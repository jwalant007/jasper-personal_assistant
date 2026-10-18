const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const { app } = require('../server/server');

// Helper to make fast HTTP requests to Express app without binding a static port
function makeRequest(app, method, urlPath, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
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

test('API Public: /api/ping should return pong', async () => {
  const res = await makeRequest(app, 'GET', '/api/ping');
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.pong, true);
});

test('API Public: /api/users should return safe user summaries', async () => {
  const res = await makeRequest(app, 'GET', '/api/users');
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(Array.isArray(res.body.users));
  assert.ok(res.body.users.length >= 1);
  for (const user of res.body.users) {
    assert.strictEqual(user.pin, undefined, 'PIN must not be exposed in user summary');
  }
});

test('API Auth: /api/auth/verify should validate passcode correctly', async () => {
  const validRes = await makeRequest(app, 'POST', '/api/auth/verify', {}, { token: 'jasper' });
  assert.strictEqual(validRes.statusCode, 200);
  assert.strictEqual(validRes.body.success, true);

  const invalidRes = await makeRequest(app, 'POST', '/api/auth/verify', {}, { token: 'wrong-pass' });
  assert.strictEqual(invalidRes.statusCode, 401);
  assert.strictEqual(invalidRes.body.success, false);
});

test('API Security: /api/fs/read MUST block path traversal to .env and sensitive files (403 Forbidden)', async () => {
  // Test reading .env directly
  const resDotEnv = await makeRequest(app, 'GET', '/api/fs/read?file=.env', { 'x-jasper-token': 'jasper' });
  assert.strictEqual(resDotEnv.statusCode, 403, 'Reading .env must be rejected with 403');
  assert.ok(resDotEnv.body.error && resDotEnv.body.error.includes('Access Denied'));

  // Test reading server/.env
  const resServerEnv = await makeRequest(app, 'GET', '/api/fs/read?file=server/.env', { 'x-jasper-token': 'jasper' });
  assert.strictEqual(resServerEnv.statusCode, 403, 'Reading server/.env must be rejected with 403');

  // Test reading private keys
  const resKey = await makeRequest(app, 'GET', '/api/fs/read?file=id_rsa', { 'x-jasper-token': 'jasper' });
  assert.strictEqual(resKey.statusCode, 403, 'Reading id_rsa must be rejected with 403');
});

test('API Security: /api/fs/list MUST filter out .env and credentials from directory listings', async () => {
  const res = await makeRequest(app, 'GET', '/api/fs/list?dir=.', { 'x-jasper-token': 'jasper' });
  assert.strictEqual(res.statusCode, 200);
  assert.ok(res.body.files && Array.isArray(res.body.files));
  for (const file of res.body.files) {
    assert.ok(!file.name.startsWith('.env'), `Listing must never display .env file: found ${file.name}`);
    assert.ok(!file.name.includes('.wwebjs_auth'), `Listing must never display .wwebjs_auth: found ${file.name}`);
  }
});

test('API Security: /api/system/power should reject command injection in timeout argument', async () => {
  const injectionPayload = {
    action: 'invalid_action_test',
    timeout: '30 & echo INJECTED'
  };
  const res = await makeRequest(app, 'POST', '/api/system/power', { 'x-jasper-token': 'jasper' }, injectionPayload);
  assert.strictEqual(res.statusCode, 400);
  assert.ok(res.body.error && res.body.error.includes('Invalid power action'));
});

test('API Security: /api/config/apikey should report status without exposing raw API key secret', async () => {
  const res = await makeRequest(app, 'GET', '/api/config/apikey', { 'x-jasper-token': 'jasper' });
  assert.strictEqual(res.statusCode, 200);
  assert.ok(typeof res.body.configured === 'boolean');
  assert.strictEqual(res.body.apiKey, undefined, 'Raw API key must never be returned');
});

test('API Security: /api/fs/read MUST block path traversal outside workspace root (403 Forbidden)', async () => {
  // Test directory traversal out to system directory
  const resOutside = await makeRequest(app, 'GET', '/api/fs/read?file=../../../../Windows/win.ini', { 'x-jasper-token': 'jasper' });
  assert.strictEqual(resOutside.statusCode, 403, 'Path traversal outside workspace root must return 403 Forbidden');
  assert.ok(resOutside.body.error && resOutside.body.error.includes('Access Denied'));

  // Test null-byte path injection
  const resNull = await makeRequest(app, 'GET', '/api/fs/read?file=package.json%00.txt', { 'x-jasper-token': 'jasper' });
  assert.strictEqual(resNull.statusCode, 403, 'Null-byte path traversal must return 403 Forbidden');
});

test('API Security: /api/auth/login MUST prevent PIN bypass and reject missing PIN on protected user account', async () => {
  // Attempt login as jwalant without supplying a PIN
  const resNoPin = await makeRequest(app, 'POST', '/api/auth/login', {}, { userId: 'jwalant' });
  assert.strictEqual(resNoPin.statusCode, 401, 'Login without PIN on PIN-protected account must return 401');
  assert.strictEqual(resNoPin.body.success, false);

  // Attempt login with empty PIN string
  const resEmptyPin = await makeRequest(app, 'POST', '/api/auth/login', {}, { userId: 'jwalant', pin: '' });
  assert.strictEqual(resEmptyPin.statusCode, 401, 'Login with empty PIN on PIN-protected account must return 401');

  // Attempt login with backdoor passcode 'master-override'
  const resBackdoor = await makeRequest(app, 'POST', '/api/auth/login', {}, { userId: 'jwalant', pin: 'master-override' });
  assert.strictEqual(resBackdoor.statusCode, 401, 'Backdoor master-override must be completely rejected with 401');
});

test('API Security: /api/auth/switch MUST prevent profile switch without valid PIN or with backdoor', async () => {
  // Attempt switch without PIN
  const resNoPin = await makeRequest(app, 'POST', '/api/auth/switch', { 'x-jasper-token': 'jasper' }, { userId: 'jwalant' });
  assert.strictEqual(resNoPin.statusCode, 401, 'Switch without PIN on PIN-protected account must return 401');

  // Attempt switch with backdoor passcode
  const resBackdoor = await makeRequest(app, 'POST', '/api/auth/switch', { 'x-jasper-token': 'jasper' }, { userId: 'jwalant', pin: 'master-override' });
  assert.strictEqual(resBackdoor.statusCode, 401, 'Backdoor passcode on switch must return 401');
});

test('API Security: /api/system/launch MUST reject unapproved arbitrary executables', async () => {
  // Attempt to launch arbitrary unapproved commands
  const resFormat = await makeRequest(app, 'POST', '/api/system/launch', { 'x-jasper-token': 'jasper' }, { appName: 'format' });
  assert.strictEqual(resFormat.statusCode, 400, 'Unapproved executable launch must return 400');
  assert.ok(resFormat.body.error && resFormat.body.error.includes('approved desktop applications allowlist'));

  const resCmd = await makeRequest(app, 'POST', '/api/system/launch', { 'x-jasper-token': 'jasper' }, { appName: 'cmd' });
  assert.strictEqual(resCmd.statusCode, 400, 'Direct cmd.exe launch must be rejected');

  // Invalid URL scheme (javascript: or file:)
  const resBadUrl = await makeRequest(app, 'POST', '/api/system/launch', { 'x-jasper-token': 'jasper' }, { url: 'file:///c:/windows/win.ini' });
  assert.strictEqual(resBadUrl.statusCode, 400, 'Non-http(s) URL launch must return 400');
});

test('API Security: /api/code/execute MUST reject destructive command patterns and unsupported languages', async () => {
  // Test destructive pattern filter
  const resDestructive = await makeRequest(app, 'POST', '/api/code/execute', { 'x-jasper-token': 'jasper' }, {
    code: 'Remove-Item -Recurse -Force C:\\Windows',
    language: 'powershell'
  });
  assert.strictEqual(resDestructive.statusCode, 403, 'Destructive command pattern must return 403 Forbidden');
  assert.ok(resDestructive.body.error && resDestructive.body.error.includes('Destructive command pattern detected'));

  // Test invalid language
  const resBadLang = await makeRequest(app, 'POST', '/api/code/execute', { 'x-jasper-token': 'jasper' }, {
    code: 'print("hello")',
    language: 'ruby'
  });
  assert.strictEqual(resBadLang.statusCode, 400, 'Unsupported execution language must return 400');
});

test('API Integrity: /api/fs/disk should honestly report disk capacity or fail closed with 503 without fake measurements', async () => {
  const res = await makeRequest(app, 'GET', '/api/fs/disk', { 'x-jasper-token': 'jasper' });
  if (res.statusCode === 200) {
    assert.strictEqual(res.body.success, true);
    assert.ok(typeof res.body.freeGB === 'number' && res.body.freeGB >= 0, 'freeGB must be a positive number');
    assert.ok(typeof res.body.totalGB === 'number' && res.body.totalGB > 0, 'totalGB must be greater than zero');
  } else {
    assert.strictEqual(res.statusCode, 503, 'When measurement is unavailable, must return 503 rather than mock measurements');
    assert.strictEqual(res.body.success, false);
  }
});

test('API Integrity: /api/youtube/status should honestly report direct API availability without fabricating OAuth', async () => {
  const res = await makeRequest(app, 'GET', '/api/youtube/status', { 'x-jasper-token': 'jasper' });
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(typeof res.body.hasDirectApi, 'boolean');
  if (!process.env.YOUTUBE_OAUTH_TOKEN && !process.env.GOOGLE_CLIENT_ID) {
    assert.strictEqual(res.body.hasDirectApi, false, 'hasDirectApi must be false when OAuth credentials are unset');
  }
});


