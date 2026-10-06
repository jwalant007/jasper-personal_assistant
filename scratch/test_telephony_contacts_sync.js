/**
 * Automated Verification Script: Telephony Hub Contacts Synchronization & Caller ID
 */

const assert = require('assert');
const path = require('path');
const telephonyEngine = require('../server/telephonyEngine');
const agentEngine = require('../server/agentEngine');
const callIntelligenceEngine = require('../server/callIntelligenceEngine');

async function runTests() {
  console.log('🧪 [TEST 1] Initializing Telephony Contacts Store...');
  const initialContacts = telephonyEngine.getContacts();
  console.log(`   Found ${initialContacts.length} initial contacts in Telephony Hub.`);
  assert(initialContacts.length > 0, 'Contacts should not be empty');

  console.log('\n🧪 [TEST 2] Testing Contact Synchronization (syncContacts)...');
  const syncResult = await telephonyEngine.syncContacts();
  console.log(`   Sync Result:`, syncResult.message);
  console.log(`   Total Contacts: ${syncResult.count}, Source: ${syncResult.source}, New: ${syncResult.newlyAdded}`);
  assert(syncResult.success === true, 'Sync should succeed');
  assert(syncResult.count >= initialContacts.length, 'Synced contacts count should be at least initial contacts');

  console.log('\n🧪 [TEST 3] Testing Caller ID Phone Number Normalization & Lookup...');
  const momContact = telephonyEngine.findContactByPhone('+91 98200 12345');
  console.log(`   Looked up "+91 98200 12345" -> Matched:`, momContact ? momContact.name : 'None');
  assert(momContact !== null, 'Mom contact should be found');
  assert(momContact.name === 'Mom', 'Contact name should be Mom');
  assert(momContact.isVip === true, 'Mom should be VIP whitelisted');

  const rahulContact = telephonyEngine.findContactByPhone('9876543210');
  console.log(`   Looked up unformatted "9876543210" -> Matched:`, rahulContact ? rahulContact.name : 'None');
  assert(rahulContact !== null, 'Rahul contact should be found via unformatted number');

  console.log('\n🧪 [TEST 4] Testing VIP Toggle for Contact...');
  const initialVip = rahulContact.isVip;
  const toggled = telephonyEngine.toggleVip(rahulContact.id);
  console.log(`   Rahul VIP toggled from ${initialVip} to ${toggled.isVip}`);
  assert(toggled.isVip === !initialVip, 'VIP status should be flipped');
  // Toggle back to clean state
  telephonyEngine.toggleVip(rahulContact.id);

  console.log('\n🧪 [TEST 5] Testing Adding and Deleting a Custom Contact...');
  const custom = telephonyEngine.addContact({
    name: 'Elon Musk (Tesla)',
    phone: '+1 650 555 9999',
    category: 'Client',
    isVip: true,
    notes: 'Urgent SpaceX consultation'
  });
  console.log(`   Created contact: ${custom.name} (${custom.phone}) with ID: ${custom.id}`);
  assert(custom.name === 'Elon Musk (Tesla)', 'Custom contact should have correct name');
  const foundCustom = telephonyEngine.findContactByPhone('+1 650 555 9999');
  assert(foundCustom !== null, 'Custom contact should be retrievable by phone');

  // Delete
  telephonyEngine.deleteContact(custom.id);
  const deletedCustom = telephonyEngine.findContactByPhone('+1 650 555 9999');
  assert(deletedCustom === null, 'Deleted contact should no longer be found');
  console.log(`   Contact deleted successfully.`);

  console.log('\n🧪 [TEST 6] Testing 1-Click Screen Inbound Call for a Synced Contact...');
  const screenResult = await telephonyEngine.screenCallForContact(momContact.id, "Hey Jwalant, are you coming home for dinner tonight?");
  console.log(`   Screening result:`, screenResult.message);
  console.log(`   Screened Session Caller: ${screenResult.session.caller}, Reason: ${screenResult.session.initialReason}`);
  assert(screenResult.success === true, 'Screening call should succeed');
  assert(screenResult.session.caller === 'Mom', 'Session caller should be Mom');
  assert(screenResult.session.isVip === true, 'Session should have VIP flag set');

  console.log('\n🧪 [TEST 7] Testing Inbound Call with Automatic Caller ID Resolution...');
  const inboundResult = await telephonyEngine.handleInboundCall({
    from: '+91 98200 12345',
    speechResult: 'Hello Jwalant, dinner is ready.',
    isSimulation: true
  });
  console.log(`   Inbound Call Matched Caller:`, inboundResult.analysis.clientName);
  assert(inboundResult.analysis.clientName === 'Mom', 'Inbound call should automatically resolve caller name to Mom');
  assert(inboundResult.analysis.isVip === true, 'Inbound call should recognize Mom as VIP');

  console.log('\n🧪 [TEST 8] Testing Agent Engine "sync_telephony_contacts" Tool...');
  const agentToolResult = await agentEngine.executeTool('sync_telephony_contacts', {});
  console.log(`   Agent Tool Result:`, agentToolResult.result?.message || agentToolResult);
  assert(agentToolResult.success === true, 'Agent Engine tool should succeed');

  console.log('\n🧪 [TEST 9] Testing Natural Language Intent Routing for Contacts Sync...');
  const nlResult = await agentEngine.processQuery({ query: 'sync my contacts in the telephony hub' });
  console.log(`   Agent NL Response:`, nlResult.response);
  assert(nlResult.toolsExecuted.some(r => r.intent === 'sync_telephony_contacts'), 'Intent should be recognized as sync_telephony_contacts');

  console.log('\n🎉 ALL 9 TELEPHONY CONTACTS SYNCHRONIZATION TESTS PASSED PERFECTLY! 🚀');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
