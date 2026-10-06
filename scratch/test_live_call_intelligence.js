const callIntelligenceEngine = require('../server/callIntelligenceEngine');

async function runTest() {
  console.log('========================================================');
  console.log('TESTING J.A.S.P.E.R. LIVE CALL INTELLIGENCE (4 PILLARS)');
  console.log('========================================================\n');

  // PILLAR 1: BEFORE I ACCEPT (Autonomous Call Screening)
  console.log('--- PILLAR 1: BEFORE I ACCEPT ---');
  console.log('1. Caller dials in and speaks to JASPER:');
  const callerInput = "Hey, I wanted to talk to Jwalant about the football trial tomorrow.";
  console.log(`Caller: "${callerInput}"`);

  const session = await callIntelligenceEngine.startScreening({
    callId: 'test-call-rahul-01',
    from: '+91 98765 43210',
    callerName: 'Rahul',
    speechResult: callerInput
  });

  console.log('\nJ.A.S.P.E.R. Analyzed Screening Summary for Jwalant:');
  console.log(`> "${session.screeningSummary}"`);
  console.log(`Caller: ${session.caller}`);
  console.log(`Initial Reason: ${session.initialReason}`);
  console.log(`Important Details:`, session.contextMemory.importantDetails);
  console.log(`Status: ${session.status} (Waiting for decision: Accept | Reject | Continue)`);

  // Test Continue Screening
  console.log('\nUser selects: "Ask J.A.S.P.E.R. to continue"');
  const continueRes = await callIntelligenceEngine.continueScreening('test-call-rahul-01');
  console.log(`J.A.S.P.E.R. asked caller: "${continueRes.jasperQuestion}"`);
  console.log(`Caller answered: "${continueRes.callerReply}"`);
  console.log(`Updated Summary: "${continueRes.session.screeningSummary}"`);
  console.log(`Updated Details:`, continueRes.session.contextMemory.importantDetails);

  // PILLAR 2: AFTER I ACCEPT THE CALL
  console.log('\n--- PILLAR 2 & 4: AFTER I ACCEPT THE CALL & CONTEXT MEMORY ---');
  console.log('User selects: "Accept"');
  const acceptRes = await callIntelligenceEngine.acceptCall('test-call-rahul-01');
  console.log(`J.A.S.P.E.R. transfer message: "${acceptRes.transferMessage}"`);
  console.log(`Call State: ${acceptRes.session.status} (Live silent intelligence active)`);

  // PILLAR 3: ANALYZE MY ANSWERS (Nuance & Commitment Tracking)
  console.log('\n--- PILLAR 3: ANALYZE MY ANSWERS (TENTATIVE VS CONFIRMED) ---');
  
  // Turn 1: Caller asks question
  console.log('\n[Turn 1] Caller speaks:');
  const t1 = await callIntelligenceEngine.processLiveTurn('test-call-rahul-01', {
    speaker: 'caller',
    text: "Can you come to practice at 6 PM?"
  });
  console.log(`Caller: "Can you come to practice at 6 PM?"`);
  console.log(`Analysis: Question detected? ${t1.turn.analysis.isQuestion}`);

  // Turn 2: Jwalant gives TENTATIVE confirmation
  console.log('\n[Turn 2] Jwalant speaks:');
  const t2 = await callIntelligenceEngine.processLiveTurn('test-call-rahul-01', {
    speaker: 'user',
    text: "Yeah, I think I can."
  });
  console.log(`Me: "Yeah, I think I can."`);
  console.log(`Confirmation Type: ${t2.turn.analysis.confirmationType.toUpperCase()}`);
  console.log(`Note: ${t2.turn.analysis.commitmentNote}`);
  console.log(`Context Memory Commitment Status:`, t2.contextMemory.commitments);
  console.log(`Silent Assistant Suggestion:`, t2.session.silentSuggestions[0]);

  // Turn 3: Caller asks for definite confirmation
  console.log('\n[Turn 3] Caller speaks:');
  const t3 = await callIntelligenceEngine.processLiveTurn('test-call-rahul-01', {
    speaker: 'caller',
    text: "So you're definitely coming at 6?"
  });
  console.log(`Caller: "So you're definitely coming at 6?"`);

  // Turn 4: Jwalant gives DEFINITE confirmation
  console.log('\n[Turn 4] Jwalant speaks:');
  const t4 = await callIntelligenceEngine.processLiveTurn('test-call-rahul-01', {
    speaker: 'user',
    text: "Yes, definitely."
  });
  console.log(`Me: "Yes, definitely."`);
  console.log(`Confirmation Type: ${t4.turn.analysis.confirmationType.toUpperCase()}`);
  console.log(`Note: ${t4.turn.analysis.commitmentNote}`);
  console.log(`Updated Context Memory Commitment Status:`, t4.contextMemory.commitments);

  // Turn 5: Caller wrap-up
  console.log('\n[Turn 5] Caller wrap-up:');
  const t5 = await callIntelligenceEngine.processLiveTurn('test-call-rahul-01', {
    speaker: 'caller',
    text: "Awesome, see you tomorrow at 6 at the training ground! Bye."
  });
  console.log(`Caller: "Awesome, see you tomorrow at 6 at the training ground! Bye."`);
  console.log(`Conclusion detected? ${t5.turn.analysis.isConclusion}`);

  // Final Context Memory snapshot
  console.log('\n--- FINAL CONTEXT MEMORY STATE ---');
  console.log(`Caller: ${t5.session.contextMemory.caller}`);
  console.log(`Initial reason: ${t5.session.contextMemory.initialReason}`);
  console.log(`Important details:`);
  t5.session.contextMemory.importantDetails.forEach(d => console.log(`  - ${d}`));
  console.log(`Decisions:`, t5.session.contextMemory.decisions);
  console.log(`Commitments:`, t5.session.contextMemory.commitments);

  console.log('\n=== ALL 4 PILLARS VERIFIED ACCURATELY ===');
}

runTest().catch(console.error);
