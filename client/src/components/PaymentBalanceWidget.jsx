import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, CreditCard, ArrowUpRight, ArrowDownLeft, RefreshCw, Eye, EyeOff, 
  ShieldAlert, TrendingUp, AlertTriangle, CheckCircle2, DollarSign, Send, 
  Plus, Trash2, ArrowLeftRight, Clock, Sparkles, PieChart, ShieldCheck, 
  ChevronRight, Smartphone, Building, Coins, AlertCircle, FileText
} from 'lucide-react';
import { getApiBase } from '../utils/apiConfig.js';

export default function PaymentBalanceWidget({ onClose }) {
  const [financeData, setFinanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('accounts'); // 'accounts' | 'budget' | 'projections' | 'advisor' | 'ledger'
  const [privacyMask, setPrivacyMask] = useState(false);
  const [notification, setNotification] = useState(null);

  // Modals inside widget
  const [showAddTxModal, setShowAddTxModal] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [testingAlert, setTestingAlert] = useState(false);

  // Form states
  const [txForm, setTxForm] = useState({
    amount: '',
    type: 'expense',
    category: 'Food & Dining',
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
    currency: '$'
  });

  const [transferForm, setTransferForm] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    description: 'Internal Transfer'
  });

  // What-If Simulator state
  const [simulatorCutPercent, setSimulatorCutPercent] = useState(15);

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
        }
      }
    } catch (err) {
      console.error('[Finance Widget] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinance();
    const interval = setInterval(fetchFinance, 10000);
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

  const maskValue = (val) => {
    if (privacyMask) return '••••••';
    const num = Number(val) || 0;
    const curr = financeData?.settings?.defaultCurrency || '$';
    return `${curr}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
        showToast(`Transaction logged (${financeData?.settings?.defaultCurrency || '$'}${txForm.amount})`);
        setShowAddTxModal(false);
        setTxForm({
          amount: '',
          type: 'expense',
          category: 'Food & Dining',
          description: '',
          accountId: financeData?.accounts[0]?.id || '',
          merchant: ''
        });
        fetchFinance();
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
        body: JSON.stringify(accountForm)
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Account "${accountForm.name}" created`);
        setShowAddAccountModal(false);
        setAccountForm({ name: '', type: 'bank', balance: '', limit: '2500', institution: '', currency: '$' });
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
    } catch (err) {
      showToast('Failed to delete transaction', 'error');
    }
  };

  // Test Guardian Alert
  const handleTestGuardianAlert = async () => {
    setTestingAlert(true);
    try {
      const res = await fetch(`${getApiBase()}/api/finance/guardian-alert/test`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(`Guardian Alert dispatched to ${financeData?.budget?.guardianName || 'Guardian'}!`);
        fetchFinance();
      }
    } catch (err) {
      showToast('Guardian alert dispatch error', 'error');
    } finally {
      setTestingAlert(false);
    }
  };

  // Update Budget Limit
  const handleUpdateBudget = async (newLimit) => {
    try {
      await fetch(`${getApiBase()}/api/finance/budget`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlyLimit: Number(newLimit) })
      });
      fetchFinance();
    } catch (_) {}
  };

  const accounts = financeData?.accounts || [];
  const budget = financeData?.budget || { monthlyLimit: 500, monthSpend: 0, percentSpent: 0, state: 'safe' };
  const analytics = financeData?.analytics || { liquidBalance: 0, creditUsed: 0, netWorth: 0, dailyBurnRate: 18.5, runwayDays: 90 };
  const transactions = financeData?.transactions || [];

  return (
    <div className="w-full h-full flex flex-col bg-slate-950/85 text-slate-100 rounded-2xl overflow-hidden backdrop-blur-2xl border border-white/[0.08] shadow-2xl relative select-none">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`absolute top-4 right-4 z-50 px-4 py-2 rounded-xl text-xs font-medium shadow-xl flex items-center gap-2 border transition-all animate-in fade-in slide-in-from-top-2 ${
          notification.type === 'error' ? 'bg-rose-950/90 border-rose-500/40 text-rose-200' : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
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
                <h1 className="text-lg font-bold text-slate-100 tracking-tight">JASPER Pay Vault & Guardian Hub</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Live Synced
                </span>
              </div>
              <p className="text-xs text-slate-400">Autonomous Multi-Account Liquidity & Guardian Budget Sentinel</p>
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

        {/* 3 Core Bento Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
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
            {/* Progress bar */}
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
              <span>Guardian: {budget.guardianName} ({budget.guardianPlatform?.toUpperCase()})</span>
            </div>
          </div>

          {/* Card 3: Liquid Runway & Burn Rate */}
          <div className="bento-card p-4 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Financial Runway</span>
              <span className="text-[10px] text-sky-400">Burn Forecast</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-sky-300 mb-1.5 flex items-baseline gap-1">
              <span>{analytics.runwayDays}</span>
              <span className="text-xs font-normal text-slate-400">Days Remaining</span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Burn: ~{maskValue(analytics.dailyBurnRate)}/day</span>
              <span className="text-emerald-400 font-medium">+30d: {maskValue(analytics.projections?.d30)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 px-6 border-b border-white/[0.06] bg-black/20 text-xs font-medium">
        {[
          { id: 'accounts', label: 'Accounts & Cards', icon: CreditCard },
          { id: 'budget', label: 'Guardian Sentinel', icon: ShieldAlert },
          { id: 'projections', label: 'Runway & Trajectory', icon: TrendingUp },
          { id: 'advisor', label: 'AI Savings Strategist', icon: Sparkles },
          { id: 'ledger', label: 'Ledger Records', icon: FileText }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-3.5 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
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
                <p className="text-xs text-slate-400">Real-time balances across checking, high-yield reserves, wallets, and credit cards</p>
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
              {accounts.map(acc => {
                const isCredit = acc.type === 'credit';
                return (
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
                          {acc.type === 'bank' && <Building className="w-4 h-4" />}
                          {acc.type === 'savings' && <Wallet className="w-4 h-4" />}
                          {acc.type === 'wallet' && <Smartphone className="w-4 h-4" />}
                          {acc.type === 'credit' && <CreditCard className="w-4 h-4" />}
                          {acc.type === 'cash' && <Coins className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">{acc.name}</div>
                          <div className="text-[11px] text-slate-400">{acc.institution}</div>
                        </div>
                      </div>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/[0.05] text-slate-400 border border-white/[0.06]">
                        {acc.type}
                      </span>
                    </div>

                    <div className="mb-3">
                      <div className="text-xs text-slate-400 mb-0.5">
                        {isCredit ? 'Current Balance (Owed)' : 'Available Balance'}
                      </div>
                      <div className="text-2xl font-bold tracking-tight text-white">
                        {maskValue(acc.balance)}
                      </div>
                    </div>

                    {isCredit && (
                      <div className="pt-2 border-t border-white/[0.06]">
                        <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                          <span>Limit: {maskValue(acc.limit)}</span>
                          <span>{Math.round(((acc.balance || 0) / (acc.limit || 1)) * 100)}% used</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                          <div 
                            className="bg-amber-400 h-full"
                            style={{ width: `${Math.min(100, ((acc.balance || 0) / (acc.limit || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: GUARDIAN SENTINEL & BUDGET */}
        {activeTab === 'budget' && (
          <div className="flex flex-col gap-6 max-w-4xl">
            {/* Guardian Alert Banner */}
            <div className={`p-5 rounded-2xl border ${
              budget.state === 'breached' 
                ? 'bg-rose-950/30 border-rose-500/50' 
                : 'bg-indigo-950/20 border-indigo-500/30'
            } flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}>
              <div className="flex items-start gap-3.5">
                <div className={`p-3 rounded-2xl ${budget.state === 'breached' ? 'bg-rose-500/20 text-rose-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Autonomous Guardian Protection Protocol</h4>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                    If monthly spending breaches your limit (<span className="text-white font-medium">{maskValue(budget.monthlyLimit)}</span>), 
                    JASPER autonomously dispatches an alert message to your guardian via WhatsApp or SMS.
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    <span>Guardian: <strong className="text-white">{budget.guardianName}</strong></span>
                    <span>•</span>
                    <span>Channel: <strong className="text-white">{budget.guardianPhone} ({budget.guardianPlatform?.toUpperCase()})</strong></span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleTestGuardianAlert}
                disabled={testingAlert}
                className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] text-xs font-semibold text-white flex items-center gap-2 whitespace-nowrap transition-all"
              >
                {testingAlert ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 text-sky-400" />}
                <span>Test Guardian Message</span>
              </button>
            </div>

            {/* Budget Configuration Card */}
            <div className="bento-card p-6 flex flex-col gap-4">
              <h4 className="text-sm font-semibold text-white">Monthly Allowance & Thresholds</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Monthly Spending Cap ({financeData?.settings?.defaultCurrency || '$'})</label>
                  <input
                    type="number"
                    value={budget.monthlyLimit}
                    onChange={(e) => handleUpdateBudget(e.target.value)}
                    className="w-full bg-slate-900/90 border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">Adjusts live threshold calculations</span>
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

        {/* TAB 3: RUNWAY & PROJECTIONS */}
        {activeTab === 'projections' && (
          <div className="flex flex-col gap-6 max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bento-card p-5">
                <div className="text-xs text-slate-400 mb-1">Estimated Liquid Runway</div>
                <div className="text-3xl font-bold text-sky-400">{analytics.runwayDays} Days</div>
                <div className="text-[11px] text-slate-500 mt-1">Before liquid capital reaches $0 at current burn</div>
              </div>

              <div className="bento-card p-5">
                <div className="text-xs text-slate-400 mb-1">Average Daily Burn</div>
                <div className="text-3xl font-bold text-rose-400">{maskValue(analytics.dailyBurnRate)}</div>
                <div className="text-[11px] text-slate-500 mt-1">Calculated over current month expenditures</div>
              </div>

              <div className="bento-card p-5">
                <div className="text-xs text-slate-400 mb-1">30-Day Projected Reserve</div>
                <div className="text-3xl font-bold text-emerald-400">{maskValue(analytics.projections?.d30)}</div>
                <div className="text-[11px] text-slate-500 mt-1">Expected balance based on net cash flow</div>
              </div>
            </div>

            {/* Trajectory Bar Visualizer */}
            <div className="bento-card p-6">
              <h4 className="text-sm font-semibold text-white mb-4">Trajectory Forecast (30, 60, 90 Days)</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="text-xs text-slate-400 mb-1">Day 30</div>
                  <div className="text-lg font-bold text-white mb-2">{maskValue(analytics.projections?.d30)}</div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div className="bg-sky-500 h-full rounded-full" style={{ width: '85%' }} />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="text-xs text-slate-400 mb-1">Day 60</div>
                  <div className="text-lg font-bold text-white mb-2">{maskValue(analytics.projections?.d60)}</div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: '70%' }} />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="text-xs text-slate-400 mb-1">Day 90</div>
                  <div className="text-lg font-bold text-white mb-2">{maskValue(analytics.projections?.d90)}</div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '60%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* What-If Savings Simulator */}
            <div className="bento-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-semibold text-white">"What-If" Expense Optimization Simulator</h4>
                  <p className="text-xs text-slate-400">See how much your runway extends if you reduce discretionary spending</p>
                </div>
                <span className="text-xs font-bold text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  Cut {simulatorCutPercent}% Spend
                </span>
              </div>

              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={simulatorCutPercent}
                onChange={(e) => setSimulatorCutPercent(Number(e.target.value))}
                className="w-full accent-indigo-500 h-2 bg-slate-800 rounded-lg cursor-pointer mb-3"
              />

              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-slate-300 flex items-center justify-between">
                <span>
                  By cutting discretionary spending by {simulatorCutPercent}%, you save approximately{' '}
                  <strong className="text-emerald-400">{maskValue(analytics.dailyBurnRate * 30 * (simulatorCutPercent / 100))}/month</strong>.
                </span>
                <span className="text-sky-300 font-semibold">
                  + {Math.round(analytics.runwayDays * (simulatorCutPercent / 100))} Extra Runway Days
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: AI SAVINGS STRATEGIST */}
        {activeTab === 'advisor' && (
          <div className="flex flex-col gap-6 max-w-4xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  JASPER AI Financial Intelligence
                </h3>
                <p className="text-xs text-slate-400">Personalized, data-backed recommendations based on your transaction history</p>
              </div>
            </div>

            {/* High Impact Recommendations */}
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

            {/* Category Breakdown Bars */}
            <div className="bento-card p-6">
              <h4 className="text-sm font-semibold text-white mb-4">Spending by Category</h4>
              <div className="flex flex-col gap-3">
                {(analytics.categoryBreakdown || []).map(cat => (
                  <div key={cat.name} className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">{cat.name}</span>
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
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: LEDGER & TRANSACTIONS */}
        {activeTab === 'ledger' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Transaction Ledger</h3>
                <p className="text-xs text-slate-400">All historical incomes, expenses, and account transfers</p>
              </div>
              <button
                onClick={() => setShowAddTxModal(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Transaction</span>
              </button>
            </div>

            <div className="bento-card p-4 overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-white/[0.06]">
                  <tr>
                    <th className="py-2">Date</th>
                    <th className="py-2">Description</th>
                    <th className="py-2">Category</th>
                    <th className="py-2">Type</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {transactions.map(tx => {
                    const isIncome = tx.type === 'income';
                    const isTransfer = tx.type === 'transfer';
                    return (
                      <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 text-slate-400">{new Date(tx.date).toLocaleDateString()}</td>
                        <td className="py-2.5 font-medium text-white">{tx.description}</td>
                        <td className="py-2.5 text-slate-400">{tx.category}</td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isIncome 
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                              : isTransfer 
                                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30' 
                                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className={`py-2.5 font-bold ${isIncome ? 'text-emerald-400' : isTransfer ? 'text-sky-400' : 'text-slate-100'}`}>
                          {isIncome ? '+' : isTransfer ? '⇄ ' : '-'}{maskValue(tx.amount)}
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => handleDeleteTx(tx.id)}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Revert & delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* --- MODAL: ADD TRANSACTION --- */}
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
                <label className="text-xs text-slate-400 block mb-1">Amount ({financeData?.settings?.defaultCurrency || '$'})</label>
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
                <label className="text-xs text-slate-400 block mb-1">Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dinner, Rent, Salary deposit"
                  value={txForm.description}
                  onChange={(e) => setTxForm({ ...txForm, description: e.target.value })}
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
                  {['Food & Dining', 'Software & Tech', 'Utilities', 'Transportation', 'Salary / Income', 'Shopping', 'Health & Fitness', 'General'].map(c => (
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
                  placeholder="e.g. Chase Checking, Apple Pay, Cash"
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
                  <option value="bank">Bank Checking</option>
                  <option value="savings">Savings Vault</option>
                  <option value="wallet">Digital Wallet / UPI</option>
                  <option value="credit">Credit Card</option>
                  <option value="cash">Petty Cash</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Initial Balance</label>
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

              {accountForm.type === 'credit' && (
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Total Credit Limit</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="3000.00"
                    value={accountForm.limit}
                    onChange={(e) => setAccountForm({ ...accountForm, limit: e.target.value })}
                    className="w-full bg-slate-900 border border-white/[0.1] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-slate-400 block mb-1">Institution / Issuer</label>
                <input
                  type="text"
                  placeholder="e.g. Chase, Apple, Barclays"
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
                <label className="text-xs text-slate-400 block mb-1">Transfer Amount ({financeData?.settings?.defaultCurrency || '$'})</label>
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
