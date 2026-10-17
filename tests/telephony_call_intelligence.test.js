const test = require('node:test');
const assert = require('node:assert');
const callIntelligenceEngine = require('../server/callIntelligenceEngine');
const telephonyEngine = require('../server/telephonyEngine');

test('CallIntelligence: should analyze initial screening speech and extract caller name & reason', async () => {
  const speech = "Hey, it's Rahul calling about the football trials tomorrow at 5 PM.";
  const analysis = await callIntelligenceEngine.analyzeInitialScreening(speech, '+919876543210');

  assert.ok(analysis);
  assert.strictEqual(analysis.caller, 'Rahul');
  assert.ok(analysis.summary && analysis.summary.length > 5, 'Should generate concise briefing summary');
  assert.ok(analysis.initialReason, 'Should extract initial reason');
});

test('CallIntelligence: startScreening should initialize session with status waiting_decision', async () => {
  const callId = `test-call-${Date.now()}`;
  const speech = "Hi Jwalant, this is Alex from Miami enterprise regarding the signing tonight.";

  const session = await callIntelligenceEngine.startScreening({
    callId,
    from: '+13055551234',
    callerName: 'Alex',
    speechResult: speech
  });

  assert.ok(session);
  assert.strictEqual(session.callId, callId);
  assert.strictEqual(session.caller, 'Alex');
  assert.strictEqual(session.status, 'waiting_decision');
  assert.ok(session.screeningSummary);
  assert.ok(Array.isArray(session.transcript));

  const fetched = callIntelligenceEngine.getSession(callId);
  assert.ok(fetched);
  assert.strictEqual(fetched.callId, callId);
});

test('CallIntelligence: continueScreening should append follow-up turn to screeningHistory', async () => {
  const callId = `test-call-cont-${Date.now()}`;
  await callIntelligenceEngine.startScreening({
    callId,
    from: '+919999988888',
    callerName: 'Coach Kumar',
    speechResult: 'We need to confirm jersey numbers for the championship.'
  });

  const contRes = await callIntelligenceEngine.continueScreening(callId, {
    customQuestion: 'What sizes are currently available?'
  });

  assert.ok(contRes && contRes.session);
  const hist = contRes.session.screeningHistory;
  assert.ok(hist.length >= 3, 'Should have initial greeting, caller speech, and follow-up question');
  assert.ok(hist.some(h => h.text.includes('What sizes are currently available?')));
});

test('CallIntelligence: acceptCall should transfer call to active_live', async () => {
  const callId = `test-call-acc-${Date.now()}`;
  await callIntelligenceEngine.startScreening({
    callId,
    from: '+919888877777',
    callerName: 'Sarah',
    speechResult: 'Calling about our design project deadline.'
  });

  const accepted = await callIntelligenceEngine.acceptCall(callId);
  assert.ok(accepted && accepted.session);
  assert.strictEqual(accepted.session.status, 'active_live');
  assert.strictEqual(accepted.session.userDecision, 'accepted');
});

test('CallIntelligence: processLiveTurn should track nuance and commitment transition from tentative to confirmed', async () => {
  const callId = `test-call-nuance-${Date.now()}`;
  await callIntelligenceEngine.startScreening({
    callId,
    callerName: 'Partner',
    speechResult: 'Can you deliver the build by Thursday?'
  });
  await callIntelligenceEngine.acceptCall(callId);

  // Turn 1: Tentative commitment from Jwalant
  const turn1 = await callIntelligenceEngine.processLiveTurn(callId, {
    speaker: 'jwalant',
    text: 'Yeah, I think I can finish the QA testing by Thursday.'
  });
  assert.ok(turn1 && turn1.session);

  // Turn 2: Absolute confirmation
  const turn2 = await callIntelligenceEngine.processLiveTurn(callId, {
    speaker: 'jwalant',
    text: 'Yes, definitely. I guarantee the build will be ready Thursday at 3 PM.'
  });
  assert.ok(turn2 && turn2.session);
  assert.ok(turn2.session.contextMemory.commitments.length >= 1, 'Should track commitments');
});

test('TelephonyEngine: should load configuration and sync contacts', () => {
  const cfg = telephonyEngine.getConfig();
  assert.ok(cfg && typeof cfg === 'object');
  assert.ok(cfg.receptionistName);
  assert.strictEqual(cfg.receptionistName, 'JASPER');

  const contacts = telephonyEngine.getContacts();
  assert.ok(Array.isArray(contacts));
});
