# J.A.S.P.E.R. Isolated Container Sandbox Runner Controller

The Sandbox Runner Controller is a trusted service that accepts code execution requests from the main J.A.S.P.E.R. backend and spawns an ephemeral, disposable container for every submitted job.

## Security Model

1. **Trusted Controller / Untrusted Worker Separation**:
   - The controller process never executes submitted source code directly.
   - Code runs exclusively inside a disposable container created with `--rm`, `--network none`, `--read-only`, and `--user 10001:10001`.
   - Zero host filesystem or Docker socket mounts are provided to worker containers.
   - Submitted code is transmitted strictly via stdin pipe (`node -` or `python3 -I -s -`).
2. **Safe Command Execution**:
   - The controller strictly uses argument arrays with `shell: false` (`spawnSync`, `execFile`, `spawn`).
   - Container IDs and names are strictly validated before any command execution (`isValidContainerIdentifier`), preventing command injection or argument smuggling.
3. **Immutable Image Digests**:
   - To eliminate supply-chain poisoning and mutable tag drift (e.g. `:latest` or `:alpine`), runtime images support immutable SHA-256 digests (`image@sha256:<64-hex>`).

---

## Configuring and Updating Runtime Images

### Default Pinned Images (Immutable SHA-256 Digests)

By default, the controller references official Alpine runtime images pinned to immutable digests:
- **Node.js**: `node:20-alpine@sha256:afdf98210b07b586eb71fa22ba2e432e058e4cd1304d31ed60888755b8c865fb`
- **Python**: `python:3.11-alpine@sha256:bfebb8e11b53c46715fe3634e3b7bc5afb33b21ec82521539af1467c81ad3aed`

### How to Safely Update an Image Reference

When updating to a newer base image release, follow this safe workflow:

#### Step 1: Pull the image on a trusted staging machine
```bash
docker pull node:20-alpine
```

#### Step 2: Extract the immutable RepoDigest
```bash
docker inspect --format='{{index .RepoDigests 0}}' node:20-alpine
# Output example:
# node@sha256:afdf98210b07b586eb71fa22ba2e432e058e4cd1304d31ed60888755b8c865fb
```

#### Step 3: Configure the environment variable on the runner host
Set `SANDBOX_NODE_IMAGE` and/or `SANDBOX_PYTHON_IMAGE`:
```bash
export SANDBOX_NODE_IMAGE="node:20-alpine@sha256:afdf98210b07b586eb71fa22ba2e432e058e4cd1304d31ed60888755b8c865fb"
export SANDBOX_PYTHON_IMAGE="python:3.11-alpine@sha256:bfebb8e11b53c46715fe3634e3b7bc5afb33b21ec82521539af1467c81ad3aed"
```

#### Step 4: Verify Image Validation
The runner controller validates every configured image reference against the following OCI image specification:
```regex
^(?:[a-zA-Z0-9_.-]+(?::[0-9]+)?\/)?[a-z0-9_.-]+(?:\/[a-z0-9_.-]+)*(?::[a-zA-Z0-9_.-]+)?(?:@sha256:[a-fA-F0-9]{64})?$
```
If an invalid image reference or malicious characters (spaces, semicolons, shell expansions) are detected, the runner **fails closed** with an HTTP 500 error and refuses to launch the container.

---

## Runner Controller Environment Variables

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `RUNNER_PORT` | `5055` | Listening port for the HTTP controller API. |
| `RUNNER_HOST` | `127.0.0.1` | Binding interface (defaults to loopback for security). |
| `CONTAINER_ENGINE` | `docker` | Container CLI command (`docker` or `podman`). |
| `JASPER_SANDBOX_RUNNER_KEY` | *(None)* | Mandatory high-entropy secret required for Bearer token auth. |
| `SANDBOX_NODE_IMAGE` | Pinned Node digest | Node.js worker container image reference. |
| `SANDBOX_PYTHON_IMAGE` | Pinned Python digest | Python worker container image reference. |

---

## Fail-Closed Operational Policy

- If `docker` or `podman` CLI is not installed or the daemon is not accessible, the runner returns **HTTP 503 Service Unavailable** on all `/run` requests.
- The controller **NEVER** falls back to executing user code on the host process.
