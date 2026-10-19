#!/usr/bin/env bash
# =============================================================================
# J.A.S.P.E.R. Sandbox Runner Host Setup & Hardening Script
# Supported OS: Ubuntu 24.04 LTS / Debian 12 (bookworm) x86_64
# =============================================================================
set -euo pipefail

echo "================================================================="
echo " J.A.S.P.E.R. Dedicated Runner Host Hardening & Provisioning"
echo "================================================================="

# 1. Update OS and install essential tools
echo "[1/7] Updating system packages..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y
apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    ufw \
    fail2ban \
    unattended-upgrades

# 2. Install official Docker CE
echo "[2/7] Installing official Docker CE repository..."
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/$(. /etc/os-release && echo "$ID")/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$(. /etc/os-release && echo "$ID") \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install -y --no-install-recommends \
    docker-ce \
    docker-ce-cli \
    containerd.io \
    docker-buildx-plugin

# 3. Create dedicated system user for sandbox controller
echo "[3/7] Creating unprivileged service user 'jasper-runner'..."
if ! id "jasper-runner" &>/dev/null; then
    useradd -r -s /usr/sbin/nologin -d /opt/jasper-runner -m jasper-runner
    usermod -aG docker jasper-runner
fi

# 4. Install Node.js (LTS v20) for running the controller service
echo "[4/7] Installing Node.js LTS (v20)..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 5. Pre-warm and verify immutable OCI container runtime image digests
echo "[5/7] Pre-pulling verified immutable worker container images..."
NODE_IMAGE="node:20-alpine@sha256:afdf98210b07b586eb71fa22ba2e432e058e4cd1304d31ed60888755b8c865fb"
PYTHON_IMAGE="python:3.11-alpine@sha256:bfebb8e11b53c46715fe3634e3b7bc5afb33b21ec82521539af1467c81ad3aed"

docker pull "${NODE_IMAGE}"
docker pull "${PYTHON_IMAGE}"

# 6. Configure systemd service for runner controller
echo "[6/7] Configuring systemd service 'jasper-sandbox-runner'..."
mkdir -p /opt/jasper-runner/app
cp -f sandboxRunnerService.js /opt/jasper-runner/app/sandboxRunnerService.js
chown -R root:root /opt/jasper-runner/app
chmod -R 755 /opt/jasper-runner/app

cat << 'EOF' > /etc/systemd/system/jasper-sandbox-runner.service
[Unit]
Description=J.A.S.P.E.R. Isolated Container Sandbox Runner Controller
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=jasper-runner
Group=jasper-runner
WorkingDirectory=/opt/jasper-runner/app
EnvironmentFile=-/etc/default/jasper-sandbox-runner
ExecStart=/usr/bin/node /opt/jasper-runner/app/sandboxRunnerService.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=jasper-sandbox-runner

# Security Hardening
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
ProtectKernelTunables=true
ProtectControlGroups=true
RestrictRealtime=true

[Install]
WantedBy=multi-user.target
EOF

# Ensure environment file template exists with restricted 600 permissions
if [ ! -f /etc/default/jasper-sandbox-runner ]; then
    cat << EOF > /etc/default/jasper-sandbox-runner
# =============================================================================
# J.A.S.P.E.R. Runner Controller Environment Configuration
# Permissions: 0600 (root / jasper-runner only)
# =============================================================================
RUNNER_PORT=5055
RUNNER_HOST=127.0.0.1
CONTAINER_ENGINE=docker
RUNNER_MAX_TIMEOUT_MS=10000
SANDBOX_NODE_IMAGE=${NODE_IMAGE}
SANDBOX_PYTHON_IMAGE=${PYTHON_IMAGE}

# MANDATORY: Generate a high-entropy secret (e.g. openssl rand -hex 32)
# JASPER_SANDBOX_RUNNER_KEY=
EOF
    chmod 600 /etc/default/jasper-sandbox-runner
    chown jasper-runner:jasper-runner /etc/default/jasper-sandbox-runner
fi

systemctl daemon-reload

# 7. Configure UFW host firewall
echo "[7/7] Configuring host firewall (UFW)..."
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
# Note: Runner port 5055 binds strictly to 127.0.0.1 (reverse proxy or tunnel required for public ingress)
ufw --force enable

echo "================================================================="
echo " Provisioning completed successfully!"
echo " Next steps:"
echo " 1. Generate runner secret: openssl rand -hex 32"
echo " 2. Add secret to /etc/default/jasper-sandbox-runner"
echo " 3. Start service: systemctl enable --now jasper-sandbox-runner"
echo " 4. Configure HTTPS reverse proxy (Caddy / Cloudflare Tunnel)"
echo "================================================================="
