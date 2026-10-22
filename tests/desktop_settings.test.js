const test = require('node:test');
const assert = require('node:assert');
const settingsManager = require('../electron/settingsManager');

test('SettingsManager: default settings and getter', () => {
  assert.strictEqual(settingsManager.get('startWithWindows'), true);
  assert.strictEqual(settingsManager.get('backgroundListening'), true);
  assert.strictEqual(settingsManager.get('wakeWordEnabled'), true);
  assert.strictEqual(settingsManager.get('wakePhrase'), 'Hey Jasper');
  assert.strictEqual(settingsManager.get('voiceResponsesEnabled'), true);
});

test('SettingsManager: update and event notifications', (t, done) => {
  const initialSensitivity = settingsManager.get('wakeWordSensitivity');
  
  settingsManager.once('change:wakeWordSensitivity', (newVal, oldVal) => {
    assert.strictEqual(newVal, 0.85);
    assert.strictEqual(oldVal, initialSensitivity);
    // restore
    settingsManager.set('wakeWordSensitivity', initialSensitivity);
    done();
  });

  settingsManager.set('wakeWordSensitivity', 0.85);
});

test('SettingsManager: batch update persists values', () => {
  settingsManager.update({
    speechRate: 1.15,
    speechPitch: 0.95,
    floatingBarCompact: true
  });

  assert.strictEqual(settingsManager.get('speechRate'), 1.15);
  assert.strictEqual(settingsManager.get('speechPitch'), 0.95);
  assert.strictEqual(settingsManager.get('floatingBarCompact'), true);

  // Restore defaults
  settingsManager.update({
    speechRate: 1.0,
    speechPitch: 1.0,
    floatingBarCompact: false
  });
});
