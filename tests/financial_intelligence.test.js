const test = require('node:test');
const assert = require('node:assert');
const financialIntelligenceEngine = require('../server/financialIntelligenceEngine');
const dbManager = require('../server/database');

test('FinancialEngine: should classify transactions into 12 standard categories', () => {
  const catFood = financialIntelligenceEngine.classifyTransaction('Swiggy Order #1234', 'Swiggy');
  assert.strictEqual(catFood, 'Food');

  const catTransport = financialIntelligenceEngine.classifyTransaction('Uber Ride to Airport', 'Uber');
  assert.strictEqual(catTransport, 'Transport');

  const catShopping = financialIntelligenceEngine.classifyTransaction('Amazon Retail India', 'Amazon');
  assert.strictEqual(catShopping, 'Shopping');

  const catBills = financialIntelligenceEngine.classifyTransaction('Electricity Bill Payment', 'Torrent Power');
  assert.strictEqual(catBills, 'Bills');

  const catSub = financialIntelligenceEngine.classifyTransaction('Netflix Monthly Subscription', 'Netflix');
  assert.strictEqual(catSub, 'Subscriptions');
});

test('FinancialEngine: should learn user-defined merchant categorization rules', () => {
  const learnRes = financialIntelligenceEngine.learnMerchantCategory('Specialty Roasters Coffee', 'Food', 'jwalant');
  assert.strictEqual(learnRes.success, true);
  assert.strictEqual(learnRes.learned.category, 'Food');

  const classified = financialIntelligenceEngine.classifyTransaction('Specialty Roasters Coffee', 'Specialty Roasters', 'jwalant');
  assert.strictEqual(classified, 'Food');
});

test('FinancialEngine: should parse CSV bank and wallet statements cleanly', () => {
  const csvData = `Date,Description,Amount,Type
2026-10-01,Grocery Supermarket,450.00,Debit
2026-10-05,Monthly Pocket Money,2000.00,Credit
2026-10-10,Metro Card Recharge,200.00,Expense`;

  const importRes = financialIntelligenceEngine.importStatement(csvData, 'csv', 'acc_1', 'jwalant');
  assert.strictEqual(importRes.success, true);
  assert.ok(importRes.importedCount >= 3, 'Should import at least 3 transactions');
});

test('FinancialEngine: should calculate safe weekly allowance based on pocket money', () => {
  const safeSpend = financialIntelligenceEngine.getSafeWeeklySpend('jwalant');
  assert.ok(safeSpend);
  assert.strictEqual(safeSpend.monthlyLimit, 2000);
  assert.ok(typeof safeSpend.safeWeeklySpend === 'number');
  assert.ok(typeof safeSpend.dailySafeSpend === 'number');
  assert.ok(safeSpend.remainingDaysInMonth > 0);
});

test('FinancialEngine: should generate multi-horizon forecasts without synthetic NaN values', () => {
  const forecast = financialIntelligenceEngine.generateForecast({}, 'jwalant');
  assert.ok(forecast && forecast.projections);
  assert.ok(Array.isArray(forecast.projections));
  assert.strictEqual(forecast.projections.length, 6, 'Should generate 6 projection horizons (1m, 3m, 6m, 1y, 3y, 5y)');
  for (const p of forecast.projections) {
    assert.ok(!isNaN(p.base), `Base forecast for ${p.label} should be a valid number`);
    assert.ok(!isNaN(p.conservative), `Conservative forecast for ${p.label} should be a valid number`);
    assert.ok(!isNaN(p.optimistic), `Optimistic forecast for ${p.label} should be a valid number`);
  }
});

test('FinancialEngine: simulateScenario should compute runway and new daily burn rate', () => {
  const sim = financialIntelligenceEngine.simulateScenario({
    expenseChangePercent: -20,
    oneTimeSavings: 500,
    monthlyPocketMoney: 2000
  }, 'jwalant');

  assert.ok(sim);
  assert.ok(sim.newDailyBurnRate > 0, 'Should calculate positive daily burn rate');
  assert.ok(sim.remainingRunwayDays >= 0, 'Should calculate remaining runway days');
  assert.ok(sim.impactStatement, 'Should provide impact statement');
});
