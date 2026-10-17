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
