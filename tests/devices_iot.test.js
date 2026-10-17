const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');

const tvController = require('../server/tvController');
const pcRemote = require('../server/pcRemoteController');
const phoneController = require('../server/phoneController');
const weatherSentinel = require('../server/weatherSentinel');

test('Devices & IoT: TV Controller ADB Key Mapping integrity', () => {
  assert.ok(tvController.ADB_KEY_MAP, 'ADB_KEY_MAP must be exported');
  assert.strictEqual(tvController.ADB_KEY_MAP['POWER'], 26);
  assert.strictEqual(tvController.ADB_KEY_MAP['HOME'], 3);
  assert.strictEqual(tvController.ADB_KEY_MAP['BACK'], 4);
  assert.strictEqual(tvController.ADB_KEY_MAP['OK'], 23);
  assert.strictEqual(tvController.ADB_KEY_MAP['VOLUP'], 24);
  assert.strictEqual(tvController.ADB_KEY_MAP['VOLDOWN'], 25);
  assert.strictEqual(tvController.ADB_KEY_MAP['MUTE'], 164);
});

test('Devices & IoT: TV Controller Config Loading & Target Switch', () => {
  const cfg = tvController.config;
  assert.ok(cfg, 'TV config must exist');
  assert.ok(cfg.tvIp !== undefined);
  assert.ok(cfg.jioStbIp !== undefined);
  assert.ok(['samsung_tv', 'jio_stb'].includes(cfg.activeTarget));

  // Test target switching
  const prevTarget = cfg.activeTarget;
  const newTarget = prevTarget === 'jio_stb' ? 'samsung_tv' : 'jio_stb';
  const updated = tvController.saveConfig({ activeTarget: newTarget });
  assert.strictEqual(updated.activeTarget, newTarget);

  // Restore previous target
  tvController.saveConfig({ activeTarget: prevTarget });
});

test('Devices & IoT: TV Controller Offline Target Execution', async () => {
  // Sending command to offline target must return graceful failure, never throw uncaught exception
  const fakeJioRes = await tvController.sendJioKey('VOLUP');
  assert.strictEqual(typeof fakeJioRes, 'object');
  assert.strictEqual(fakeJioRes.success, false);
  assert.ok(fakeJioRes.error !== undefined);
});

test('Devices & IoT: PC Remote Controller Native Bridge and Fallbacks', () => {
  assert.ok(pcRemote, 'PcRemoteController instance exists');
  assert.strictEqual(typeof pcRemote.clickMouse, 'function');
  assert.strictEqual(typeof pcRemote.typeText, 'function');
  assert.strictEqual(typeof pcRemote.sendHotkey, 'function');
  assert.strictEqual(typeof pcRemote.getScreenCapture, 'function');
  
  // Verify bridge file paths exist in structure
  assert.ok(pcRemote.bridgeCsPath && fs.existsSync(pcRemote.bridgeCsPath), 'JasperInputBridge.cs must exist');
});

test('Devices & IoT: PC Remote Hotkey Validation', async () => {
  // Test hotkey handler for safe string handling
  const res = await pcRemote.sendHotkey('esc');
  assert.strictEqual(typeof res, 'object');
  assert.ok('success' in res);
  assert.ok(['native', 'powershell'].includes(res.bridge));
});

test('Devices & IoT: Phone Controller Honest Physical Disconnected Status', async () => {
  // Phone controller must honestly report physical status without fake mock screenshot
  const status = await phoneController.status();
  assert.strictEqual(typeof status, 'object');
  assert.strictEqual(typeof status.connected, 'boolean');
  
  if (!status.connected) {
    const shot = await phoneController.screenshot();
    assert.strictEqual(shot, null, 'Must NOT return fake SVG mockup when phone is disconnected');
  }
});

test('Devices & IoT: Weather Sentinel Header Sanitization and Safety', () => {
  assert.strictEqual(typeof weatherSentinel.sanitizeHeader, 'function');
  
  // Test sanitization of non-ASCII header strings (prevents HTTP header injection / node crash)
  const unsafeHeader = '🚨 Storm Warning \u0000 \u001f Mumbai';
  const clean = weatherSentinel.sanitizeHeader(unsafeHeader, 'Alert');
  assert.strictEqual(/[^\x20-\x7E]/.test(clean), false, 'Header must contain only printable ASCII (32-126)');
  assert.ok(clean.includes('Storm Warning'));
});
