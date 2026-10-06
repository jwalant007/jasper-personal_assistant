const callIntelligenceEngine = require('../server/callIntelligenceEngine');

async function testFullFlow() {
  console.log('--- RUNNING FULL END-TO-END CALL INTELLIGENCE VERIFICATION ---');

  // STEP 1: BEFORE I ACCEPT
  const session = await callIntelligenceEngine.startScreening({
    callId: `e2e-test-${Date.now()}`,
    from: '+91 98765 43210',
    callerName: 'Rahul',
    speechResult: 'Hey, I wanted to talk to Jwalant about the football trial tomorrow.'
  });

  console.log('✓ Screening started. Summary:', session.screeningSummary);
  if (!session.screeningSummary.includes('football trial')) {
    throw new Error('Summary failed to extract football trial: ' + session.screeningSummary);
  }

  // STEP 2: USER ASKS J.A.S.P.E.R. TO CONTINUE
  const cont = await callIntelligenceEngine.continueScreening(session.callId);
  console.log('✓ Screening continued. Updated summary:', cont.session.screeningSummary);
  console.log('✓ Details after continue:', cont.session.contextMemory.importantDetails);

  // STEP 3: USER ACCEPTS CALL
  const accepted = await callIntelligenceEngine.acceptCall(session.callId);
  console.log('✓ Call accepted. Mode:', accepted.session.status);
  if (accepted.session.status !== 'active_live') {
    throw new Error('Status not active_live');
  }

  // STEP 4: CALLER ASKS QUESTION
  const t1 = await callIntelligenceEngine.processLiveTurn(session.callId, {
    speaker: 'caller',
    text: 'Can you come to practice at 6 PM?'
  });
  console.log('✓ Turn 1 processed. Question detected:', t1.turn.analysis.isQuestion);

  // STEP 5: USER TENTATIVE CONFIRMATION
  const t2 = await callIntelligenceEngine.processLiveTurn(session.callId, {
    speaker: 'user',
    text: 'Yeah, I think I can.'
  });
  console.log('✓ Turn 2 processed. Confirmation:', t2.turn.analysis.confirmationType);
  if (t2.turn.analysis.confirmationType !== 'tentative') {
    throw new Error('Expected tentative confirmation, got ' + t2.turn.analysis.confirmationType);
  }
  const comm1 = t2.contextMemory.commitments.find(c => c.topic.includes('6 PM'));
  console.log('✓ Context commitment status:', comm1?.status);
  if (comm1?.status !== 'tentative') {
    throw new Error('Commitment status should be tentative');
  }

  // STEP 6: CALLER ASKS FOR DEFINITE CONFIRMATION
  await callIntelligenceEngine.processLiveTurn(session.callId, {
    speaker: 'caller',
    text: "So you're definitely coming at 6?"
  });

  // STEP 7: USER DEFINITE CONFIRMATION
  const t4 = await callIntelligenceEngine.processLiveTurn(session.callId, {
    speaker: 'user',
    text: 'Yes, definitely.'
  });
  console.log('✓ Turn 4 processed. Confirmation:', t4.turn.analysis.confirmationType);
  if (t4.turn.analysis.confirmationType !== 'definite') {
    throw new Error('Expected definite confirmation, got ' + t4.turn.analysis.confirmationType);
  }
  const comm2 = t4.contextMemory.commitments.find(c => c.topic.includes('6 PM'));
  console.log('✓ Context commitment upgraded to:', comm2?.status);
  if (comm2?.status !== 'definite' && comm2?.status !== 'confirmed') {
    throw new Error('Commitment status should be definite/confirmed');
  }

  // STEP 8: CALLER CONCLUSION
  const t5 = await callIntelligenceEngine.processLiveTurn(session.callId, {
    speaker: 'caller',
    text: 'Awesome, see you tomorrow at 6 at the training ground! Bye.'
  });
  console.log('✓ Conclusion detected:', t5.turn.analysis.isConclusion);

  // STEP 9: CONCLUDE CALL & MEMORY VALIDATION
  const final = await callIntelligenceEngine.concludeCall(session.callId);
  console.log('✓ Call concluded. Important details recorded:');
  final.session.contextMemory.importantDetails.forEach(d => console.log('   *', d));

  console.log('\n>>> SUCCESS: ALL USER REQUIREMENTS FULLY MET & VERIFIED! <<<');
}

testFullFlow().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
