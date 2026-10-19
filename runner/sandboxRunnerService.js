/**
 * J.A.S.P.E.R. Per-Job Isolated Container Sandbox Runner Controller
 * 
 * Standalone runner controller microservice.
 * Enforces per-job container isolation:
 * - The controller NEVER executes submitted code directly in its own process or container.
 * - Every job is executed inside a fresh, disposable container with:
 *     • Configurable runtime images supporting immutable SHA-256 digests
 *     • Unprivileged user (UID 10001:10001)
 *     • Complete network isolation (--network none)
 *     • Read-only root filesystem (--read-only)
 *     • Zero host filesystem volume mounts, zero Docker socket exposure
 *     • Zero inherited environment secrets
 *     • All Linux capabilities dropped (--cap-drop=ALL)
 *     • Privilege escalation blocked (--security-opt no-new-privileges:true)
 *     • Cgroups memory ceiling (64MB), CPU ceiling (0.5), PID limit (32)
 *     • Ephemeral in-memory tmpfs workspace (--tmpfs /tmp:rw,nosuid,size=16m)
 *     • Code streamed directly via stdin (never touches host disk)
 * - Safe command execution: ZERO shell invocation usage, strict argument array passing.
 * - Container identifier validation: Prevents command injection or argument smuggling.
 * - If the container runtime (Docker/Podman) is unavailable, it FAILS CLOSED (HTTP 503).
 * - Mandatory constant-time Bearer token authentication.
 * - Strict request payload size capping (128 KB max to prevent DoS).
 * - External wall-clock timeout and process/container tree kill.
 * - Strict job ownership verification on cancellation and two-tier idempotency.
 * - Startup orphan container purge.
 */

const http = require('http');
const crypto = require('crypto');
const { spawn, spawnSync, execFile } = require('child_process');

const PORT = parseInt(process.env.RUNNER_PORT || '5055', 10);
const HOST = process.env.RUNNER_HOST || '127.0.0.1'; // Loopback/private network by default
const CONTAINER_ENGINE = (process.env.CONTAINER_ENGINE || 'docker').trim();

// Pinned official images with immutable SHA-256 digests (fallbacks and defaults)
const DEFAULT_NODE_IMAGE = 'node:20-alpine@sha256:afdf98210b07b586eb71fa22ba2e432e058e4cd1304d31ed60888755b8c865fb';
const DEFAULT_PYTHON_IMAGE = 'python:3.11-alpine@sha256:bfebb8e11b53c46715fe3634e3b7bc5afb33b21ec82521539af1467c81ad3aed';

/**
 * Validates that an ID or container name adheres strictly to Docker naming conventions:
 * - 1 to 128 characters
 * - Starts with an alphanumeric character [a-zA-Z0-9]
 * - Contains only alphanumeric, underscore, hyphen, or dot: [a-zA-Z0-9_.-]
 * - Strictly prohibits spaces, shell metacharacters, control characters, and path separators.
 */
function isValidContainerIdentifier(idOrName) {
  if (!idOrName || typeof idOrName !== 'string') return false;
  const trimmed = idOrName.trim();
  if (trimmed.length < 1 || trimmed.length > 128) return false;
  return /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/.test(trimmed);
}

/**
 * Validates a user / requester / owner identity string:
 * - 1 to 128 characters
 * - Starts with an alphanumeric character [a-zA-Z0-9]
 * - Contains only alphanumeric, underscore, hyphen, or dot: [a-zA-Z0-9_.-]
 * - Strictly prohibits spaces, shell metacharacters, control characters, and path separators.
 */
function isValidUserIdentifier(id) {
  if (!id || typeof id !== 'string') return false;
  const trimmed = id.trim();
  if (trimmed.length < 1 || trimmed.length > 128) return false;
  return /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/.test(trimmed);
}

/**
 * Validates an OCI / Docker container image reference.
 * Allows repository names, optional namespaces, optional tags, and optional immutable SHA-256 digests.
 * Example: node:20-alpine@sha256:afdf98210b07b586eb71fa22ba2e432e058e4cd1304d31ed60888755b8c865fb
 */
function isValidImageReference(imageRef) {
  if (!imageRef || typeof imageRef !== 'string') return false;
  const trimmed = imageRef.trim();
  if (trimmed.length < 1 || trimmed.length > 255) return false;
  // Regex validates standard OCI/Docker image references:
  // [domain[:port]/][namespace/]repository[:tag][@sha256:<64 hex>]
  // Disallows any shell metacharacters, whitespace, control chars
  const pattern = /^(?:[a-zA-Z0-9_.-]+(?::[0-9]+)?\/)?[a-z0-9_.-]+(?:\/[a-z0-9_.-]+)*(?::[a-zA-Z0-9_.-]+)?(?:@sha256:[a-fA-F0-9]{64})?$/;
  return pattern.test(trimmed);
}

/**
 * Checks if the image reference includes an immutable SHA-256 digest (@sha256:<64 hex chars>).
 */
function isImmutableImageDigest(imageRef) {
  if (!isValidImageReference(imageRef)) return false;
  return /@sha256:[a-fA-F0-9]{64}$/.test(imageRef.trim());
}

/**
 * Resolves the active runtime image for the given language.
 * Strictly enforces immutable SHA-256 digests (@sha256:<64 hex>):
 * - Mutable tags (e.g., node:latest, node:20-alpine) are strictly rejected.
 * - Malformed digests or invalid overrides fail closed and return null (never silently fall back).
 * - When an override is omitted, uses the verified pinned default digest.
 */
function getRuntimeImage(lang) {
  let configured = '';
  let defaultImage = '';

  if (lang === 'javascript') {
    configured = (process.env.SANDBOX_NODE_IMAGE || '').trim();
    defaultImage = DEFAULT_NODE_IMAGE;
  } else if (lang === 'python') {
    configured = (process.env.SANDBOX_PYTHON_IMAGE || '').trim();
    defaultImage = DEFAULT_PYTHON_IMAGE;
  } else {
    return null;
  }

  // If an override is explicitly configured:
  if (configured) {
    // Must strictly be a valid immutable SHA-256 digest; reject mutable tags and invalid references fail-closed
    if (isImmutableImageDigest(configured)) {
      return configured;
    }
    return null; // Fails closed on mutable or malformed override
  }

  // Default fallback when override is omitted: verify default is an immutable digest
  if (isImmutableImageDigest(defaultImage)) {
    return defaultImage;
  }
  return null;
}

const PINNED_NODE_IMAGE = DEFAULT_NODE_IMAGE;
const PINNED_PYTHON_IMAGE = DEFAULT_PYTHON_IMAGE;

function getRunnerAuthKey() {
  return (process.env.JASPER_SANDBOX_RUNNER_KEY || '').trim();
}

const MAX_BODY_BYTES = 128 * 1024; // 128 KB
const MAX_CODE_LENGTH = 65536; // 64 KB
const MAX_OUTPUT_BYTES = 32 * 1024; // 32 KB per stream
// Execution timeout configuration & approved bounds
const MIN_TIMEOUT_MS = 1000;           // Hard minimum timeout (1 second)
const DEFAULT_TIMEOUT_MS = 5000;       // Default job timeout (5 seconds)
const DEFAULT_MAX_TIMEOUT_MS = 10000;  // Safe default ceiling (10 seconds)
const ABSOLUTE_MAX_TIMEOUT_MS = 30000; // Approved absolute ceiling (30 seconds) for heavy container runtimes

/**
 * Validates and parses RUNNER_MAX_TIMEOUT_MS from environment.
 * Must be a finite safe integer within [MIN_TIMEOUT_MS, ABSOLUTE_MAX_TIMEOUT_MS].
 * Rejects NaN, Infinity, negative values, floats, or out-of-range bounds, safely falling back to DEFAULT_MAX_TIMEOUT_MS.
 */
function parseMaxTimeoutMs(envVal) {
  if (envVal === undefined || envVal === null || String(envVal).trim() === '') {
    return DEFAULT_MAX_TIMEOUT_MS;
  }
  const num = Number(String(envVal).trim());
  if (!Number.isSafeInteger(num) || num < MIN_TIMEOUT_MS || num > ABSOLUTE_MAX_TIMEOUT_MS) {
    return DEFAULT_MAX_TIMEOUT_MS;
  }
  return num;
}

const MAX_TIMEOUT_MS = parseMaxTimeoutMs(process.env.RUNNER_MAX_TIMEOUT_MS);
const MAX_CONCURRENT_JOBS = 4;
const MAX_RATE_PER_MINUTE = 60;

/**
 * Probes whether the host has a functioning container engine (Docker/Podman).
 * Strictly uses argument arrays and shell: false.
 */
function probeContainerEngine(engine = CONTAINER_ENGINE, spawnSyncFn = spawnSync) {
  if (!isValidContainerIdentifier(engine)) {
    return false;
  }
  try {
    const cleanEnv = {
      PATH: process.env.PATH || '',
      ...(process.platform === 'win32' ? { SystemRoot: process.env.SystemRoot || 'C:\\Windows' } : {}),
      ...(process.env.DOCKER_HOST ? { DOCKER_HOST: process.env.DOCKER_HOST } : {})
    };
    const res = spawnSyncFn(engine, ['--version'], { 
      encoding: 'utf8', 
      shell: false, 
      windowsHide: true,
      env: cleanEnv,
      timeout: 5000
    });
    return Boolean(!res.error && res.status === 0);
  } catch (_) {
    return false;
  }
}

/**
 * Startup cleanup: Removes any orphaned job containers from previous crashes.
 * Strictly uses argument arrays and shell: false.
 * Validates container IDs/names to prevent argument smuggling.
 */
function purgeOrphanedContainers(engine = CONTAINER_ENGINE, spawnSyncFn = spawnSync) {
  if (!isValidContainerIdentifier(engine)) {
    return { cleaned: 0, error: 'Invalid engine identifier' };
  }
  let cleaned = 0;
  try {
    const res = spawnSyncFn(engine, ['ps', '-aq', '--filter', 'name=jasper_job_'], { 
      encoding: 'utf8', 
      shell: false, 
      windowsHide: true,
      timeout: 5000
    });
    if (!res.error && res.stdout && res.stdout.trim()) {
      const containerIds = res.stdout.trim().split(/\s+/).filter(Boolean);
      for (const cid of containerIds) {
        if (isValidContainerIdentifier(cid)) {
          try { 
            const rmRes = spawnSyncFn(engine, ['rm', '-f', cid], { 
              shell: false, 
              windowsHide: true,
              timeout: 3000
            });
            if (!rmRes.error && rmRes.status === 0) cleaned++;
          } catch (_) {}
        }
      }
    }
  } catch (_) {}
  return { cleaned };
}

// Initial purge on module load
if (isValidContainerIdentifier(CONTAINER_ENGINE)) {
  purgeOrphanedContainers();
}

/**
 * Default container driver: invokes real Docker/Podman CLI.
 */
const defaultContainerDriver = {
  isAvailable() {
    return probeContainerEngine(CONTAINER_ENGINE);
  },
  getEngineName() {
    return CONTAINER_ENGINE;
  },
  buildRunArgs({ containerName, cleanLang, runtimeImage }) {
    if (!isValidContainerIdentifier(containerName)) {
      throw new Error(`Invalid container name: ${containerName}`);
    }
    if (!runtimeImage || !isImmutableImageDigest(runtimeImage)) {
      throw new Error(`Invalid or mutable runtime image reference: ${runtimeImage}. Runtime images must be pinned to immutable @sha256 digests.`);
    }
    const guestCmd = cleanLang === 'javascript' 
      ? ['node', '-'] 
      : ['python3', '-I', '-s', '-'];

    return [
      'run',
      '-i',
      '--rm',
      '--name', containerName,
      '--network', 'none',
      '--read-only',
      '--user', '10001:10001',
      '--cap-drop=ALL',
      '--security-opt', 'no-new-privileges:true',
      '--memory', '64m',
      '--memory-swap', '64m',
      '--cpus', '0.5',
      '--pids-limit', '32',
      '--tmpfs', '/tmp:rw,nosuid,size=16m',
      runtimeImage,
      ...guestCmd
    ];
  },
  spawnJob({ containerName, cleanLang, runtimeImage }) {
    if (!isValidContainerIdentifier(CONTAINER_ENGINE)) {
      throw new Error(`Invalid container engine identifier: ${CONTAINER_ENGINE}`);
    }
    const args = this.buildRunArgs({ containerName, cleanLang, runtimeImage });
    const cleanEnv = {
      PATH: process.env.PATH || '',
      ...(process.platform === 'win32' ? { SystemRoot: process.env.SystemRoot || 'C:\\Windows' } : {}),
      ...(process.env.DOCKER_HOST ? { DOCKER_HOST: process.env.DOCKER_HOST } : {})
    };
    return spawn(CONTAINER_ENGINE, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
      shell: false,
      env: cleanEnv // ZERO host environment secrets passed; only sanitized system paths required to run the CLI
    });
  },
  killJob(containerName, callback) {
    if (!isValidContainerIdentifier(CONTAINER_ENGINE) || !isValidContainerIdentifier(containerName)) {
      if (callback) callback(new Error('Invalid container name or engine identifier'));
      return;
    }
    execFile(CONTAINER_ENGINE, ['kill', containerName], { shell: false, windowsHide: true }, () => {
      execFile(CONTAINER_ENGINE, ['rm', '-f', containerName], { shell: false, windowsHide: true }, (err) => {
        if (callback) callback(err);
      });
    });
  }
};

/**
 * Constant-time authentication validation.
 * Fails closed if runner auth key is missing or invalid.
 */
function verifyAuth(req) {
  const runnerKey = getRunnerAuthKey();
  if (!runnerKey || runnerKey.length < 8) {
    return { ok: false, status: 503, error: 'Runner authentication key is not configured. Runner is locked fail-closed.' };
  }

  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    return { ok: false, status: 401, error: 'Authorization header with Bearer token is required.' };
  }

  const tokenBuf = Buffer.from(token, 'utf8');
  const expectedBuf = Buffer.from(runnerKey, 'utf8');

  if (tokenBuf.length !== expectedBuf.length) {
    return { ok: false, status: 401, error: 'Invalid runner authentication credentials.' };
  }

  const isValid = crypto.timingSafeEqual(tokenBuf, expectedBuf);
  if (!isValid) {
    return { ok: false, status: 401, error: 'Invalid runner authentication credentials.' };
  }

  return { ok: true };
}

/**
 * Creates and configures the HTTP server instance.
 */
function createServer(options = {}) {
  const driver = options.containerDriver || defaultContainerDriver;
  const configuredMaxTimeout = (options.maxTimeoutMs !== undefined && options.maxTimeoutMs !== null)
    ? parseMaxTimeoutMs(options.maxTimeoutMs)
    : parseMaxTimeoutMs(process.env.RUNNER_MAX_TIMEOUT_MS);

  const activeJobs = new Map(); // executionId -> { child, containerName, timer, ownerId, cancelled, startTime }
  const recentlyTerminatedJobs = new Map(); // executionId -> { timestamp, exitCode, cancelled, ownerId }
  const rateLimitMap = new Map(); // ip -> { count, resetTime }

  function pruneState() {
    const now = Date.now();
    for (const [ip, data] of rateLimitMap.entries()) {
      if (now > data.resetTime) rateLimitMap.delete(ip);
    }
    for (const [id, data] of recentlyTerminatedJobs.entries()) {
      if (now - data.timestamp > 300000) recentlyTerminatedJobs.delete(id); // 5 min TTL
    }
  }

  function checkRateLimit(ip) {
    const now = Date.now();
    let record = rateLimitMap.get(ip);
    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + 60000 };
      rateLimitMap.set(ip, record);
      return true;
    }
    record.count++;
    return record.count <= MAX_RATE_PER_MINUTE;
  }

  function handleRun(req, res, body) {
    const { code, language = 'javascript', timeoutMs, ownerId } = body || {};

    if (!code || typeof code !== 'string') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'No code provided.' }));
    }

    if (code.length > MAX_CODE_LENGTH) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ 
        success: false, 
        error: `Code payload exceeds maximum size (${MAX_CODE_LENGTH} characters).` 
      }));
    }

    const cleanLang = String(language).toLowerCase().trim();
    if (cleanLang !== 'javascript' && cleanLang !== 'python') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ 
        success: false, 
        error: `Unsupported language '${language}'. Supported: javascript, python.` 
      }));
    }

    if (!ownerId || typeof ownerId !== 'string' || !isValidUserIdentifier(ownerId)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: false,
        error: 'Valid ownerId required for code execution job.'
      }));
    }
    const cleanOwnerId = ownerId.trim();

    if (activeJobs.size >= MAX_CONCURRENT_JOBS) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ 
        success: false, 
        error: `Runner capacity reached (${activeJobs.size} concurrent jobs).` 
      }));
    }

    // Critical Requirement: Fail closed if container engine is unavailable.
    // The controller NEVER executes code directly in its own process or container.
    if (!driver.isAvailable()) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ 
        success: false, 
        error: 'Per-job container isolation runtime (Docker/Podman) is unavailable on this runner host. Arbitrary code execution is disabled fail-closed in accordance with J.A.S.P.E.R. security policy.',
        isolation: 'container_per_job',
        runtimeAvailable: false
      }));
    }

    const parsedTimeout = parseInt(timeoutMs, 10);
    const cleanTimeout = Math.max(MIN_TIMEOUT_MS, Math.min(configuredMaxTimeout, Number.isFinite(parsedTimeout) ? parsedTimeout : DEFAULT_TIMEOUT_MS));
    const executionId = `run_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const containerName = `jasper_job_${executionId}`;

    if (!isValidContainerIdentifier(containerName)) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ 
        success: false, 
        error: 'Generated container identifier is invalid.', 
        executionId 
      }));
    }

    const runtimeImage = getRuntimeImage(cleanLang);
    if (!runtimeImage || !isImmutableImageDigest(runtimeImage)) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ 
        success: false, 
        error: `Runtime image for ${cleanLang} is invalid, mutable, or not pinned to an immutable SHA-256 digest. Execution blocked fail-closed.`,
        executionId 
      }));
    }

    const startTime = Date.now();
    let stdoutBuf = '';
    let stderrBuf = '';
    let isTimedOut = false;

    let child;
    try {
      child = driver.spawnJob({ containerName, cleanLang, runtimeImage });
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ 
        success: false, 
        error: `Failed to launch isolated job container: ${err.message}`, 
        executionId 
      }));
    }

    // Stream code into container via stdin (zero disk writes, zero host mounts)
    try {
      child.stdin.write(code);
      child.stdin.end();
    } catch (_) {}

    const timer = setTimeout(() => {
      isTimedOut = true;
      try {
        if (isValidContainerIdentifier(containerName)) {
          driver.killJob(containerName);
        }
      } catch (_) {}
      try { child.kill('SIGKILL'); } catch (_) {}
    }, cleanTimeout);

    activeJobs.set(executionId, {
      child,
      containerName,
      timer,
      ownerId: cleanOwnerId,
      cancelled: false,
      startTime
    });

    child.stdout.on('data', (chunk) => {
      if (stdoutBuf.length < MAX_OUTPUT_BYTES) {
        stdoutBuf += chunk.toString('utf8');
        if (stdoutBuf.length >= MAX_OUTPUT_BYTES) {
          stdoutBuf = stdoutBuf.slice(0, MAX_OUTPUT_BYTES) + '\n[TRUNCATED: Maximum output size threshold reached (32 KB)]';
        }
      }
    });

    child.stderr.on('data', (chunk) => {
      if (stderrBuf.length < MAX_OUTPUT_BYTES) {
        stderrBuf += chunk.toString('utf8');
        if (stderrBuf.length >= MAX_OUTPUT_BYTES) {
          stderrBuf = stderrBuf.slice(0, MAX_OUTPUT_BYTES) + '\n[TRUNCATED: Maximum error size threshold reached (32 KB)]';
        }
      }
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      activeJobs.delete(executionId);
      recentlyTerminatedJobs.set(executionId, {
        timestamp: Date.now(),
        exitCode: 1,
        cancelled: false,
        ownerId: cleanOwnerId
      });
      try { 
        if (isValidContainerIdentifier(containerName)) {
          driver.killJob(containerName); 
        }
      } catch (_) {}

      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: `Job container process error: ${err.message}`,
        executionId
      }));
    });

    child.on('close', (exitCode) => {
      clearTimeout(timer);
      const durationMs = Date.now() - startTime;
      const job = activeJobs.get(executionId);
      const wasCancelled = Boolean(job?.cancelled);

      activeJobs.delete(executionId);
      recentlyTerminatedJobs.set(executionId, {
        timestamp: Date.now(),
        exitCode: exitCode || 0,
        cancelled: wasCancelled,
        ownerId: cleanOwnerId
      });

      // Ensure container cleanup on daemon
      try { 
        if (isValidContainerIdentifier(containerName)) {
          driver.killJob(containerName); 
        }
      } catch (_) {}

      res.writeHead(200, { 'Content-Type': 'application/json' });

      if (wasCancelled) {
        return res.end(JSON.stringify({
          success: false,
          cancelled: true,
          exitCode: 130,
          stdout: stdoutBuf.trim(),
          stderr: stderrBuf.trim(),
          executionId,
          durationMs,
          isolation: 'container_per_job'
        }));
      }

      if (isTimedOut) {
        return res.end(JSON.stringify({
          success: false,
          timedOut: true,
          exitCode: 124,
          error: `Execution timed out (${cleanTimeout}ms limit exceeded). Container terminated.`,
          stdout: stdoutBuf.trim(),
          stderr: (stderrBuf.trim() ? stderrBuf.trim() + '\n' : '') + `[TIMEOUT: Exceeded ${cleanTimeout}ms hard limit]`,
          executionId,
          durationMs,
          isolation: 'container_per_job'
        }));
      }

      const cleanStdout = stdoutBuf.trim();
      const cleanStderr = stderrBuf.trim();
      return res.end(JSON.stringify({
        success: exitCode === 0,
        exitCode: exitCode || 0,
        stdout: cleanStdout,
        stderr: cleanStderr,
        output: cleanStdout || cleanStderr || '(Clean execution with zero output)',
        executionId,
        durationMs,
        language: cleanLang,
        isolation: 'container_per_job'
      }));
    });
  }

  function handleCancel(req, res, body) {
    const { executionId, requesterId } = body || {};

    if (!executionId || typeof executionId !== 'string' || !isValidContainerIdentifier(executionId)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Valid executionId required.' }));
    }

    if (!requesterId || typeof requesterId !== 'string' || !isValidUserIdentifier(requesterId)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Valid requester user identity required for cancellation.' }));
    }
    const cleanRequesterId = requesterId.trim();

    // Idempotency: If job was already terminated
    if (recentlyTerminatedJobs.has(executionId)) {
      const termData = recentlyTerminatedJobs.get(executionId);
      // Strict ownership enforcement: stored ownerId must exist, be valid, and match requesterId exactly
      if (!termData || !isValidUserIdentifier(termData.ownerId) || termData.ownerId !== cleanRequesterId) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: false,
          error: "Access denied: You do not have permission to cancel another user's execution job."
        }));
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ 
        success: true, 
        message: `Job ${executionId} is already completed or terminated.`, 
        executionId,
        idempotent: true,
        cancelled: termData.cancelled
      }));
    }

    const job = activeJobs.get(executionId);
    if (!job) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Job not found or already completed.' }));
    }

    // Strict ownership enforcement: stored ownerId must exist, be valid, and match requesterId exactly
    if (!isValidUserIdentifier(job.ownerId) || job.ownerId !== cleanRequesterId) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ 
        success: false, 
        error: "Access denied: You do not have permission to cancel another user's execution job." 
      }));
    }

    if (job.cancelled) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ 
        success: true, 
        message: `Job ${executionId} is already being terminated.`, 
        executionId,
        idempotent: true,
        cancelled: true
      }));
    }

    job.cancelled = true;
    if (job.timer) clearTimeout(job.timer);
    try {
      if (isValidContainerIdentifier(job.containerName)) {
        driver.killJob(job.containerName);
      }
    } catch (_) {}
    try { job.child.kill('SIGKILL'); } catch (_) {}

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ 
      success: true, 
      message: `Job ${executionId} cancelled.`, 
      executionId 
    }));
  }

  const server = http.createServer((req, res) => {
    pruneState();

    const clientIp = req.socket.remoteAddress || '127.0.0.1';

    if (!checkRateLimit(clientIp)) {
      req.resume();
      res.writeHead(429, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Too many requests. Please slow down.' }));
    }

    // Health check endpoint (free of secrets, internal paths, or sensitive details)
    if (req.method === 'GET' && req.url === '/health') {
      req.resume();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        status: 'healthy',
        runner: 'jasper-container-runner-controller',
        isolation: 'container_per_job',
        runtimeAvailable: driver.isAvailable(),
        activeJobs: activeJobs.size,
        capacity: MAX_CONCURRENT_JOBS,
        authRequired: true,
        nodeImageImmutable: isImmutableImageDigest(getRuntimeImage('javascript')),
        pythonImageImmutable: isImmutableImageDigest(getRuntimeImage('python')),
        timestamp: Date.now()
      }));
    }

    const authResult = verifyAuth(req);
    if (!authResult.ok) {
      req.resume();
      res.writeHead(authResult.status, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: authResult.error }));
    }

    let rawData = '';
    let bodyTooLarge = false;

    req.on('data', chunk => {
      if (bodyTooLarge) return;
      rawData += chunk;
      if (rawData.length > MAX_BODY_BYTES) {
        bodyTooLarge = true;
        req.resume();
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: `Payload too large. Maximum size is ${MAX_BODY_BYTES} bytes.` }));
        req.destroy();
      }
    });

    req.on('end', () => {
      if (bodyTooLarge) return;

      let body = {};
      if (rawData.trim()) {
        try {
          body = JSON.parse(rawData);
        } catch (_) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: 'Malformed JSON payload.' }));
        }
      }

      if (req.method === 'POST' && req.url === '/run') {
        return handleRun(req, res, body);
      }
      if (req.method === 'POST' && req.url === '/cancel') {
        return handleCancel(req, res, body);
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Endpoint not found.' }));
    });
  });

  server.activeJobs = activeJobs;
  server.recentlyTerminatedJobs = recentlyTerminatedJobs;
  server.configuredMaxTimeout = configuredMaxTimeout;

  return server;
}

if (require.main === module) {
  const server = createServer();
  server.listen(PORT, HOST, () => {
    console.log(`[JASPER Sandbox Controller] Listening on ${HOST}:${PORT} (engine: ${CONTAINER_ENGINE})`);
  });
}

module.exports = { 
  createServer, 
  defaultContainerDriver,
  probeContainerEngine,
  purgeOrphanedContainers,
  verifyAuth,
  getRunnerAuthKey,
  isValidContainerIdentifier,
  isValidUserIdentifier,
  isValidImageReference,
  isImmutableImageDigest,
  getRuntimeImage,
  parseMaxTimeoutMs,
  MIN_TIMEOUT_MS,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_MAX_TIMEOUT_MS,
  ABSOLUTE_MAX_TIMEOUT_MS,
  MAX_TIMEOUT_MS,
  DEFAULT_NODE_IMAGE,
  DEFAULT_PYTHON_IMAGE,
  PINNED_NODE_IMAGE,
  PINNED_PYTHON_IMAGE
};
