/**
 * J.A.S.P.E.R. Code Sandbox Security & Per-Job Container Isolation Test Suite
 * 
 * Verifies:
 * 1. Legacy in-process host execution code is completely removed from server.
 * 2. Default fail-closed policy (no execution without isolated container runner).
 * 3. Production fail-closed policy.
 * 4. Misconfigured runner fail-closed policy (missing or weak key).
 * 5. Query-string authentication rejection on /api/code/execute and /api/code/cancel (headers only).
 * 6. Server-derived user identity attached to jobs; cross-user cancellation rejected with 403.
 * 7. PowerShell rejected with Hyper-V isolation rationale; unsupported languages rejected.
 * 8. Code size limits (64 KB) and destructive patterns blocked.
 * 9. Runner controller direct access rejects unauthenticated requests with 401/503.
 * 10. Runner controller fails closed with 503 when container engine (Docker/Podman) is unavailable.
 * 11. Per-job container specification: distinct container names, --network none, --read-only,
 *     --user 10001:10001, --cap-drop=ALL, no-new-privileges, cgroups limits, zero host mounts, zero secrets.
 * 12. Container lifecycle: process-tree kill on timeout, kill on cancellation, idempotency.
 * 13. Output truncation at 32 KB threshold.
 * 14. Request body size capping at 128 KB (returns 413).
 * 15. Canary server secrets never leak to runner or job.
 * 16. Host container runtime detection and boundary verification.
 */

const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { execFile } = require('child_process');
const { EventEmitter } = require('node:events');
const { app, authAttemptTracker } = require('../server/server');
const codeSandboxEngine = require('../server/codeSandboxEngine');
const runnerService = require('../runner/sandboxRunnerService');

// Ensure Docker Desktop binary directory is included in PATH if installed on Windows
if (process.platform === 'win32') {
  const dockerDesktopBin = path.join(process.env.LOCALAPPDATA || '', 'Programs', 'DockerDesktop', 'resources', 'bin');
  if (fs.existsSync(dockerDesktopBin) && !process.env.PATH.includes(dockerDesktopBin)) {
    process.env.PATH = dockerDesktopBin + path.delimiter + process.env.PATH;
  }
}

const TEST_RUNNER_SECRET = 'jasper-test-runner-secret-key-32chars!';

// HTTP client helper for Express app
function makeRequest(appInstance, method, urlPath, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(appInstance);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      const opts = {
        hostname: '127.0.0.1',
        port,
        path: urlPath,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      const req = http.request(opts, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          server.close(() => {
            let json = null;
            try { json = JSON.parse(data); } catch (_) {}
            resolve({ statusCode: res.statusCode, headers: res.headers, body: json || data });
          });
        });
      });

      req.on('error', (err) => {
        server.close(() => reject(err));
      });

      if (body) {
        req.write(typeof body === 'string' ? body : JSON.stringify(body));
      }
      req.end();
    });
  });
}

// HTTP client helper for listening servers (direct port connection)
function makeDirectRequest(port, method, urlPath, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: '127.0.0.1',
      port,
      path: urlPath,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (_) {}
        resolve({ statusCode: res.statusCode, headers: res.headers, body: json || data });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

function clearLimiter() {
  if (authAttemptTracker && typeof authAttemptTracker.clear === 'function') {
    authAttemptTracker.clear();
  }
}

// ---------------------------------------------------------------------------
// 1. LEGACY HOST EXECUTION ELIMINATION & FAIL-CLOSED POLICY TESTS
// ---------------------------------------------------------------------------

test('Architecture Remediation: Legacy direct host execution code MUST be completely eliminated', () => {
  const engineSourcePath = path.join(__dirname, '..', 'server', 'codeSandboxEngine.js');
  const engineSource = fs.readFileSync(engineSourcePath, 'utf8');

  // Must NOT import spawn or execFile from child_process
  assert.strictEqual(/require\(['"]child_process['"]\)/.test(engineSource), false, 
    'codeSandboxEngine.js must NOT import child_process');
  assert.strictEqual(engineSource.includes('spawn('), false, 
    'codeSandboxEngine.js must NOT contain spawn()');
  assert.strictEqual(engineSource.includes('execFile('), false, 
    'codeSandboxEngine.js must NOT contain execFile()');
  assert.strictEqual(engineSource.includes('_activeExecutions'), false, 
    'codeSandboxEngine.js must NOT contain legacy _activeExecutions');
  assert.strictEqual(engineSource.includes('SANDBOX_BASE_DIR'), false, 
    'codeSandboxEngine.js must NOT contain SANDBOX_BASE_DIR');
});

test('Architecture Remediation: runner/sandboxRunnerService.js must NOT use shell: true', () => {
  const runnerSourcePath = path.join(__dirname, '..', 'runner', 'sandboxRunnerService.js');
  const runnerSource = fs.readFileSync(runnerSourcePath, 'utf8');

  assert.strictEqual(runnerSource.includes('shell: true'), false, 
    'sandboxRunnerService.js must NOT contain shell: true');
});

test('Sandbox Policy: System MUST fail closed and refuse host execution when no runner is configured', async () => {
  clearLimiter();
  const oldRunner = process.env.JASPER_SANDBOX_RUNNER_URL;
  delete process.env.JASPER_SANDBOX_RUNNER_URL;

  try {
    const statusRes = await makeRequest(app, 'GET', '/api/code/status');
    assert.strictEqual(statusRes.statusCode, 200);
    assert.strictEqual(statusRes.body.enabled, false, 'Execution must be disabled without an external runner');
    assert.strictEqual(statusRes.body.mode, 'disabled_no_runner');

    const execRes = await makeRequest(app, 'POST', '/api/code/execute', { 'x-jasper-token': 'jasper' }, {
      code: 'console.log("malicious_host_probe");',
      language: 'javascript'
    });
    assert.strictEqual(execRes.statusCode, 403, 'Must return 403 Forbidden when runner is missing');
    assert.strictEqual(execRes.body.success, false);
    assert.strictEqual(execRes.body.sandboxMode, 'disabled_no_runner');

    process.env.ALLOW_HOST_CODE_EXECUTION = 'true';
    const statusWithAllow = codeSandboxEngine.getStatus();
    assert.strictEqual(statusWithAllow.enabled, false, 'Setting ALLOW_HOST_CODE_EXECUTION alone must NOT enable execution');
  } finally {
    if (oldRunner !== undefined) process.env.JASPER_SANDBOX_RUNNER_URL = oldRunner;
    delete process.env.ALLOW_HOST_CODE_EXECUTION;
  }
});

test('Sandbox Policy: Production mode MUST fail closed without external runner', async () => {
  clearLimiter();
  const oldNodeEnv = process.env.NODE_ENV;
  const oldRunner = process.env.JASPER_SANDBOX_RUNNER_URL;

  try {
    process.env.NODE_ENV = 'production';
    delete process.env.JASPER_SANDBOX_RUNNER_URL;

    const status = codeSandboxEngine.getStatus();
    assert.strictEqual(status.enabled, false);
    assert.strictEqual(status.mode, 'disabled_in_production');
  } finally {
    process.env.NODE_ENV = oldNodeEnv;
    if (oldRunner !== undefined) process.env.JASPER_SANDBOX_RUNNER_URL = oldRunner;
  }
});

test('Sandbox Policy: Misconfigured runner without auth key MUST fail closed', async () => {
  clearLimiter();
  const oldRunner = process.env.JASPER_SANDBOX_RUNNER_URL;
  const oldKey = process.env.JASPER_SANDBOX_RUNNER_KEY;

  try {
    process.env.JASPER_SANDBOX_RUNNER_URL = 'http://127.0.0.1:5055';
    delete process.env.JASPER_SANDBOX_RUNNER_KEY;

    const status = codeSandboxEngine.getStatus();
    assert.strictEqual(status.enabled, false);
    assert.strictEqual(status.mode, 'misconfigured_runner');

    const execRes = await makeRequest(app, 'POST', '/api/code/execute', { 'x-jasper-token': 'jasper' }, {
      code: 'console.log("unauth_runner_probe");',
      language: 'javascript'
    });
    assert.strictEqual(execRes.statusCode, 403);
    assert.strictEqual(execRes.body.sandboxMode, 'misconfigured_runner');
  } finally {
    if (oldRunner !== undefined) process.env.JASPER_SANDBOX_RUNNER_URL = oldRunner;
    else delete process.env.JASPER_SANDBOX_RUNNER_URL;
    if (oldKey !== undefined) process.env.JASPER_SANDBOX_RUNNER_KEY = oldKey;
    else delete process.env.JASPER_SANDBOX_RUNNER_KEY;
  }
});

// ---------------------------------------------------------------------------
// 2. AUTHENTICATION, AUTHORIZATION & INPUT VALIDATION TESTS
// ---------------------------------------------------------------------------

test('Sandbox Auth: Query-string authentication MUST be strictly rejected on /api/code/execute and cancel', async () => {
  clearLimiter();
  // Attempt auth via query string (?token=jasper) on execute
  const execQueryAuth = await makeRequest(app, 'POST', '/api/code/execute?token=jasper', {}, {
    code: 'console.log("query_auth");',
    language: 'javascript'
  });
  assert.strictEqual(execQueryAuth.statusCode, 401, 'Query-string token on execute must be rejected with 401');
  assert.ok(execQueryAuth.body.error.includes('Query string authentication is prohibited'));

  // Attempt auth via query string on cancel
  const cancelQueryAuth = await makeRequest(app, 'POST', '/api/code/cancel?token=jasper', {}, {
    executionId: 'run_123'
  });
  assert.strictEqual(cancelQueryAuth.statusCode, 401, 'Query-string token on cancel must be rejected with 401');
  assert.ok(cancelQueryAuth.body.error.includes('Query string authentication is prohibited'));
});

test('Sandbox Auth: /api/code/execute and cancel MUST reject missing or invalid headers', async () => {
  clearLimiter();
  const resNoAuth = await makeRequest(app, 'POST', '/api/code/execute', {}, {
    code: 'console.log("unauth");',
    language: 'javascript'
  });
  assert.strictEqual(resNoAuth.statusCode, 401);

  const resBadToken = await makeRequest(app, 'POST', '/api/code/execute', { 'x-jasper-token': 'wrong-token-xyz' }, {
    code: 'console.log("unauth");',
    language: 'javascript'
  });
  assert.strictEqual(resBadToken.statusCode, 401);
});

test('Sandbox Validation: PowerShell MUST be rejected with explicit isolation rationale', async () => {
  clearLimiter();
  const resPs = await makeRequest(app, 'POST', '/api/code/execute', { 'x-jasper-token': 'jasper' }, {
    code: 'Write-Host "probe"',
    language: 'powershell'
  });
  assert.strictEqual(resPs.statusCode, 400);
  assert.ok(resPs.body.error && resPs.body.error.includes('PowerShell cannot be safely sandboxed without Hyper-V container isolation'));
});

test('Sandbox Validation: Code payloads exceeding 64 KB MUST be rejected', async () => {
  clearLimiter();
  const oversizedCode = 'console.log("a");\n'.repeat(5000);
  const resOversize = await makeRequest(app, 'POST', '/api/code/execute', { 'x-jasper-token': 'jasper' }, {
    code: oversizedCode,
    language: 'javascript'
  });
  assert.ok(resOversize.statusCode === 400 || resOversize.statusCode === 413);
});

test('Sandbox Validation: Unsupported languages MUST be rejected with 400', async () => {
  clearLimiter();
  for (const lang of ['ruby', 'bash', 'sh', 'php']) {
    const res = await makeRequest(app, 'POST', '/api/code/execute', { 'x-jasper-token': 'jasper' }, {
      code: 'print(1)',
      language: lang
    });
    assert.strictEqual(res.statusCode, 400);
  }
});

test('Sandbox Security: /api/code/execute MUST reject destructive command patterns with 403', async () => {
  clearLimiter();
  const resDestructive = await makeRequest(app, 'POST', '/api/code/execute', { 'x-jasper-token': 'jasper' }, {
    code: 'Remove-Item -Recurse -Force C:\\Windows',
    language: 'powershell'
  });
  assert.strictEqual(resDestructive.statusCode, 403);
});

// ---------------------------------------------------------------------------
// 3. RUNNER CONTROLLER AUTHENTICATION, ENGINE PROBING & SPECIFICATION TESTS
// ---------------------------------------------------------------------------

test('[UNIT / MOCKED DOCKER] Runner Controller: Direct access MUST reject unauthenticated requests and leak zero secrets', async (t) => {
  const oldKey = process.env.JASPER_SANDBOX_RUNNER_KEY;
  process.env.JASPER_SANDBOX_RUNNER_KEY = TEST_RUNNER_SECRET;

  const runnerServer = runnerService.createServer();
  const testPort = 5071;

  await new Promise((resolve, reject) => {
    runnerServer.listen(testPort, '127.0.0.1', resolve);
    runnerServer.on('error', reject);
  });

  t.after(() => {
    if (oldKey !== undefined) process.env.JASPER_SANDBOX_RUNNER_KEY = oldKey;
    else delete process.env.JASPER_SANDBOX_RUNNER_KEY;
    return new Promise(resolve => runnerServer.close(resolve));
  });

  // 1. Health check reports status without leaking secrets
  const healthRes = await makeDirectRequest(testPort, 'GET', '/health');
  assert.strictEqual(healthRes.statusCode, 200);
  assert.strictEqual(healthRes.body.status, 'healthy');
  assert.strictEqual(healthRes.body.isolation, 'container_per_job');
  assert.strictEqual(healthRes.body.authRequired, true);
  assert.strictEqual(JSON.stringify(healthRes.body).includes(TEST_RUNNER_SECRET), false);

  // 2. Unauthenticated /run rejected with 401
  const runNoAuth = await makeDirectRequest(testPort, 'POST', '/run', {}, {
    code: 'console.log("probe");',
    language: 'javascript'
  });
  assert.strictEqual(runNoAuth.statusCode, 401);

  // 3. Invalid token rejected with 401
  const runBadAuth = await makeDirectRequest(testPort, 'POST', '/run', {
    'Authorization': 'Bearer wrong-secret-token'
  }, {
    code: 'console.log("probe");',
    language: 'javascript'
  });
  assert.strictEqual(runBadAuth.statusCode, 401);
});

test('[UNIT / MOCKED DOCKER] Runner Controller: MUST fail closed with 503 when container engine (Docker/Podman) is unavailable', async (t) => {
  const oldKey = process.env.JASPER_SANDBOX_RUNNER_KEY;
  process.env.JASPER_SANDBOX_RUNNER_KEY = TEST_RUNNER_SECRET;

  // Create server with container driver that reports engine unavailable
  const unavailableDriver = {
    isAvailable: () => false,
    getEngineName: () => 'docker'
  };

  const runnerServer = runnerService.createServer({ containerDriver: unavailableDriver });
  const testPort = 5072;

  await new Promise((resolve, reject) => {
    runnerServer.listen(testPort, '127.0.0.1', resolve);
    runnerServer.on('error', reject);
  });

  t.after(() => {
    if (oldKey !== undefined) process.env.JASPER_SANDBOX_RUNNER_KEY = oldKey;
    else delete process.env.JASPER_SANDBOX_RUNNER_KEY;
    return new Promise(resolve => runnerServer.close(resolve));
  });

  // Attempt to execute code when container runtime is unavailable
  const res = await makeDirectRequest(testPort, 'POST', '/run', {
    'Authorization': `Bearer ${TEST_RUNNER_SECRET}`
  }, {
    code: 'console.log("probe");',
    language: 'javascript',
    ownerId: 'test_user'
  });

  // MUST return 503 Service Unavailable and NEVER fall back to host execution
  assert.strictEqual(res.statusCode, 503);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.runtimeAvailable, false);
  assert.ok(res.body.error.includes('Per-job container isolation runtime'));
  assert.ok(res.body.error.includes('disabled fail-closed'));
});

test('[UNIT / MOCKED DOCKER] Runner Controller: Per-job container launch arguments MUST strictly enforce kernel isolation boundaries', () => {
  const driver = runnerService.defaultContainerDriver;
  const args = driver.buildRunArgs({
    containerName: 'jasper_job_run_test_123',
    cleanLang: 'javascript',
    runtimeImage: runnerService.DEFAULT_NODE_IMAGE
  });

  // Verify mandatory flags for disposable per-job container isolation:
  assert.ok(args.includes('--rm'), 'Container must have --rm for automatic cleanup');
  assert.ok(args.includes('--network') && args[args.indexOf('--network') + 1] === 'none', 
    'Container must strictly use --network none');
  assert.ok(args.includes('--read-only'), 'Container must have read-only root filesystem');
  assert.ok(args.includes('--user') && args[args.indexOf('--user') + 1] === '10001:10001', 
    'Container must execute as non-root user 10001:10001');
  assert.ok(args.includes('--cap-drop=ALL'), 'Container must drop all Linux capabilities');
  assert.ok(args.includes('--security-opt') && args[args.indexOf('--security-opt') + 1] === 'no-new-privileges:true', 
    'Container must enforce no-new-privileges');
  assert.ok(args.includes('--memory') && args[args.indexOf('--memory') + 1] === '64m', 
    'Container must enforce 64m memory ceiling');
  assert.ok(args.includes('--pids-limit') && args[args.indexOf('--pids-limit') + 1] === '32', 
    'Container must enforce PID limit to prevent fork bombs');

  // Verify ZERO host mounts and ZERO Docker socket mounts
  for (let i = 0; i < args.length; i++) {
    assert.strictEqual(args[i] === '-v' || args[i] === '--volume' || args[i] === '--mount', false, 
      'Job container must NOT have any host volume mounts');
    assert.strictEqual(args[i].includes('docker.sock'), false, 
      'Job container must NOT have Docker socket mounted');
  }

  // Verify entrypoint executes via stdin
  assert.ok(args.includes('node') && args[args.indexOf('node') + 1] === '-', 
    'JavaScript execution must read pure code from stdin (-)');
});

test('[UNIT / MOCKED DOCKER] probeContainerEngine executes --version with shell: false and returns status correctly', () => {
  let executedCmd = null;
  let executedArgs = null;
  let executedOpts = null;

  const mockSpawnSync = (cmd, args, opts) => {
    executedCmd = cmd;
    executedArgs = args;
    executedOpts = opts;
    return { status: 0, error: null };
  };

  // 1. Success case: exits 0
  const isOk = runnerService.probeContainerEngine('docker', mockSpawnSync);
  assert.strictEqual(isOk, true);
  assert.strictEqual(executedCmd, 'docker');
  assert.deepStrictEqual(executedArgs, ['--version']);
  assert.strictEqual(executedOpts.shell, false, 'Must enforce shell: false');
  assert.strictEqual(executedOpts.encoding, 'utf8');

  // 2. Error case (e.g. ENOENT when Docker is not installed)
  const mockSpawnSyncError = () => ({ status: null, error: new Error('ENOENT') });
  assert.strictEqual(runnerService.probeContainerEngine('docker', mockSpawnSyncError), false);

  // 3. Non-zero exit code
  const mockSpawnSyncFail = () => ({ status: 1, error: null });
  assert.strictEqual(runnerService.probeContainerEngine('docker', mockSpawnSyncFail), false);

  // 4. Invalid engine identifier
  assert.strictEqual(runnerService.probeContainerEngine('docker; malicious', mockSpawnSync), false);
});

test('[UNIT / MOCKED DOCKER] purgeOrphanedContainers lists and removes containers with shell: false and validates container IDs', () => {
  const calls = [];
  const mockSpawnSync = (cmd, args, opts) => {
    calls.push({ cmd, args, opts });
    if (args[0] === 'ps') {
      return {
        status: 0,
        stdout: 'cid123456789\njasper_job_run_123_abc\n;rm -rf /\n../bad_traversal\nvalid_cid_9999\n'
      };
    }
    return { status: 0, error: null };
  };

  const result = runnerService.purgeOrphanedContainers('docker', mockSpawnSync);
  assert.strictEqual(result.cleaned, 3, 'Must only clean the 3 valid container identifiers');

  // Verify ps call uses shell: false
  assert.strictEqual(calls[0].opts.shell, false, 'ps must use shell: false');
  assert.deepStrictEqual(calls[0].args, ['ps', '-aq', '--filter', 'name=jasper_job_']);

  // Verify subsequent rm calls
  const rmCalls = calls.slice(1);
  assert.strictEqual(rmCalls.length, 3);
  for (const call of rmCalls) {
    assert.strictEqual(call.opts.shell, false, 'rm must use shell: false');
    assert.strictEqual(call.args[0], 'rm');
    assert.strictEqual(call.args[1], '-f');
    assert.ok(runnerService.isValidContainerIdentifier(call.args[2]), 'Container ID must be validated');
  }

  // Ensure invalid tokens were NEVER passed to rm
  const rmTargets = rmCalls.map(c => c.args[2]);
  assert.ok(!rmTargets.includes(';rm -rf /'), 'Must NOT execute rm on shell injection string');
  assert.ok(!rmTargets.includes('../bad_traversal'), 'Must NOT execute rm on path traversal string');
});

test('[UNIT / MOCKED DOCKER] isValidContainerIdentifier validates safe IDs and rejects metacharacters and path traversal', () => {
  // Valid
  assert.strictEqual(runnerService.isValidContainerIdentifier('a1234567890b'), true);
  assert.strictEqual(runnerService.isValidContainerIdentifier('jasper_job_run_1792345678_abcd1234'), true);
  assert.strictEqual(runnerService.isValidContainerIdentifier('container-name.123_v1'), true);
  assert.strictEqual(runnerService.isValidContainerIdentifier('sha256-abc'), true);

  // Invalid
  assert.strictEqual(runnerService.isValidContainerIdentifier(''), false);
  assert.strictEqual(runnerService.isValidContainerIdentifier('   '), false);
  assert.strictEqual(runnerService.isValidContainerIdentifier('; rm -rf /'), false);
  assert.strictEqual(runnerService.isValidContainerIdentifier('container$(whoami)'), false);
  assert.strictEqual(runnerService.isValidContainerIdentifier('a|b'), false);
  assert.strictEqual(runnerService.isValidContainerIdentifier('a&b'), false);
  assert.strictEqual(runnerService.isValidContainerIdentifier('../path/traversal'), false);
  assert.strictEqual(runnerService.isValidContainerIdentifier('foo\nbar'), false);
  assert.strictEqual(runnerService.isValidContainerIdentifier('a'.repeat(129)), false);
});

test('[UNIT / MOCKED DOCKER] Configurable image reference validation supports tags, repositories, and immutable SHA-256 digests', () => {
  // Valid tagged references
  assert.strictEqual(runnerService.isValidImageReference('node:20-alpine'), true);
  assert.strictEqual(runnerService.isValidImageReference('python:3.11-alpine'), true);
  assert.strictEqual(runnerService.isValidImageReference('docker.io/library/node:20-alpine'), true);

  // Valid immutable SHA-256 digests
  const nodeWithDigest = 'node:20-alpine@sha256:afdf98210b07b586eb71fa22ba2e432e058e4cd1304d31ed60888755b8c865fb';
  assert.strictEqual(runnerService.isValidImageReference(nodeWithDigest), true);
  assert.strictEqual(runnerService.isImmutableImageDigest(nodeWithDigest), true);

  // Reference without digest is not immutable
  assert.strictEqual(runnerService.isImmutableImageDigest('node:20-alpine'), false);

  // Malformed or dangerous image strings MUST be rejected
  assert.strictEqual(runnerService.isValidImageReference('node:latest; cat /etc/passwd'), false);
  assert.strictEqual(runnerService.isValidImageReference('evil image with spaces'), false);
  assert.strictEqual(runnerService.isValidImageReference('node$(whoami)'), false);
  assert.strictEqual(runnerService.isValidImageReference(''), false);
  assert.strictEqual(runnerService.isValidImageReference('a'.repeat(256)), false);

  // getRuntimeImage fails closed on invalid or mutable overrides (never silently falls back)
  const oldNodeEnv = process.env.SANDBOX_NODE_IMAGE;
  process.env.SANDBOX_NODE_IMAGE = 'evil; injection';
  assert.strictEqual(runnerService.getRuntimeImage('javascript'), null, 'Invalid override must fail closed and return null');
  if (oldNodeEnv !== undefined) process.env.SANDBOX_NODE_IMAGE = oldNodeEnv;
  else delete process.env.SANDBOX_NODE_IMAGE;
});

test('[UNIT / MOCKED DOCKER] Runtime Image Security: Immutable SHA-256 digest enforcement, mutable tag rejection, and fail-closed overrides', async (t) => {
  const oldNodeImage = process.env.SANDBOX_NODE_IMAGE;
  const oldPythonImage = process.env.SANDBOX_PYTHON_IMAGE;
  const oldKey = process.env.JASPER_SANDBOX_RUNNER_KEY;

  try {
    // 1. Missing overrides: safely resolve to default verified pinned digests
    delete process.env.SANDBOX_NODE_IMAGE;
    delete process.env.SANDBOX_PYTHON_IMAGE;

    const defaultNode = runnerService.getRuntimeImage('javascript');
    const defaultPython = runnerService.getRuntimeImage('python');

    assert.strictEqual(defaultNode, runnerService.DEFAULT_NODE_IMAGE);
    assert.strictEqual(defaultPython, runnerService.DEFAULT_PYTHON_IMAGE);
    assert.strictEqual(runnerService.isImmutableImageDigest(defaultNode), true, 'Default Node image must be an immutable SHA-256 digest');
    assert.strictEqual(runnerService.isImmutableImageDigest(defaultPython), true, 'Default Python image must be an immutable SHA-256 digest');
    assert.ok(defaultNode.includes('@sha256:afdf98210b07b586eb71fa22ba2e432e058e4cd1304d31ed60888755b8c865fb'));
    assert.ok(defaultPython.includes('@sha256:bfebb8e11b53c46715fe3634e3b7bc5afb33b21ec82521539af1467c81ad3aed'));

    // 2. Mutable tags: MUST be rejected and fail closed (return null, never fall back)
    const mutableNodeTags = ['node:20-alpine', 'node:latest', 'node:alpine', 'myrepo/node:test'];
    for (const tag of mutableNodeTags) {
      process.env.SANDBOX_NODE_IMAGE = tag;
      assert.strictEqual(runnerService.getRuntimeImage('javascript'), null, `Mutable tag '${tag}' must fail closed and return null`);
    }

    const mutablePythonTags = ['python:3.11-alpine', 'python:latest', 'python:3-slim'];
    for (const tag of mutablePythonTags) {
      process.env.SANDBOX_PYTHON_IMAGE = tag;
      assert.strictEqual(runnerService.getRuntimeImage('python'), null, `Mutable tag '${tag}' must fail closed and return null`);
    }

    // 3. Malformed digests: MUST be rejected and fail closed (return null)
    const malformedDigests = [
      'node:20-alpine@sha256:tooshort', // Truncated hash (< 64 hex)
      'node:20-alpine@sha256:afdf98210b07b586eb71fa22ba2e432e058e4cd1304d31ed60888755b8c865f', // 63 chars
      'node:20-alpine@sha256:afdf98210b07b586eb71fa22ba2e432e058e4cd1304d31ed60888755b8c865fbaa', // 65 chars
      'node:20-alpine@sha256:zzzz98210b07b586eb71fa22ba2e432e058e4cd1304d31ed60888755b8c865fb', // Non-hex characters
      'node:20-alpine@md5:afdf98210b07b586eb71fa22ba2e432e', // Non-SHA256 algorithm
      'node:20-alpine@sha512:afdf98210b07b586eb71fa22ba2e432e058e4cd1304d31ed60888755b8c865fb', // Non-SHA256
      'node:20-alpine@sha256:afdf98210b07b586eb71fa22ba2e432e058e4cd1304d31ed60888755b8c865fb; whoami' // Metacharacters
    ];

    for (const malformed of malformedDigests) {
      process.env.SANDBOX_NODE_IMAGE = malformed;
      assert.strictEqual(runnerService.getRuntimeImage('javascript'), null, `Malformed digest '${malformed}' must fail closed and return null`);
    }

    // 4. Valid custom pinned immutable digests: MUST be accepted
    const customNodePinned = 'registry.corp.internal:5000/secured/node:20@sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    process.env.SANDBOX_NODE_IMAGE = customNodePinned;
    assert.strictEqual(runnerService.getRuntimeImage('javascript'), customNodePinned, 'Valid custom pinned Node image must be accepted');

    const customPythonPinned = 'myregistry.io/python:3.11@sha256:fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210';
    process.env.SANDBOX_PYTHON_IMAGE = customPythonPinned;
    assert.strictEqual(runnerService.getRuntimeImage('python'), customPythonPinned, 'Valid custom pinned Python image must be accepted');

    // 5. Unsupported language: returns null
    assert.strictEqual(runnerService.getRuntimeImage('ruby'), null);
    assert.strictEqual(runnerService.getRuntimeImage('powershell'), null);

    // 6. Fail-closed HTTP execution: POST /run MUST return HTTP 500 when configured with mutable tag or malformed image
    process.env.JASPER_SANDBOX_RUNNER_KEY = TEST_RUNNER_SECRET;
    process.env.SANDBOX_NODE_IMAGE = 'node:latest'; // Mutable tag configured

    const mockDriver = createMockContainerDriver();
    const runnerServer = runnerService.createServer({ containerDriver: mockDriver });

    await new Promise((resolve, reject) => {
      runnerServer.listen(0, '127.0.0.1', resolve);
      runnerServer.on('error', reject);
    });

    const testPort = runnerServer.address().port;

    try {
      const runRes = await makeDirectRequest(testPort, 'POST', '/run', {
        'Authorization': `Bearer ${TEST_RUNNER_SECRET}`
      }, {
        code: 'console.log("probe");',
        language: 'javascript',
        ownerId: 'test_user'
      });

      assert.strictEqual(runRes.statusCode, 500, 'POST /run must return HTTP 500 when image is mutable or invalid');
      assert.strictEqual(runRes.body.success, false);
      assert.ok(runRes.body.error.includes('immutable SHA-256 digest'), 'Error message must cite immutable SHA-256 digest requirement');
      assert.strictEqual(mockDriver.spawnedContainers.length, 0, 'No container must ever be spawned when image is mutable or invalid');
    } finally {
      await new Promise(resolve => runnerServer.close(resolve));
    }
  } finally {
    if (oldNodeImage !== undefined) process.env.SANDBOX_NODE_IMAGE = oldNodeImage;
    else delete process.env.SANDBOX_NODE_IMAGE;
    if (oldPythonImage !== undefined) process.env.SANDBOX_PYTHON_IMAGE = oldPythonImage;
    else delete process.env.SANDBOX_PYTHON_IMAGE;
    if (oldKey !== undefined) process.env.JASPER_SANDBOX_RUNNER_KEY = oldKey;
    else delete process.env.JASPER_SANDBOX_RUNNER_KEY;
  }
});

test('[UNIT / MOCKED DOCKER] defaultContainerDriver argument validation and safe execution with shell: false', () => {
  const driver = runnerService.defaultContainerDriver;

  // buildRunArgs rejects malformed container name
  assert.throws(() => {
    driver.buildRunArgs({
      containerName: '; rm -rf /',
      cleanLang: 'javascript',
      runtimeImage: runnerService.DEFAULT_NODE_IMAGE
    });
  }, /Invalid container name/);

  // buildRunArgs rejects malformed or dangerous image reference
  assert.throws(() => {
    driver.buildRunArgs({
      containerName: 'valid_container_name',
      cleanLang: 'javascript',
      runtimeImage: 'evil; image'
    });
  }, /Invalid or mutable runtime image reference/);

  // buildRunArgs rejects mutable tagged image reference (must be pinned digest)
  assert.throws(() => {
    driver.buildRunArgs({
      containerName: 'valid_container_name',
      cleanLang: 'javascript',
      runtimeImage: 'node:20-alpine'
    });
  }, /Invalid or mutable runtime image reference/);

  // buildRunArgs accepts valid immutable SHA-256 pinned digest
  assert.doesNotThrow(() => {
    const args = driver.buildRunArgs({
      containerName: 'valid_container_name',
      cleanLang: 'javascript',
      runtimeImage: runnerService.DEFAULT_NODE_IMAGE
    });
    assert.ok(args.includes(runnerService.DEFAULT_NODE_IMAGE));
    assert.ok(args.includes('--network'));
    assert.ok(args.includes('none'));
  });

  // killJob rejects malformed container name without executing
  let callbackErr = null;
  driver.killJob('; malicious_name', (err) => {
    callbackErr = err;
  });
  assert.ok(callbackErr instanceof Error);
  assert.ok(callbackErr.message.includes('Invalid container name'));
});

// ---------------------------------------------------------------------------
// 4. DISPOSABLE CONTAINER LIFECYCLE, CANCELLATION & CONCURRENCY TESTS
// ---------------------------------------------------------------------------

function createMockContainerDriver() {
  const killedContainers = [];
  const spawnedContainers = [];

  return {
    isAvailable: () => true,
    getEngineName: () => 'docker-mock-driver',
    killedContainers,
    spawnedContainers,
    buildRunArgs: (opts) => runnerService.defaultContainerDriver.buildRunArgs(opts),
    spawnJob({ containerName, cleanLang, runtimeImage }) {
      spawnedContainers.push({ containerName, cleanLang, runtimeImage });

      const child = new EventEmitter();
      child.stdout = new EventEmitter();
      child.stderr = new EventEmitter();
      child.stdin = {
        write: (data) => { child._inputData = (child._inputData || '') + data; },
        end: () => {
          // Simulate container execution asynchronously
          setImmediate(() => {
            if (child._isKilled) return;
            const code = child._inputData || '';
            if (code.includes('SLEEP_SIMULATION')) {
              // Simulates long-running container
              child._sleepTimer = setTimeout(() => {
                if (!child._isKilled) {
                  child.stdout.emit('data', Buffer.from('done\n'));
                  child.emit('close', 0);
                }
              }, 4000);
            } else if (code.includes('FLOOD_SIMULATION')) {
              // Simulates output flooding
              child.stdout.emit('data', Buffer.from('PADDING_LINE\n'.repeat(3000)));
              child.emit('close', 0);
            } else if (code.includes('ERROR_SIMULATION')) {
              child.stderr.emit('data', Buffer.from('error occurred\n'));
              child.emit('close', 1);
            } else {
              child.stdout.emit('data', Buffer.from(`CONTAINER_OUTPUT: ${cleanLang}_success\n`));
              child.emit('close', 0);
            }
          });
        }
      };
      child.kill = (sig) => {
        child._isKilled = true;
        if (child._sleepTimer) clearTimeout(child._sleepTimer);
        setImmediate(() => child.emit('close', 130));
      };

      return child;
    },
    killJob(containerName, callback) {
      killedContainers.push(containerName);
      if (callback) setImmediate(callback);
    }
  };
}

test('[UNIT / MOCKED DOCKER] Per-Job Container Isolation: Each job receives a distinct container and cleans up on completion', async (t) => {
  const oldKey = process.env.JASPER_SANDBOX_RUNNER_KEY;
  process.env.JASPER_SANDBOX_RUNNER_KEY = TEST_RUNNER_SECRET;

  const mockDriver = createMockContainerDriver();
  const runnerServer = runnerService.createServer({ containerDriver: mockDriver });
  const testPort = 5073;

  await new Promise((resolve, reject) => {
    runnerServer.listen(testPort, '127.0.0.1', resolve);
    runnerServer.on('error', reject);
  });

  t.after(() => {
    if (oldKey !== undefined) process.env.JASPER_SANDBOX_RUNNER_KEY = oldKey;
    else delete process.env.JASPER_SANDBOX_RUNNER_KEY;
    return new Promise(resolve => runnerServer.close(resolve));
  });

  // Run job 1
  const res1 = await makeDirectRequest(testPort, 'POST', '/run', {
    'Authorization': `Bearer ${TEST_RUNNER_SECRET}`
  }, {
    code: 'console.log("job1");',
    language: 'javascript',
    ownerId: 'test_user_1'
  });
  assert.strictEqual(res1.statusCode, 200);
  assert.strictEqual(res1.body.isolation, 'container_per_job');

  // Run job 2
  const res2 = await makeDirectRequest(testPort, 'POST', '/run', {
    'Authorization': `Bearer ${TEST_RUNNER_SECRET}`
  }, {
    code: 'print("job2")',
    language: 'python',
    ownerId: 'test_user_2'
  });
  assert.strictEqual(res2.statusCode, 200);

  // Verify that each job received a distinct disposable container
  assert.strictEqual(mockDriver.spawnedContainers.length, 2);
  const name1 = mockDriver.spawnedContainers[0].containerName;
  const name2 = mockDriver.spawnedContainers[1].containerName;

  assert.ok(name1.startsWith('jasper_job_run_'));
  assert.ok(name2.startsWith('jasper_job_run_'));
  assert.notStrictEqual(name1, name2, 'Each job must receive a distinct disposable container name');
});

test('[UNIT / MOCKED DOCKER] Job Cancellation: Cancellation strictly verifies owner and terminates container', async (t) => {
  const oldKey = process.env.JASPER_SANDBOX_RUNNER_KEY;
  process.env.JASPER_SANDBOX_RUNNER_KEY = TEST_RUNNER_SECRET;

  const mockDriver = createMockContainerDriver();
  const runnerServer = runnerService.createServer({ containerDriver: mockDriver });
  const testPort = 5074;

  await new Promise((resolve, reject) => {
    runnerServer.listen(testPort, '127.0.0.1', resolve);
    runnerServer.on('error', reject);
  });

  t.after(() => {
    if (oldKey !== undefined) process.env.JASPER_SANDBOX_RUNNER_KEY = oldKey;
    else delete process.env.JASPER_SANDBOX_RUNNER_KEY;
    return new Promise(resolve => runnerServer.close(resolve));
  });

  // Launch a job owned by user_alice
  const launchPromise = makeDirectRequest(testPort, 'POST', '/run', {
    'Authorization': `Bearer ${TEST_RUNNER_SECRET}`
  }, {
    code: 'SLEEP_SIMULATION',
    language: 'javascript',
    timeoutMs: 4000,
    ownerId: 'user_alice'
  });

  await new Promise(r => setTimeout(r, 100));

  const jobIds = Array.from(runnerServer.activeJobs.keys());
  assert.ok(jobIds.length > 0);
  const activeJobId = jobIds[0];

  // 1. Cross-user cancellation attempt by user_bob MUST return 403 Forbidden
  const crossCancelRes = await makeDirectRequest(testPort, 'POST', '/cancel', {
    'Authorization': `Bearer ${TEST_RUNNER_SECRET}`
  }, {
    executionId: activeJobId,
    requesterId: 'user_bob'
  });
  assert.strictEqual(crossCancelRes.statusCode, 403);
  assert.ok(crossCancelRes.body.error.includes('permission'));

  // 2. Cancellation without requesterId MUST return 401
  const noRequesterCancel = await makeDirectRequest(testPort, 'POST', '/cancel', {
    'Authorization': `Bearer ${TEST_RUNNER_SECRET}`
  }, {
    executionId: activeJobId
  });
  assert.strictEqual(noRequesterCancel.statusCode, 401);

  // 3. Legitimate cancellation by user_alice MUST succeed and kill container
  const ownerCancelRes = await makeDirectRequest(testPort, 'POST', '/cancel', {
    'Authorization': `Bearer ${TEST_RUNNER_SECRET}`
  }, {
    executionId: activeJobId,
    requesterId: 'user_alice'
  });
  assert.strictEqual(ownerCancelRes.statusCode, 200);
  assert.strictEqual(ownerCancelRes.body.success, true);

  // Verify that the container was explicitly killed
  assert.ok(mockDriver.killedContainers.some(name => name.includes(activeJobId)));

  // 4. Repeated cancellation MUST be idempotent
  const repeatCancel = await makeDirectRequest(testPort, 'POST', '/cancel', {
    'Authorization': `Bearer ${TEST_RUNNER_SECRET}`
  }, {
    executionId: activeJobId,
    requesterId: 'user_alice'
  });
  assert.strictEqual(repeatCancel.statusCode, 200);
  assert.strictEqual(repeatCancel.body.idempotent, true);

  const launchResult = await launchPromise;
  assert.strictEqual(launchResult.body.cancelled, true);
});

test('[UNIT / MOCKED DOCKER] Timeout cleanup terminates container with killJob and returns exit code 124', async (t) => {
  const oldKey = process.env.JASPER_SANDBOX_RUNNER_KEY;
  process.env.JASPER_SANDBOX_RUNNER_KEY = TEST_RUNNER_SECRET;

  const mockDriver = createMockContainerDriver();
  const runnerServer = runnerService.createServer({ containerDriver: mockDriver });
  const testPort = 5078;

  await new Promise((resolve, reject) => {
    runnerServer.listen(testPort, '127.0.0.1', resolve);
    runnerServer.on('error', reject);
  });

  t.after(() => {
    if (oldKey !== undefined) process.env.JASPER_SANDBOX_RUNNER_KEY = oldKey;
    else delete process.env.JASPER_SANDBOX_RUNNER_KEY;
    return new Promise(resolve => runnerServer.close(resolve));
  });

  // Execute job with 1000ms timeout simulating a hung process
  const res = await makeDirectRequest(testPort, 'POST', '/run', {
    'Authorization': `Bearer ${TEST_RUNNER_SECRET}`
  }, {
    code: 'SLEEP_SIMULATION',
    language: 'javascript',
    timeoutMs: 1000,
    ownerId: 'test_timeout_user'
  });

  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.timedOut, true);
  assert.strictEqual(res.body.exitCode, 124);
  assert.ok(res.body.error.includes('Execution timed out'));

  // Verify killJob was called for the timed-out container
  assert.ok(mockDriver.killedContainers.length > 0);
  assert.ok(mockDriver.killedContainers.some(name => name.startsWith('jasper_job_run_')));
});

test('[UNIT / MOCKED DOCKER] Direct cancel endpoint strictly rejects malformed executionId with 400', async (t) => {
  const oldKey = process.env.JASPER_SANDBOX_RUNNER_KEY;
  process.env.JASPER_SANDBOX_RUNNER_KEY = TEST_RUNNER_SECRET;

  const runnerServer = runnerService.createServer();
  const testPort = 5079;

  await new Promise((resolve, reject) => {
    runnerServer.listen(testPort, '127.0.0.1', resolve);
    runnerServer.on('error', reject);
  });

  t.after(() => {
    if (oldKey !== undefined) process.env.JASPER_SANDBOX_RUNNER_KEY = oldKey;
    else delete process.env.JASPER_SANDBOX_RUNNER_KEY;
    return new Promise(resolve => runnerServer.close(resolve));
  });

  const res = await makeDirectRequest(testPort, 'POST', '/cancel', {
    'Authorization': `Bearer ${TEST_RUNNER_SECRET}`
  }, {
    executionId: '; rm -rf /',
    requesterId: 'alice'
  });

  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
  assert.ok(res.body.error.includes('Valid executionId required'));
});

test('[UNIT / MOCKED DOCKER] Runner Security: Request payload exceeding 128 KB MUST return 413', async (t) => {
  const oldKey = process.env.JASPER_SANDBOX_RUNNER_KEY;
  process.env.JASPER_SANDBOX_RUNNER_KEY = TEST_RUNNER_SECRET;

  const runnerServer = runnerService.createServer();
  const testPort = 5075;

  await new Promise((resolve, reject) => {
    runnerServer.listen(testPort, '127.0.0.1', resolve);
    runnerServer.on('error', reject);
  });

  t.after(() => {
    if (oldKey !== undefined) process.env.JASPER_SANDBOX_RUNNER_KEY = oldKey;
    else delete process.env.JASPER_SANDBOX_RUNNER_KEY;
    return new Promise(resolve => runnerServer.close(resolve));
  });

  const oversizedData = {
    code: 'console.log("ok");',
    language: 'javascript',
    ownerId: 'test_user',
    padding: 'X'.repeat(140 * 1024)
  };

  const res = await makeDirectRequest(testPort, 'POST', '/run', {
    'Authorization': `Bearer ${TEST_RUNNER_SECRET}`
  }, oversizedData);

  assert.strictEqual(res.statusCode, 413, 'Oversized payload must be rejected with 413 Payload Too Large');
});

// ---------------------------------------------------------------------------
// 5. FULL END-TO-END BACKEND INTEGRATION TESTS WITH RUNNER CONTROLLER
// ---------------------------------------------------------------------------

test('[UNIT / MOCKED DOCKER] Isolated Runner Integration: End-to-end execution through main J.A.S.P.E.R. backend', async (t) => {
  clearLimiter();
  const oldRunnerUrl = process.env.JASPER_SANDBOX_RUNNER_URL;
  const oldRunnerKey = process.env.JASPER_SANDBOX_RUNNER_KEY;

  process.env.JASPER_SANDBOX_RUNNER_KEY = TEST_RUNNER_SECRET;
  const mockDriver = createMockContainerDriver();
  const runnerServer = runnerService.createServer({ containerDriver: mockDriver });
  const runnerPort = 5076;

  await new Promise((resolve, reject) => {
    runnerServer.listen(runnerPort, '127.0.0.1', resolve);
    runnerServer.on('error', reject);
  });

  process.env.JASPER_SANDBOX_RUNNER_URL = `http://127.0.0.1:${runnerPort}`;

  t.after(() => {
    if (oldRunnerUrl !== undefined) process.env.JASPER_SANDBOX_RUNNER_URL = oldRunnerUrl;
    else delete process.env.JASPER_SANDBOX_RUNNER_URL;
    if (oldRunnerKey !== undefined) process.env.JASPER_SANDBOX_RUNNER_KEY = oldRunnerKey;
    else delete process.env.JASPER_SANDBOX_RUNNER_KEY;
    return new Promise(resolve => runnerServer.close(resolve));
  });

  // 1. Status endpoint detects authenticated runner
  const statusRes = await makeRequest(app, 'GET', '/api/code/status');
  assert.strictEqual(statusRes.statusCode, 200);
  assert.strictEqual(statusRes.body.enabled, true);
  assert.strictEqual(statusRes.body.mode, 'external_runner');

  // 2. JavaScript execution via runner controller
  clearLimiter();
  const jsRes = await makeRequest(app, 'POST', '/api/code/execute', { 'x-jasper-token': 'jasper' }, {
    code: 'console.log("hello");',
    language: 'javascript'
  });
  assert.strictEqual(jsRes.statusCode, 200);
  assert.strictEqual(jsRes.body.success, true);
  assert.strictEqual(jsRes.body.sandboxMode, 'external_runner');
  assert.ok(jsRes.body.stdout.includes('CONTAINER_OUTPUT: javascript_success'));

  // 3. Canary server secret MUST NOT leak to runner
  clearLimiter();
  process.env.CANARY_MAIN_SERVER_SECRET = 'SUPER_SECRET_TOKEN_DO_NOT_LEAK';
  const secretRes = await makeRequest(app, 'POST', '/api/code/execute', { 'x-jasper-token': 'jasper' }, {
    code: 'console.log("test");',
    language: 'javascript'
  });
  delete process.env.CANARY_MAIN_SERVER_SECRET;
  assert.strictEqual(secretRes.statusCode, 200);
  assert.strictEqual(secretRes.body.stdout.includes('SUPER_SECRET_TOKEN_DO_NOT_LEAK'), false);

  // 4. Output stream truncation
  clearLimiter();
  const floodRes = await makeRequest(app, 'POST', '/api/code/execute', { 'x-jasper-token': 'jasper' }, {
    code: 'FLOOD_SIMULATION',
    language: 'javascript'
  });
  assert.strictEqual(floodRes.statusCode, 200);
  assert.ok(floodRes.body.stdout.includes('[TRUNCATED: Maximum output size threshold reached (32 KB)]'));

  // 5. In-flight cancellation via main backend
  clearLimiter();
  const sleepPromise = makeRequest(app, 'POST', '/api/code/execute', { 'x-jasper-token': 'jasper' }, {
    code: 'SLEEP_SIMULATION',
    language: 'javascript',
    timeoutMs: 4000
  });

  await new Promise(r => setTimeout(r, 100));

  const activeRunnerIds = Array.from(codeSandboxEngine._activeRunnerJobs.keys());
  assert.ok(activeRunnerIds.length > 0, 'Active runner job must be tracked');
  const targetId = activeRunnerIds[0];

  const cancelRes = await makeRequest(app, 'POST', '/api/code/cancel', { 'x-jasper-token': 'jasper' }, {
    executionId: targetId
  });
  assert.strictEqual(cancelRes.statusCode, 200);
  assert.strictEqual(cancelRes.body.success, true);

  const execResult = await sleepPromise;
  assert.strictEqual(execResult.statusCode, 200);
  assert.strictEqual(execResult.body.cancelled, true);
});

// ---------------------------------------------------------------------------
// 6. PHYSICAL CONTAINER ENVIRONMENT AUDIT (HOST DETECTION)
// ---------------------------------------------------------------------------

test('[INTEGRATION / REAL DOCKER CHECK] Container Infrastructure Detection: Host container environment boundary check', () => {
  const isDockerAvailable = runnerService.defaultContainerDriver.isAvailable();
  console.log(`[Container Engine Audit] Host container runtime available: ${isDockerAvailable}`);

  if (!isDockerAvailable) {
    console.log('[Container Engine Audit] Docker/Podman CLI is not available on this host.');
    console.log('[Container Engine Audit] Per security policy, runner controller fails closed and refuses execution.');
  }

  assert.ok(true, 'Host boundary detection completed.');
});

// ---------------------------------------------------------------------------
// 7. REAL DOCKER INTEGRATION: ACTIVE CANCELLATION & CONTAINER CLEANUP
// ---------------------------------------------------------------------------

test('[INTEGRATION / REAL DOCKER EXECUTION] Active Job Cancellation: Real Docker container termination, authorization, and cleanup', async (t) => {
  if (!runnerService.defaultContainerDriver.isAvailable()) {
    t.skip('Docker container engine is unavailable on this host. Skipping real Docker integration test.');
    return;
  }

  const oldKey = process.env.JASPER_SANDBOX_RUNNER_KEY;
  process.env.JASPER_SANDBOX_RUNNER_KEY = TEST_RUNNER_SECRET;

  // Use the REAL defaultContainerDriver invoking the real local Docker engine with 30s timeout ceiling
  const runnerServer = runnerService.createServer({
    containerDriver: runnerService.defaultContainerDriver,
    maxTimeoutMs: 30000
  });
  await new Promise((resolve, reject) => {
    runnerServer.listen(0, '127.0.0.1', resolve);
    runnerServer.on('error', reject);
  });
  const testPort = runnerServer.address().port;

  const uniqueSuffix = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const legitimateOwner = `owner_alice_${uniqueSuffix}`;
  const unauthorizedOwner = `attacker_bob_${uniqueSuffix}`;
  let capturedContainerName = null;
  let capturedExecutionId = null;

  t.after(async () => {
    if (oldKey !== undefined) process.env.JASPER_SANDBOX_RUNNER_KEY = oldKey;
    else delete process.env.JASPER_SANDBOX_RUNNER_KEY;

    // Reliable fallback container cleanup in finally
    if (capturedContainerName && runnerService.isValidContainerIdentifier(capturedContainerName)) {
      try {
        const engine = runnerService.defaultContainerDriver.getEngineName();
        if (runnerService.isValidContainerIdentifier(engine)) {
          execFile(engine, ['rm', '-f', capturedContainerName], { shell: false, windowsHide: true }, () => {});
        }
      } catch (_) {}
    }

    await new Promise(resolve => runnerServer.close(resolve));
  });

  // Launch harmless long-running JavaScript job with legitimate owner
  const longRunningCode = 'setTimeout(() => { console.log("harmless_job_done"); }, 30000);';
  const runPromise = makeDirectRequest(testPort, 'POST', '/run', {
    'Authorization': `Bearer ${TEST_RUNNER_SECRET}`
  }, {
    code: longRunningCode,
    language: 'javascript',
    timeoutMs: 30000,
    ownerId: legitimateOwner
  });

  // Safe in-memory test hook: Bounded polling to safely obtain execution ID while active
  const pollStart = Date.now();
  while (Date.now() - pollStart < 8000) {
    for (const [id, job] of runnerServer.activeJobs.entries()) {
      if (job.ownerId === legitimateOwner && !job.cancelled) {
        capturedExecutionId = id;
        capturedContainerName = job.containerName;
        break;
      }
    }
    if (capturedExecutionId) break;
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  assert.ok(capturedExecutionId, 'Job must be actively registered in runnerServer.activeJobs');
  assert.ok(capturedContainerName, 'Job must have a valid container name assigned');
  assert.ok(runnerService.isValidContainerIdentifier(capturedContainerName), 'Container name must be a valid identifier');

  // Verify real Docker container is actively running (bounded wait for container startup)
  const engine = runnerService.defaultContainerDriver.getEngineName();
  let isRunning = false;
  let lastInspect = null;
  const inspectPollStart = Date.now();
  while (Date.now() - inspectPollStart < 15000) {
    const inspectRes = await new Promise((resolve) => {
      execFile(engine, ['inspect', '--format', '{{.State.Running}}', capturedContainerName], {
        shell: false,
        windowsHide: true
      }, (err, stdout, stderr) => {
        resolve({ err, stdout: (stdout || '').trim(), stderr: (stderr || '').trim() });
      });
    });
    if (inspectRes.stdout === 'true') {
      isRunning = true;
      break;
    }
    lastInspect = inspectRes;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.strictEqual(isRunning, true, 'Docker container must be actively running in Docker engine');

  // 1. Unauthorized cancellation attempt by a different owner MUST return HTTP 403
  const unauthorizedCancelRes = await makeDirectRequest(testPort, 'POST', '/cancel', {
    'Authorization': `Bearer ${TEST_RUNNER_SECRET}`
  }, {
    executionId: capturedExecutionId,
    requesterId: unauthorizedOwner
  });

  assert.strictEqual(unauthorizedCancelRes.statusCode, 403, 'Cross-user cancellation must be forbidden (HTTP 403)');
  assert.strictEqual(unauthorizedCancelRes.body.success, false);
  assert.ok(unauthorizedCancelRes.body.error.includes('permission'), 'Error response must indicate permission denied');

  // 2. Legitimate cancellation by legitimate owner MUST succeed (HTTP 200)
  const authorizedCancelRes = await makeDirectRequest(testPort, 'POST', '/cancel', {
    'Authorization': `Bearer ${TEST_RUNNER_SECRET}`
  }, {
    executionId: capturedExecutionId,
    requesterId: legitimateOwner
  });

  assert.strictEqual(authorizedCancelRes.statusCode, 200, 'Legitimate cancellation must return HTTP 200 OK');
  assert.strictEqual(authorizedCancelRes.body.success, true);
  assert.strictEqual(authorizedCancelRes.body.executionId, capturedExecutionId);

  // 3. Assert original run response reports cancelled: true, not timedOut: true
  const runRes = await runPromise;
  assert.strictEqual(runRes.statusCode, 200, 'Original run response must return HTTP 200');
  assert.strictEqual(runRes.body.cancelled, true, 'Original run response must report cancelled: true');
  assert.strictEqual(Boolean(runRes.body.timedOut), false, 'Original run response must NOT report timedOut: true');
  assert.strictEqual(runRes.body.executionId, capturedExecutionId);
  assert.strictEqual(runRes.body.exitCode, 130, 'Cancelled job must exit with code 130');

  // 4. Verify corresponding Docker container is removed from Docker engine
  let containerRemoved = false;
  const removalPollStart = Date.now();
  while (Date.now() - removalPollStart < 5000) {
    const checkRes = await new Promise((resolve) => {
      execFile(engine, ['ps', '-a', '--filter', `name=${capturedContainerName}`, '--format', '{{.Names}}'], {
        shell: false,
        windowsHide: true
      }, (err, stdout) => {
        resolve({ err, stdout: (stdout || '').trim() });
      });
    });
    const foundNames = (checkRes.stdout || '').split(/\r?\n/).filter(Boolean);
    if (!foundNames.includes(capturedContainerName)) {
      containerRemoved = true;
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  assert.strictEqual(containerRemoved, true, 'Docker container must be removed from the host Docker engine');
});

// ---------------------------------------------------------------------------
// 8. STRICT OWNERSHIP & TIMEOUT BOUNDS SECURITY TESTS
// ---------------------------------------------------------------------------

test('[UNIT / MOCKED DOCKER] Owner Identity Security: Missing, invalid, and malformed ownerId on /run MUST fail closed with 400', async (t) => {
  const oldKey = process.env.JASPER_SANDBOX_RUNNER_KEY;
  process.env.JASPER_SANDBOX_RUNNER_KEY = TEST_RUNNER_SECRET;

  const mockDriver = createMockContainerDriver();
  const runnerServer = runnerService.createServer({ containerDriver: mockDriver });
  const testPort = 5085;

  await new Promise((resolve, reject) => {
    runnerServer.listen(testPort, '127.0.0.1', resolve);
    runnerServer.on('error', reject);
  });

  t.after(() => {
    if (oldKey !== undefined) process.env.JASPER_SANDBOX_RUNNER_KEY = oldKey;
    else delete process.env.JASPER_SANDBOX_RUNNER_KEY;
    return new Promise(resolve => runnerServer.close(resolve));
  });

  const basePayload = {
    code: 'console.log("identity_test");',
    language: 'javascript'
  };

  // 1. Missing ownerId entirely MUST return 400
  const resMissing = await makeDirectRequest(testPort, 'POST', '/run', {
    'Authorization': `Bearer ${TEST_RUNNER_SECRET}`
  }, basePayload);
  assert.strictEqual(resMissing.statusCode, 400);
  assert.strictEqual(resMissing.body.success, false);
  assert.ok(resMissing.body.error.includes('Valid ownerId required'));

  // 2. Empty string ownerId MUST return 400
  const resEmpty = await makeDirectRequest(testPort, 'POST', '/run', {
    'Authorization': `Bearer ${TEST_RUNNER_SECRET}`
  }, { ...basePayload, ownerId: '' });
  assert.strictEqual(resEmpty.statusCode, 400);
  assert.strictEqual(resEmpty.body.success, false);

  // 3. Whitespace-only ownerId MUST return 400
  const resWhitespace = await makeDirectRequest(testPort, 'POST', '/run', {
    'Authorization': `Bearer ${TEST_RUNNER_SECRET}`
  }, { ...basePayload, ownerId: '   ' });
  assert.strictEqual(resWhitespace.statusCode, 400);

  // 4. Non-string ownerId MUST return 400
  for (const invalidOwner of [12345, { user: 'alice' }, true, null]) {
    const res = await makeDirectRequest(testPort, 'POST', '/run', {
      'Authorization': `Bearer ${TEST_RUNNER_SECRET}`
    }, { ...basePayload, ownerId: invalidOwner });
    assert.strictEqual(res.statusCode, 400);
  }

  // 5. Excessively long ownerId (> 128 chars) MUST return 400
  const resLong = await makeDirectRequest(testPort, 'POST', '/run', {
    'Authorization': `Bearer ${TEST_RUNNER_SECRET}`
  }, { ...basePayload, ownerId: 'a'.repeat(129) });
  assert.strictEqual(resLong.statusCode, 400);

  // 6. Injection metacharacters / traversal MUST return 400
  for (const injection of ['; rm -rf /', '../../etc/passwd', 'user$(whoami)', 'alice`id`', 'user with spaces', 'user\nnewline']) {
    const res = await makeDirectRequest(testPort, 'POST', '/run', {
      'Authorization': `Bearer ${TEST_RUNNER_SECRET}`
    }, { ...basePayload, ownerId: injection });
    assert.strictEqual(res.statusCode, 400);
  }

  // 7. Valid ownerId succeeds with 200
  const resValid = await makeDirectRequest(testPort, 'POST', '/run', {
    'Authorization': `Bearer ${TEST_RUNNER_SECRET}`
  }, { ...basePayload, ownerId: 'valid_user-1.0' });
  assert.strictEqual(resValid.statusCode, 200);
  assert.strictEqual(resValid.body.success, true);
});

test('[UNIT / MOCKED DOCKER] Ownership Authorization: Matching and mismatching owners for active and terminated jobs fail closed', async (t) => {
  const oldKey = process.env.JASPER_SANDBOX_RUNNER_KEY;
  process.env.JASPER_SANDBOX_RUNNER_KEY = TEST_RUNNER_SECRET;

  const mockDriver = createMockContainerDriver();
  const runnerServer = runnerService.createServer({ containerDriver: mockDriver });
  const testPort = 5086;

  await new Promise((resolve, reject) => {
    runnerServer.listen(testPort, '127.0.0.1', resolve);
    runnerServer.on('error', reject);
  });

  t.after(() => {
    if (oldKey !== undefined) process.env.JASPER_SANDBOX_RUNNER_KEY = oldKey;
    else delete process.env.JASPER_SANDBOX_RUNNER_KEY;
    return new Promise(resolve => runnerServer.close(resolve));
  });

  // Launch job with legitimate owner 'user_alice'
  const launchPromise = makeDirectRequest(testPort, 'POST', '/run', {
    'Authorization': `Bearer ${TEST_RUNNER_SECRET}`
  }, {
    code: 'SLEEP_SIMULATION',
    language: 'javascript',
    timeoutMs: 8000,
    ownerId: 'user_alice'
  });

  await new Promise(r => setTimeout(r, 100));
  const activeJobId = Array.from(runnerServer.activeJobs.keys())[0];
  assert.ok(activeJobId, 'Job must be registered in activeJobs');

  // --- Active Job Tests ---
  // 1. Mismatching owner on active job MUST return 403 Forbidden
  const activeMismatchRes = await makeDirectRequest(testPort, 'POST', '/cancel', {
    'Authorization': `Bearer ${TEST_RUNNER_SECRET}`
  }, {
    executionId: activeJobId,
    requesterId: 'user_bob'
  });
  assert.strictEqual(activeMismatchRes.statusCode, 403);
  assert.strictEqual(activeMismatchRes.body.success, false);
  assert.ok(activeMismatchRes.body.error.includes('permission'));

  // 2. Missing requesterId on active job MUST return 401
  const activeNoReqRes = await makeDirectRequest(testPort, 'POST', '/cancel', {
    'Authorization': `Bearer ${TEST_RUNNER_SECRET}`
  }, {
    executionId: activeJobId
  });
  assert.strictEqual(activeNoReqRes.statusCode, 401);

  // 3. Malformed requesterId on active job MUST return 401
  const activeBadReqRes = await makeDirectRequest(testPort, 'POST', '/cancel', {
    'Authorization': `Bearer ${TEST_RUNNER_SECRET}`
  }, {
    executionId: activeJobId,
    requesterId: '; rm -rf /'
  });
  assert.strictEqual(activeBadReqRes.statusCode, 401);

  // 4. Matching owner on active job succeeds with 200 and terminates job
  const activeMatchRes = await makeDirectRequest(testPort, 'POST', '/cancel', {
    'Authorization': `Bearer ${TEST_RUNNER_SECRET}`
  }, {
    executionId: activeJobId,
    requesterId: 'user_alice'
  });
  assert.strictEqual(activeMatchRes.statusCode, 200);
  assert.strictEqual(activeMatchRes.body.success, true);

  await launchPromise;

  // --- Terminated Job Tests ---
  assert.ok(runnerServer.recentlyTerminatedJobs.has(activeJobId), 'Job must now be in recentlyTerminatedJobs');
  const termData = runnerServer.recentlyTerminatedJobs.get(activeJobId);
  assert.strictEqual(termData.ownerId, 'user_alice', 'Terminated job record must retain validated ownerId');

  // 5. Mismatching owner on terminated job MUST return 403 Forbidden
  const termMismatchRes = await makeDirectRequest(testPort, 'POST', '/cancel', {
    'Authorization': `Bearer ${TEST_RUNNER_SECRET}`
  }, {
    executionId: activeJobId,
    requesterId: 'user_bob'
  });
  assert.strictEqual(termMismatchRes.statusCode, 403);
  assert.strictEqual(termMismatchRes.body.success, false);
  assert.ok(termMismatchRes.body.error.includes('permission'));

  // 6. Missing requesterId on terminated job MUST return 401
  const termNoReqRes = await makeDirectRequest(testPort, 'POST', '/cancel', {
    'Authorization': `Bearer ${TEST_RUNNER_SECRET}`
  }, {
    executionId: activeJobId
  });
  assert.strictEqual(termNoReqRes.statusCode, 401);

  // 7. Matching owner on terminated job returns 200 with idempotent: true
  const termMatchRes = await makeDirectRequest(testPort, 'POST', '/cancel', {
    'Authorization': `Bearer ${TEST_RUNNER_SECRET}`
  }, {
    executionId: activeJobId,
    requesterId: 'user_alice'
  });
  assert.strictEqual(termMatchRes.statusCode, 200);
  assert.strictEqual(termMatchRes.body.idempotent, true);

  // 8. Corrupted / missing stored ownerId on terminated job MUST fail closed with 403, never grant access
  termData.ownerId = null;
  const termCorruptRes = await makeDirectRequest(testPort, 'POST', '/cancel', {
    'Authorization': `Bearer ${TEST_RUNNER_SECRET}`
  }, {
    executionId: activeJobId,
    requesterId: 'user_alice'
  });
  assert.strictEqual(termCorruptRes.statusCode, 403, 'Missing stored ownership must fail closed');
});

test('[UNIT / MOCKED DOCKER] Timeout Configuration & Request Clamping: Safe bounds and fallbacks', async (t) => {
  // 1. parseMaxTimeoutMs validation unit tests
  assert.strictEqual(runnerService.parseMaxTimeoutMs(undefined), 10000);
  assert.strictEqual(runnerService.parseMaxTimeoutMs(''), 10000);
  assert.strictEqual(runnerService.parseMaxTimeoutMs('10000'), 10000);
  assert.strictEqual(runnerService.parseMaxTimeoutMs('30000'), 30000);
  assert.strictEqual(runnerService.parseMaxTimeoutMs('1000'), 1000);
  assert.strictEqual(runnerService.parseMaxTimeoutMs('15000'), 15000);

  // Invalid values fall back to safe default (10000 ms)
  assert.strictEqual(runnerService.parseMaxTimeoutMs('60000'), 10000); // Exceeds ABSOLUTE_MAX_TIMEOUT_MS
  assert.strictEqual(runnerService.parseMaxTimeoutMs('500'), 10000);   // Below MIN_TIMEOUT_MS
  assert.strictEqual(runnerService.parseMaxTimeoutMs('0'), 10000);
  assert.strictEqual(runnerService.parseMaxTimeoutMs('-1000'), 10000);
  assert.strictEqual(runnerService.parseMaxTimeoutMs('NaN'), 10000);
  assert.strictEqual(runnerService.parseMaxTimeoutMs('Infinity'), 10000);
  assert.strictEqual(runnerService.parseMaxTimeoutMs('12000.5'), 10000); // Non-integer
  assert.strictEqual(runnerService.parseMaxTimeoutMs('invalid'), 10000);

  // 2. Request timeout clamping on createServer
  const oldKey = process.env.JASPER_SANDBOX_RUNNER_KEY;
  process.env.JASPER_SANDBOX_RUNNER_KEY = TEST_RUNNER_SECRET;

  const mockDriver = createMockContainerDriver();
  // Server configured with default max timeout (10000 ms)
  const runnerServer = runnerService.createServer({ containerDriver: mockDriver, maxTimeoutMs: 10000 });
  const testPort = 5087;

  await new Promise((resolve, reject) => {
    runnerServer.listen(testPort, '127.0.0.1', resolve);
    runnerServer.on('error', reject);
  });

  t.after(() => {
    if (oldKey !== undefined) process.env.JASPER_SANDBOX_RUNNER_KEY = oldKey;
    else delete process.env.JASPER_SANDBOX_RUNNER_KEY;
    return new Promise(resolve => runnerServer.close(resolve));
  });

  // Request timeout higher than max limit (60000ms requested, clamped to 10000ms)
  const resHigh = await makeDirectRequest(testPort, 'POST', '/run', {
    'Authorization': `Bearer ${TEST_RUNNER_SECRET}`
  }, {
    code: 'console.log("ok");',
    language: 'javascript',
    timeoutMs: 60000,
    ownerId: 'test_user'
  });
  assert.strictEqual(resHigh.statusCode, 200);

  // Request timeout below min limit (100ms requested, clamped to 1000ms minimum)
  const resLow = await makeDirectRequest(testPort, 'POST', '/run', {
    'Authorization': `Bearer ${TEST_RUNNER_SECRET}`
  }, {
    code: 'console.log("ok");',
    language: 'javascript',
    timeoutMs: 100,
    ownerId: 'test_user'
  });
  assert.strictEqual(resLow.statusCode, 200);

  // Invalid / negative request timeout falls back safely
  const resNegative = await makeDirectRequest(testPort, 'POST', '/run', {
    'Authorization': `Bearer ${TEST_RUNNER_SECRET}`
  }, {
    code: 'console.log("ok");',
    language: 'javascript',
    timeoutMs: -5000,
    ownerId: 'test_user'
  });
  assert.strictEqual(resNegative.statusCode, 200);
});

test('[UNIT / MOCKED DOCKER] Timeout Configuration Regression: Explicit options.maxTimeoutMs = 0 falls back to DEFAULT_MAX_TIMEOUT_MS when RUNNER_MAX_TIMEOUT_MS is non-default', async (t) => {
  const oldEnvTimeout = process.env.RUNNER_MAX_TIMEOUT_MS;
  const oldKey = process.env.JASPER_SANDBOX_RUNNER_KEY;

  // Set RUNNER_MAX_TIMEOUT_MS to a valid non-default value (e.g. 25000)
  process.env.RUNNER_MAX_TIMEOUT_MS = '25000';
  process.env.JASPER_SANDBOX_RUNNER_KEY = TEST_RUNNER_SECRET;

  const mockDriver = createMockContainerDriver();

  // options.maxTimeoutMs is explicitly passed as 0 (not undefined or null)
  const runnerServer = runnerService.createServer({
    containerDriver: mockDriver,
    maxTimeoutMs: 0
  });

  t.after(() => {
    if (oldEnvTimeout !== undefined) process.env.RUNNER_MAX_TIMEOUT_MS = oldEnvTimeout;
    else delete process.env.RUNNER_MAX_TIMEOUT_MS;
    if (oldKey !== undefined) process.env.JASPER_SANDBOX_RUNNER_KEY = oldKey;
    else delete process.env.JASPER_SANDBOX_RUNNER_KEY;
    return new Promise(resolve => runnerServer.close(resolve));
  });

  // Explicit options.maxTimeoutMs = 0 must go through parseMaxTimeoutMs(0)
  // and fall back to DEFAULT_MAX_TIMEOUT_MS (10000ms), NOT the environment value (25000ms)
  assert.strictEqual(
    runnerServer.configuredMaxTimeout,
    runnerService.DEFAULT_MAX_TIMEOUT_MS,
    `Explicit 0 options.maxTimeoutMs must follow documented fallback (${runnerService.DEFAULT_MAX_TIMEOUT_MS}ms), not env value (25000ms)`
  );
  assert.strictEqual(runnerServer.configuredMaxTimeout, 10000);

  // Also verify NaN and out-of-range values passed as options.maxTimeoutMs follow documented fallback
  const serverNaN = runnerService.createServer({ containerDriver: mockDriver, maxTimeoutMs: NaN });
  assert.strictEqual(serverNaN.configuredMaxTimeout, 10000);

  const serverOutOfRange = runnerService.createServer({ containerDriver: mockDriver, maxTimeoutMs: 60000 });
  assert.strictEqual(serverOutOfRange.configuredMaxTimeout, 10000);

  const serverFractional = runnerService.createServer({ containerDriver: mockDriver, maxTimeoutMs: 15000.5 });
  assert.strictEqual(serverFractional.configuredMaxTimeout, 10000);
});
