#!/bin/bash
# ===============================================================================
# JWALANT BHATT CREATION - NATIVE LINUX JASPER OS INSTALLER
# ===============================================================================

echo "==============================================================================="
echo "        ⚡ JWALANT BHATT CREATION - INSTALLING NATIVE JASPER OS ⚡"
echo "==============================================================================="
echo ""

if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run as root (e.g. sudo bash setup_linux_node.sh)"
  exit 1
fi

echo "[1/4] Installing system dependencies (Node.js, Chromium Kiosk, X11/Wayland)..."
apt-get update -y
apt-get install -y nodejs npm chromium-browser xorg openbox curl git

echo "[2/4] Deploying JASPER OS Core to /opt/jasper-os..."
mkdir -p /opt/jasper-os
cp -r ../* /opt/jasper-os/

cd /opt/jasper-os
npm install --production

echo "[3/4] Configuring Systemd Service (Auto-Boot on Power On)..."
cp linux_installer/jasper-os.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable jasper-os
systemctl start jasper-os

echo "[4/4] Setting up Fullscreen Kiosk Auto-Start..."
mkdir -p ~/.config/openbox
cat << 'EOF' > ~/.config/openbox/autostart
chromium-browser --kiosk --app=http://localhost:3001 --noerrdialogs --disable-infobars &
EOF

echo ""
echo "==============================================================================="
echo "   ✅ SUCCESS! JASPER OS IS INSTALLED AS NATIVE LINUX OPERATING SYSTEM"
echo "==============================================================================="
echo "Rebooting will now boot directly into JASPER OS!"
echo ""
