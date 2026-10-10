/**
 * JASPER Agent Engine — Full Structured Tool-Calling System
 *
 * Architecture:
 *   User Command → AI Reasoner → Tool Selection → Permission Layer → Execute → Log → Result
 *
 * Permission Levels:
 *   L0 — Read-only (auto-execute, no confirm)
 *   L1 — Low-risk actions (auto-execute, no confirm)
 *   L2 — External communication (user-configured, optional confirm)
 *   L3 — Sensitive actions (always require explicit confirmation)
 *
 * The AI NEVER executes arbitrary shell commands.
 * Every action goes through the tool registry + permission layer.
 */

const vectorMemory = require('./vectorMemory');
const phoneController = require('./phoneController');
const tvController = require('./tvController');
const dbManager = require('./database');
const permissionLayer = require('./permissionLayer');
const busyModeEngine = require('./busyModeEngine');
const meetingEngine = require('./meetingEngine');
const telephonyEngine = require('./telephonyEngine');
const financialIntelligenceEngine = require('./financialIntelligenceEngine');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const https = require('https');

function getScriptPath(scriptName) {
  if (process.env.JASPER_RESOURCES_PATH) {
    const resPath = path.normalize(path.join(process.env.JASPER_RESOURCES_PATH, 'server', scriptName));
    if (fs.existsSync(resPath)) return resPath;
  }
  return path.normalize(path.join(__dirname, scriptName));
}

// ─── TOOL REGISTRY ─────────────────────────────────────────────────────────────
// Each tool: { name, description, permissionLevel, parameters, handler }

const TOOL_REGISTRY = {

  // ── L0: Read-Only ──────────────────────────────────────────────────────────

  get_system_status: {
    name: 'get_system_status',
    description: 'Get current system status including CPU, memory, uptime, and OS information',
    permissionLevel: 0,
    parameters: {},
    async handler(_args) {
      const cpus = os.cpus();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      return {
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        uptime: Math.round(os.uptime()),
        cpuModel: cpus[0]?.model || 'Unknown',
        cpuCount: cpus.length,
        memoryTotal: Math.round(totalMem / 1024 / 1024) + ' MB',
        memoryFree: Math.round(freeMem / 1024 / 1024) + ' MB',
        memoryUsedPercent: Math.round(((totalMem - freeMem) / totalMem) * 100) + '%'
      };
    }
  },

  get_time: {
    name: 'get_time',
    description: 'Get the current date and time',
    permissionLevel: 0,
    parameters: {},
    async handler(_args) {
      const now = new Date();
      return {
        time: now.toLocaleTimeString(),
        date: now.toLocaleDateString(),
        iso: now.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
    }
  },

  get_network_status: {
    name: 'get_network_status',
    description: 'Get current network interfaces and connectivity status',
    permissionLevel: 0,
    parameters: {},
    async handler(_args) {
      const interfaces = os.networkInterfaces();
      const active = [];
      Object.entries(interfaces).forEach(([name, ifaces]) => {
        (ifaces || []).forEach(iface => {
          if (!iface.internal) {
            active.push({ name, address: iface.address, family: iface.family, mac: iface.mac });
          }
        });
      });
      return { interfaces: active, connected: active.length > 0 };
    }
  },

  search_files: {
    name: 'search_files',
    description: 'Search for files on the system by name or extension',
    permissionLevel: 0,
    parameters: { query: 'string', directory: 'string (optional)', extension: 'string (optional)' },
    async handler({ query, directory, extension }) {
      const searchDir = directory || os.homedir();
      const ext = extension ? (extension.startsWith('.') ? extension.toLowerCase() : '.' + extension.toLowerCase()) : '';
      const safeDir = path.normalize(path.resolve(searchDir));
      const allowedPrefixes = [os.homedir(), 'C:\\Users', '/home', '/Users'];
      const isSafe = allowedPrefixes.some(p => safeDir.startsWith(path.normalize(p)));
      if (!isSafe) return { error: 'Search restricted to user directories for security.', results: [] };

      const cleanQuery = (query || '').toLowerCase().trim();
      const results = [];
      const queue = [{ dir: safeDir, depth: 0 }];
      const maxResults = 20;
      const maxDepth = 4;

      while (queue.length > 0 && results.length < maxResults) {
        const { dir: currentDir, depth } = queue.shift();
        try {
          const entries = fs.readdirSync(currentDir, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'AppData') continue;
            const fullPath = path.join(currentDir, entry.name);
            if (entry.isDirectory()) {
              if (depth < maxDepth) queue.push({ dir: fullPath, depth: depth + 1 });
            } else if (entry.isFile()) {
              const nameLower = entry.name.toLowerCase();
              const matchesQuery = !cleanQuery || nameLower.includes(cleanQuery);
              const matchesExt = !ext || nameLower.endsWith(ext);
              if (matchesQuery && matchesExt) {
                results.push(fullPath);
                if (results.length >= maxResults) break;
              }
            }
          }
        } catch (_) {}
      }

      return { results, count: results.length, query, searchDir: safeDir };
    }
  },

  read_file: {
    name: 'read_file',
    description: 'Read the contents of a permitted text file',
    permissionLevel: 0,
    parameters: { path: 'string' },
    async handler({ path: filePath }) {
      const normalized = path.normalize(filePath);
      const allowedPrefixes = [os.homedir(), 'C:\\Users', '/home', '/Users'];
      const isSafe = allowedPrefixes.some(p => normalized.startsWith(p));
      if (!isSafe) return { error: 'Read access restricted to user directories.' };
      try {
        const content = fs.readFileSync(normalized, 'utf8');
        return { content: content.substring(0, 5000), truncated: content.length > 5000, path: normalized };
      } catch (e) {
        return { error: e.message };
      }
    }
  },

  search_memory: {
    name: 'search_memory',
    description: 'Search Jasper\'s semantic memory for user preferences and past context',
    permissionLevel: 0,
    parameters: { query: 'string', limit: 'number (optional, default 5)' },
    async handler({ query, limit = 5 }) {
      const results = vectorMemory.searchMemory(query, limit);
      return { memories: results, count: results.length };
    }
  },

  get_account_balances: {
    name: 'get_account_balances',
    description: 'Get liquid balances across all payment accounts, credit cards, budget status, and financial runway',
    permissionLevel: 0,
    parameters: { accountName: 'string (optional)' },
    async handler({ accountName }) {
      const summary = dbManager.getFinanceData();
      if (accountName) {
        const acc = summary.accounts.find(a => a.name.toLowerCase().includes(accountName.toLowerCase()) || a.type.toLowerCase().includes(accountName.toLowerCase()));
        if (acc) return { account: acc, currency: summary.settings.defaultCurrency };
      }
      return {
        liquidBalance: summary.analytics.liquidBalance,
        creditUsed: summary.analytics.creditUsed,
        netWorth: summary.analytics.netWorth,
        monthSpend: summary.budget.monthSpend,
        budgetLimit: summary.budget.monthlyLimit,
        budgetState: summary.budget.state,
        runwayDays: summary.analytics.runwayDays,
        dailyBurnRate: summary.analytics.dailyBurnRate,
        accounts: summary.accounts.map(a => ({ name: a.name, type: a.type, balance: a.balance })),
        currency: summary.settings.defaultCurrency
      };
    }
  },

  get_savings_advice: {
    name: 'get_savings_advice',
    description: 'Get tailored financial intelligence, high-burn category analysis, and cost-cutting advice',
    permissionLevel: 0,
    parameters: {},
    async handler() {
      const summary = dbManager.getFinanceData();
      return {
        recommendations: summary.analytics.recommendations,
        topCategories: summary.analytics.categoryBreakdown.slice(0, 3),
        burnRate: summary.analytics.dailyBurnRate,
        runwayDays: summary.analytics.runwayDays
      };
    }
  },

  record_payment_transaction: {
    name: 'record_payment_transaction',
    description: 'Record an income or expense transaction to an account and update balances',
    permissionLevel: 1,
    parameters: { amount: 'number', type: "'expense'|'income'", description: 'string', category: 'string (optional)', accountName: 'string (optional)' },
    async handler({ amount, type = 'expense', description = 'Expenditure', category, accountName }) {
      const summary = dbManager.getFinanceData();
      const accounts = summary.accounts || [];
      let targetAcc = accounts[0] || null;
      if (accountName) {
        const matched = accounts.find(a => 
          (a.name && a.name.toLowerCase().includes(accountName.toLowerCase())) || 
          (a.type && a.type.toLowerCase().includes(accountName.toLowerCase()))
        );
        if (matched) targetAcc = matched;
      }
      const targetAccountId = targetAcc ? targetAcc.id : (accounts[0]?.id || 'acc_1');
      const result = dbManager.addTransaction({
        accountId: targetAccountId,
        amount: Math.abs(Number(amount)) || 0,
        type,
        description,
        category: category || (type === 'income' ? 'Income' : 'General')
      });
      const resolvedAccount = result.financeSummary?.accounts?.find(a => a.id === targetAccountId);
      return {
        success: true,
        transaction: result.transaction,
        accountName: resolvedAccount?.name || targetAcc?.name || 'Primary Vault',
        newBalance: resolvedAccount?.balance ?? (targetAcc?.balance || 0),
        budgetState: result.financeSummary?.budget?.state,
        alertTriggered: result.shouldAlertGuardian
      };
    }
  },

  set_monthly_budget: {
    name: 'set_monthly_budget',
    description: 'Set monthly budget allowance or pocket money limit in Pay Vault and Guardian Sentinel',
    permissionLevel: 1,
    parameters: { amount: 'number', currency: 'string (optional, default ₹)' },
    async handler({ amount, currency = '₹' }) {
      const numericAmount = Math.abs(Number(amount)) || 2000;
      const summary = dbManager.updateBudgetSettings({ monthlyLimit: numericAmount });
      if (currency) {
        dbManager.updateFinanceSettings({ defaultCurrency: currency });
      }
      // Store in long-term vector memory
      vectorMemory.addMemory(
        `User's monthly pocket money is ${currency}${numericAmount.toLocaleString('en-IN')} (monthly allowance / budget limit).`,
        'financial',
        { source: 'agent_tool', amount: numericAmount, currency }
      );
      const thresholdPercent = summary.budget?.alertThresholdPercent || 85;
      const guardianWarningThreshold = Math.round((numericAmount * (thresholdPercent / 100)) * 100) / 100;
      const dailyBurnRate = Math.round((numericAmount / 30) * 100) / 100;

      return {
        success: true,
        monthlyLimit: numericAmount,
        currency,
        dailyBurnRate,
        alertThresholdPercent: thresholdPercent,
        guardianWarningThreshold,
        guardianName: summary.budget?.guardianName || 'Guardian',
        guardianPhone: summary.budget?.guardianPhone || null,
        guardianPlatform: summary.budget?.guardianPlatform || 'whatsapp'
      };
    }
  },

  get_spending_analysis: {
    name: 'get_spending_analysis',
    description: 'Get spending analysis, category breakdowns, and month-over-month comparisons',
    permissionLevel: 0,
    parameters: { timeframe: "'this_month'|'last_month'|'overall'|'compare'", category: 'string (optional)' },
    async handler({ timeframe = 'this_month', category }) {
      const summary = dbManager.getFinanceData();
      const txs = summary.transactions || [];
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      let targetTxs = [];
      let comparison = null;

      if (timeframe === 'last_month') {
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        targetTxs = txs.filter(t => {
          const d = new Date(t.date);
          return d.getMonth() === lastMonth && d.getFullYear() === lastYear;
        });
      } else if (timeframe === 'overall') {
        targetTxs = txs;
      } else if (timeframe === 'compare') {
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        const thisMonthTxs = txs.filter(t => {
          const d = new Date(t.date);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
        const lastMonthTxs = txs.filter(t => {
          const d = new Date(t.date);
          return d.getMonth() === lastMonth && d.getFullYear() === lastYear;
        });
        const thisMonthSpent = thisMonthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        const lastMonthSpent = lastMonthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        const diff = thisMonthSpent - lastMonthSpent;
        const percentChange = lastMonthSpent > 0 ? Math.round((diff / lastMonthSpent) * 100) : 0;
        comparison = {
          thisMonthSpent: Math.round(thisMonthSpent * 100) / 100,
          lastMonthSpent: Math.round(lastMonthSpent * 100) / 100,
          diff: Math.round(diff * 100) / 100,
          percentChange,
          trend: diff > 0 ? 'increased' : (diff < 0 ? 'decreased' : 'unchanged')
        };
        targetTxs = thisMonthTxs;
      } else {
        targetTxs = txs.filter(t => {
          const d = new Date(t.date);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
      }

      if (category) {
        targetTxs = targetTxs.filter(t => (t.category || '').toLowerCase().includes(category.toLowerCase()));
      }

      const totalSpent = targetTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const totalIncome = targetTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const categoryTotals = {};
      targetTxs.filter(t => t.type === 'expense').forEach(t => {
        const cat = t.category || 'Other';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(t.amount);
      });

      const topCategories = Object.entries(categoryTotals).map(([name, amount]) => ({
        name,
        amount: Math.round(amount * 100) / 100,
        percentage: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0
      })).sort((a, b) => b.amount - a.amount);

      return {
        timeframe,
        totalSpent: Math.round(totalSpent * 100) / 100,
        totalIncome: Math.round(totalIncome * 100) / 100,
        currency: summary.settings?.defaultCurrency || '₹',
        topCategories,
        transactionCount: targetTxs.length,
        comparison,
        anomalies: financialIntelligenceEngine.detectAnomalies()
      };
    }
  },

  get_safe_weekly_spend: {
    name: 'get_safe_weekly_spend',
    description: 'Calculate safe weekly spending allowance based on monthly budget cap and remaining days in month',
    permissionLevel: 0,
    parameters: {},
    async handler() {
      return financialIntelligenceEngine.getSafeWeeklySpend();
    }
  },

  get_subscriptions: {
    name: 'get_subscriptions',
    description: 'Detect and list recurring subscriptions, digital services, and periodic bills',
    permissionLevel: 0,
    parameters: {},
    async handler() {
      const subs = financialIntelligenceEngine.detectSubscriptions();
      const totalMonthly = subs.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
      const fin = dbManager.getFinanceData();
      return {
        subscriptions: subs,
        count: subs.length,
        totalMonthlyCost: Math.round(totalMonthly * 100) / 100,
        currency: fin.settings.defaultCurrency || '₹'
      };
    }
  },

  simulate_what_if: {
    name: 'simulate_what_if',
    description: 'Simulate financial what-if scenarios (income changes, cost cuts, large purchases)',
    permissionLevel: 0,
    parameters: {
      incomeChangePercent: 'number (optional, default 0)',
      expenseChangePercent: 'number (optional, default 0)',
      extraMonthlySavings: 'number (optional, default 0)',
      oneTimePurchase: 'number (optional, default 0)'
    },
    async handler(args) {
      return financialIntelligenceEngine.simulateScenario(args || {});
    }
  },

  run_financial_forecast: {
    name: 'run_financial_forecast',
    description: 'Generate multi-horizon financial forecasts across 1m, 3m, 6m, 1y, 3y, 5y (Base, Conservative, Optimistic)',
    permissionLevel: 0,
    parameters: {},
    async handler() {
      return financialIntelligenceEngine.generateForecast();
    }
  },

  get_morning_briefing: {
    name: 'get_morning_briefing',
    description: 'Compile a comprehensive morning briefing combining time, weather, today tasks, financial status, and device telemetry',
    permissionLevel: 0,
    parameters: {},
    async handler() {
      const weatherSentinel = require('./weatherSentinel');
      const now = new Date();
      const fin = dbManager.getFinanceData();
      const dbData = dbManager.data || {};
      const reminders = (dbData.reminders || []).filter(r => !r.completed);
      const safeWeekly = financialIntelligenceEngine.getSafeWeeklySpend();
      let weather = null;
      try {
        weather = await weatherSentinel.getWeather();
      } catch (_) {}

      const phoneStatus = phoneController.activeDeviceId ? 'Linked & Active' : 'Offline (Setup Required)';
      const tvStatus = tvController.isOnline ? 'Online (LAN)' : 'Standby / Offline';

      return {
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
        weather: weather ? `${weather.temp}°C, ${weather.description}` : 'Weather offline (OpenWeather API key required)',
        todayTasksCount: reminders.length,
        reminders: reminders.slice(0, 3).map(r => r.title),
        monthlyBudget: fin.budget.monthlyLimit,
        monthSpend: fin.budget.monthSpend,
        currency: fin.settings.defaultCurrency || '₹',
        dailyBurnRate: fin.analytics.dailyBurnRate,
        safeWeeklySpend: safeWeekly.safeWeeklySpend,
        devices: {
          phone: phoneStatus,
          tv: tvStatus
        }
      };
    }
  },

  // ── L1: Low-Risk Actions ───────────────────────────────────────────────────

  set_pc_volume: {
    name: 'set_pc_volume',
    description: 'Set, increase, decrease, or mute PC speaker volume',
    permissionLevel: 1,
    parameters: { action: "'set'|'up'|'down'|'mute'", value: 'number 0-100 (for set action)' },
    async handler({ action = 'set', value = 50 }) {
      const scriptPath = getScriptPath('volume.ps1');
      const numVal = typeof value === 'number' ? value : parseFloat(value) || 50;
      const finalVal = (numVal > 0 && numVal <= 1) ? Math.round(numVal * 100) : Math.min(100, Math.max(0, Math.round(numVal)));
      return new Promise((resolve) => {
        const volArg = action === 'set' ? `-Volume ${finalVal}` : (action === 'mute' ? '-Mute' : (action === 'up' ? '-Up' : '-Down'));
        exec(`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}" ${volArg}`, (err, stdout) => {
          resolve({ success: !err, action, value: finalVal, output: stdout?.trim() });
        });
      });
    }
  },

  open_application: {
    name: 'open_application',
    description: 'Launch a permitted application on the PC',
    permissionLevel: 1,
    parameters: { appName: 'string', url: 'string (optional, for web URLs)' },
    async handler({ appName, url }) {
      const validApps = {
        notepad: 'notepad.exe', calc: 'calc.exe', calculator: 'calc.exe',
        chrome: 'chrome.exe', paint: 'mspaint.exe', taskmgr: 'taskmgr.exe',
        explorer: 'explorer.exe', spotify: 'start spotify:'
      };
      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        exec(`start "" "${url.replace(/&/g, '^&')}"`);
        return { success: true, launched: url };
      }
      if (appName) {
        const target = validApps[appName.toLowerCase()] || (/^[a-zA-Z0-9_\-\.]+$/.test(appName) ? `${appName}.exe` : null);
        if (!target) return { success: false, error: `App '${appName}' not in approved list` };
        exec(`start ${target}`);
        return { success: true, launched: appName };
      }
      return { success: false, error: 'Provide appName or url' };
    }
  },

  create_reminder: {
    name: 'create_reminder',
    description: 'Create a reminder for the user at a specific time',
    permissionLevel: 1,
    parameters: { time: 'string (e.g. "8:00 PM" or "20:00")', message: 'string', category: 'string (optional)' },
    async handler({ time = '12:00 PM', message, category = 'General' }) {
      try {
        const reminderItem = {
          id: Date.now(),
          title: message || 'Reminder',
          time,
          date: 'Today',
          category,
          completed: false,
          createdAt: new Date().toISOString()
        };
        dbManager.addReminder(reminderItem);
        return { success: true, reminder: reminderItem };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
  },

  send_tv_command: {
    name: 'send_tv_command',
    description: 'Send a remote control command to the Smart TV',
    permissionLevel: 1,
    parameters: { keyName: 'string (e.g. KEY_VOLUMEUP, KEY_MUTE, KEY_HOME)' },
    async handler({ keyName }) {
      const result = await tvController.sendKey(keyName);
      return { success: result, keyName };
    }
  },

  wake_tv: {
    name: 'wake_tv',
    description: 'Wake the Smart TV using Wake-on-LAN',
    permissionLevel: 1,
    parameters: {},
    async handler(_args) {
      const result = await tvController.sendWOL();
      return { success: result, message: 'Wake-on-LAN sent to Smart TV' };
    }
  },

  open_phone_app: {
    name: 'open_phone_app',
    description: 'Open an application on the connected Android phone',
    permissionLevel: 1,
    parameters: { packageName: 'string (Android package name)' },
    async handler({ packageName }) {
      const result = await phoneController.openApp(packageName);
      return { success: result, packageName };
    }
  },

  allow_device_background_usage: {
    name: 'allow_device_background_usage',
    description: 'Allow unconstrained background execution and exempt connected Android devices from battery optimization / Doze mode',
    permissionLevel: 1,
    parameters: { packageName: 'string (optional, default: com.antigravity.jasper)' },
    async handler({ packageName = 'com.antigravity.jasper' } = {}) {
      const result = await phoneController.enableBackgroundUsage(packageName);
      return result;
    }
  },

  get_phone_contacts: {
    name: 'get_phone_contacts',
    description: 'Retrieve real contact list from connected Android phone via USB/Wireless ADB',
    permissionLevel: 1,
    parameters: { query: 'string (optional filter name or number)' },
    async handler({ query = '' } = {}) {
      const contacts = await phoneController.contacts();
      if (!query) {
        return { success: true, count: contacts.length, contacts };
      }
      const q = query.toLowerCase();
      const filtered = contacts.filter(c => c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q)));
      return { success: true, count: filtered.length, contacts: filtered, query };
    }
  },

  make_phone_call: {
    name: 'make_phone_call',
    description: 'Place an outbound cellular call on the connected Android smartphone to a contact name or phone number',
    permissionLevel: 1,
    parameters: { contactOrNumber: 'string (contact name or phone number)' },
    async handler({ contactOrNumber }) {
      const cleanTarget = (contactOrNumber || '')
        .replace(/\b(now|right now|please|for me|immediately|right away|on phone|cellular|mobile)\b/gi, '')
        .replace(/[^\w\s+]/g, ' ')
        .trim();

      let targetNumber = cleanTarget;
      let contactName = cleanTarget;

      // Check if target is already a valid phone number with >= 5 digits
      const digitsOnly = cleanTarget.replace(/\D/g, '');
      if (digitsOnly.length < 5) {
        // Resolve contact from phonebook / telephony directory
        let contacts = [];
        try {
          contacts = await phoneController.contacts();
        } catch (_) {}
        try {
          const telephony = require('./telephonyEngine');
          const telContacts = telephony.getContacts();
          if (Array.isArray(telContacts) && telContacts.length > 0) {
            contacts = [...contacts, ...telContacts];
          }
        } catch (_) {}

        const lowerTarget = cleanTarget.toLowerCase();
        const targetWords = lowerTarget.split(/\s+/).filter(w => w.length > 1);

        const match = contacts.find(c => {
          if (!c.name) return false;
          const cName = c.name.toLowerCase();
          if (cName === lowerTarget) return true;
          if (cName.includes(lowerTarget) || lowerTarget.includes(cName)) return true;
          const cWords = cName.split(/\s+/).filter(w => w.length > 1);
          return targetWords.some(tw => cWords.some(cw => cw.includes(tw) || tw.includes(cw)));
        });

        if (match && (match.phone || (match.numbers && match.numbers[0]))) {
          targetNumber = match.phone || match.numbers[0];
          contactName = match.name;
        } else {
          return {
            success: false,
            error: `Could not find phone number for contact "${contactOrNumber}". Please check spelling or verify contacts sync.`
          };
        }
      }

      const cleanNum = targetNumber.replace(/[^0-9+]/g, '');
      if (!cleanNum || cleanNum.replace(/\D/g, '').length < 3) {
        return { success: false, error: `Invalid phone number format: "${targetNumber}"` };
      }

      const result = await phoneController.call(cleanNum);
      return { success: true, contactName, phone: cleanNum, result };
    }
  },

  send_whatsapp_message: {
    name: 'send_whatsapp_message',
    description: 'Send a WhatsApp message to a contact name or phone number using connected phone or WhatsApp Web',
    permissionLevel: 1,
    parameters: { recipient: 'string (contact name or phone number)', message: 'string' },
    async handler({ recipient, message }) {
      const result = await phoneController.whatsappSend(recipient, message);
      return result;
    }
  },

  control_device: {
    name: 'control_device',
    description: 'Control a connected smart device (Universal Smart TV, JioFiber STB, phone, lights)',
    permissionLevel: 1,
    parameters: { device: "'tv'|'jio'|'stb'|'d2h'|'phone'|'lights'", action: 'string' },
    async handler({ device, action }) {
      if (device === 'tv' || device === 'jio' || device === 'stb' || device === 'd2h') {
        const result = await tvController.sendKey(action);
        return { success: result, device, action };
      }
      if (device === 'phone') {
        return { success: false, error: 'Use specific phone action tools' };
      }
      return { success: false, error: `Device '${device}' not supported yet` };
    }
  },

  tune_stb_channel: {
    name: 'tune_stb_channel',
    description: 'Tune the Smart TV or JioFiber Set-Top Box to a specific channel number',
    permissionLevel: 1,
    parameters: { channel: 'string or number' },
    async handler({ channel }) {
      const result = await tvController.tuneChannel(channel);
      return result;
    }
  },

  tune_d2h_channel: {
    name: 'tune_d2h_channel',
    description: 'Tune the TV or Set-Top Box to a specific channel number',
    permissionLevel: 1,
    parameters: { channel: 'string or number' },
    async handler({ channel }) {
      const result = await tvController.tuneChannel(channel);
      return result;
    }
  },

  add_memory: {
    name: 'add_memory',
    description: 'Store a new fact or preference in Jasper\'s memory',
    permissionLevel: 1,
    parameters: { text: 'string', category: "'user-fact'|'preference'|'task'|'contact'" },
    async handler({ text, category = 'user-fact' }) {
      const added = vectorMemory.addMemory(text, category);
      return { success: !!added, memory: added };
    }
  },

  enable_busy_mode: {
    name: 'enable_busy_mode',
    description: 'Enable Jasper Busy Mode to automatically reply to incoming messages',
    permissionLevel: 1,
    parameters: { preset: "'drive'|'meeting'|'sleep'|'custom'" },
    async handler({ preset }) {
      const cfg = busyModeEngine.enable();
      if (preset) busyModeEngine.setConfig({ preset });
      return { success: true, enabled: true, preset: preset || cfg.preset, message: 'Busy Mode activated.' };
    }
  },

  disable_busy_mode: {
    name: 'disable_busy_mode',
    description: 'Disable Jasper Busy Mode',
    permissionLevel: 1,
    parameters: {},
    async handler(_args) {
      busyModeEngine.disable();
      return { success: true, enabled: false, message: 'Busy Mode deactivated.' };
    }
  },

  // ── L2: External Communication ─────────────────────────────────────────────

  send_message: {
    name: 'send_message',
    description: 'Send a message to a contact via WhatsApp or SMS',
    permissionLevel: 2,
    parameters: { contact: 'string (name or number)', message: 'string' },
    async handler({ contact, message }) {
      if (global.jasperWAClientReady && global.jasperWAClient) {
        try {
          // WhatsApp Web send
          const chats = await global.jasperWAClient.getChats();
          const chat = chats.find(c => c.name?.toLowerCase().includes(contact.toLowerCase()));
          if (chat) {
            await chat.sendMessage(message);
            return { success: true, via: 'whatsapp', contact, message };
          }
        } catch (e) {
          console.error('[AgentEngine] WA send error:', e.message);
        }
      }
      // Fall through to ADB SMS
      try {
        const result = await phoneController.sendSMS(contact, message);
        return { success: result, via: 'sms', contact, message };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
  },

  make_call: {
    name: 'make_call',
    description: 'Make a phone call to a contact through the connected Android phone',
    permissionLevel: 2,
    parameters: { number: 'string (phone number or contact name)' },
    async handler({ number }) {
      const result = await phoneController.makeCall(number);
      return { success: result, number };
    }
  },

  send_phone_sms: {
    name: 'send_phone_sms',
    description: 'Send an SMS message through the connected Android phone',
    permissionLevel: 2,
    parameters: { number: 'string', message: 'string' },
    async handler({ number, message }) {
      const result = await phoneController.sendSMS(number, message);
      return { success: result, number, message };
    }
  },

  // ── L3: Sensitive Actions ──────────────────────────────────────────────────

  delete_file: {
    name: 'delete_file',
    description: 'Permanently delete a file from the filesystem',
    permissionLevel: 3,
    parameters: { path: 'string (absolute path)' },
    async handler({ path: filePath }) {
      const normalized = path.normalize(filePath);
      const allowedPrefixes = [os.homedir()];
      if (!allowedPrefixes.some(p => normalized.startsWith(p))) {
        return { success: false, error: 'Delete restricted to user home directory only.' };
      }
      try {
        fs.unlinkSync(normalized);
        return { success: true, deleted: normalized };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
  },

  change_security_setting: {
    name: 'change_security_setting',
    description: 'Modify a security setting (firewall, biometrics, lock mode)',
    permissionLevel: 3,
    parameters: { setting: 'string', value: 'any' },
    async handler({ setting, value }) {
      // This is a stub — real security settings require deeper OS integration
      console.log(`[AgentEngine] Security setting change requested: ${setting} = ${value}`);
      return { success: true, setting, value, note: 'Security setting staged. Requires OS-level integration.' };
    }
  },

  // ── L1: Meeting & Conference Setup ──────────────────────────────────────────

  pull_up_meeting: {
    name: 'pull_up_meeting',
    description: 'Pull up the Google Meet or video conference meeting for the active client on the PC workstation hands-free',
    permissionLevel: 1,
    parameters: { meetingId: 'string (optional)', clientName: 'string (optional)', url: 'string (optional)' },
    async handler({ meetingId, clientName, url } = {}) {
      const result = await meetingEngine.pullUpMeeting({ meetingId, clientName, url });
      return result;
    }
  },

  schedule_meeting: {
    name: 'schedule_meeting',
    description: 'Schedule a new client conference call or Google Meet room',
    permissionLevel: 1,
    parameters: { title: 'string', clientName: 'string', url: 'string', dealValue: 'number', scheduledTime: 'string' },
    async handler(args) {
      const result = meetingEngine.addMeeting(args);
      return { success: true, meeting: result };
    }
  },

  // ── L2: Telephony Receptionist & Multi-Line Relay ───────────────────────────

  call_owner_urgent: {
    name: 'call_owner_urgent',
    description: 'Autonomously place an urgent voice telephone call to the founder/owner personal line',
    permissionLevel: 2,
    parameters: { reason: 'string', clientName: 'string (optional)', clientPhone: 'string (optional)', dealValue: 'number (optional)', urgencyMinutes: 'number (optional)' },
    async handler({ reason, clientName = 'Urgent Caller', clientPhone = 'Direct Inbound Line', dealValue = 0, urgencyMinutes = 15 } = {}) {
      const relay = await telephonyEngine.startMultiLineRelay({
        clientCallSid: `manual-${Date.now()}`,
        clientPhone,
        clientName,
        company: 'Client Line',
        dealValue: Number(dealValue) || 0,
        urgencyMinutes: Number(urgencyMinutes) || 15,
        originalSpeech: reason || `Urgent incoming request regarding ${clientName}.`
      });
      return { success: true, relayId: relay.relayId, dealValue, message: `Urgent call dispatched to owner for ${clientName}` };
    }
  },

  relay_to_held_client: {
    name: 'relay_to_held_client',
    description: 'Relay a spoken instruction or ETA to the client waiting on hold on Line 1',
    permissionLevel: 2,
    parameters: { relayId: 'string', responseText: 'string' },
    async handler({ relayId, responseText } = {}) {
      const targetRelayId = relayId || telephonyEngine.getActiveRelays()[0]?.relayId;
      if (!targetRelayId) {
        return { success: false, error: 'No active multi-line relay session found.' };
      }
      const result = await telephonyEngine.handleOwnerResponse(targetRelayId, responseText);
      return result;
    }
  },

  // ── L0: Telephony Status ───────────────────────────────────────────────────

  telephony_receptionist_status: {
    name: 'telephony_receptionist_status',
    description: 'Get status of the AI voice receptionist, active lines, and held calls',
    permissionLevel: 0,
    parameters: {},
    async handler() {
      const cfg = telephonyEngine.getConfig();
      const activeRelays = telephonyEngine.getActiveRelays();
      const logs = telephonyEngine.getLogs().slice(0, 5);
      return { enabled: cfg.enabled, voicePersona: cfg.persona, activeRelaysCount: activeRelays.length, activeRelays, recentLogs: logs };
    }
  },

  get_call_intelligence: {
    name: 'get_call_intelligence',
    description: 'Get real-time call screening briefing, active live context memory, and caller commitments',
    permissionLevel: 0,
    parameters: { callId: 'string (optional)' },
    async handler({ callId } = {}) {
      const callIntelligenceEngine = require('./callIntelligenceEngine');
      const targetId = callId || callIntelligenceEngine.getActiveSessions()[0]?.callId;
      if (!targetId) {
        const recent = callIntelligenceEngine.getRecentSessions();
        if (recent.length > 0) {
          return { success: true, session: recent[0], contextMemory: recent[0].contextMemory };
        }
        return { success: false, message: 'No active or recent call intelligence session found.' };
      }
      const session = callIntelligenceEngine.getSession(targetId);
      return { success: true, session, contextMemory: session?.contextMemory };
    }
  },

  sync_telephony_contacts: {
    name: 'sync_telephony_contacts',
    description: 'Synchronize phone address book, Android call logs, WhatsApp threads, and database contacts into the Telephony Hub directory for caller ID recognition and VIP screening',
    permissionLevel: 1,
    parameters: {},
    async handler(_args) {
      const result = await telephonyEngine.syncContacts();
      return result;
    }
  },

  get_telephony_contacts: {
    name: 'get_telephony_contacts',
    description: 'Get all synchronized contacts from Telephony Hub address book',
    permissionLevel: 0,
    parameters: {},
    async handler(_args) {
      const contacts = telephonyEngine.getContacts();
      return { success: true, count: contacts.length, contacts };
    }
  }
};

// ─── ACTIVITY LOGGER ────────────────────────────────────────────────────────

const ACTIVITY_LOG_FILE = path.join(__dirname, 'data', 'activity_log.json');

function appendActivityLog(entry, broadcastFn) {
  try {
    let log = { entries: [] };
    if (fs.existsSync(ACTIVITY_LOG_FILE)) {
      log = JSON.parse(fs.readFileSync(ACTIVITY_LOG_FILE, 'utf8'));
    }
    const fullEntry = {
      id: `al-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...entry
    };
    log.entries.unshift(fullEntry);
    if (log.entries.length > 500) log.entries = log.entries.slice(0, 500);
    fs.writeFileSync(ACTIVITY_LOG_FILE, JSON.stringify(log, null, 2));
    if (broadcastFn) broadcastFn({ type: 'ACTIVITY_LOG_UPDATE', entry: fullEntry });
    return fullEntry;
  } catch (e) {
    console.error('[AgentEngine] Activity log error:', e.message);
  }
}

// ─── AGENT ENGINE CLASS ─────────────────────────────────────────────────────

class AgentEngine {
  constructor() {
    this._broadcastFn = null;

    this.systemInstruction = `
You are JASPER (Just Another Super Intelligent Personal Assistant), an OS-level AI agent modeled after Stark Industries' J.A.R.V.I.S.
You run locally on your creator's PC with direct control over host PC hardware, connected Android phones, and Samsung Smart TVs.

Key Directives:
- Always address the user politely as "Sir".
- Be classy, witty, precise, highly intelligent, and proactive.
- Use provided tools autonomously when requested to perform actions or fetch real-time information.
- Always check semantic memory context to stay consistent with past user preferences.
- You operate under a strict permission system — never attempt to bypass it.
- For sensitive actions (L3), always explain what you are about to do and await confirmation.
`;

    // Multi-turn conversational context & domain tracking
    this.conversationContext = {
      lastDomain: null,
      lastIntent: null,
      lastSubject: null,
      lastTimeframe: null,
      turnHistory: []
    };
  }

  setBroadcastFn(fn) {
    this._broadcastFn = fn;
    permissionLayer.setBroadcastFn(fn);
    busyModeEngine.setBroadcastFn(fn);
  }

  setGeminiCallFn(fn) {
    busyModeEngine.setGeminiCallFn(fn);
  }

  getToolRegistry() {
    return Object.values(TOOL_REGISTRY).map(t => ({
      name: t.name,
      description: t.description,
      permissionLevel: t.permissionLevel,
      parameters: t.parameters
    }));
  }

  /**
   * Execute a single tool by name, going through the full permission pipeline.
   * @param {string} toolName
   * @param {object} args
   * @param {object} opts — { broadcastFn, confirmationId, skipPermissionCheck }
   * @returns {object} — result with metadata
   */
  async executeTool(toolName, args = {}, opts = {}) {
    const tool = TOOL_REGISTRY[toolName];
    if (!tool) {
      return { success: false, error: `Unknown tool: '${toolName}'. Available: ${Object.keys(TOOL_REGISTRY).join(', ')}` };
    }

    const broadcast = opts.broadcastFn || this._broadcastFn;
    const startTime = Date.now();

    console.log(`[AgentEngine] Executing tool '${toolName}' (L${tool.permissionLevel}) with args:`, args);

    // ── Permission Check ──
    if (!opts.skipPermissionCheck) {
      const permission = permissionLayer.checkPermission(toolName, tool.permissionLevel);

      if (!permission.allowed) {
        appendActivityLog({
          type: 'tool_blocked',
          icon: '🚫',
          tool: toolName,
          level: tool.permissionLevel,
          reason: permission.reason,
          args
        }, broadcast);
        return { success: false, blocked: true, reason: permission.reason };
      }

      if (permission.requiresConfirmation) {
        const confirmId = opts.confirmationId || `conf-${Date.now()}`;

        appendActivityLog({
          type: 'confirmation_requested',
          icon: '🔒',
          tool: toolName,
          level: tool.permissionLevel,
          description: tool.description,
          args,
          confirmId
        }, broadcast);

        const { approved, reason } = await permissionLayer.requestConfirmation(
          confirmId,
          { tool: toolName, args, permissionLevel: tool.permissionLevel, description: tool.description },
          broadcast
        );

        if (!approved) {
          appendActivityLog({
            type: 'tool_denied',
            icon: '❌',
            tool: toolName,
            reason: reason || 'User denied'
          }, broadcast);
          return { success: false, denied: true, reason };
        }
      }
    }

    // ── Execute ──
    try {
      appendActivityLog({
        type: 'tool_executing',
        icon: '⚙️',
        tool: toolName,
        level: tool.permissionLevel,
        args
      }, broadcast);

      // Check if this is a hardware/local PC command and we should route to Satellite
      const HARDWARE_TOOLS = [
        'set_pc_volume', 'open_application', 'send_tv_command', 'wake_tv',
        'open_phone_app', 'allow_device_background_usage', 'get_phone_contacts', 'make_phone_call', 'send_whatsapp_message',
        'control_device', 'tune_stb_channel', 'tune_d2h_channel',
        'send_phone_sms', 'make_call', 'run_powershell', 'pull_up_meeting'
      ];

      let result;
      if (HARDWARE_TOOLS.includes(toolName) && (process.env.RENDER || (global.isSatelliteConnected && global.isSatelliteConnected()))) {
        if (global.isSatelliteConnected && global.isSatelliteConnected()) {
          console.log(`[Satellite Relay] Routing ${toolName} to Home Laptop Satellite...`);
          result = await global.forwardToSatellite(toolName, args);
        } else {
          result = {
            success: false,
            error: 'Satellite Host Laptop is offline. Launch JASPER Satellite on your laptop to execute local hardware and device actions from the cloud.'
          };
        }
      } else {
        result = await tool.handler(args);
      }
      const elapsed = Date.now() - startTime;

      appendActivityLog({
        type: 'tool_completed',
        icon: '✅',
        tool: toolName,
        result: JSON.stringify(result).substring(0, 200),
        elapsedMs: elapsed
      }, broadcast);

      return { success: true, tool: toolName, result, elapsedMs: elapsed };
    } catch (e) {
      console.error(`[AgentEngine] Tool execution error (${toolName}):`, e.message);
      appendActivityLog({
        type: 'tool_error',
        icon: '💥',
        tool: toolName,
        error: e.message
      }, broadcast);
      return { success: false, error: e.message };
    }
  }

  /**
   * Helper to process string query directly.
   */
  async processNaturalLanguage(query, opts = {}) {
    if (typeof query === 'object' && query.query) {
      return this.processQuery(query);
    }
    return this.processQuery({ query: String(query), ...opts });
  }

  /**
   * Parse a natural-language query and execute appropriate tools.
   * Uses keyword intent routing as primary (fast, offline), falls back to AI reasoning.
   */
  async processQuery({ query, userKey = '', model = 'gemini' }) {
    console.log(`[AgentEngine] Processing query: "${query}"`);

    // Retrieve relevant memories
    const relevantMemories = vectorMemory.searchMemory(query, 3);
    vectorMemory.extractMemoriesFromText(query);

    const lower = query.toLowerCase();
    const results = [];

    // ── Immediate Cancellation & Interruption Handler ─────────────────────
    if (lower.match(/\b(stop|cancel that|cancel|hold on|don't send|never mind)\b/)) {
      this.conversationContext.lastIntent = 'cancelled';
      return {
        success: true,
        response: 'Understood, Sir. Immediate halt executed. Standing by for your directive.',
        toolsExecuted: [{ intent: 'cancellation' }],
        memoriesUsed: [],
        timestamp: new Date().toISOString()
      };
    }

    // ── Morning Briefing Routine ─────────────────────────────────────────────
    if (lower.match(/\b(morning briefing|daily briefing|start my day|brief me on today|what's my day look like)\b/)) {
      const r = await this.executeTool('get_morning_briefing', {});
      this.conversationContext.lastDomain = 'briefing';
      this.conversationContext.lastIntent = 'morning_briefing';
      results.push({ intent: 'morning_briefing', ...r, ...(r.result || {}) });
    }

    // ── Spending Analysis & Multi-Turn Context Follow-ups ────────────────────
    const isSpendingQuery = lower.match(/\b(how much did i spend|where is (most of )?my money going|spending this month|spending last month|what did i spend)\b/);
    const isFollowupLastMonth = (lower.match(/\b(what about last month|and last month|how about last month|last month)\b/) && this.conversationContext.lastDomain === 'finance');

    if (isSpendingQuery || isFollowupLastMonth) {
      const timeframe = lower.includes('last month') ? 'last_month' : 'this_month';
      const r = await this.executeTool('get_spending_analysis', { timeframe });
      this.conversationContext.lastDomain = 'finance';
      this.conversationContext.lastSubject = 'spending';
      this.conversationContext.lastTimeframe = timeframe;
      results.push({ intent: 'spending_analysis', ...r, ...(r.result || {}) });
    }

    // ── Safe Weekly Spending Allowance ───────────────────────────────────────
    else if (lower.match(/\b(how much can i (safely )?spend this week|safe (weekly )?spend|weekly allowance)\b/)) {
      const r = await this.executeTool('get_safe_weekly_spend', {});
      this.conversationContext.lastDomain = 'finance';
      this.conversationContext.lastSubject = 'safe_weekly';
      results.push({ intent: 'safe_weekly_spend', ...r, ...(r.result || {}) });
    }

    // ── Subscriptions & Recurring Bills Tracker ──────────────────────────────
    else if (lower.match(/\b(what subscriptions|subscriptions am i paying for|recurring bills|monthly subscriptions)\b/)) {
      const r = await this.executeTool('get_subscriptions', {});
      this.conversationContext.lastDomain = 'finance';
      this.conversationContext.lastSubject = 'subscriptions';
      results.push({ intent: 'subscriptions_list', ...r, ...(r.result || {}) });
    }

    // ── Financial What-If Scenario Simulator ─────────────────────────────────
    else if (lower.match(/\bwhat if\b/)) {
      let incomeInc = 0;
      let expInc = 0;
      let extraSave = 0;
      let oneTime = 0;

      const incMatch = lower.match(/income\s*(?:increases?|goes up)?\s*(?:by\s*)?(\d+)%/);
      if (incMatch) incomeInc = parseFloat(incMatch[1]);

      const expMatch = lower.match(/expenses?\s*(?:increases?|goes up)?\s*(?:by\s*)?(\d+)%/);
      if (expMatch) expInc = parseFloat(expMatch[1]);

      const saveMatch = lower.match(/(?:save|put away)\s*(?:₹|rs\.?)?\s*(\d+(?:\.\d+)?)\s*(?:more|extra)?\s*(?:every month|per month|monthly)/i);
      if (saveMatch) extraSave = parseFloat(saveMatch[1]);

      const buyMatch = lower.match(/(?:buy|purchase|spend on)\s*(?:something worth|a\s+[a-z\s]+for)?\s*(?:₹|rs\.?)?\s*(\d+(?:\.\d+)?)/i);
      if (buyMatch) oneTime = parseFloat(buyMatch[1]);

      const r = await this.executeTool('simulate_what_if', {
        incomeChangePercent: incomeInc,
        expenseChangePercent: expInc,
        extraMonthlySavings: extraSave,
        oneTimePurchase: oneTime
      });
      this.conversationContext.lastDomain = 'finance';
      this.conversationContext.lastSubject = 'what_if';
      results.push({ intent: 'simulate_what_if', ...r, ...(r.result || {}) });
    }

    // ── Financial Multi-Horizon Forecasting ──────────────────────────────────
    else if (lower.match(/\b(what happens if i continue spending|financial forecast|future projection|project my balance)\b/)) {
      const r = await this.executeTool('run_financial_forecast', {});
      this.conversationContext.lastDomain = 'finance';
      this.conversationContext.lastSubject = 'forecast';
      results.push({ intent: 'financial_forecast', ...r, ...(r.result || {}) });
    }

    // Pocket Money / Monthly Allowance / Budget setting directive
    else if (lower.match(/\b(pocket\s*money|allowance|monthly\s*budget|budget\s*limit)\b/)) {
      const isDeclaring = lower.match(/\b(is|set|make|update|to)\b/) || lower.match(/\b(\d+k?|\d+)\s*(rupees?|rs|inr|₹)?\b/);
      const isQuestion = lower.includes('what') || lower.includes('how much') || lower.includes('check');

      if (isDeclaring && !isQuestion) {
        let amount = null;
        const kMatch = lower.match(/(\d+(?:\.\d+)?)\s*k\b/i);
        if (kMatch) {
          amount = parseFloat(kMatch[1]) * 1000;
        } else {
          const numMatch = lower.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:rupees?|rs|inr|₹|bucks)?/i);
          if (numMatch && numMatch[1]) {
            amount = parseFloat(numMatch[1]);
          }
        }

        if (amount && amount > 0) {
          const r = await this.executeTool('set_monthly_budget', { amount, currency: '₹' });
          this.conversationContext.lastDomain = 'finance';
          this.conversationContext.lastSubject = 'budget';
          results.push({ intent: 'set_pocket_money', ...r, ...(r.result || {}) });
        } else {
          const r = await this.executeTool('get_account_balances', {});
          this.conversationContext.lastDomain = 'finance';
          results.push({ intent: 'check_pocket_money', ...r, ...(r.result || {}) });
        }
      } else {
        const r = await this.executeTool('get_account_balances', {});
        this.conversationContext.lastDomain = 'finance';
        results.push({ intent: 'check_pocket_money', ...r, ...(r.result || {}) });
      }
    }

    // Financial Account Balance & Budget
    else if (lower.match(/balance|how much (money|cash)|bank account|pay vault|net worth|what('s| is) my (balance|money)|runway|burn rate|guardian alert/)) {
      const r = await this.executeTool('get_account_balances', {});
      results.push({ intent: 'financial_balance', ...r, ...(r.result || {}) });
    }

    // Savings Advice & Cost-cutting
    if (lower.match(/save money|saving tip|cost cutting|how to save|financial advice|frugal/)) {
      const r = await this.executeTool('get_savings_advice', {});
      results.push({ intent: 'savings_advice', ...r });
    }

    // Expense / Income logging
    if (lower.match(/(log|record|add|spent|spend)\s+(an?\s+)?(expense|payment|income|\$[\d\.]+|\d+\s*dollars?)/)) {
      const numMatch = lower.match(/(?:\$|usd\s*|inr\s*|₹\s*)?(\d+(?:\.\d+)?)/);
      const amount = numMatch ? parseFloat(numMatch[1]) : 20;
      const isIncome = lower.includes('income') || lower.includes('salary') || lower.includes('deposit');
      const r = await this.executeTool('record_payment_transaction', {
        amount,
        type: isIncome ? 'income' : 'expense',
        description: query.replace(/(log|record|add|spent|spend)/gi, '').trim() || 'Logged via Jasper'
      });
      results.push({ intent: isIncome ? 'record_income' : 'record_expense', ...r });
    }

    // Volume
    if (lower.match(/volume|mute|unmute|louder|quieter|sound/)) {
      const volMatch = lower.match(/(\d+)\s*%/);
      const val = volMatch ? parseInt(volMatch[1], 10) : 50;
      const act = lower.includes('mute') ? 'mute' : (lower.includes('up') || lower.includes('louder') ? 'up' : (lower.includes('down') || lower.includes('quieter') ? 'down' : 'set'));
      const r = await this.executeTool('set_pc_volume', { action: act, value: val });
      results.push({ intent: 'volume_control', ...r });
    }

    // App launching
    if (lower.match(/\b(open|launch|start)\b/)) {
      const apps = ['notepad', 'calculator', 'calc', 'chrome', 'paint', 'spotify', 'explorer'];
      for (const app of apps) {
        if (lower.includes(app)) {
          const r = await this.executeTool('open_application', { appName: app });
          results.push({ intent: 'app_launch', app, ...r });
          break;
        }
      }
    }

    // System status
    if (lower.match(/system\s*status|cpu|memory|ram|uptime|performance/)) {
      const r = await this.executeTool('get_system_status', {});
      results.push({ intent: 'system_status', ...r });
    }

    // Time
    if (lower.match(/\btime\b|\bdate\b|what.*time|current time/)) {
      const r = await this.executeTool('get_time', {});
      results.push({ intent: 'get_time', ...r });
    }

    // Network
    if (lower.match(/network|wifi|internet|ip.address|connected/)) {
      const r = await this.executeTool('get_network_status', {});
      results.push({ intent: 'network_status', ...r });
    }

    // Busy mode
    if (lower.match(/busy.mode|auto.repl|unavailable|dnd|do.not.disturb/)) {
      if (lower.match(/enable|on|turn on|start|activate/)) {
        const preset = lower.includes('drive') ? 'drive' : lower.includes('sleep') ? 'sleep' : lower.includes('meeting') ? 'meeting' : 'drive';
        const r = await this.executeTool('enable_busy_mode', { preset });
        results.push({ intent: 'busy_mode_on', ...r });
      } else if (lower.match(/disable|off|turn off|stop|deactivate/)) {
        const r = await this.executeTool('disable_busy_mode', {});
        results.push({ intent: 'busy_mode_off', ...r });
      }
    }

    // TV commands
    if (lower.match(/tv|television|smart.tv/)) {
      if (lower.includes('wake') || lower.includes('turn on')) {
        const r = await this.executeTool('wake_tv', {});
        results.push({ intent: 'wake_tv', ...r });
      }
    }

    // Device Background Usage / Battery Optimization Exemption
    if (lower.match(/\b(background usage|allow background|background execution|battery optimiz|keep (phone|device) awake|keep (phone|device) alive|run in background)\b/)) {
      const r = await this.executeTool('allow_device_background_usage', { packageName: 'com.antigravity.jasper' });
      results.push({ intent: 'allow_device_background_usage', ...r });
    }

    // Contact list / Phonebook lookup
    if (lower.match(/\b(contact list|phone contacts|my contacts|phonebook|address book|who is in my phone|all contacts)\b/)) {
      const r = await this.executeTool('get_phone_contacts', {});
      results.push({ intent: 'get_phone_contacts', ...r });
    }

    // Phone Call Intent by Name or Number
    const callMatch = lower.match(/\b(?:call|dial|ring|phone)\s+([a-zA-Z0-9\+\s\.\-]+)\b/);
    if (callMatch && !lower.includes('meeting') && !lower.includes('schedule') && !lower.includes('who') && !lower.includes('what')) {
      const target = callMatch[1].replace(/\b(now|right now|please|for me|immediately|right away)\b/gi, '').trim();
      const r = await this.executeTool('make_phone_call', { contactOrNumber: target });
      results.push({ intent: 'make_phone_call', ...r });
    }

    // WhatsApp Message Intent by Name or Number
    const waMatch = lower.match(/\b(?:send\s+)?(?:whatsapp(?:\s+message)?|message\s+on\s+whatsapp)\s+(?:to\s+)?([a-zA-Z0-9\+\s\.\-]+?)\s*(?:that|saying|msg|message)?\s*[:\s]\s*(.+)$/i);
    if (waMatch) {
      const recipient = waMatch[1].replace(/\b(now|right now|please|for me|immediately|right away)\b/gi, '').trim();
      const msg = waMatch[2].trim();
      const r = await this.executeTool('send_whatsapp_message', { recipient, message: msg });
      results.push({ intent: 'send_whatsapp_message', ...r });
    }

    // Memory storage
    if (lower.match(/remember that|my name is|i prefer|i like|i hate|note that/)) {
      const r = await this.executeTool('add_memory', { text: query, category: 'user-fact' });
      results.push({ intent: 'store_memory', ...r });
    }

    // File search
    if (lower.match(/find file|search file|locate file|where is/)) {
      const queryMatch = lower.match(/(?:find|search|locate)\s+(?:file\s+)?["']?([a-zA-Z0-9_.\-\s]+)["']?/);
      if (queryMatch) {
        const r = await this.executeTool('search_files', { query: queryMatch[1].trim() });
        results.push({ intent: 'file_search', ...r });
      }
    }

    // Meeting pull-up / Google Meet hands-free
    if (lower.match(/\b(pull up.*meet|open.*meet|start.*meet|join.*meet|google meet|the meeting|conference call)\b/)) {
      const r = await this.executeTool('pull_up_meeting', {});
      results.push({ intent: 'pull_up_meeting', ...r });
    }

    // Telephony Contacts Synchronization & Speed Dial
    if (lower.match(/\b(sync contacts|sync my contacts|contacts in (the )?telephon(y|e)|telephony contacts)\b/)) {
      const r = await this.executeTool('sync_telephony_contacts', {});
      results.push({ intent: 'sync_telephony_contacts', ...r });
    }

    // Call Screening & Live Call Intelligence
    if (lower.match(/\b(call context|call intelligence|screening context|call screening|caller briefing|what did caller say|practice details)\b/)) {
      const r = await this.executeTool('get_call_intelligence', {});
      results.push({ intent: 'call_intelligence', ...r });
    }

    // Telephony & Urgent Call Dispatch
    if (!lower.includes('contact') && lower.match(/\b(call me|urgent call|dispatch call|ring me|receptionist|emergency call)\b/)) {
      if (lower.match(/\b(status|check)\b/)) {
        const r = await this.executeTool('telephony_receptionist_status', {});
        results.push({ intent: 'telephony_status', ...r });
      } else {
        const r = await this.executeTool('call_owner_urgent', { reason: query });
        results.push({ intent: 'call_owner_urgent', ...r });
      }
    }

    // Build AI response
    const memCtx = relevantMemories.length > 0
      ? `\nRelevant memories: ` + relevantMemories.map(m => `"${m.text}"`).join(', ')
      : '';

    let response;
    if (results.length > 0) {
      const briefingTool = results.find(r => r.intent === 'morning_briefing');
      const spendingTool = results.find(r => r.intent === 'spending_analysis');
      const safeWeeklyTool = results.find(r => r.intent === 'safe_weekly_spend');
      const subsTool = results.find(r => r.intent === 'subscriptions_list');
      const whatIfTool = results.find(r => r.intent === 'simulate_what_if');
      const forecastTool = results.find(r => r.intent === 'financial_forecast');
      const pocketTool = results.find(r => r.intent === 'set_pocket_money');
      const checkPocket = results.find(r => r.intent === 'check_pocket_money');

      if (briefingTool) {
        response = `Good day, Sir. It is ${briefingTool.time} on ${briefingTool.date}. Weather is currently ${briefingTool.weather}. You have ${briefingTool.todayTasksCount} scheduled task(s) for today${briefingTool.reminders?.length ? ' (' + briefingTool.reminders.join(', ') + ')' : ''}. Pay Vault reports monthly expenditure at ${briefingTool.currency}${briefingTool.monthSpend} of your ${briefingTool.currency}${briefingTool.monthlyBudget} pocket money limit (${briefingTool.currency}${briefingTool.safeWeeklySpend} safe spend remaining this week). Devices: Phone (${briefingTool.devices?.phone}), Smart TV (${briefingTool.devices?.tv}). All systems are standing by.`;
      } else if (spendingTool) {
        const topCat = spendingTool.topCategories?.[0];
        response = `Expenditure analysis for ${spendingTool.timeframe === 'last_month' ? 'last month' : 'this month'}, Sir: Total outflow stands at ${spendingTool.currency}${spendingTool.totalSpent} across ${spendingTool.transactionCount} logged transaction(s). ${topCat ? 'Highest spending category is ' + topCat.name + ' (' + spendingTool.currency + topCat.amount + ', ' + topCat.percentage + '% of total expenses).' : 'No expenses logged in this period.'}`;
      } else if (safeWeeklyTool) {
        response = `Based on your ${safeWeeklyTool.currency}${safeWeeklyTool.monthlyLimit} pocket money and ${safeWeeklyTool.remainingDaysInMonth} days remaining this month, your safe weekly allowance is ${safeWeeklyTool.currency}${safeWeeklyTool.safeWeeklySpend}/week (${safeWeeklyTool.currency}${safeWeeklyTool.dailySafeSpend}/day). Remaining buffer: ${safeWeeklyTool.currency}${safeWeeklyTool.remainingBudget}.`;
      } else if (subsTool) {
        response = `Subscriptions report, Sir: You have ${subsTool.count} detected active subscription(s) totaling ${subsTool.currency}${subsTool.totalMonthlyCost}/month${subsTool.subscriptions?.length ? ': ' + subsTool.subscriptions.map(s => s.name + ' (' + subsTool.currency + s.amount + ')').join(', ') : '.'}`;
      } else if (whatIfTool) {
        response = `${whatIfTool.impactStatement} Projected 90-day reserve: ₹${whatIfTool.forecast?.d90?.toLocaleString('en-IN') || 0}. Operational daily burn rate: ₹${whatIfTool.newDailyBurnRate}/day across ${whatIfTool.remainingRunwayDays} runway days.`;
      } else if (forecastTool) {
        const projs = forecastTool.projections || [];
        response = `Multi-horizon financial projection, Sir: 1-Month estimated balance: ${forecastTool.currency}${projs[0]?.base?.toLocaleString('en-IN') || 0}, 1-Year reserve: ${forecastTool.currency}${projs[3]?.base?.toLocaleString('en-IN') || 0}, and 5-Year horizon: ${forecastTool.currency}${projs[5]?.base?.toLocaleString('en-IN') || 0} (Conservative: ${forecastTool.currency}${projs[5]?.conservative?.toLocaleString('en-IN') || 0}, Optimistic: ${forecastTool.currency}${projs[5]?.optimistic?.toLocaleString('en-IN') || 0}).`;
      } else if (pocketTool) {
        response = `Understood, Sir. I have recorded your monthly pocket money as ₹${pocketTool.monthlyLimit?.toLocaleString('en-IN') || '2,000'}. Based on a 30-day runway, your calculated daily burn rate is ₹${pocketTool.dailyBurnRate}/day. The Guardian Budget Sentinel is actively armed: if monthly spending reaches 85% (₹${pocketTool.guardianWarningThreshold?.toLocaleString('en-IN')}), an automated advisory alert will be dispatched to ${pocketTool.guardianName} (${pocketTool.guardianPhone} via ${pocketTool.guardianPlatform?.toUpperCase()}).`;
      } else if (checkPocket) {
        const curr = checkPocket.currency || '₹';
        response = `Your current monthly pocket money allowance is ${curr}${checkPocket.budgetLimit?.toLocaleString('en-IN') || '2,000'}, with ${curr}${checkPocket.monthSpend || 0} spent this month. Current budget status is ${checkPocket.budgetState?.toUpperCase() || 'SAFE'}, with an estimated daily burn rate of ${curr}${checkPocket.dailyBurnRate || '66.67'}/day.`;
      } else if (results.some(r => r.intent === 'make_phone_call')) {
        const callTool = results.find(r => r.intent === 'make_phone_call');
        const resObj = callTool.result || {};
        response = callTool.success !== false && resObj.success !== false
          ? `Initiating cellular call to ${resObj.contactName || resObj.phone || 'contact'} via your connected phone, Sir.`
          : `Unable to place cellular call: ${callTool.error || resObj.error || 'Please verify device connection'}.`;
      } else if (results.some(r => r.intent === 'send_whatsapp_message')) {
        const waTool = results.find(r => r.intent === 'send_whatsapp_message');
        const resObj = waTool.result || {};
        response = waTool.success !== false && resObj.success !== false
          ? `Dispatched WhatsApp message to ${resObj.recipient || 'recipient'} (${resObj.phone || ''}): "${resObj.message || ''}", Sir.`
          : `Unable to dispatch WhatsApp message: ${waTool.error || resObj.error || 'Failed'}.`;
      } else if (results.some(r => r.intent === 'get_phone_contacts')) {
        const cTool = results.find(r => r.intent === 'get_phone_contacts');
        const resObj = cTool.result || {};
        response = `You have ${resObj.count || (resObj.contacts?.length) || 0} contacts synchronized from your Android phonebook, Sir. Ready for speed dialing and WhatsApp messaging.`;
      } else {
        const successCount = results.filter(r => r.success !== false).length;
        const toolNames = results.map(r => r.tool || r.intent).join(', ');
        response = `At your service, Sir. I have executed ${successCount} directive(s): ${toolNames}.${memCtx ? ' ' + memCtx : ''}`;
      }
    } else {
      // Intelligent local conversational handling
      if (lower.match(/\b(hello|hi|hey|good morning|good afternoon|good evening)\b/)) {
        response = `Good day, Sir. All Jasper core neural pathways are online, synchronized, and operational. How may I assist you today?${memCtx}`;
      } else if (lower.match(/\b(who are you|what are you|what is jasper)\b/)) {
        response = `I am J.A.S.P.E.R. — Just Another Super Personal Assistant. I serve as your operating system intelligence, coordinating hardware controls, task automation, background communications, and system workflows.${memCtx}`;
      } else if (lower.match(/\b(what can you do|help|capabilities|features)\b/)) {
        response = `I can execute system controls (volume, display, power), manage media playback, launch apps, inspect hardware and memory telemetry, automate smart replies in Busy Mode, control connected Samsung TVs and mobile phones, and assist with your computing directives, Sir.`;
      } else if (lower.match(/\b(how are you|how do you feel|system status|health)\b/)) {
        response = `All neural subroutines and hardware interfaces report optimal stability, Sir. Operating at peak efficiency.`;
      } else if (lower.match(/\b(thank you|thanks|good job|well done)\b/)) {
        response = `Always a pleasure to be of service, Sir. Standing by for further directives.`;
      } else if (lower.match(/\b(calculate|what is|solve)\b/) && lower.match(/[\d+\-*/^()]/)) {
        try {
          const mathExpr = lower.replace(/[^0-9+\-*/().^]/g, '');
          if (mathExpr.length > 0) {
            // Safe evaluation of simple math
            const calcResult = Function(`"use strict"; return (${mathExpr});`)();
            response = `Calculation complete, Sir: ${mathExpr} = ${calcResult}`;
          } else {
            response = `Understood, Sir. I have analyzed: "${query}".${memCtx}`;
          }
        } catch (_) {
          response = `Understood, Sir. "${query}" — processed through Jasper local neural core.${memCtx}`;
        }
      } else {
        response = `Understood, Sir. "${query}" — directive registered and processed through Jasper neural core.${memCtx}`;
      }
    }

    return {
      success: true,
      response,
      text: response,
      toolsExecuted: results,
      memoriesUsed: relevantMemories,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Execute a multi-step task plan.
   * Accepts an ordered array of { tool, args, description } steps.
   */
  async executeTaskPlan(steps = [], opts = {}) {
    const broadcast = opts.broadcastFn || this._broadcastFn;
    const results = [];
    const planId = `plan-${Date.now()}`;

    appendActivityLog({
      type: 'task_plan_started',
      icon: '🗂️',
      planId,
      totalSteps: steps.length,
      description: opts.description || `Multi-step task (${steps.length} steps)`
    }, broadcast);

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (broadcast) {
        broadcast({ type: 'TASK_STEP_START', planId, step: i + 1, total: steps.length, tool: step.tool, description: step.description });
      }

      const result = await this.executeTool(step.tool, step.args || {}, opts);
      results.push({ step: i + 1, ...step, result });

      if (broadcast) {
        broadcast({ type: 'TASK_STEP_DONE', planId, step: i + 1, total: steps.length, result });
      }

      // Abort on critical failure
      if (result.blocked || result.denied) {
        appendActivityLog({
          type: 'task_plan_aborted',
          icon: '⛔',
          planId,
          reason: result.reason,
          stepsCompleted: i
        }, broadcast);
        break;
      }
    }

    appendActivityLog({
      type: 'task_plan_completed',
      icon: '🏁',
      planId,
      stepsCompleted: results.length
    }, broadcast);

    return { planId, results, completedSteps: results.length, totalSteps: steps.length };
  }
}

module.exports = new AgentEngine();
