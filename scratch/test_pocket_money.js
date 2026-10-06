const dbManager = require('../server/database');
const vectorMemory = require('../server/vectorMemory');
const agentEngine = require('../server/agentEngine');

async function runTest() {
  console.log('=== Step 1: Initializing & Updating Database with Pocket Money ===');
  // Update budget settings in DB
  const budgetSummary = dbManager.updateBudgetSettings({
    monthlyLimit: 2000,
    alertThresholdPercent: 85
  });
  console.log('Budget Limit set to:', budgetSummary.budget.monthlyLimit);
  console.log('Budget State:', budgetSummary.budget.state);

  // Update default currency
  dbManager.updateFinanceSettings({ defaultCurrency: '₹' });
  const finData = dbManager.getFinanceData();
  console.log('Default Currency:', finData.settings.defaultCurrency);
  console.log('Daily burn rate:', finData.analytics.dailyBurnRate);

  console.log('\n=== Step 2: Testing Semantic Memory Storage ===');
  const addedMem = vectorMemory.addMemory(
    "User's monthly pocket money is ₹2,000 (2k rupees).",
    "financial",
    { source: "user_directive", amount: 2000, currency: "₹" }
  );
  console.log('Added Memory:', addedMem);

  const searchRes = vectorMemory.searchMemory('pocket money allowance', 3);
  console.log('Semantic Search Results count:', searchRes.length);
  searchRes.forEach((m, idx) => console.log(`  [${idx+1}] (Score: ${m.score}) ${m.text}`));

  console.log('\n=== Step 3: Testing Natural Language Agent Processing for "my monthly pocket money is 2k rupees" ===');
  const queryRes = await agentEngine.processQuery({ query: 'my monthly pocket money is 2k rupees' });
  console.log('Agent Response:\n', queryRes.response);
  console.log('Tools Executed:', queryRes.toolsExecuted.map(t => ({ intent: t.intent, monthlyLimit: t.monthlyLimit })));

  console.log('\n=== Step 4: Testing Check Query: "how much is my pocket money?" ===');
  const checkRes = await agentEngine.processQuery({ query: 'what is my monthly pocket money?' });
  console.log('Agent Response:\n', checkRes.response);

  console.log('\n=== All Pocket Money & Budget Tests Completed Successfully ===');
}

runTest().catch(console.error);
