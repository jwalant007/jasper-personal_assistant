import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, CreditCard, ArrowUpRight, ArrowDownLeft, RefreshCw, Eye, EyeOff, 
  ShieldAlert, TrendingUp, AlertTriangle, CheckCircle2, DollarSign, Send, 
  Plus, Trash2, ArrowLeftRight, Clock, Sparkles, PieChart, ShieldCheck, 
  ChevronRight, Smartphone, Building, Coins, AlertCircle, FileText, Upload,
  Calendar, Layers, Sliders, Check, HelpCircle
} from 'lucide-react';
import { getApiBase } from '../utils/apiConfig.js';

const STANDARD_CATEGORIES = [
  'Food', 'Transport', 'Shopping', 'Education', 'Entertainment',
  'Bills', 'Subscriptions', 'Health', 'Travel', 'Investments', 'Savings', 'Other'
];

export default function PaymentBalanceWidget({ onClose }) {
  const [financeData, setFinanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('accounts'); // 'accounts' | 'budget' | 'projections' | 'subscriptions' | 'advisor' | 'ledger'
  const [privacyMask, setPrivacyMask] = useState(false);
  const [notification, setNotification] = useState(null);

  // Advanced Intelligence data states
  const [forecastData, setForecastData] = useState(null);
  const [subscriptionsData, setSubscriptionsData] = useState(null);
  const [anomaliesData, setAnomaliesData] = useState([]);
  const [safeWeeklyData, setSafeWeeklyData] = useState(null);

  // Modals inside widget
  const [showAddTxModal, setShowAddTxModal] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [testingAlert, setTestingAlert] = useState(false);

  // Form states
  const [txForm, setTxForm] = useState({
    amount: '',
    type: 'expense',
    category: 'Food',
    description: '',
    accountId: '',
    merchant: ''
  });

  const [accountForm, setAccountForm] = useState({
    name: '',
    type: 'bank',
    balance: '',
    limit: '2500',
    institution: '',
    currency: '₹'
  });

  const [transferForm, setTransferForm] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    description: 'Internal Transfer'
  });

  // Statement import state
  const [importText, setImportText] = useState('');
  const [importAccountId, setImportAccountId] = useState('');
  const [importing, setImporting] = useState(false);

  // What-If Simulator state
  const [whatIfParams, setWhatIfParams] = useState({
    incomeChangePercent: 0,
    expenseChangePercent: 0,
    extraMonthlySavings: 0,
    oneTimePurchase: 0
  });
  const [whatIfResult, setWhatIfResult] = useState(null);
  const [simulating, setSimulating] = useState(false);

  const fetchFinance = async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/finance/summary`);
      const data = await res.json();
      if (data.success) {
        setFinanceData(data);
        if (data.settings?.privacyMask !== undefined) {
          setPrivacyMask(data.settings.privacyMask);
        }
        if (data.accounts?.length > 0 && !txForm.accountId) {
          setTxForm(prev => ({ ...prev, accountId: data.accounts[0].id }));
          setTransferForm(prev => ({ 
            ...prev, 
            fromAccountId: data.accounts[0].id,
            toAccountId: data.accounts[1]?.id || data.accounts[0].id
          }));
          setImportAccountId(data.accounts[0].id);
        }
      }
    } catch (err) {
      console.error('[Finance Widget] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdvancedIntelligence = async () => {
    try {
      const [forecastRes, subsRes, anomRes, safeRes] = await Promise.all([
        fetch(`${getApiBase()}/api/finance/forecast`),
        fetch(`${getApiBase()}/api/finance/subscriptions`),
        fetch(`${getApiBase()}/api/finance/anomalies`),
        fetch(`${getApiBase()}/api/finance/safe-weekly`)
      ]);

      const [forecastJson, subsJson, anomJson, safeJson] = await Promise.all([
        forecastRes.json(),
        subsRes.json(),
        anomRes.json(),
        safeRes.json()
      ]);

      if (forecastJson.success) setForecastData(forecastJson);
      if (subsJson.success) setSubscriptionsData(subsJson.subscriptions);
      if (anomJson.success) setAnomaliesData(anomJson.anomalies);
      if (safeJson.success) setSafeWeeklyData(safeJson);
    } catch (err) {
      console.error('[Finance Intelligence] Fetch error:', err);
    }
  };

  useEffect(() => {
    fetchFinance();
    fetchAdvancedIntelligence();
    const interval = setInterval(() => {
      fetchFinance();
      fetchAdvancedIntelligence();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const togglePrivacy = async () => {
    const next = !privacyMask;
    setPrivacyMask(next);
    try {
      await fetch(`${getApiBase()}/api/finance/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privacyMask: next })
      });
    } catch (_) {}
  };

  const curr = financeData?.settings?.defaultCurrency || '₹';

  const maskValue = (val) => {
    if (privacyMask) return '••••••';
    const num = Number(val) || 0;
    return `${curr}${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Submit New Transaction
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!txForm.amount || Number(txForm.amount) <= 0) return;

    try {
      const res = await fetch(`${getApiBase()}/api/finance/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txForm)
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Transaction logged (${curr}${txForm.amount})`);
        setShowAddTxModal(false);
        setTxForm({
          amount: '',
          type: 'expense',
          category: 'Food',
          description: '',
          accountId: financeData?.accounts[0]?.id || '',
          merchant: ''
        });
        fetchFinance();
        fetchAdvancedIntelligence();
      }
    } catch (err) {
      showToast('Error recording transaction', 'error');
    }
  };

  // Submit New Account
  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (!accountForm.name) return;

    try {
      const res = await fetch(`${getApiBase()}/api/finance/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...accountForm, currency: curr })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Account "${accountForm.name}" created`);
        setShowAddAccountModal(false);
        setAccountForm({ name: '', type: 'bank', balance: '', limit: '2500', institution: '', currency: curr });
        fetchFinance();
      }
    } catch (err) {
      showToast('Error creating account', 'error');
    }
  };

  // Submit Transfer
  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!transferForm.amount || transferForm.fromAccountId === transferForm.toAccountId) {
      showToast('Select different source & destination accounts', 'error');
      return;
    }

    try {
      const res = await fetch(`${getApiBase()}/api/finance/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferForm)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Fund transfer executed successfully');
        setShowTransferModal(false);
        setTransferForm(prev => ({ ...prev, amount: '' }));
        fetchFinance();
      }
    } catch (err) {
      showToast('Transfer failed', 'error');
    }
  };

  // Delete Transaction
  const handleDeleteTx = async (id) => {
    if (!confirm('Revert and delete this transaction? Balance will be adjusted.')) return;
    try {
      await fetch(`${getApiBase()}/api/finance/transactions/${id}`, { method: 'DELETE' });
      showToast('Transaction reverted');
      fetchFinance();
      fetchAdvancedIntelligence();
    } catch (err) {
      showToast('Failed to delete transaction', 'error');
    }
  };

  // Manual Category Correction with Adaptive Learning
  const handleCorrectCategory = async (merchant, newCategory) => {
    if (!merchant || !newCategory) return;
    try {
      const res = await fetch(`${getApiBase()}/api/finance/categories/correct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchant, category: newCategory })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Learned: Future "${merchant}" will be categorized as ${newCategory}`);
        fetchFinance();
      }
    } catch (err) {
      showToast('Failed to record category learning', 'error');
    }
  };

  // Statement CSV Import Handler
  const handleImportStatement = async (e) => {
    e.preventDefault();
    if (!importText.trim()) {
      showToast('Please paste statement CSV or text', 'error');
      return;
    }
    setImporting(true);
    try {
      const res = await fetch(`${getApiBase()}/api/finance/import-statement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statementText: importText,
          format: 'csv',
          accountId: importAccountId || financeData?.accounts[0]?.id || 'acc_1'
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Successfully imported ${data.importedCount} transactions!`);
        setShowImportModal(false);
        setImportText('');
        fetchFinance();
        fetchAdvancedIntelligence();
      } else {
        showToast(data.error || 'Import failed', 'error');
      }
    } catch (err) {
      showToast('Error importing statement', 'error');
    } finally {
      setImporting(false);
    }
  };

  // Run What-If Simulation
  const handleRunWhatIf = async () => {
    setSimulating(true);
    try {
      const res = await fetch(`${getApiBase()}/api/finance/what-if`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(whatIfParams)
      });
      const data = await res.json();
      if (data.success) {
        setWhatIfResult(data);
      }
    } catch (err) {
      showToast('What-If simulation failed', 'error');
    } finally {
      setSimulating(false);
    }
  };

  // Test Guardian Alert
  const handleTestGuardianAlert = async () => {
    setTestingAlert(true);
    try {
      const res = await fetch(`${getApiBase()}/api/finance/guardian-alert/test`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('Autonomous Guardian alert dispatched to ' + (data.details?.guardianName || 'Guardian'));
        fetchFinance();
      } else {
        showToast('Guardian dispatch returned error', 'error');
      }
    } catch (err) {
      showToast('Could not trigger test alert', 'error');
    } finally {
      setTestingAlert(false);
    }
  };

  // Update Monthly Budget
  const handleUpdateBudget = async (newLimit) => {
    try {
      await fetch(`${getApiBase()}/api/finance/budget`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlyLimit: Number(newLimit) })
      });
      fetchFinance();
      fetchAdvancedIntelligence();
      showToast('Monthly limit updated');
    } catch (err) {
      showToast('Failed to update budget', 'error');
    }
  };

  const accounts = financeData?.accounts || [];
  const transactions = financeData?.transactions || [];
  const budget = financeData?.budget || {
    monthlyLimit: 2000,
    monthSpend: 0,
    state: 'normal',
    percentSpent: 0,
    guardianName: 'Guardian',
    guardianPhone: '',
    guardianPlatform: 'whatsapp'
  };
  const analytics = financeData?.analytics || {
    netWorth: 0,
    liquidBalance: 0,
    creditUsed: 0,
    dailyBurnRate: 0,
    runwayDays: 0,
    categoryBreakdown: []
  };

  if (loading && !financeData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
        <span className="text-xs uppercase tracking-wider font-mono">Loading JASPER Financial Intelligence...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950/95 text-slate-200 overflow-hidden relative">
      {/* Toast Notification */}
      {notification && (
        <div className={`absolute top-4 right-4 z-50 px-4 py-2.5 rounded-xl border backdrop-blur-md shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-2 ${
          notification.type === 'error' 
            ? 'bg-rose-950/90 border-rose-500/50 text-rose-200' 
            : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
        }`}>
          {notification.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Top Header & Net Worth Overview Banner */}
      <div className="p-6 border-b border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-100 tracking-tight">JASPER Financial Intelligence Center</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Zero-Fake Synced
                </span>
              </div>
              <p className="text-xs text-slate-400">Statement Imports, Autonomous Categorization, What-If Projections & Guardian Sentinel</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={togglePrivacy}
              title={privacyMask ? "Reveal Balances" : "Hide / Mask Balances"}
              className="px-3 py-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-xs text-slate-300 flex items-center gap-1.5 transition-all"
            >
              {privacyMask ? <EyeOff className="w-3.5 h-3.5 text-indigo-400" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{privacyMask ? 'Hidden' : 'Visible'}</span>
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="px-3 py-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-xs text-slate-200 flex items-center gap-1.5 transition-all"
            >
              <Upload className="w-3.5 h-3.5 text-purple-400" />
              <span>Import Statement</span>
            </button>
            <button
              onClick={() => setShowTransferModal(true)}
              className="px-3 py-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-xs text-slate-200 flex items-center gap-1.5 transition-all"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-sky-400" />
              <span>Transfer</span>
            </button>
            <button
              onClick={() => setShowAddTxModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Record</span>
            </button>
          </div>
        </div>

        {/* 4 Core Bento Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
          {/* Card 1: Total Liquid Balance */}
          <div className="bento-card p-4 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Total Liquid Reserve</span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Available
              </span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-white mb-1.5">
              {maskValue(analytics.liquidBalance)}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Net Worth: {maskValue(analytics.netWorth)}</span>
              <span className="text-zinc-500">Liabilities: {maskValue(analytics.creditUsed)}</span>
            </div>
          </div>

          {/* Card 2: Guardian Budget Sentinel */}
          <div className={`bento-card p-4 relative overflow-hidden ${
            budget.state === 'breached' 
              ? 'border-rose-500/40 bg-rose-950/20' 
              : budget.state === 'warning' 
                ? 'border-amber-500/40 bg-amber-950/20' 
                : ''
          }`}>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className={`w-3.5 h-3.5 ${budget.state === 'breached' ? 'text-rose-400' : 'text-indigo-400'}`} />
                Guardian Budget
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                budget.state === 'breached'
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse'
                  : budget.state === 'warning'
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              }`}>
                {budget.state === 'breached' ? 'BREACHED' : budget.state === 'warning' ? 'APPROACHING' : 'ON TRACK'}
              </span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-white mb-1.5 flex items-baseline gap-2">
              <span>{maskValue(budget.monthSpend)}</span>
              <span className="text-xs text-slate-400 font-normal">/ {maskValue(budget.monthlyLimit)}</span>
            </div>
            <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  budget.state === 'breached' ? 'bg-rose-500' : budget.state === 'warning' ? 'bg-amber-400' : 'bg-indigo-500'
                }`}
                style={{ width: `${Math.min(100, budget.percentSpent)}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 mt-1.5 flex justify-between">
              <span>{budget.percentSpent}% utilized</span>
              <span>Guardian: {budget.guardianName}</span>
            </div>
          </div>

          {/* Card 3: Safe Weekly Spend Allowance */}
          <div className="bento-card p-4 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Safe Weekly Spend</span>
              <span className="text-[10px] text-sky-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Sentinel
              </span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-white mb-1.5">
              {safeWeeklyData ? maskValue(safeWeeklyData.safeWeeklySpend) : maskValue((budget.monthlyLimit - budget.monthSpend) / 4)}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Daily Rate: {safeWeeklyData ? maskValue(safeWeeklyData.dailySafeSpend) : maskValue(66.67)}</span>
              <span>{safeWeeklyData?.remainingDaysInMonth || 24}d left in mo</span>
            </div>
          </div>

          {/* Card 4: Liquid Runway */}
          <div className="bento-card p-4 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Operating Runway</span>
              <span className="text-[10px] text-indigo-400">Burn Forecast</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-white mb-1.5">
              {analytics.runwayDays > 365 ? '1+ Year' : `${analytics.runwayDays} Days`}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Burn: {maskValue(analytics.dailyBurnRate)}/day</span>
              <span className={anomaliesData.length > 0 ? "text-amber-400 font-semibold" : "text-emerald-400"}>
                {anomaliesData.length > 0 ? `${anomaliesData.length} Anomaly Alerts` : 'Zero Anomalies'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 px-6 border-b border-white/[0.06] bg-black/20 text-xs font-medium overflow-x-auto">
        {[
          { id: 'accounts', label: 'Vaults & Accounts', icon: CreditCard },
          { id: 'budget', label: 'Guardian Sentinel', icon: ShieldAlert },
          { id: 'projections', label: 'Forecasting & What-If', icon: TrendingUp },
          { id: 'subscriptions', label: 'Recurring & Subscriptions', icon: Layers },
          { id: 'advisor', label: 'Category Analytics', icon: Sparkles },
          { id: 'ledger', label: 'Ledger & Statement Import', icon: FileText }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-3.5 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                isActive 
                  ? 'border-indigo-500 text-white font-semibold bg-white/[0.02]' 
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.01]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 p-6 overflow-y-auto">

        {/* TAB 1: ACCOUNTS & CARDS */}
        {activeTab === 'accounts' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Connected Financial Vaults</h3>
                <p className="text-xs text-slate-400">Real-time balances across checking, savings, UPI wallets, and petty reserves</p>
              </div>
              <button
                onClick={() => setShowAddAccountModal(true)}
                className="px-3 py-1.5 rounded-xl border border-white/[0.08] hover:border-white/[0.2] bg-white/[0.04] text-xs text-slate-200 flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                <span>Add Account</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map(acc => (
                <div 
                  key={acc.id} 
                  className="p-5 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-transparent hover:border-white/[0.18] transition-all relative overflow-hidden group shadow-lg"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${
                        acc.type === 'bank' ? 'bg-blue-600/30 border border-blue-500/40 text-blue-400' :
                        acc.type === 'savings' ? 'bg-emerald-600/30 border border-emerald-500/40 text-emerald-400' :
                        acc.type === 'wallet' ? 'bg-purple-600/30 border border-purple-500/40 text-purple-400' :
                        acc.type === 'credit' ? 'bg-zinc-700/40 border border-zinc-500/40 text-zinc-300' :
                        'bg-amber-600/30 border border-amber-500/40 text-amber-400'
                      }`}>
                        {acc.type === 'bank' ? <Building className="w-4 h-4" /> :
                         acc.type === 'savings' ? <Coins className="w-4 h-4" /> :
                         acc.type === 'wallet' ? <Smartphone className="w-4 h-4" /> :
                         <CreditCard className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white tracking-tight">{acc.name}</h4>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">{acc.institution || acc.type}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.06] text-slate-300 border border-white/[0.08]">
                      {acc.type.toUpperCase()}
                    </span>
                  </div>

                  <div className="mb-2">
                    <span className="text-xs text-slate-400 block mb-0.5">Current Balance</span>
                    <span className="text-2xl font-bold text-white tracking-tight">
                      {maskValue(acc.balance)}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
                    <span>Account ID: {acc.id}</span>
                    <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: GUARDIAN SENTINEL & ALERTS */}
        {activeTab === 'budget' && (
          <div className="flex flex-col gap-6 max-w-4xl">
            {/* Guardian Status Hero */}
            <div className="bento-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border-indigo-500/30 bg-indigo-950/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Autonomous Guardian Sentinel</h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Real-time breach monitoring. If spend exceeds 85% ({maskValue(budget.monthlyLimit * 0.85)}), automated advisory alerts are dispatched.
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    <span>Configured Guardian: <strong className="text-white">{budget.guardianName}</strong></span>
                    <span>•</span>
                    <span>Channel: <strong className="text-white">{budget.guardianPhone} ({budget.guardianPlatform?.toUpperCase()})</strong></span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleTestGuardianAlert}
                disabled={testingAlert}
                className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] text-xs font-semibold text-white flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer"
              >
                {testingAlert ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 text-sky-400" />}
                <span>Test Guardian Message</span>
              </button>
            </div>

            {/* Anomalies & Sentinel Alert Feed */}
            {anomaliesData.length > 0 && (
              <div className="bento-card p-5 border-amber-500/40 bg-amber-950/20">
                <h4 className="text-sm font-semibold text-amber-300 flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4" />
                  Financial Sentinel Anomaly Detections ({anomaliesData.length})
                </h4>
                <div className="flex flex-col gap-2">
                  {anomaliesData.map((anom, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-black/40 border border-amber-500/20 flex items-start justify-between gap-3 text-xs">
                      <div>
                        <span className="font-semibold text-white">{anom.type.replace('_', ' ').toUpperCase()}</span>
                        <p className="text-slate-300 mt-0.5">{anom.message}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        anom.severity === 'high' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}>
                        {anom.severity.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Budget Configuration Card */}
            <div className="bento-card p-6 flex flex-col gap-4">
              <h4 className="text-sm font-semibold text-white">Monthly Allowance & Thresholds</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Monthly Spending Cap ({curr})</label>
                  <input
                    type="number"
                    value={budget.monthlyLimit}
                    onChange={(e) => handleUpdateBudget(e.target.value)}
                    className="w-full bg-slate-900/90 border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">Configured Pocket Money: ₹2,000 / month</span>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Alert Threshold Warning</label>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-sm font-semibold text-amber-400">{budget.alertThresholdPercent || 85}%</span>
                    <div className="flex-1 bg-slate-800 rounded-full h-2">
                      <div className="bg-amber-400 h-full rounded-full" style={{ width: `${budget.alertThresholdPercent || 85}%` }} />
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">HUD warning triggers at {maskValue((budget.monthlyLimit * (budget.alertThresholdPercent || 85)) / 100)}</span>
                </div>
              </div>
            </div>

            {/* Alerts History Table */}
            <div className="bento-card p-6">
              <h4 className="text-sm font-semibold text-white mb-3">Guardian Alert Event Log</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-white/[0.06]">
                    <tr>
                      <th className="py-2">Timestamp</th>
                      <th className="py-2">Event</th>
                      <th className="py-2">Recipient</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {(budget.alertsHistory || []).map(alt => (
                      <tr key={alt.id} className="hover:bg-white/[0.02]">
                        <td className="py-2.5 text-slate-400">{new Date(alt.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                        <td className="py-2.5 text-slate-200">{alt.message}</td>
                        <td className="py-2.5 text-slate-400">{alt.deliveredTo}</td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            {alt.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {(!budget.alertsHistory || budget.alertsHistory.length === 0) && (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-500">No breach alerts logged yet. Clean record!</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FORECASTING & WHAT-IF SIMULATOR */}
        {activeTab === 'projections' && (
          <div className="flex flex-col gap-6 max-w-4xl">
            {/* Multi-Horizon Projections */}
            <div className="bento-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                    Multi-Horizon Balance Forecast
                  </h4>
                  <p className="text-xs text-slate-400">Mathematical estimates across 1-Month, 3-Month, 6-Month, 1-Year, 3-Year, 5-Year horizons</p>
                </div>
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300">
                  Historical Net: {maskValue(forecastData?.monthlyNetSavings || 0)}/mo
                </span>
              </div>

              {forecastData?.horizons ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {Object.entries(forecastData.horizons).map(([key, h]) => (
                    <div key={key} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center flex flex-col justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{h.label}</span>
                      <div className="my-2">
                        <span className="text-xs text-slate-500 block">Base</span>
                        <span className="text-sm font-bold text-white">{maskValue(h.baseProjectedBalance)}</span>
                      </div>
                      <div className="pt-2 border-t border-white/[0.04] text-[10px] flex justify-between text-slate-400">
                        <span className="text-amber-400/80">Con: {maskValue(h.conservativeBalance)}</span>
                        <span className="text-emerald-400/80">Opt: {maskValue(h.optimisticBalance)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 text-xs">Computing projection vectors...</div>
              )}

              <p className="text-[10px] text-zinc-500 mt-4 italic">
                * Note: Projections are strictly mathematical estimates computed from current cash-flow burn and do not guarantee future financial market performance.
              </p>
            </div>

            {/* Interactive What-If Scenario Simulator */}
            <div className="bento-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-purple-400" />
                    "What-If" Scenario Simulation Engine
                  </h4>
                  <p className="text-xs text-slate-400">Simulate financial decisions and test impact on runway and future liquid reserves</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Income Shift (%)</label>
                  <input
                    type="number"
                    value={whatIfParams.incomeChangePercent}
                    onChange={(e) => setWhatIfParams({ ...whatIfParams, incomeChangePercent: Number(e.target.value) })}
                    placeholder="e.g. +20 or -10"
                    className="w-full bg-slate-900 border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">e.g. +20% raise</span>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Expense Shift (%)</label>
                  <input
                    type="number"
                    value={whatIfParams.expenseChangePercent}
                    onChange={(e) => setWhatIfParams({ ...whatIfParams, expenseChangePercent: Number(e.target.value) })}
                    placeholder="e.g. -15 or +10"
                    className="w-full bg-slate-900 border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">e.g. -15% budget cut</span>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Extra Monthly Savings ({curr})</label>
                  <input
                    type="number"
                    value={whatIfParams.extraMonthlySavings}
                    onChange={(e) => setWhatIfParams({ ...whatIfParams, extraMonthlySavings: Number(e.target.value) })}
                    placeholder="e.g. 500"
                    className="w-full bg-slate-900 border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Recurring SIP / Vault deposit</span>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">One-Time Big Purchase ({curr})</label>
                  <input
                    type="number"
                    value={whatIfParams.oneTimePurchase}
                    onChange={(e) => setWhatIfParams({ ...whatIfParams, oneTimePurchase: Number(e.target.value) })}
                    placeholder="e.g. 8000"
                    className="w-full bg-slate-900 border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">e.g. Laptop, Phone, Course</span>
                </div>
              </div>

              <div className="flex justify-end mb-4">
                <button
                  onClick={handleRunWhatIf}
                  disabled={simulating}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-purple-600/20 cursor-pointer"
                >
                  {simulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Simulate Scenario</span>
                </button>
              </div>

              {/* Simulation Result Output */}
              {whatIfResult && (
                <div className={`p-4 rounded-xl border ${whatIfResult.feasible ? 'bg-indigo-950/30 border-indigo-500/30' : 'bg-rose-950/30 border-rose-500/30'} flex flex-col gap-3 animate-in fade-in`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{whatIfResult.simulationSummary}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${whatIfResult.feasible ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                      {whatIfResult.feasible ? 'FEASIBLE' : 'SHORTFALL RISK'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">{whatIfResult.impactStatement}</p>

                  <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/[0.06] text-center text-xs">
                    <div className="p-2 rounded-lg bg-black/30">
                      <span className="text-slate-400 block text-[10px]">3-Month Reserve</span>
                      <strong className="text-white">{maskValue(whatIfResult.projectedBalances?.m3)}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-black/30">
                      <span className="text-slate-400 block text-[10px]">6-Month Reserve</span>
                      <strong className="text-white">{maskValue(whatIfResult.projectedBalances?.m6)}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-black/30">
                      <span className="text-slate-400 block text-[10px]">1-Year Reserve</span>
                      <strong className="text-white">{maskValue(whatIfResult.projectedBalances?.y1)}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: RECURRING & SUBSCRIPTIONS */}
        {activeTab === 'subscriptions' && (
          <div className="flex flex-col gap-6 max-w-4xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-400" />
                  Subscriptions & Recurring Commitments
                </h3>
                <p className="text-xs text-slate-400">Autonomous detection of recurring bills, streaming, software, and services</p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300">
                Total Monthly: {maskValue(subscriptionsData?.reduce((acc, s) => acc + (s.monthlyCost || 0), 0) || 0)}
              </span>
            </div>

            {subscriptionsData && subscriptionsData.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {subscriptionsData.map((sub, idx) => (
                  <div key={idx} className="bento-card p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white capitalize">{sub.name}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-300">
                          {sub.frequency.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-xl font-bold text-slate-100 mb-1">
                        {maskValue(sub.amount)}
                      </div>
                      <p className="text-[11px] text-slate-400">Detected from {sub.occurrenceCount} historical recurring charges</p>
                    </div>
                    <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-slate-400 mt-3">
                      <span>Annual impact: {maskValue(sub.monthlyCost * 12)}</span>
                      <span className="text-emerald-400 font-semibold">Active</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bento-card p-8 text-center text-slate-400 text-xs">
                <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <span>No recurring subscription patterns detected yet. Log or import recurring bills (Netflix, Spotify, Wifi, Cloud) to track subscriptions.</span>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: CATEGORY ANALYTICS */}
        {activeTab === 'advisor' && (
          <div className="flex flex-col gap-6 max-w-4xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-purple-400" />
                  Standard 12-Category Financial Breakdown
                </h3>
                <p className="text-xs text-slate-400">Classified autonomously into Food, Transport, Shopping, Bills, Subscriptions, Health, etc.</p>
              </div>
            </div>

            {/* Category Breakdown Bars */}
            <div className="bento-card p-6">
              <h4 className="text-sm font-semibold text-white mb-4">Expenditure by Category</h4>
              <div className="flex flex-col gap-3">
                {(analytics.categoryBreakdown || []).map(cat => (
                  <div key={cat.name} className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">{cat.name}</span>
                      <span className="text-slate-400">{maskValue(cat.amount)} ({cat.percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-indigo-500 h-full rounded-full" 
                        style={{ width: `${Math.min(100, cat.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
                {(!analytics.categoryBreakdown || analytics.categoryBreakdown.length === 0) && (
                  <span className="text-xs text-slate-500 py-3 text-center">No expenditure entries categorized yet.</span>
                )}
              </div>
            </div>

            {/* High Impact AI Advice */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(analytics.recommendations || []).map(rec => (
                <div key={rec.id} className="bento-card p-5 flex flex-col justify-between border-white/[0.08] hover:border-purple-500/30 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-purple-300">{rec.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                        {rec.impact}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{rec.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: LEDGER RECORDS & STATEMENT IMPORT */}
        {activeTab === 'ledger' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Transaction Ledger & Learning Hub</h3>
                <p className="text-xs text-slate-400">All historical incomes, expenses, and category corrections</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="px-3 py-1.5 rounded-xl border border-white/[0.08] hover:bg-white/[0.06] text-white text-xs font-medium flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5 text-purple-400" />
                  <span>Import Statement</span>
                </button>
                <button
                  onClick={() => setShowAddTxModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Transaction</span>
                </button>
              </div>
            </div>

            <div className="bento-card p-4 overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-white/[0.06]">
                  <tr>
                    <th className="py-2">Date</th>
                    <th className="py-2">Description / Merchant</th>
                    <th className="py-2">Category (Click to Learn)</th>
                    <th className="py-2">Type</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 text-slate-400 whitespace-nowrap">
                        {new Date(tx.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-3">
                        <span className="font-semibold text-slate-100 block">{tx.description}</span>
                        {tx.merchant && tx.merchant !== tx.description && (
                          <span className="text-[10px] text-slate-500">{tx.merchant}</span>
                        )}
                      </td>
                      <td className="py-3">
                        {/* Interactive Category Selector with Adaptive Learning */}
                        <select
                          value={tx.category || 'Other'}
                          onChange={(e) => handleCorrectCategory(tx.merchant || tx.description, e.target.value)}
                          className="bg-slate-900 border border-white/[0.1] rounded-lg px-2 py-1 text-[11px] text-indigo-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                          title="Change category to train JASPER's auto-categorizer"
                        >
                          {STANDARD_CATEGORIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          tx.type === 'income' 
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                            : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                        }`}>
                          {tx.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 font-semibold text-white">
                        <span className={tx.type === 'income' ? 'text-emerald-400' : 'text-slate-100'}>
                          {tx.type === 'income' ? '+' : '-'}{maskValue(tx.amount)}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleDeleteTx(tx.id)}
                          className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                          title="Revert transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No transactions found in ledger. Import a bank CSV or log a record above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* --- MODAL: STATEMENT IMPORT --- */}
      {showImportModal && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bento-card max-w-lg w-full p-6 bg-slate-950 border border-white/[0.1] shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-purple-400" />
                Import Bank / UPI Statement
              </h3>
              <button 
                onClick={() => setShowImportModal(false)}
                className="text-slate-500 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-3">
              Paste rows from your bank CSV or export statement. JASPER will parse dates, amounts, and auto-categorize each line into standard financial areas.
            </p>

            <form onSubmit={handleImportStatement} className="flex flex-col gap-3.5">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Target Account</label>
                <select
                  value={importAccountId}
                  onChange={(e) => setImportAccountId(e.target.value)}
                  className="w-full bg-slate-900 border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({maskValue(a.balance)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  CSV Statement Content (Date, Description, Amount, Type, Merchant)
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder={`2026-10-01, Swiggy Food Order, 320, expense, Swiggy\n2026-10-02, Monthly Pocket Money, 2000, income, Allowance\n2026-10-03, Uber Ride to College, 150, expense, Uber\n2026-10-04, Netflix Subscription, 499, expense, Netflix`}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className="w-full bg-slate-900 border border-white/[0.1] rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-2 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importing}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 flex items-center gap-2 cursor-pointer"
                >
                  {importing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <span>Parse & Import Statement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: LOG TRANSACTION --- */}
      {showAddTxModal && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bento-card max-w-md w-full p-6 bg-slate-950 border border-white/[0.1] shadow-2xl relative">
            <h3 className="text-base font-bold text-white mb-4">Log New Financial Record</h3>
            <form onSubmit={handleAddTransaction} className="flex flex-col gap-3.5">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTxForm({ ...txForm, type: 'expense' })}
                    className={`py-2 text-xs rounded-xl font-semibold border ${
                      txForm.type === 'expense' ? 'bg-rose-600 text-white border-rose-500' : 'bg-slate-900 text-slate-400 border-white/[0.08]'
                    }`}
                  >
                    Expense (Debit)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxForm({ ...txForm, type: 'income' })}
                    className={`py-2 text-xs rounded-xl font-semibold border ${
                      txForm.type === 'income' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-900 text-slate-400 border-white/[0.08]'
                    }`}
                  >
                    Income (Credit)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Amount ({curr})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={txForm.amount}
                  onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                  className="w-full bg-slate-900 border border-white/[0.1] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Target Account</label>
                <select
                  value={txForm.accountId}
                  onChange={(e) => setTxForm({ ...txForm, accountId: e.target.value })}
                  className="w-full bg-slate-900 border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({maskValue(a.balance)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Description / Merchant</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Swiggy Lunch, Metro recharge, Books"
                  value={txForm.description}
                  onChange={(e) => setTxForm({ ...txForm, description: e.target.value, merchant: e.target.value })}
                  className="w-full bg-slate-900 border border-white/[0.1] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Category</label>
                <select
                  value={txForm.category}
                  onChange={(e) => setTxForm({ ...txForm, category: e.target.value })}
                  className="w-full bg-slate-900 border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {STANDARD_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end mt-3">
                <button
                  type="button"
                  onClick={() => setShowAddTxModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: ADD ACCOUNT --- */}
      {showAddAccountModal && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bento-card max-w-md w-full p-6 bg-slate-950 border border-white/[0.1] shadow-2xl relative">
            <h3 className="text-base font-bold text-white mb-4">Add Financial Account</h3>
            <form onSubmit={handleAddAccount} className="flex flex-col gap-3.5">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Account Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Bank, GPay UPI, Petty Cash"
                  value={accountForm.name}
                  onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                  className="w-full bg-slate-900 border border-white/[0.1] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Account Type</label>
                <select
                  value={accountForm.type}
                  onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value })}
                  className="w-full bg-slate-900 border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="bank">Bank Checking / Savings</option>
                  <option value="savings">Savings Vault</option>
                  <option value="wallet">Digital Wallet / UPI</option>
                  <option value="credit">Credit Card</option>
                  <option value="cash">Petty Cash</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Initial Balance ({curr})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={accountForm.balance}
                  onChange={(e) => setAccountForm({ ...accountForm, balance: e.target.value })}
                  className="w-full bg-slate-900 border border-white/[0.1] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Institution / Issuer</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC, SBI, Google Pay"
                  value={accountForm.institution}
                  onChange={(e) => setAccountForm({ ...accountForm, institution: e.target.value })}
                  className="w-full bg-slate-900 border border-white/[0.1] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-2 justify-end mt-3">
                <button
                  type="button"
                  onClick={() => setShowAddAccountModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: INTERNAL TRANSFER --- */}
      {showTransferModal && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bento-card max-w-md w-full p-6 bg-slate-950 border border-white/[0.1] shadow-2xl relative">
            <h3 className="text-base font-bold text-white mb-4">Transfer Between Accounts</h3>
            <form onSubmit={handleTransfer} className="flex flex-col gap-3.5">
              <div>
                <label className="text-xs text-slate-400 block mb-1">From Account (Source)</label>
                <select
                  value={transferForm.fromAccountId}
                  onChange={(e) => setTransferForm({ ...transferForm, fromAccountId: e.target.value })}
                  className="w-full bg-slate-900 border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({maskValue(a.balance)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">To Account (Destination)</label>
                <select
                  value={transferForm.toAccountId}
                  onChange={(e) => setTransferForm({ ...transferForm, toAccountId: e.target.value })}
                  className="w-full bg-slate-900 border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({maskValue(a.balance)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Transfer Amount ({curr})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                  className="w-full bg-slate-900 border border-white/[0.1] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-2 justify-end mt-3">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30"
                >
                  Execute Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
