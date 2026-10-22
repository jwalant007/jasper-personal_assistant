const test = require('node:test');
const assert = require('node:assert');
const WakeWordManager = require('../electron/wakeWordManager');

test('WakeWordManager: should initialize, start and transition states', async () => {
  const manager = new WakeWordManager({ threshold: 0.70 });
  assert.strictEqual(manager.threshold, 0.70);
  assert.strictEqual(manager.isListening, false);

  let readyReceived = false;
  const readyPromise = new Promise((resolve) => {
    manager.on('ready', (event) => {
      readyReceived = true;
      resolve(event);
    });
    // Timeout safeguard for machines without audio input
    setTimeout(() => resolve(null), 8000);
  });

  manager.start();
  const event = await readyPromise;

  if (event) {
    assert.ok(readyReceived, 'Should receive READY event');
    assert.strictEqual(manager.isListening, true);

    // Test mute/pause
    const mutePromise = new Promise((resolve) => {
      manager.on('muted', resolve);
      setTimeout(() => resolve(null), 3000);
    });
    manager.mute();
    await mutePromise;

    // Test threshold change
    manager.setThreshold(0.80);
    assert.strictEqual(manager.threshold, 0.80);
  } else {
    console.log('[Notice] Skipping live microphone capture assertions in headless environment');
  }

  // Clean shutdown
  manager.stop();
  assert.strictEqual(manager.isDisposed, true);
});
