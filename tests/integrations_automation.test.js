const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const { app } = require('../server/server');

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
          'x-jasper-token': 'jasper',
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

test('Integrations: /api/busy/status and toggle', async () => {
  const getRes = await makeRequest(app, 'GET', '/api/busy/status');
  assert.strictEqual(getRes.statusCode, 200);
  assert.strictEqual(typeof getRes.body.enabled, 'boolean');

  const toggleRes = await makeRequest(app, 'POST', '/api/busy/toggle');
  assert.strictEqual(toggleRes.statusCode, 200);
  assert.strictEqual(typeof toggleRes.body.enabled, 'boolean');

  // Toggle back to original state
  await makeRequest(app, 'POST', '/api/busy/toggle');
});

test('Integrations: /api/busy/priority-contacts CRUD', async () => {
  const listRes = await makeRequest(app, 'GET', '/api/busy/priority-contacts');
  assert.strictEqual(listRes.statusCode, 200);
  assert.ok(Array.isArray(listRes.body.contacts));

  // Add test priority contact
  const addRes = await makeRequest(app, 'POST', '/api/busy/priority-contacts', {}, {
    name: 'Audit Test Contact',
    phone: '+919999900001',
    relationship: 'Family'
  });
  assert.strictEqual(addRes.statusCode, 200);
  assert.ok(addRes.body.contact && addRes.body.contact.id);
  const contactId = addRes.body.contact.id;

  // Cleanup test contact
  const delRes = await makeRequest(app, 'DELETE', `/api/busy/priority-contacts/${contactId}`);
  assert.strictEqual(delRes.statusCode, 200);
});

test('Integrations: /api/sports/hub returns scores feed structure', async () => {
  const res = await makeRequest(app, 'GET', '/api/sports/hub');
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(Array.isArray(res.body.newsStream));
  assert.ok(Array.isArray(res.body.liveMatches));
  assert.ok(Array.isArray(res.body.leagueTable));
});

test('Integrations: /api/briefing compiles executive morning briefing', async () => {
  const res = await makeRequest(app, 'GET', '/api/briefing');
  assert.strictEqual(res.statusCode, 200);
  assert.ok(res.body.success);
  assert.ok(typeof res.body.briefing === 'object' || typeof res.body.briefing === 'string');
});

test('Integrations: /api/blender/status detects Blender 3D environment honestly', async () => {
  const res = await makeRequest(app, 'GET', '/api/blender/status');
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(typeof res.body.installed, 'boolean');
  assert.ok(Array.isArray(res.body.capabilities));
  assert.ok(Array.isArray(res.body.supportedEngines));
});

test('Integrations: /api/sentinel/status reports weather monitoring telemetry', async () => {
  const res = await makeRequest(app, 'GET', '/api/sentinel/status');
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(typeof res.body.status.enabled, 'boolean');
  assert.ok(res.body.status.channelTopic);
});

test('Integrations: /api/meetings CRUD operations', async () => {
  const listRes = await makeRequest(app, 'GET', '/api/meetings');
  assert.strictEqual(listRes.statusCode, 200);
  assert.ok(Array.isArray(listRes.body.meetings));

  const addRes = await makeRequest(app, 'POST', '/api/meetings', {}, {
    title: 'Automated Audit Checkpoint Meeting',
    startTime: new Date().toISOString(),
    durationMinutes: 30,
    attendees: ['Jwalant', 'JASPER Core']
  });
  assert.strictEqual(addRes.statusCode, 200);
  assert.ok(addRes.body.meeting && addRes.body.meeting.id);
  const meetingId = addRes.body.meeting.id;

  const delRes = await makeRequest(app, 'DELETE', `/api/meetings/${meetingId}`);
  assert.strictEqual(delRes.statusCode, 200);
});

test('Integrations: /api/version and download manifest metadata', async () => {
  const verRes = await makeRequest(app, 'GET', '/api/version');
  assert.strictEqual(verRes.statusCode, 200);
  assert.ok(verRes.body.version);

  const manifestRes = await makeRequest(app, 'GET', '/api/downloads/manifest');
  assert.strictEqual(manifestRes.statusCode, 200);
  assert.ok(manifestRes.body.binaries || manifestRes.body.downloads);
});

test('Integrations: /api/social/wa-status reports connection state and QR fields', async () => {
  const statusRes = await makeRequest(app, 'GET', '/api/social/wa-status');
  assert.strictEqual(statusRes.statusCode, 200);
  assert.ok('status' in statusRes.body);
  assert.ok('hasQr' in statusRes.body);
  assert.ok('qr' in statusRes.body);
  assert.ok('qrDataUrl' in statusRes.body);
});

test('Integrations: /api/social/config and accounts respond cleanly', async () => {
  const cfgRes = await makeRequest(app, 'GET', '/api/social/config');
  assert.strictEqual(cfgRes.statusCode, 200);
  assert.strictEqual(cfgRes.body.success, true);
  assert.ok(cfgRes.body.config);

  const accRes = await makeRequest(app, 'GET', '/api/social/accounts');
  assert.strictEqual(accRes.statusCode, 200);
  assert.strictEqual(accRes.body.success, true);
  assert.ok(accRes.body.accounts);
});

