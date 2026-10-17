const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const morningEngine = require('../server/morningRoutineEngine');
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

test('MorningRoutine: should get and update schedule configuration', () => {
  const initial = morningEngine.getConfig();
  assert.ok(initial);
  assert.strictEqual(typeof initial.enabled, 'boolean');
  assert.ok(initial.time);
  assert.ok(Array.isArray(initial.days));
  assert.ok(initial.channels);

  // Update schedule time and days
  const updated = morningEngine.saveConfig({
    time: '08:15',
    days: ['Mon', 'Wed', 'Fri'],
    channels: { phoneAdb: true, inAppVoip: true, ntfyPush: true }
  });
  assert.strictEqual(updated.time, '08:15');
  assert.deepStrictEqual(updated.days, ['Mon', 'Wed', 'Fri']);
  assert.strictEqual(updated.channels.phoneAdb, true);
  assert.strictEqual(updated.channels.inAppVoip, true);
  assert.strictEqual(updated.channels.ntfyPush, true);

  // Restore
  morningEngine.saveConfig({ time: initial.time, days: initial.days });
});

test('MorningRoutine: compileMorningBriefing aggregates live context cleanly', async () => {
  const briefing = await morningEngine.compileMorningBriefing('jwalant');
  assert.ok(briefing);
  assert.strictEqual(typeof briefing.text, 'string');
  assert.ok(briefing.text.length > 50, 'Briefing text must be comprehensive');
  assert.ok(briefing.summaryItems);
  assert.ok(briefing.summaryItems.date);
  assert.ok(briefing.summaryItems.weather);
});

test('MorningRoutine: triggerWakeUpSequence executes hybrid methods (1, 2, 4)', async () => {
  let broadcastReceived = null;
  morningEngine.setBroadcastFn((msg) => {
    broadcastReceived = msg;
  });

  const triggerResult = await morningEngine.triggerWakeUpSequence(true);
  assert.ok(triggerResult.sessionId);
  assert.ok(triggerResult.briefing);
  assert.ok(triggerResult.channelsDispatched);

  // Method 1 (ADB) check
  assert.ok('phoneAdb' in triggerResult.channelsDispatched);

  // Method 2 (In-App VoIP) check
  assert.ok('inAppVoip' in triggerResult.channelsDispatched);
  assert.ok(broadcastReceived);
  assert.strictEqual(broadcastReceived.type, 'INCOMING_MORNING_CALL');
  assert.strictEqual(broadcastReceived.sessionId, triggerResult.sessionId);

  // Method 4 (ntfy push) check
  assert.ok('ntfyPush' in triggerResult.channelsDispatched);
});

test('MorningRoutine: processCallResponse handles accept, decline, and voice directives', async () => {
  const triggerResult = await morningEngine.triggerWakeUpSequence(true);
  const sessionId = triggerResult.sessionId;

  // 1. Accept call
  const acceptRes = await morningEngine.processCallResponse(sessionId, 'accept');
  assert.strictEqual(acceptRes.success, true);
  assert.strictEqual(acceptRes.status, 'active');
  assert.ok(acceptRes.speakText);

  // 2. Interactive voice directive (reschedule)
  const voiceRes = await morningEngine.processCallResponse(sessionId, 'respond', 'Push my 10 AM meeting by 15 minutes');
  assert.strictEqual(voiceRes.success, true);
  assert.strictEqual(voiceRes.status, 'concluded');
  assert.ok(voiceRes.spokenResponse && voiceRes.spokenResponse.includes('15 minutes'));
});

test('MorningRoutine API: /api/routine/config, preview, trigger, respond', async () => {
  // GET config
  const getCfg = await makeRequest(app, 'GET', '/api/routine/config');
  assert.strictEqual(getCfg.statusCode, 200);
  assert.strictEqual(getCfg.body.success, true);

  // POST config (user edits schedule)
  const postCfg = await makeRequest(app, 'POST', '/api/routine/config', {}, {
    time: '07:45',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  });
  assert.strictEqual(postCfg.statusCode, 200);
  assert.strictEqual(postCfg.body.config.time, '07:45');

  // GET preview
  const prevRes = await makeRequest(app, 'GET', '/api/routine/preview');
  assert.strictEqual(prevRes.statusCode, 200);
  assert.ok(prevRes.body.text);

  // POST trigger (manual test)
  const trigRes = await makeRequest(app, 'POST', '/api/routine/trigger');
  assert.strictEqual(trigRes.statusCode, 200);
  assert.ok(trigRes.body.sessionId);

  // POST respond (decline)
  const respRes = await makeRequest(app, 'POST', '/api/routine/respond', {}, {
    sessionId: trigRes.body.sessionId,
    action: 'decline'
  });
  assert.strictEqual(respRes.statusCode, 200);
  assert.strictEqual(respRes.body.status, 'declined');
});
