/**
 * JASPER FINANCIAL INTELLIGENCE ENGINE
 * Comprehensive, Zero-Fake Financial Intelligence Center:
 * - Real Statement Importer (CSV / JSON text format)
 * - Autonomous 12-Category Classifier & Adaptive Learning Loop
 * - Subscriptions & Recurring Payment Detector
 * - Anomaly & Unusual Transaction Sentinel
 * - Multi-Horizon Financial Forecasting (1m, 3m, 6m, 1y, 3y, 5y)
 * - "What-If" Scenario Simulator (Base / Conservative / Optimistic)
 * - Safe Weekly Burn Rate & Pocket Money Runway Sentinel
 */

const dbManager = require('./database');
const vectorMemory = require('./vectorMemory');

// Standard 12 Financial Categories
const FINANCIAL_CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Education',
  'Entertainment',
  'Bills',
  'Subscriptions',
  'Health',
  'Travel',
  'Investments',
  'Savings',
  'Other'
];

// Keyword Rules for Initial Autonomous Classification
const CATEGORY_RULES = {
  Food: ['swiggy', 'zomato', 'restaurant', 'cafe', 'mcdonald', 'burger', 'pizza', 'grocery', 'supermarket', 'blinkit', 'zepto', 'instamart', 'starbucks', 'dining', 'food', 'snack', 'tea', 'coffee'],
  Transport: ['uber', 'ola', 'rapido', 'metro', 'bus', 'train', 'irctc', 'petrol', 'fuel', 'diesel', 'parking', 'toll', 'fastag', 'cab', 'auto'],
  Shopping: ['amazon', 'flipkart', 'myntra', 'ajio', 'clothing', 'retail', 'electronics', 'croma', 'reliance digital', 'store', 'mall', 'apparel'],
  Education: ['course', 'udemy', 'coursera', 'books', 'college', 'tuition', 'exam', 'fees', 'school', 'training', 'stationery'],
  Entertainment: ['movie', 'cinema', 'pvr', 'inox', 'concert', 'gaming', 'steam', 'playstation', 'xbox', 'theatre', 'club', 'outing'],
  Bills: ['electricity', 'water', 'gas', 'broadband', 'wifi', 'jiofiber', 'airtel', 'recharge', 'mobile bill', 'maintenance', 'rent'],
  Subscriptions: ['netflix', 'spotify', 'prime', 'youtube premium', 'chatgpt', 'github', 'cloud', 'aws', 'render', 'hotstar', 'disney', 'icloud', 'google one'],
  Health: ['pharmacy', 'hospital', 'doctor', 'clinic', 'dentist', 'apollo', 'medplus', 'medicine', 'gym', 'fitness', 'cult.fit', 'lab test'],
  Travel: ['flight', 'airline', 'makemytrip', 'hotel', 'airbnb', 'indigo', 'resort', 'vacation', 'luggage', 'visa'],
  Investments: ['zerodha', 'groww', 'mutual fund', 'stocks', 'sip', 'etf', 'gold', 'crypto', 'coinbase', 'binance', 'deposit'],
  Savings: ['emergency vault', 'fixed deposit', 'recurring deposit', 'piggy', 'reserve', 'vault deposit', 'safe reserve'],
  Other: ['miscellaneous', 'general', 'atm withdrawal', 'cash']
};

class FinancialIntelligenceEngine {
  constructor() {
    this.merchantLearningStore = {};
  }

  /**
   * Classify a transaction description/merchant into one of 12 standard categories.
   */
  classifyTransaction(description = '', merchant = '') {
    const text = `${description} ${merchant}`.toLowerCase();

    // 1. Check user-taught merchant rules first
    const dbData = dbManager.getFinanceData();
    const customRules = dbData.settings?.merchantCategoryRules || this.merchantLearningStore;
    for (const [mKey, cat] of Object.entries(customRules)) {
      if (text.includes(mKey.toLowerCase())) {
        return cat;
      }
    }

    // 2. Keyword matching across standard dictionary
    for (const [category, keywords] of Object.entries(CATEGORY_RULES)) {
      for (const kw of keywords) {
        if (text.includes(kw)) {
          return category;
        }
      }
    }

    return 'Other';
  }

  /**
   * Learn from a user correction to automatically categorize future transactions.
   */
  learnMerchantCategory(merchantPattern, correctCategory) {
    if (!merchantPattern || !FINANCIAL_CATEGORIES.includes(correctCategory)) {
      return { success: false, error: 'Invalid merchant pattern or category' };
    }

    const fin = dbManager.getFinanceData();
    if (!fin.settings.merchantCategoryRules) {
      fin.settings.merchantCategoryRules = {};
    }

    const cleanPattern = merchantPattern.trim().toLowerCase();
    fin.settings.merchantCategoryRules[cleanPattern] = correctCategory;
    this.merchantLearningStore[cleanPattern] = correctCategory;
    dbManager.updateFinanceSettings({ merchantCategoryRules: fin.settings.merchantCategoryRules });

    // Store in semantic vector memory
    vectorMemory.addMemory(
      `Merchant "${merchantPattern}" is categorized as "${correctCategory}" by user directive.`,
      'financial',
      { merchant: cleanPattern, category: correctCategory }
    );

    return { success: true, learned: { merchant: cleanPattern, category: correctCategory } };
  }

  /**
   * Parse CSV or JSON statement data safely.
   * Format supported: Date, Description/Merchant, Amount, Type (Debit/Credit/Expense/Income)
   */
  importStatement(rawText, format = 'csv', accountId = 'acc_1') {
    if (!rawText || typeof rawText !== 'string') {
      return { success: false, error: 'Empty or invalid statement text' };
    }

    const importedTransactions = [];
    const rows = rawText.split(/\r?\n/).map(r => r.trim()).filter(Boolean);

    if (rows.length === 0) {
      return { success: false, error: 'No data rows found in statement' };
    }

    // Detect CSV headers or format
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      // Skip header line if detected
      if (i === 0 && row.toLowerCase().includes('date') && row.toLowerCase().includes('amount')) {
        continue;
      }

      const parts = row.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length >= 3) {
        const dateStr = parts[0] || new Date().toISOString();
        const desc = parts[1] || 'Imported Transaction';
        const rawAmount = parts[2] ? parseFloat(parts[2].replace(/[^0-9.-]/g, '')) : 0;
        const rawType = parts[3] ? parts[3].toLowerCase() : (rawAmount < 0 ? 'expense' : 'income');

        if (!isNaN(rawAmount) && rawAmount !== 0) {
          const type = (rawType.includes('credit') || rawType.includes('income') || rawAmount > 0) ? 'income' : 'expense';
          const absAmount = Math.abs(rawAmount);
          const category = this.classifyTransaction(desc, parts[4] || '');

          const tx = dbManager.addTransaction({
            date: new Date(dateStr).toISOString() || new Date().toISOString(),
            accountId,
            type,
            amount: absAmount,
            description: desc,
            merchant: parts[4] || desc,
            category
          });

          if (tx && tx.transaction) {
            importedTransactions.push(tx.transaction);
          }
        }
      }
    }

    return {
      success: true,
      importedCount: importedTransactions.length,
      transactions: importedTransactions
    };
  }

  /**
   * Detect recurring subscriptions and repeat bills.
   */
  detectSubscriptions() {
    const fin = dbManager.getFinanceData();
    const transactions = fin.transactions || [];
    const potentialRecurring = {};

    transactions.forEach(tx => {
      if (tx.type !== 'expense') return;
      const key = `${(tx.merchant || tx.description || '').toLowerCase().trim()}_${Math.round(tx.amount)}`;
      if (!potentialRecurring[key]) {
        potentialRecurring[key] = {
          name: tx.merchant || tx.description,
          amount: tx.amount,
          category: tx.category,
          dates: [],
          count: 0
        };
      }
      potentialRecurring[key].dates.push(new Date(tx.date).getTime());
      potentialRecurring[key].count++;
    });

    // Subscriptions: matches recurring names or items charged 2+ times with similar amounts
    const detected = [];
    for (const [_, item] of Object.entries(potentialRecurring)) {
      const isKnownSubName = ['netflix', 'spotify', 'prime', 'youtube', 'chatgpt', 'github', 'aws', 'render', 'hotstar', 'wifi', 'broadband', 'jio']
        .some(name => item.name.toLowerCase().includes(name));

      if (item.count >= 2 || isKnownSubName) {
        detected.push({
          name: item.name,
          amount: item.amount,
          frequency: item.count >= 2 ? 'Monthly Recurring' : 'Periodic',
          category: item.category || 'Subscriptions',
          chargesLogged: item.count,
          estimatedAnnualCost: Math.round(item.amount * 12)
        });
      }
    }

    return detected;
  }

  /**
   * Detect unusual spending spikes, duplicate charges, or anomalies.
   */
  detectAnomalies() {
    const fin = dbManager.getFinanceData();
    const txs = fin.transactions || [];
    const monthlyLimit = fin.budget.monthlyLimit || 2000;
    const anomalies = [];

    // 1. Large transaction detection (> 30% of monthly budget in a single charge)
    const largeThreshold = monthlyLimit * 0.30;
    txs.forEach(tx => {
      if (tx.type === 'expense' && tx.amount >= largeThreshold) {
        anomalies.push({
          type: 'large_transaction',
          severity: 'high',
          message: `Large expense detected: ${tx.description} for ${fin.settings.defaultCurrency}${tx.amount} (${Math.round((tx.amount / monthlyLimit) * 100)}% of monthly budget).`,
          transactionId: tx.id,
          amount: tx.amount,
          date: tx.date
        });
      }
    });

    // 2. Duplicate charge detection (same merchant & amount within 48 hours)
    for (let i = 0; i < txs.length; i++) {
      for (let j = i + 1; j < txs.length; j++) {
        const a = txs[i];
        const b = txs[j];
        if (a.type === 'expense' && b.type === 'expense' && a.amount === b.amount && a.merchant && a.merchant === b.merchant) {
          const diffHours = Math.abs(new Date(a.date).getTime() - new Date(b.date).getTime()) / (3600 * 1000);
          if (diffHours <= 48) {
            anomalies.push({
              type: 'duplicate_charge',
              severity: 'medium',
              message: `Possible duplicate charge: ${fin.settings.defaultCurrency}${a.amount} at "${a.merchant}" charged twice within ${Math.round(diffHours)} hours.`,
              transactionId: a.id,
              date: a.date
            });
            break;
          }
        }
      }
    }

    // 3. Category burn spike detection (> 35% of total monthly spend in one category)
    const breakdown = fin.analytics.categoryBreakdown || [];
    breakdown.forEach(cat => {
      if (cat.percentage > 35) {
        anomalies.push({
          type: 'category_spike',
          severity: 'warning',
          message: `Category Alert: ${cat.name} accounts for ${cat.percentage}% of your current monthly expenditure.`,
          category: cat.name,
          amount: cat.amount
        });
      }
    });

    return anomalies;
  }

  /**
   * Multi-Horizon Financial Forecasting across 1m, 3m, 6m, 1y, 3y, 5y.
   * Outputs Base, Conservative, and Optimistic models.
   */
  generateForecast(customAssumptions = {}) {
    const fin = dbManager.getFinanceData();
    const currentLiquid = fin.analytics.liquidBalance || 0;
    const monthlyLimit = fin.budget.monthlyLimit || 2000;
    const monthlySpend = fin.budget.monthSpend || 0;
    const monthlyIncome = fin.budget.monthIncome || (monthlyLimit * 1.5);

    const baseMonthlySavings = Math.max(-monthlyLimit, monthlyIncome - Math.max(monthlySpend, monthlyLimit));

    const horizons = [
      { label: '1 Month', months: 1 },
      { label: '3 Months', months: 3 },
      { label: '6 Months', months: 6 },
      { label: '1 Year', months: 12 },
      { label: '3 Years', months: 36 },
      { label: '5 Years', months: 60 }
    ];

    const projections = horizons.map(h => {
      const m = h.months;
      // Base: current net savings flow
      const baseProjected = Math.round(currentLiquid + (baseMonthlySavings * m));

      // Conservative: 15% higher expenses, 5% lower income
      const consSavings = (monthlyIncome * 0.95) - (Math.max(monthlySpend, monthlyLimit) * 1.15);
      const conservativeProjected = Math.round(currentLiquid + (consSavings * m));

      // Optimistic: 10% higher income, 15% cost discipline
      const optSavings = (monthlyIncome * 1.10) - (Math.max(monthlySpend, monthlyLimit) * 0.85);
      const optimisticProjected = Math.round(currentLiquid + (optSavings * m));

      return {
        horizon: h.label,
        months: m,
        base: Math.max(0, baseProjected),
        conservative: Math.max(0, conservativeProjected),
        optimistic: Math.max(0, optimisticProjected),
        estimatedNetCashFlow: Math.round(baseMonthlySavings * m)
      };
    });

    const horizonsMap = {};
    projections.forEach(p => {
      const key = p.months >= 12 ? `${p.months / 12}y` : `${p.months}m`;
      horizonsMap[key] = {
        label: p.horizon,
        months: p.months,
        baseProjectedBalance: p.base,
        conservativeBalance: p.conservative,
        optimisticBalance: p.optimistic,
        estimatedNetCashFlow: p.estimatedNetCashFlow
      };
    });

    return {
      currentLiquidBalance: currentLiquid,
      monthlyIncomeEstimate: monthlyIncome,
      monthlySpendBaseline: Math.max(monthlySpend, monthlyLimit),
      monthlySavingsBaseline: baseMonthlySavings,
      monthlyNetSavings: baseMonthlySavings,
      currency: fin.settings.defaultCurrency || '₹',
      projections,
      horizons: horizonsMap,
      disclaimer: 'Note: Forecasts are mathematical projections based on historical run rates and assumptions, not guaranteed financial results.'
    };
  }

  /**
   * "What-If" Scenario Simulator
   * e.g. "What if I save ₹5,000 more every month?", "What if my expenses increase 10%?", "What if I buy something worth ₹80,000?"
   */
  simulateScenario(params = {}) {
    const { incomeChangePercent = 0, expenseChangePercent = 0, extraMonthlySavings = 0, oneTimePurchase = 0 } = params;
    const fin = dbManager.getFinanceData();
    const currentLiquid = fin.analytics.liquidBalance || 0;
    const monthlyLimit = fin.budget.monthlyLimit || 2000;
    const baselineMonthlySpend = Math.max(fin.budget.monthSpend || 0, monthlyLimit);
    const baselineIncome = fin.budget.monthIncome || (monthlyLimit * 1.5);

    // Adjusted parameters
    const adjustedIncome = baselineIncome * (1 + (incomeChangePercent / 100));
    const adjustedSpend = (baselineMonthlySpend * (1 + (expenseChangePercent / 100))) - extraMonthlySavings;
    const adjustedMonthlySavings = adjustedIncome - adjustedSpend;

    const liquidAfterOneTime = currentLiquid - oneTimePurchase;
    const runway30d = Math.round(liquidAfterOneTime + (adjustedMonthlySavings * 1));
    const runway90d = Math.round(liquidAfterOneTime + (adjustedMonthlySavings * 3));
    const runway180d = Math.round(liquidAfterOneTime + (adjustedMonthlySavings * 6));
    const runway1y = Math.round(liquidAfterOneTime + (adjustedMonthlySavings * 12));

    const dailyBurn = Math.round((adjustedSpend / 30) * 100) / 100;
    const daysRunway = dailyBurn > 0 ? Math.max(0, Math.floor(liquidAfterOneTime / dailyBurn)) : 999;

    return {
      simulationSummary: `Scenario: Income ${incomeChangePercent >= 0 ? '+' : ''}${incomeChangePercent}%, Expenses ${expenseChangePercent >= 0 ? '+' : ''}${expenseChangePercent}%, Extra Savings: ${fin.settings.defaultCurrency || '₹'}${extraMonthlySavings}/mo, One-Time Purchase: ${fin.settings.defaultCurrency || '₹'}${oneTimePurchase}.`,
      adjustedMonthlyIncome: Math.round(adjustedIncome),
      adjustedMonthlySpend: Math.round(adjustedSpend),
      adjustedMonthlySavings: Math.round(adjustedMonthlySavings),
      newDailyBurnRate: dailyBurn,
      remainingRunwayDays: daysRunway,
      forecast: {
        d30: runway30d,
        d90: runway90d,
        y1: runway1y
      },
      projectedBalances: {
        m1: runway30d,
        m3: runway90d,
        m6: runway180d,
        y1: runway1y
      },
      feasible: liquidAfterOneTime >= 0,
      impactStatement: liquidAfterOneTime < 0
        ? `Warning: A one-time purchase of ${fin.settings.defaultCurrency || '₹'}${oneTimePurchase} would exceed your current liquid reserve by ${fin.settings.defaultCurrency || '₹'}${Math.abs(liquidAfterOneTime)}.`
        : `Feasible: Leaves ${fin.settings.defaultCurrency || '₹'}${liquidAfterOneTime} immediate liquid reserves with ${daysRunway} days of operating runway.`
    };
  }

  simulateWhatIf(params) {
    return this.simulateScenario(params);
  }

  /**
   * Calculate Safe Weekly Spending Allowance based on monthly limit and remaining days
   */
  getSafeWeeklySpend() {
    const fin = dbManager.getFinanceData();
    const monthlyLimit = fin.budget.monthlyLimit || 2000;
    const monthSpend = fin.budget.monthSpend || 0;
    const remainingBudget = Math.max(0, monthlyLimit - monthSpend);

    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const remainingDays = Math.max(1, daysInMonth - now.getDate() + 1);

    const dailyRate = remainingBudget / remainingDays;
    const weeklySafe = Math.round(dailyRate * 7 * 100) / 100;

    return {
      monthlyLimit,
      monthSpend,
      remainingBudget: Math.round(remainingBudget * 100) / 100,
      remainingDaysInMonth: remainingDays,
      dailySafeSpend: Math.round(dailyRate * 100) / 100,
      safeWeeklySpend: weeklySafe,
      currency: fin.settings.defaultCurrency || '₹'
    };
  }
}

const financialIntelligenceEngine = new FinancialIntelligenceEngine();
module.exports = financialIntelligenceEngine;
