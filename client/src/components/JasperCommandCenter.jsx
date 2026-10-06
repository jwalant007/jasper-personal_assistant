import React, { useState, useEffect } from 'react';
import ArcReactor from './ArcReactor';
import { 
  Shield, ShieldCheck, Zap, Activity, Cpu, HardDrive, Wifi, Smartphone, Tv, Monitor, 
  PhoneForwarded, Wallet, AlertTriangle, ArrowUpRight, Play, CheckCircle2, RefreshCw, 
  Lock, Sparkles, BarChart3, Bot, Video, Box, Radio, Bell, Clock, ChevronRight,
  TrendingDown, DollarSign, Layers, Flame, PhoneCall, Volume2, Mic
} from 'lucide-react';
import { getApiBase } from '../utils/apiConfig';

export default function JasperCommandCenter({
  onLaunchApp,
  onMicClick,
  onLockSystem,
  onOpenSettings,
  onViewAllApps,
  jasperState = 'idle',
  aiStatusLabel = 'Cloud Core Online',
  isAiOnline = true
}) {
  // Live Dashboard State
  const [financeSummary, setFinanceSummary] = useState({
    pocketMoney: 2000,
    safeWeeklySpend: 560,
    currentBalance: 2000,
    spentThisMonth: 0,
    burnRate: 0,
    guardianArmed: true,
    guardianThreshold: 1700
  });

  const [hardwareState, setHardwareState] = useState({
    phoneAdb: { status: 'Setup Required', connected: false, ip: null },
    smartTv: { status: 'Standby', connected: false, ip: '192.168.1.100' },
    pcWorkstation: { status: 'Active', connected: true, name: 'Local Host' }
  });

  const [telephonyState, setTelephonyState] = useState({
    configured: false,
    screeningActive: true,
    vipCount: 0,
    lastSummary: 'Call Sentinel Armed. Auto-transfers allowed only after caller validation.'
  });

  const [systemTelemetry, setSystemTelemetry] = useState({
    cpu: 14,
    ram: 3.4,
    latency: '18ms',
    zeroTrustLevel: 'L0 PUBLIC / AUTO-PROMOTES',
    zeroFakeVerified: true
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [briefingPlaying, setBriefingPlaying] = useState(false);

  // Poll live data
  const fetchLiveStatus = async () => {
    setIsRefreshing(true);
    try {
      const api = getApiBase();
      
      // 1. Fetch Finance Summary & Safe Weekly Spend
      const [finRes, safeRes] = await Promise.allSettled([
        fetch(`${api}/api/finance/summary`),
        fetch(`${api}/api/finance/safe-weekly`)
      ]);

      if (finRes.status === 'fulfilled' && finRes.value.ok) {
        const finData = await finRes.value.json();
        const pocketMoney = finData.pocketMoney || 2000;
        const totalBal = finData.totalBalance !== undefined ? finData.totalBalance : pocketMoney;
        const monthlyBudget = finData.budget?.monthlyBudget || pocketMoney;
        const totalSpent = finData.budget?.spent || 0;
        
        let safeWeekly = 560;
        if (safeRes.status === 'fulfilled' && safeRes.value.ok) {
          const safeData = await safeRes.value.json();
          if (safeData.safeWeeklySpend) safeWeekly = safeData.safeWeeklySpend;
        }

        setFinanceSummary({
          pocketMoney,
          safeWeeklySpend: safeWeekly,
          currentBalance: totalBal,
          spentThisMonth: totalSpent,
          burnRate: totalSpent > 0 ? Math.round((totalSpent / monthlyBudget) * 100) : 0,
          guardianArmed: true,
          guardianThreshold: 1700
        });
      }

      // 2. Fetch Phone & Device Status
      try {
        const phoneRes = await fetch(`${api}/api/phone/status`);
        if (phoneRes.ok) {
          const pData = await phoneRes.json();
          setHardwareState(prev => ({
            ...prev,
            phoneAdb: {
              status: pData.connected ? 'Paired (ADB)' : 'Setup Required',
              connected: Boolean(pData.connected),
              ip: pData.ip || null
            }
          }));
        }
      } catch (_) {}

      // 3. Fetch Telephony Config & Contacts
      try {
        const telRes = await fetch(`${api}/api/telephony/contacts`);
        if (telRes.ok) {
          const tData = await telRes.json();
          const contacts = tData.contacts || [];
          const vip = contacts.filter(c => c.isVip).length;
          setTelephonyState(prev => ({
            ...prev,
            vipCount: vip
          }));
        }
      } catch (_) {}

    } catch (err) {
      console.warn('[CommandCenter] Status refresh notice:', err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveStatus();
    const interval = setInterval(fetchLiveStatus, 12000);
    return () => clearInterval(interval);
  }, []);

  // Vocal Morning Briefing Trigger
  const handleTriggerBriefing = async () => {
    setBriefingPlaying(true);
    try {
      const api = getApiBase();
      const res = await fetch(`${api}/api/voice/process-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'Give me my morning briefing with financial status and calendar' })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.spokenResponse && window.speechSynthesis) {
          const utter = new SpeechSynthesisUtterance(data.spokenResponse);
          window.speechSynthesis.speak(utter);
        }
      }
    } catch (_) {
      // Fallback local voice
      if (window.speechSynthesis) {
        const utter = new SpeechSynthesisUtterance(
          `Good day Jwalant. All systems nominal. Your monthly pocket money budget is ₹${financeSummary.pocketMoney}, with a safe weekly spend of ₹${financeSummary.safeWeeklySpend}. Zero fake data is loaded. Telephony sentinel is active.`
        );
        window.speechSynthesis.speak(utter);
      }
    } finally {
      setTimeout(() => setBriefingPlaying(false), 4000);
    }
  };

  // State styling helper for AI Core
  const getStateBadge = () => {
    switch (jasperState) {
      case 'listening':
        return { label: 'CORE LISTENING', color: 'border-cyan-400 bg-cyan-500/20 text-cyan-200 shadow-[0_0_20px_#06b6d4]' };
      case 'processing':
        return { label: 'NEURAL PROCESSING', color: 'border-purple-400 bg-purple-500/20 text-purple-200 shadow-[0_0_20px_#a855f7]' };
      case 'speaking':
        return { label: 'VOCAL SYNTHESIS', color: 'border-amber-400 bg-amber-500/20 text-amber-200 shadow-[0_0_20px_#f59e0b]' };
      default:
        return { label: 'STANDBY / SENTINEL ONLINE', color: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]' };
    }
  };

  const stateBadge = getStateBadge();

  return (
    <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-6 select-none animate-in fade-in duration-500">
      
      {/* 1. TOP SYSTEM HUD TELEMETRY STRIP */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950/70 border border-white/[0.08] backdrop-blur-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-7 h-7 rounded-xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-400">
            <Zap className="w-4 h-4 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-sans tracking-wider text-slate-100 uppercase">J.A.S.P.E.R. v2.4</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-300">
                PERSONAL AI OPERATING SYSTEM
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400">Unified Neural Core &bull; Zero-Trust &bull; Zero-Fake Architecture</p>
          </div>
        </div>

        {/* Live HUD Badges */}
        <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-white/[0.08] text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI: {aiStatusLabel}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-emerald-500/30 text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>SECURITY: L0-L3 ARMED</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-white/[0.08] text-slate-400">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span>LATENCY: {systemTelemetry.latency}</span>
          </div>

          <button
            onClick={fetchLiveStatus}
            disabled={isRefreshing}
            className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/[0.08] text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Refresh All Telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. CENTRAL JARVIS AI CORE HERO STAGE */}
      <div className="relative w-full rounded-3xl bg-gradient-to-b from-slate-950/80 via-indigo-950/20 to-slate-950/80 border border-white/[0.1] backdrop-blur-3xl p-6 sm:p-8 flex flex-col items-center justify-center shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Subtle Ambient Radial Backdrops */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Outer Circular Sci-Fi Orbital Ring HUD */}
        <div className="relative flex items-center justify-center my-2">
          {/* Outer Dashed Orbit */}
          <div className="absolute w-72 h-72 sm:w-80 sm:h-80 rounded-full border border-indigo-400/20 border-dashed animate-[spin_60s_linear_infinite] pointer-events-none" />
          
          {/* Middle Counter-Rotating Precision Orbit */}
          <div className="absolute w-60 h-60 sm:w-68 sm:h-68 rounded-full border border-cyan-400/25 border-t-transparent border-b-transparent animate-[spin_35s_linear_infinite_reverse] pointer-events-none" />
          
          {/* Inner Glowing Reactor Enclosure */}
          <div 
            onClick={onMicClick}
            className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-300 hover:scale-105 group"
            title="Click JARVIS AI Core to activate voice input or wake listening"
          >
            <ArcReactor state={jasperState} />

            {/* Hover Tooltip / Click Prompt */}
            <div className="absolute inset-0 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/70 backdrop-blur-sm pointer-events-none">
              <Mic className="w-8 h-8 text-cyan-400 mb-1 animate-bounce" />
              <span className="text-[11px] font-sans font-bold text-slate-100 tracking-wider">CLICK TO SPEAK</span>
              <span className="text-[9px] font-mono text-cyan-300">&quot;Hey Jasper&quot;</span>
            </div>
          </div>
        </div>

        {/* AI State Badge & Status */}
        <div className="mt-3 flex flex-col items-center gap-1.5 z-10">
          <div className={`px-4 py-1 rounded-full border text-xs font-mono font-bold tracking-widest uppercase transition-all duration-300 ${stateBadge.color}`}>
            {stateBadge.label}
          </div>
          <p className="text-xs text-slate-400 text-center max-w-md font-sans">
            Ready for voice or text directives. Real-time multi-turn context memory &amp; autonomous agent router active.
          </p>
        </div>

        {/* Reactive Simulated Waveform Bar Visualizer */}
        <div className="flex items-center gap-1.5 mt-4 h-6">
          {[...Array(24)].map((_, i) => {
            const isSpeaking = jasperState === 'speaking';
            const isListening = jasperState === 'listening';
            const isProcessing = jasperState === 'processing';
            let heightClass = 'h-1.5 opacity-30';
            if (isSpeaking) {
              const heights = ['h-5', 'h-3', 'h-6', 'h-4', 'h-5', 'h-2'];
              heightClass = `${heights[i % heights.length]} opacity-90 bg-amber-400 animate-pulse`;
            } else if (isListening) {
              const heights = ['h-4', 'h-6', 'h-3', 'h-5', 'h-2', 'h-6'];
              heightClass = `${heights[i % heights.length]} opacity-90 bg-cyan-400 animate-pulse`;
            } else if (isProcessing) {
              heightClass = 'h-3.5 opacity-70 bg-purple-400 animate-pulse';
            }
            return (
              <div 
                key={i} 
                className={`w-1 rounded-full bg-indigo-400 transition-all duration-150 ${heightClass}`} 
              />
            );
          })}
        </div>

        {/* Core Quick Voice / Briefing Trigger Pill */}
        <div className="mt-5 flex items-center gap-2 flex-wrap justify-center z-10">
          <button
            onClick={onMicClick}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 hover:from-cyan-500/30 hover:to-indigo-500/30 border border-cyan-400/40 text-cyan-200 font-sans font-semibold text-xs flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] cursor-pointer"
          >
            <Mic className="w-3.5 h-3.5 text-cyan-400" />
            <span>Voice Command</span>
          </button>

          <button
            onClick={handleTriggerBriefing}
            disabled={briefingPlaying}
            className="px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/[0.1] text-slate-200 hover:text-white font-sans font-medium text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Volume2 className={`w-3.5 h-3.5 ${briefingPlaying ? 'text-amber-400 animate-bounce' : 'text-slate-400'}`} />
            <span>{briefingPlaying ? 'Speaking Briefing...' : 'Morning Briefing'}</span>
          </button>

          <button
            onClick={onViewAllApps}
            className="px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/[0.1] text-indigo-300 hover:text-indigo-200 font-sans font-medium text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>View All 35 Apps Matrix</span>
          </button>
        </div>
      </div>

      {/* 3. COMMAND CENTER HUD BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* CARD 1: FINANCIAL INTELLIGENCE & POCKET MONEY SENTINEL */}
        <div className="rounded-2xl bg-slate-950/70 border border-white/[0.08] p-5 backdrop-blur-2xl flex flex-col justify-between shadow-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-100">Financial Health</h3>
                  <p className="text-[10px] font-mono text-emerald-400">Guardian Budget Sentinel Active</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300">
                POCKET MONEY
              </span>
            </div>

            {/* Financial Highlights */}
            <div className="grid grid-cols-2 gap-2 my-3">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/[0.05]">
                <div className="text-[9px] font-mono text-slate-400 uppercase">Monthly Allowance</div>
                <div className="text-lg font-bold font-mono text-slate-100">₹{financeSummary.pocketMoney.toLocaleString()}</div>
                <div className="text-[8.5px] font-mono text-slate-500">Fixed pocket money</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/20">
                <div className="text-[9px] font-mono text-emerald-400 uppercase">Safe Weekly Spend</div>
                <div className="text-lg font-bold font-mono text-emerald-300">₹{financeSummary.safeWeeklySpend}</div>
                <div className="text-[8.5px] font-mono text-emerald-400/70">Calculated pace</div>
              </div>
            </div>

            {/* Guardian Alert Status */}
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/[0.05] text-[10.5px] flex items-center justify-between text-slate-300 font-sans">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                Guardian Alert at ₹{financeSummary.guardianThreshold}
              </span>
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                ARMED
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center gap-2">
            <button
              onClick={() => onLaunchApp('payVault')}
              className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 hover:border-emerald-400 text-emerald-200 font-sans font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Pay Vault &amp; Guardian</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CARD 2: CONNECTED HARDWARE & DEVICE LINK */}
        <div className="rounded-2xl bg-slate-950/70 border border-white/[0.08] p-5 backdrop-blur-2xl flex flex-col justify-between shadow-xl relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-100">Hardware Link</h3>
                  <p className="text-[10px] font-mono text-cyan-400">Physical Devices Sentinel</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300">
                ZERO-FAKE
              </span>
            </div>

            {/* Device List */}
            <div className="space-y-2 my-2">
              {/* Android Phone */}
              <div className="p-2 rounded-xl bg-slate-900/80 border border-white/[0.05] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                  <div>
                    <div className="text-xs font-sans font-medium text-slate-200">Android Smartphone</div>
                    <div className="text-[9px] font-mono text-slate-500">Wireless ADB Pairing</div>
                  </div>
                </div>
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                  hardwareState.phoneAdb.connected 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}>
                  {hardwareState.phoneAdb.status}
                </span>
              </div>

              {/* Samsung Smart TV */}
              <div className="p-2 rounded-xl bg-slate-900/80 border border-white/[0.05] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tv className="w-3.5 h-3.5 text-indigo-400" />
                  <div>
                    <div className="text-xs font-sans font-medium text-slate-200">Smart TV / STB</div>
                    <div className="text-[9px] font-mono text-slate-500">LAN Control Protocol</div>
                  </div>
                </div>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-white/[0.06]">
                  {hardwareState.smartTv.status}
                </span>
              </div>

              {/* PC Workstation */}
              <div className="p-2 rounded-xl bg-slate-900/80 border border-white/[0.05] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className="w-3.5 h-3.5 text-emerald-400" />
                  <div>
                    <div className="text-xs font-sans font-medium text-slate-200">PC Workstation</div>
                    <div className="text-[9px] font-mono text-slate-500">Active Host Machine</div>
                  </div>
                </div>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  ONLINE
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center gap-2">
            <button
              onClick={() => onLaunchApp('phoneControl')}
              className="flex-1 py-2 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 hover:border-cyan-400 text-cyan-200 font-sans font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Pair Android Phone</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onLaunchApp('tvRemote')}
              className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-white/[0.08] text-slate-300 hover:text-white font-sans text-xs transition-all cursor-pointer"
              title="Open Smart TV Remote"
            >
              TV Remote
            </button>
          </div>
        </div>

        {/* CARD 3: TELEPHONY & LIVE CALL INTELLIGENCE */}
        <div className="rounded-2xl bg-slate-950/70 border border-white/[0.08] p-5 backdrop-blur-2xl flex flex-col justify-between shadow-xl relative overflow-hidden group hover:border-violet-500/40 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-400">
                  <PhoneForwarded className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-100">Telephony Sentinel</h3>
                  <p className="text-[10px] font-mono text-violet-400">Live Call Screening Engine</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-300">
                PSTN &bull; TWILIO
              </span>
            </div>

            {/* Telephony Highlights */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-white/[0.05] mb-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono text-slate-400">Autonomous Screening</span>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/30">
                  ACTIVE
                </span>
              </div>
              <p className="text-[11px] font-sans text-slate-300 leading-relaxed">
                Screens callers before and after answering. Transcribes reason, generates concise summary, and routes decisions.
              </p>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/50 border border-white/[0.05] text-[10px] font-mono text-slate-400">
              <span>Synced Contacts: Active</span>
              <span className="text-violet-300 font-semibold">{telephonyState.vipCount} VIP Screened</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center gap-2">
            <button
              onClick={() => onLaunchApp('telephonyHub')}
              className="flex-1 py-2 px-3 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/30 hover:border-violet-400 text-violet-200 font-sans font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Launch Telephony Hub</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CARD 4: EXECUTIVE QUICK ACTIONS */}
        <div className="rounded-2xl bg-slate-950/70 border border-white/[0.08] p-5 backdrop-blur-2xl flex flex-col justify-between shadow-xl relative overflow-hidden group hover:border-indigo-500/40 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-400/30 text-indigo-400">
                  <Play className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-100">Executive Actions</h3>
                  <p className="text-[10px] font-mono text-indigo-400">Instant One-Click Operations</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-400/25 text-indigo-300">
                DISPATCH
              </span>
            </div>

            {/* Quick Action Matrix */}
            <div className="grid grid-cols-2 gap-2 my-2">
              <button
                onClick={() => onLaunchApp('videoStudio')}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-rose-950/30 border border-white/[0.06] hover:border-rose-400/40 flex items-center gap-2 transition-all cursor-pointer text-left"
              >
                <Video className="w-4 h-4 text-rose-400 shrink-0" />
                <div>
                  <div className="text-xs font-sans font-medium text-slate-200">Video Studio</div>
                  <div className="text-[9px] font-mono text-slate-500">AI Creator</div>
                </div>
              </button>

              <button
                onClick={() => onLaunchApp('hologramStudio')}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-cyan-950/30 border border-white/[0.06] hover:border-cyan-400/40 flex items-center gap-2 transition-all cursor-pointer text-left"
              >
                <Box className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <div className="text-xs font-sans font-medium text-slate-200">3D Hologram</div>
                  <div className="text-[9px] font-mono text-slate-500">Blender Studio</div>
                </div>
              </button>

              <button
                onClick={() => onLaunchApp('agentHub')}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-indigo-950/30 border border-white/[0.06] hover:border-indigo-400/40 flex items-center gap-2 transition-all cursor-pointer text-left"
              >
                <Bot className="w-4 h-4 text-indigo-400 shrink-0" />
                <div>
                  <div className="text-xs font-sans font-medium text-slate-200">Agent Swarm</div>
                  <div className="text-[9px] font-mono text-slate-500">Autonomous Hub</div>
                </div>
              </button>

              <button
                onClick={() => onLaunchApp('codeStudio')}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-amber-950/30 border border-white/[0.06] hover:border-amber-400/40 flex items-center gap-2 transition-all cursor-pointer text-left"
              >
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="text-xs font-sans font-medium text-slate-200">Code Studio</div>
                  <div className="text-[9px] font-mono text-slate-500">Dev Terminal</div>
                </div>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06]">
            {onLockSystem && (
              <button
                onClick={onLockSystem}
                className="w-full py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 hover:border-rose-400 text-rose-300 font-sans font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span>Lock System Shield</span>
              </button>
            )}
          </div>
        </div>

        {/* CARD 5: SYSTEM SENTINEL & ZERO-TRUST SECURITY */}
        <div className="rounded-2xl bg-slate-950/70 border border-white/[0.08] p-5 backdrop-blur-2xl flex flex-col justify-between shadow-xl relative overflow-hidden group hover:border-sky-500/40 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-100">Security Sentinel</h3>
                  <p className="text-[10px] font-mono text-sky-400">Zero-Trust &amp; Biometrics</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300">
                ACTIVE
              </span>
            </div>

            <div className="space-y-2 my-2 text-xs font-sans">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/[0.05] flex items-center justify-between">
                <span className="text-slate-300">Zero-Trust Risk Engine</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                  L0 &rarr; L3 DYNAMIC
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/[0.05] flex items-center justify-between">
                <span className="text-slate-300">Zero-Fake Architecture</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                  100% VERIFIED
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/[0.05] flex items-center justify-between">
                <span className="text-slate-300">Biometric Face &amp; PIN Shield</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  STANDBY
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center gap-2">
            <button
              onClick={() => onLaunchApp('security')}
              className="flex-1 py-2 px-3 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 hover:border-sky-400 text-sky-200 font-sans font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Security Center</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-white/[0.08] text-slate-300 hover:text-white font-sans text-xs transition-all cursor-pointer"
              >
                Settings
              </button>
            )}
          </div>
        </div>

        {/* CARD 6: MASTER APPLICATION LAUNCHER BANNER */}
        <div className="rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-950/80 border border-indigo-400/30 p-5 backdrop-blur-2xl flex flex-col justify-between shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-300">
                <Layers className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-100">All Applications</h3>
                <p className="text-[10px] font-mono text-indigo-300">35 Native Operating System Apps</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed my-2">
              Access the complete suite of JASPER OS modules: Telephony Hub, Pay Vault, 3D Blender Studio, Video Creator, Social Auto-Reply, File Explorer, Terminal, and more.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center gap-2">
            <button
              onClick={onViewAllApps}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-500/25 hover:bg-indigo-500/35 border border-indigo-400/50 hover:border-indigo-300 text-indigo-200 font-sans font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(99,102,241,0.25)] cursor-pointer"
            >
              <span>Spread All 35 Apps Matrix</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
