const test = require('node:test');
const assert = require('node:assert');
const agentEngine = require('../server/agentEngine');
const permissionLayer = require('../server/permissionLayer');

test('AgentEngine: should load tool registry with all tools', () => {
  const tools = agentEngine.getToolRegistry();
  assert.ok(Array.isArray(tools), 'Should return an array of tools');
  assert.ok(tools.length >= 40, 'Should have at least 40 registered tools');
  assert.ok(tools.some(t => t.name === 'get_time'), 'Should have get_time tool');
  assert.ok(tools.some(t => t.name === 'get_system_status'), 'Should have get_system_status tool');
  assert.ok(tools.some(t => t.name === 'search_files'), 'Should have search_files tool');
  assert.ok(tools.some(t => t.name === 'search_memory'), 'Should have search_memory tool');
});

test('AgentEngine: should execute get_time tool with timezone', async () => {
  const result = await agentEngine.executeTool('get_time', { timezone: 'Asia/Kolkata' }, { skipPermissionCheck: true });
  assert.strictEqual(result.success, true);
  assert.ok(result.result && result.result.time, 'Should return time string');
  assert.ok(result.result.date, 'Should return date string');
  assert.strictEqual(result.result.timezone, 'Asia/Kolkata');
});

test('AgentEngine: should execute get_system_status tool (L0)', async () => {
  const result = await agentEngine.executeTool('get_system_status', {}, { skipPermissionCheck: true });
  assert.strictEqual(result.success, true);
  assert.ok(result.result.cpuCount > 0, 'CPU count should be positive');
  assert.ok(result.result.memoryTotal, 'Should report memoryTotal');
  assert.ok(result.result.platform, 'Should report platform');
});

test('AgentEngine: processQuery should handle basic conversational greeting', async () => {
  const res = await agentEngine.processQuery({ query: 'Hello Jasper', userId: 'jwalant' });
  assert.strictEqual(res.success, true);
  assert.ok(res.response.includes('Jasper') || res.response.includes('Good day'), 'Should return greeting response');
});

test('AgentEngine: processQuery should resolve mathematical calculation', async () => {
  const res = await agentEngine.processQuery({ query: 'calculate 150 * 4', userId: 'jwalant' });
  assert.strictEqual(res.success, true);
  assert.ok(res.response.includes('600'), 'Should calculate 150 * 4 = 600');
});

test('PermissionLayer: should enforce L0 auto-execute and L3 sensitive confirmation', () => {
  const l0Check = permissionLayer.checkPermission('get_time', 0);
  assert.strictEqual(l0Check.allowed, true);
  assert.strictEqual(l0Check.requiresConfirmation, false);

  const l3Check = permissionLayer.checkPermission('shutdown_computer', 3);
  assert.strictEqual(l3Check.allowed, true);
  assert.strictEqual(l3Check.requiresConfirmation, true);
});

test('AgentEngine: executeTaskPlan should execute multi-step plans sequentially', async () => {
  const plan = [
    { tool: 'get_time', args: { timezone: 'UTC' }, description: 'Check UTC time' },
    { tool: 'get_system_status', args: {}, description: 'Check hardware specs' }
  ];
  const planRes = await agentEngine.executeTaskPlan(plan, { skipPermissionCheck: true });
  assert.ok(planRes.planId);
  assert.strictEqual(planRes.completedSteps, 2);
  assert.strictEqual(planRes.results.length, 2);
  assert.strictEqual(planRes.results[0].result.success, true);
  assert.strictEqual(planRes.results[1].result.success, true);
});
