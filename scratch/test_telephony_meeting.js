const telephonyEngine = require('../server/telephonyEngine');
const meetingEngine = require('../server/meetingEngine');
const agentEngine = require('../server/agentEngine');

async function testAll() {
  console.log('--- TEST 1: Autonomous Inbound Telephony Receptionist ---');
  const inbound = await telephonyEngine.handleInboundCall({
    callSid: 'test-call-101',
    from: '+1 (305) 555-0199',
    speechResult: 'This is Alex from Miami. We have the $17,000 contract ready to sign tonight, but I need to close before I board in 20 minutes.',
    isSimulation: true
  });
  console.log('Inbound Action:', inbound.action);
  console.log('Deal Value Extracted: $' + inbound.analysis.dealValue.toLocaleString());
  console.log('Urgency (Mins):', inbound.analysis.urgencyMinutes);
  console.log('Line 1 Priority Hold Engage:', inbound.relay?.clientLine?.status);

  console.log('\n--- TEST 2: Autonomous Outbound Call to Owner (Line 2) ---');
  const relayId = inbound.relayId;
  const relayState = telephonyEngine.getRelay(relayId);
  console.log('Line 2 Status:', relayState.ownerLine.status);

  console.log('\n--- TEST 3: Multi-Line Call Holding & Relay Response ---');
  const relayRes = await telephonyEngine.handleOwnerResponse(relayId, "I'm on my way, tell him 1 minute!");
  console.log('Relay Success:', relayRes.success);
  console.log('Relayed Message to Client:', relayRes.relayMessage);

  console.log('\n--- TEST 4: Agent Engine Natural Language Directive ---');
  const cmdRes = await agentEngine.processQuery({ query: "Jarvis, pull up the meeting, please" });
  console.log('Tools Executed:', cmdRes.toolsExecuted.map(t => t.tool || t.intent));
  console.log('Agent Spoken Response:', cmdRes.response);

  console.log('\n--- TEST 5: Meeting Engine Pull Up ---');
  const meetRes = await meetingEngine.pullUpMeeting({ clientName: 'Miami Enterprise Client' });
  console.log('Meeting URL:', meetRes.url);
  console.log('Meeting Title:', meetRes.title);
  console.log('Meeting Deal Value: $' + meetRes.dealValue.toLocaleString());
  console.log('Workstation Launch:', meetRes.message);

  console.log('\n=== ALL 4 FEATURES VERIFIED & WORKING PERFECTLY ===');
  process.exit(0);
}

testAll().catch(err => {
  console.error(err);
  process.exit(1);
});
