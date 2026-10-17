const test = require('node:test');
const assert = require('node:assert');
const dbManager = require('../server/database');
const vectorMemory = require('../server/vectorMemory');

test('Database: should load active user and users list', () => {
  const activeUser = dbManager.getActiveUserId();
  assert.ok(activeUser, 'Should have an active user ID');
  const users = dbManager.getUsers();
  assert.ok(Array.isArray(users), 'Should return array of users');
  assert.ok(users.length >= 1, 'Should have at least 1 user');
  const jwalant = users.find(u => u.userId === 'jwalant');
  assert.ok(jwalant, 'Default owner user jwalant should exist');
  assert.strictEqual(jwalant.role, 'owner');
});

test('Database: should isolate user notes and tasks', () => {
  const testNote = dbManager.addNote({ title: 'Audit Test Note', content: 'Testing database persistence' }, 'jwalant');
  assert.ok(testNote && testNote.id);

  const notes = dbManager.getNotes('jwalant');
  assert.ok(notes.some(n => n.id === testNote.id));

  // Verify deletion
  const deletedNotes = dbManager.deleteNote(testNote.id, 'jwalant');
  assert.ok(Array.isArray(deletedNotes), 'deleteNote returns updated notes array');
  assert.ok(!deletedNotes.some(n => n.id === testNote.id));
  const notesAfter = dbManager.getNotes('jwalant');
  assert.ok(!notesAfter.some(n => n.id === testNote.id));
});

test('Database: should manage chat history entries', () => {
  const entry = dbManager.addChatEntry({
    query: 'Audit test prompt',
    response: 'Audit test response'
  }, 'jwalant');
  assert.ok(entry && entry.id);

  const chats = dbManager.getChatHistory('jwalant');
  assert.ok(chats.some(c => c.id === entry.id));

  dbManager.deleteChatEntry(entry.id, 'jwalant');
  const chatsAfter = dbManager.getChatHistory('jwalant');
  assert.ok(!chatsAfter.some(c => c.id === entry.id));
});

test('Database: getUserDump should sanitize sensitive credentials (passwords)', () => {
  const dump = dbManager.getUserDump('jwalant');
  assert.ok(dump && dump.social_accounts);
  if (dump.social_accounts.instagram) {
    assert.strictEqual(dump.social_accounts.instagram.password, undefined, 'Instagram password must be stripped');
    assert.strictEqual(dump.social_accounts.instagram.sessionCookie, undefined, 'Session cookie must be stripped');
  }
});

test('Database: should maintain finance accounts and monthly pocket money limit', () => {
  const fin = dbManager.getFinanceData('jwalant');
  assert.ok(fin);
  assert.ok(Array.isArray(fin.accounts), 'Should have accounts array');
  assert.ok(fin.budget, 'Should have budget configuration');
  assert.ok(typeof fin.budget.monthlyLimit === 'number', 'Budget limit should be numeric');
  assert.strictEqual(fin.budget.monthlyLimit, 2000, 'Monthly pocket money limit should be 2000');
});

test('VectorMemory: should compute 128-dimensional dense semantic embeddings', () => {
  const vec1 = vectorMemory.computeDenseEmbedding('Samsung Frame Smart TV in living room');
  assert.ok(Array.isArray(vec1), 'Should return embedding array');
  assert.strictEqual(vec1.length, 128, 'Vector dimensions should be 128');

  // Verify L2 normalization: sum of squares should equal approx 1.0
  const norm = Math.sqrt(vec1.reduce((sum, v) => sum + v * v, 0));
  assert.ok(Math.abs(norm - 1.0) < 0.05, `Vector norm should be approximately 1.0 (got ${norm})`);
});

test('VectorMemory: should rank semantically similar memories higher', () => {
  const vecTV = vectorMemory.computeDenseEmbedding('television screen display');
  const vecMusic = vectorMemory.computeDenseEmbedding('spotify audio playlist music');
  const queryVec = vectorMemory.computeDenseEmbedding('smart TV');

  const simTV = vectorMemory.cosineSimilarity(queryVec, vecTV);
  const simMusic = vectorMemory.cosineSimilarity(queryVec, vecMusic);

  assert.ok(simTV > simMusic, `TV query should have higher similarity with TV than music (${simTV} vs ${simMusic})`);
});
