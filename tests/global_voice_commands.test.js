const test = require('node:test');
const assert = require('node:assert');
const agentEngine = require('../server/agentEngine');

test('Global Voice Commands: what time is it', async () => {
  const res = await agentEngine.processQuery({ query: 'Hey Jasper, what time is it?', userId: 'jwalant' });
  assert.strictEqual(res.success, true);
  assert.ok(res.response.toLowerCase().includes('current time') || res.response.toLowerCase().includes(':'));
  assert.ok(res.toolsExecuted.some(t => t.intent === 'get_time' || t.tool === 'get_time'));
});

test('Global Voice Commands: open Chrome', async () => {
  const res = await agentEngine.processQuery({ query: 'Hey Jasper, open Chrome', userId: 'jwalant' });
  assert.strictEqual(res.success, true);
  assert.ok(res.response.toLowerCase().includes('chrome') || res.toolsExecuted.some(t => t.app === 'chrome'));
});

test('Global Voice Commands: search for Python tutorials', async () => {
  const res = await agentEngine.processQuery({ query: 'Hey Jasper, search for Python tutorials', userId: 'jwalant' });
  assert.strictEqual(res.success, true);
  assert.ok(res.response.toLowerCase().includes('python tutorials') || res.toolsExecuted.some(t => t.intent === 'web_search'));
});

test('Global Voice Commands: open my project in VS Code', async () => {
  const res = await agentEngine.processQuery({ query: 'Hey Jasper, open my project in VS Code', userId: 'jwalant' });
  assert.strictEqual(res.success, true);
  assert.ok(res.toolsExecuted.some(t => t.intent === 'app_launch' && (t.app === 'VS Code' || t.app === 'vscode')));
});

test('Global Voice Commands: start a five-minute timer', async () => {
  const res = await agentEngine.processQuery({ query: 'Hey Jasper, start a 5 minute timer', userId: 'jwalant' });
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.action, 'start_timer');
  assert.strictEqual(res.timer.value, 5);
  assert.strictEqual(res.timer.totalSeconds, 300);
});

test('Global Voice Commands: stop talking', async () => {
  const res = await agentEngine.processQuery({ query: 'Hey Jasper, stop talking', userId: 'jwalant' });
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.action, 'stop_speech');
  assert.ok(res.response.includes('Immediate halt'));
});

test('Global Voice Commands: hide the function bar', async () => {
  const res = await agentEngine.processQuery({ query: 'Hey Jasper, hide the function bar', userId: 'jwalant' });
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.action, 'hide_bar');
});

test('Global Voice Commands: turn off listening', async () => {
  const res = await agentEngine.processQuery({ query: 'Hey Jasper, turn off listening', userId: 'jwalant' });
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.action, 'mute_listening');
});

test('Global Voice Commands: turn on listening', async () => {
  const res = await agentEngine.processQuery({ query: 'Hey Jasper, turn on listening', userId: 'jwalant' });
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.action, 'unmute_listening');
});

test('Global Voice Commands: open your main interface', async () => {
  const res = await agentEngine.processQuery({ query: 'Hey Jasper, open your main interface', userId: 'jwalant' });
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.action, 'open_main_window');
});
