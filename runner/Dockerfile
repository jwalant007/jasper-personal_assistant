# =============================================================================
# J.A.S.P.E.R. Per-Job Isolated Sandbox Runner Controller Container
# =============================================================================
# Trusted controller microservice that receives execution requests from the
# main J.A.S.P.E.R. backend and orchestrates a separate, disposable container
# for every submitted job.
#
# CRITICAL SECURITY ARCHITECTURE:
# - The controller NEVER executes untrusted source code in its own process/container.
# - The controller uses the container engine (Docker/Podman) to spawn ephemeral
#   worker containers (node:20-alpine / python:3.11-alpine) for each job.
# - Worker containers run with:
#     • --network none (zero network, no access to host, internet, or other containers)
#     • --read-only (immutable root filesystem)
#     • --user 10001:10001 (unprivileged non-root)
#     • --cap-drop=ALL and --security-opt=no-new-privileges:true
#     • ZERO Docker socket mounts (worker containers NEVER have Docker access)
#     • ZERO host filesystem mounts (code is streamed pure via stdin)
#     • Strict cgroups memory (64m), CPU (0.5), and PID (32) limits
# =============================================================================

FROM node:20-alpine

# Install Docker CLI so the controller can orchestrate disposable worker containers
RUN apk add --no-cache docker-cli && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# Copy the standalone controller service
COPY sandboxRunnerService.js /app/sandboxRunnerService.js

# Ensure app directory is read-only
RUN chown -R root:root /app && \
    chmod -R 755 /app

EXPOSE 5055

ENV RUNNER_PORT=5055
ENV RUNNER_HOST=127.0.0.1
ENV CONTAINER_ENGINE=docker
ENV NODE_ENV=production

CMD ["node", "/app/sandboxRunnerService.js"]

# =============================================================================
# TRUSTED CONTROLLER RUNTIME INSTRUCTIONS:
#
# Launch the runner controller container on a private, internal network:
#
# docker run -d \
#   --name jasper-runner-controller \
#   --network jasper-internal-net \
#   -v /var/run/docker.sock:/var/run/docker.sock:ro \
#   --read-only \
#   --tmpfs /tmp:rw,noexec,nosuid,size=16m \
#   -e RUNNER_HOST=0.0.0.0 \
#   -e JASPER_SANDBOX_RUNNER_KEY="<STRONG_HIGH_ENTROPY_KEY>" \
#   jasper-runner-controller
#
# Worker containers launched by the controller will run with:
#   docker run -i --rm \
#     --network none \
#     --read-only \
#     --user 10001:10001 \
#     --cap-drop=ALL \
#     --security-opt=no-new-privileges:true \
#     --memory=64m \
#     --pids-limit=32 \
#     --tmpfs /tmp:rw,nosuid,size=16m \
#     <pinned_runtime_image> node -
# =============================================================================
