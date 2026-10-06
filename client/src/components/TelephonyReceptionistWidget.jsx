import React, { useState, useEffect } from 'react';
import { getApiBase } from '../utils/apiConfig.js';
import { 
  PhoneCall, PhoneForwarded, PhoneIncoming, PhoneOff, Video, 
  Play, Settings, Clock, DollarSign, ShieldAlert, Sparkles, 
  CheckCircle2, AlertTriangle, ExternalLink, RefreshCw, Volume2, 
  Send, Users, Calendar, ArrowRight, Zap, Radio, UserCheck, 
  BookmarkPlus, Check, Mic
} from 'lucide-react';

export default function TelephonyReceptionistWidget({ onClose }) {
  const [activeTab, setActiveTab] = useState('intelligence'); // 'intelligence' | 'switchboard' | 'meetings' | 'logs' | 'config'
  const [config, setConfig] = useState({
    enabled: true,
    receptionistName: 'JASPER',
    persona: 'British AI Executive Assistant',
    voice: 'Polly.Brian',
    urgentThresholdDollars: 1000,
    ownerPhoneNumber: '+1 (555) 0199',
    twilioPhoneNumber: '',
    twilioAccountSid: '',
    twilioAuthToken: '',
    autoRelayToOwner: true
  });
  const [relays, setRelays] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [logs, setLogs] = useState([]);
  const [liveSessions, setLiveSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [cockpitUserInput, setCockpitUserInput] = useState('');
  const [cockpitCallerInput, setCockpitCallerInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [pullUpStatus, setPullUpStatus] = useState('');
  const [customReply, setCustomReply] = useState('');

  // New meeting form state
  const [newTitle, setNewTitle] = useState('');
  const [newClient, setNewClient] = useState('');
  const [newVal, setNewVal] = useState('17000');
  const [newUrl, setNewUrl] = useState('https://meet.google.com/xyz-qwer-abc');
  const [newTime, setNewTime] = useState('Tonight (Urgent)');

  // Fetch all telephony & meeting data
  const fetchData = async () => {
    try {
      const [cfgRes, relayRes, meetRes, logRes, liveRes] = await Promise.all([
        fetch(`${getApiBase()}/api/telephony/config`).then(r => r.json()).catch(() => ({})),
        fetch(`${getApiBase()}/api/telephony/relays`).then(r => r.json()).catch(() => ({})),
        fetch(`${getApiBase()}/api/meetings`).then(r => r.json()).catch(() => ({})),
        fetch(`${getApiBase()}/api/telephony/logs`).then(r => r.json()).catch(() => ({})),
        fetch(`${getApiBase()}/api/telephony/live/sessions`).then(r => r.json()).catch(() => ({}))
      ]);

      if (cfgRes.success) setConfig(cfgRes.config);
      if (relayRes.success) setRelays(relayRes.relays);
      if (meetRes.success) setMeetings(meetRes.meetings);
      if (logRes.success) setLogs(logRes.logs);
      if (liveRes.success) setLiveSessions(liveRes.active?.length ? liveRes.active : (liveRes.recent || []));
    } catch (err) {
      console.error('[TelephonyWidget] Error fetching data:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  // 🎬 Trigger the full $17k Miami Client Reel Flow
  const handleSimulateReel = async () => {
    setIsSimulating(true);
    setStatusMessage('Initiating $17k Miami Client Inbound Call on Line 1...');
    try {
      const res = await fetch(`${getApiBase()}/api/telephony/simulate-reel-scenario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage('🎬 Live Reel Simulation active! Line 1 placed on priority hold. Outbound alert dispatched to owner. Google Meet launching on workstation...');
        setTimeout(fetchData, 1000);
        setTimeout(fetchData, 3000);
        setTimeout(fetchData, 5000);
      }
    } catch (e) {
      setStatusMessage('Simulation dispatch failed: ' + e.message);
    } finally {
      setTimeout(() => setIsSimulating(false), 6000);
    }
  };

  // ⚽ Trigger the Live Call Screening & Intelligence Football Trial Scenario
  const handleSimulateFootballScenario = async () => {
    setStatusMessage('Initiating Rahul Football Trial Call Screening...');
    try {
      const res = await fetch(`${getApiBase()}/api/telephony/live/simulate-football-scenario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage('⚽ Rahul Call Screening Active! Check the Live Screening Modal on your screen.');
        fetchData();
      }
    } catch (e) {
      setStatusMessage('Simulation failed: ' + e.message);
    }
  };

  // Live Call Intelligence Cockpit Handlers
  const handleCockpitTurn = async (callId, speaker, text) => {
    if (!text?.trim() || !callId) return;
    try {
      const res = await fetch(`${getApiBase()}/api/telephony/live/turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId, speaker, text: text.trim() })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCockpitAccept = async (callId) => {
    try {
      await fetch(`${getApiBase()}/api/telephony/screening/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId })
      });
      setStatusMessage('Call accepted! Live silent intelligence active.');
      fetchData();
    } catch (e) {}
  };

  const handleCockpitReject = async (callId) => {
    try {
      await fetch(`${getApiBase()}/api/telephony/screening/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId, reason: 'unavailable' })
      });
      setStatusMessage('Call declined with polite message.');
      fetchData();
    } catch (e) {}
  };

  const handleCockpitContinue = async (callId, question) => {
    try {
      await fetch(`${getApiBase()}/api/telephony/screening/continue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId, followUpInstruction: question || 'timing and location' })
      });
      setStatusMessage('J.A.S.P.E.R. probed caller and updated summary.');
      fetchData();
    } catch (e) {}
  };

  const handleCockpitActivate = async (callId) => {
    try {
      const res = await fetch(`${getApiBase()}/api/telephony/live/activate-assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId, prompt: "What is my availability?" })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`J.A.S.P.E.R. Spoken: "${data.spokenResponse}"`);
        fetchData();
      }
    } catch (e) {}
  };

  const handleCockpitConclude = async (callId) => {
    try {
      await fetch(`${getApiBase()}/api/telephony/live/conclude`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId })
      });
      setStatusMessage('Live call concluded and context saved.');
      fetchData();
    } catch (e) {}
  };

  // Hands-free Pull Up Meeting command
  const handlePullUpMeeting = async (meeting) => {
    setPullUpStatus(`Launching Google Meet for ${meeting?.clientName || 'Client'}...`);
    try {
      const res = await fetch(`${getApiBase()}/api/meetings/pull-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meeting || {})
      });
      const data = await res.json();
      if (data.success) {
        setPullUpStatus(`✅ ${data.message}`);
      } else {
        setPullUpStatus(`❌ Error: ${data.error || 'Failed to launch'}`);
      }
    } catch (err) {
      setPullUpStatus(`❌ Failed to connect: ${err.message}`);
    }
    setTimeout(() => setPullUpStatus(''), 5000);
  };

  // Owner Line response
  const handleSendOwnerResponse = async (relayId, text) => {
    try {
      await fetch(`${getApiBase()}/api/telephony/relay-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relayId, responseText: text })
      });
      fetchData();
      setCustomReply('');
    } catch (e) {
      console.error(e);
    }
  };

  // Save Config
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api/telephony/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        setStatusMessage('Telephony & Receptionist settings saved successfully!');
      }
    } catch (e) {
      setStatusMessage('Error saving settings: ' + e.message);
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  // Add Meeting
  const handleAddMeeting = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${getApiBase()}/api/meetings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle || 'Client Video Meeting',
          clientName: newClient || 'New Client',
          dealValue: parseFloat(newVal) || 0,
          url: newUrl,
          scheduledTime: newTime
        })
      });
      setNewTitle('');
      setNewClient('');
      fetchData();
      setActiveTab('meetings');
    } catch (e) {
      console.error(e);
    }
  };

  const activeRelay = relays[0];

  return (
    <div className="bg-slate-900/95 border border-cyan-500/30 rounded-2xl shadow-2xl backdrop-blur-xl text-slate-100 flex flex-col h-[740px] max-h-[90vh] w-full max-w-5xl overflow-hidden font-sans">
      {/* Header */}
      <div className="p-4 border-b border-cyan-500/20 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/40">
            <Radio className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-wider text-cyan-300 uppercase">J.A.S.P.E.R. Telephony Hub & Live Intelligence</h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                AI RECEPTIONIST ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400">Autonomous Call Screening • Live Real-Time Conversation Intelligence • Multi-Line Switchboard</p>
          </div>
        </div>

        {/* Quick Actions: Simulations */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateFootballScenario}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600/30 to-cyan-600/30 hover:from-emerald-600/40 hover:to-cyan-600/40 border border-emerald-500/50 text-emerald-300 font-semibold text-xs tracking-wide shadow-md transition-all active:scale-95"
            title="Simulate Rahul calling about tomorrow's football trial"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>⚽ SIMULATE FOOTBALL SCREENING</span>
          </button>

          <button
            onClick={handleSimulateReel}
            disabled={isSimulating}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-rose-500/20 hover:from-amber-500/30 hover:to-rose-500/30 border border-amber-500/40 text-amber-300 font-semibold text-xs tracking-wide shadow-lg shadow-amber-500/10 transition-all active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
            {isSimulating ? 'SIMULATING REEL...' : '🎬 SIMULATE $17K REEL'}
          </button>
          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Status Bar */}
      {(statusMessage || pullUpStatus) && (
        <div className="px-4 py-2 bg-cyan-950/40 border-b border-cyan-500/20 text-xs flex items-center justify-between text-cyan-200 animate-fadeIn">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>{statusMessage || pullUpStatus}</span>
          </div>
          <button onClick={() => { setStatusMessage(''); setPullUpStatus(''); }} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 gap-2">
        {[
          { id: 'intelligence', label: 'Live Call Intelligence', icon: Sparkles, badge: liveSessions.length > 0 ? 'ACTIVE' : 'NEW' },
          { id: 'switchboard', label: 'Multi-Line Switchboard', icon: PhoneForwarded, badge: relays.length > 0 ? 'ACTIVE' : null },
          { id: 'meetings', label: 'Google Meet Launcher', icon: Video, badge: meetings.length },
          { id: 'logs', label: 'Call Intelligence Logs', icon: Clock, badge: logs.length },
          { id: 'config', label: 'Telephony & Voice Persona', icon: Settings }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold transition-all border-b-2 ${
                isActive 
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5' 
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  tab.badge === 'ACTIVE' 
                    ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50 animate-pulse' 
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 0: LIVE CALL INTELLIGENCE & SCREENING */}
        {activeTab === 'intelligence' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Hero Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-slate-900/80 to-slate-950/80 border border-cyan-500/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
                  <h3 className="font-orbitron font-bold text-base text-cyan-200">
                    LIVE CALL INTELLIGENCE & AUTONOMOUS SCREENING CORE
                  </h3>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  J.A.S.P.E.R. screens callers before you pick up, summarizes the purpose, and acts as a <b>silent intelligent assistant</b> during active calls with real-time nuance & context memory tracking.
                </p>
              </div>

              <button
                onClick={handleSimulateFootballScenario}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-orbitron font-bold text-xs tracking-wider shadow-lg shadow-cyan-900/40 flex items-center gap-2 active:scale-95 shrink-0"
              >
                <Zap className="w-4 h-4 text-emerald-300" />
                <span>⚽ TEST FOOTBALL TRIAL SCENARIO</span>
              </button>
            </div>

            {/* 4 Pillars Architecture Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Pillar 1 */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-cyan-500/30 text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-cyan-300 font-bold font-orbitron">
                  <PhoneIncoming className="w-4 h-4 text-cyan-400" />
                  <span>1. BEFORE ACCEPT</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  J.A.S.P.E.R. answers caller, extracts caller intent, generates concise summary, and waits for your decision: <b>Accept</b>, <b>Reject</b>, or <b>Continue Screening</b>.
                </p>
              </div>

              {/* Pillar 2 */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-cyan-500/30 text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-300 font-bold font-orbitron">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>2. AFTER ACCEPT</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Call transfers to you seamlessly. J.A.S.P.E.R. acts as a <b>silent intelligent assistant</b>, analyzing questions and decisions without vocal interruptions.
                </p>
              </div>

              {/* Pillar 3 */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-cyan-500/30 text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-amber-300 font-bold font-orbitron">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>3. ANALYZE ANSWERS</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Understands semantic nuance: distinguishes tentative confirmation (<i>"Yeah, I think I can"</i>) from absolute confirmation (<i>"Yes, definitely"</i>).
                </p>
              </div>

              {/* Pillar 4 */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-cyan-500/30 text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-sky-300 font-bold font-orbitron">
                  <Clock className="w-4 h-4 text-sky-400" />
                  <span>4. CONTEXT MEMORY</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Maintains temporary conversation memory during call: Caller, Initial reason, Important details (Time: 6 PM, Training ground), and decisions.
                </p>
              </div>
            </div>

            {/* Active & Recent Sessions Inspector */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <h4 className="font-orbitron font-bold text-xs text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-400" />
                  Active & Recent Call Intelligence Sessions ({liveSessions.length})
                </h4>
                <button onClick={fetchData} className="text-slate-400 hover:text-white text-xs flex items-center gap-1 font-mono">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh
                </button>
              </div>

              {liveSessions.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  <PhoneIncoming className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No call intelligence sessions logged yet.</p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Click "Test Football Trial Scenario" above to test the full live call screening and intelligence pipeline!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {liveSessions.map((sess, idx) => {
                    const isScreening = sess.status === 'screening' || sess.status === 'waiting_decision';
                    const isLive = sess.status === 'active_live';
                    const isConcluded = sess.status === 'concluded' || sess.status === 'rejected';

                    return (
                      <div key={idx} className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30 text-xs space-y-3 shadow-lg">
                        {/* Session Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-400/50 flex items-center justify-center text-cyan-300 font-bold">
                              {sess.caller?.[0] || 'C'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-sm">{sess.caller}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{sess.phone || '+91 98765 43210'}</span>
                              </div>
                              <span className="text-[10px] text-amber-300 font-mono">REASON: {sess.initialReason}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold ${
                              isScreening 
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                                : isLive
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}>
                              {isScreening ? 'WAITING DECISION' : isLive ? 'LIVE CALL ACTIVE' : 'CONCLUDED'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{sess.displayTime || sess.createdAt?.slice(11, 19)}</span>
                          </div>
                        </div>

                        {/* J.A.S.P.E.R. Concise Screening Summary */}
                        <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-100 font-sans">
                          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            J.A.S.P.E.R. Screening Briefing for Jwalant:
                          </span>
                          <p className="font-medium text-xs leading-relaxed">
                            "{sess.screeningSummary}"
                          </p>
                        </div>

                        {/* Important Details & Commitment Tracker */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {/* Important Details */}
                          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                            <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                              Important Details (Live Context):
                            </span>
                            {sess.contextMemory?.importantDetails?.length > 0 ? (
                              <div className="space-y-1">
                                {sess.contextMemory.importantDetails.map((det, i) => (
                                  <div key={i} className="text-cyan-200 text-[11px] font-mono flex items-center gap-1.5">
                                    <Check className="w-3 h-3 text-cyan-400 shrink-0" />
                                    <span>{det}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-500 text-[11px] italic">No details extracted yet.</span>
                            )}
                          </div>

                          {/* Nuance & Commitment Tracking */}
                          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                            <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                              Nuance & Commitment Tracker:
                            </span>
                            {sess.contextMemory?.commitments?.length > 0 ? (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-200 text-[11px]">{sess.contextMemory.commitments[0].topic}</span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    sess.contextMemory.commitments[0].status === 'definite' || sess.contextMemory.commitments[0].status === 'confirmed'
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  }`}>
                                    {sess.contextMemory.commitments[0].status?.toUpperCase()}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-300 italic bg-black/40 p-1.5 rounded">
                                  "{sess.contextMemory.commitments[0].note}"
                                </p>
                              </div>
                            ) : (
                              <span className="text-slate-500 text-[11px] italic">Awaiting confirmation reply in call...</span>
                            )}
                          </div>
                        </div>

                        {/* PILLAR 1: SCREENING DECISION CONTROLS (IF WAITING DECISION) */}
                        {isScreening && (
                          <div className="pt-2 border-t border-slate-800">
                            <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1.5">
                              Your Screening Decision:
                            </span>
                            <div className="grid grid-cols-3 gap-2">
                              <button
                                onClick={() => handleCockpitAccept(sess.callId)}
                                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-orbitron font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-950"
                              >
                                <PhoneCall className="w-3.5 h-3.5" />
                                <span>ACCEPT CALL</span>
                              </button>

                              <button
                                onClick={() => handleCockpitReject(sess.callId)}
                                className="px-3 py-2 rounded-xl bg-red-950/70 hover:bg-red-900 border border-red-500/40 text-red-300 font-orbitron font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                              >
                                <PhoneOff className="w-3.5 h-3.5" />
                                <span>REJECT</span>
                              </button>

                              <button
                                onClick={() => handleCockpitContinue(sess.callId, 'time and training ground location')}
                                className="px-3 py-2 rounded-xl bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-orbitron font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>ASK TO CONTINUE</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* PILLAR 2, 3, 4: LIVE CALL INTERACTION (IF ACTIVE LIVE) */}
                        {isLive && (
                          <div className="pt-2 border-t border-slate-800 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                                Silent Intelligent Assistant Monitoring Real-Time Dialogue
                              </span>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleCockpitActivate(sess.callId)}
                                  className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 text-[10px] font-orbitron font-bold"
                                >
                                  ACTIVATE J.A.S.P.E.R.
                                </button>
                                <button
                                  onClick={() => handleCockpitConclude(sess.callId)}
                                  className="px-2.5 py-1 rounded-lg bg-red-950/70 hover:bg-red-900 border border-red-500/40 text-red-300 text-[10px] font-orbitron font-bold flex items-center gap-1"
                                >
                                  <PhoneOff className="w-3 h-3" />
                                  <span>End Call</span>
                                </button>
                              </div>
                            </div>

                            {/* Recent Transcript Bubbles */}
                            {sess.transcript?.length > 0 && (
                              <div className="max-h-36 overflow-y-auto rounded-xl bg-black/50 border border-slate-800 p-2.5 space-y-1.5">
                                {sess.transcript.slice(-4).map((tr, tIdx) => (
                                  <div key={tIdx} className={`flex flex-col ${tr.speaker === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className="flex items-center gap-1 text-[9px] font-mono text-slate-400">
                                      <span>{tr.speaker === 'user' ? 'You (Jwalant)' : sess.caller}</span>
                                      {tr.analysis?.confirmationType === 'tentative' && (
                                        <span className="px-1 rounded bg-amber-500/20 text-amber-300">Tentative</span>
                                      )}
                                      {tr.analysis?.confirmationType === 'definite' && (
                                        <span className="px-1 rounded bg-emerald-500/20 text-emerald-300">Confirmed</span>
                                      )}
                                    </div>
                                    <div className={`px-2.5 py-1 rounded-lg text-xs max-w-[80%] ${
                                      tr.speaker === 'user'
                                        ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-100'
                                        : 'bg-slate-800/80 border border-cyan-500/30 text-white'
                                    }`}>
                                      {tr.text}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* 1-Click Interactive Steps to demonstrate the prompt flow */}
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                              <span className="text-slate-400 uppercase">Dialogue Steps:</span>
                              <button
                                onClick={() => handleCockpitTurn(sess.callId, 'caller', "Can you come to practice at 6 PM?")}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700"
                              >
                                1. Caller: "Can you come at 6?"
                              </button>
                              <button
                                onClick={() => handleCockpitTurn(sess.callId, 'user', "Yeah, I think I can.")}
                                className="px-2 py-1 rounded bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-500/40"
                              >
                                2. Me: "Yeah, I think I can" [Tentative 🟡]
                              </button>
                              <button
                                onClick={() => handleCockpitTurn(sess.callId, 'caller', "So you're definitely coming at 6?")}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700"
                              >
                                3. Caller: "Definitely coming?"
                              </button>
                              <button
                                onClick={() => handleCockpitTurn(sess.callId, 'user', "Yes, definitely.")}
                                className="px-2 py-1 rounded bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40"
                              >
                                4. Me: "Yes, definitely" [Confirmed 🟢]
                              </button>
                              <button
                                onClick={() => handleCockpitTurn(sess.callId, 'caller', "Awesome, see you tomorrow at 6! Bye.")}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                              >
                                5. Wrap-up
                              </button>
                            </div>

                            {/* Custom Speech Row */}
                            <div className="flex gap-2 items-center">
                              <input
                                type="text"
                                value={cockpitUserInput}
                                onChange={(e) => setCockpitUserInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && cockpitUserInput.trim()) {
                                    handleCockpitTurn(sess.callId, 'user', cockpitUserInput);
                                    setCockpitUserInput('');
                                  }
                                }}
                                placeholder="Type or speak what You say to caller..."
                                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                              />
                              <button
                                onClick={() => {
                                  if (cockpitUserInput.trim()) {
                                    handleCockpitTurn(sess.callId, 'user', cockpitUserInput);
                                    setCockpitUserInput('');
                                  }
                                }}
                                disabled={!cockpitUserInput.trim()}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs disabled:opacity-40"
                              >
                                Speak (Me)
                              </button>
                            </div>
                          </div>
                        )}

                        {/* CONCLUDED DOSSIER VIEW */}
                        {isConcluded && (
                          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center justify-between">
                            <span className="flex items-center gap-1.5 font-bold">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              Call concluded & intelligence saved into JASPER context memory.
                            </span>
                            <span className="text-slate-400 font-mono text-[10px]">TOTAL TURNS: {sess.transcript?.length || 0}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 1: SWITCHBOARD */}
        {activeTab === 'switchboard' && (
          <div className="space-y-4">
            {/* Multi-Line Switchboard Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* LINE 1: CLIENT CALL LEG */}
              <div className="rounded-xl border border-cyan-500/30 bg-slate-950/70 p-4 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none"></div>
                <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
                    <h3 className="font-bold text-sm tracking-wide text-cyan-300 uppercase">LINE 1 • Inbound Client Call</h3>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-cyan-900/40 text-cyan-300 border border-cyan-700/50 font-mono">
                    {activeRelay?.clientLine?.status || 'STANDBY / LISTENING'}
                  </span>
                </div>

                {activeRelay ? (
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-slate-200 text-sm">{activeRelay.clientLine.name}</div>
                        <div className="text-slate-400 font-mono">{activeRelay.clientLine.company} • {activeRelay.clientLine.phone}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-amber-400 font-bold text-base flex items-center justify-end gap-1">
                          <DollarSign className="w-4 h-4" />
                          {activeRelay.dealInfo.value.toLocaleString()}
                        </div>
                        <div className="text-rose-400 font-medium text-[11px]">{activeRelay.dealInfo.deadlineText}</div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300">
                      <div className="text-[10px] text-cyan-400 uppercase font-mono mb-1">Client Spoken Audio Transcription:</div>
                      <p className="italic font-serif">"{activeRelay.clientLine.speech}"</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-cyan-200">
                      <div className="text-[10px] text-cyan-400 uppercase font-mono mb-1">JASPER Priority Hold Action:</div>
                      <p>Client placed on priority hold with Iron Man Jarvis executive holding loop while dispatching private line alert to you.</p>
                    </div>

                    {activeRelay.relayToClientMessage && (
                      <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-700/50 text-emerald-200 animate-fadeIn">
                        <div className="text-[10px] text-emerald-400 uppercase font-mono mb-1">Relayed to Client on Line 1:</div>
                        <p className="italic">"{activeRelay.relayToClientMessage}"</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-500">
                    <PhoneIncoming className="w-10 h-10 mx-auto mb-2 text-slate-600 opacity-60" />
                    <p className="text-xs">No active caller on Line 1 right now.</p>
                    <p className="text-[11px] text-slate-600 mt-1">Incoming calls will appear here automatically with deal valuation & urgency metrics.</p>
                  </div>
                )}
              </div>

              {/* LINE 2: OWNER DIRECT RELAY LEG */}
              <div className="rounded-xl border border-amber-500/30 bg-slate-950/70 p-4 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>
                <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${activeRelay ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`}></span>
                    <h3 className="font-bold text-sm tracking-wide text-amber-300 uppercase">LINE 2 • Autonomous Outbound to You</h3>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-900/40 text-amber-300 border border-amber-700/50 font-mono">
                    {activeRelay?.ownerLine?.status || 'IDLE'}
                  </span>
                </div>

                {activeRelay ? (
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-slate-200">Founder Personal Phone</div>
                        <div className="text-slate-400 font-mono">{config.ownerPhoneNumber}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                        AUTONOMOUS DISPATCH
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/40 text-amber-200">
                      <div className="text-[10px] text-amber-400 uppercase font-mono mb-1">JASPER Spoken Prompt to You:</div>
                      <p className="italic">
                        "Sir, the {activeRelay.clientLine.name} is on the other line. He wants to sign tonight, ${activeRelay.dealInfo.value.toLocaleString()}, but I am the only one with you. He is leaving in {activeRelay.dealInfo.deadlineMinutes} minutes. Should I tell him you are on your way?"
                      </p>
                    </div>

                    {/* Owner Quick Actions */}
                    <div className="pt-2">
                      <div className="text-[10px] text-slate-400 uppercase font-mono mb-1.5">Respond / Relay to Client:</div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleSendOwnerResponse(activeRelay.relayId, "I'm on my way, tell him 1 minute!")}
                          className="px-3 py-2 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/50 text-emerald-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Zap className="w-3.5 h-3.5 text-emerald-400" />
                          "On my way (1 min)"
                        </button>
                        <button
                          onClick={() => handleSendOwnerResponse(activeRelay.relayId, "Tell him I'm driving, be there in 5 minutes!")}
                          className="px-3 py-2 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/50 text-blue-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Clock className="w-3.5 h-3.5 text-blue-400" />
                          "Hold 5 mins, driving"
                        </button>
                      </div>

                      <div className="mt-2 flex gap-1.5">
                        <input
                          type="text"
                          value={customReply}
                          onChange={(e) => setCustomReply(e.target.value)}
                          placeholder="Or type custom spoken instruction..."
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                        />
                        <button
                          onClick={() => handleSendOwnerResponse(activeRelay.relayId, customReply)}
                          disabled={!customReply.trim()}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 disabled:opacity-40"
                        >
                          Relay
                        </button>
                      </div>
                    </div>

                    {activeRelay.meetingUrl && (
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">Ready to enter room?</span>
                        <button
                          onClick={() => handlePullUpMeeting({ clientName: activeRelay.clientLine.name, url: activeRelay.meetingUrl })}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20"
                        >
                          <Video className="w-3.5 h-3.5" />
                          PULL UP MEETING NOW
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-500">
                    <PhoneForwarded className="w-10 h-10 mx-auto mb-2 text-slate-600 opacity-60" />
                    <p className="text-xs">Owner line is in standby mode.</p>
                    <p className="text-[11px] text-slate-600 mt-1">JASPER will autonomously dial your number when an urgent deal or caller is detected.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Demonstration Helper */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-sm text-cyan-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Experience the Blake Stephens Reel Workflow
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click the simulate button to watch JASPER intercept the $17k Miami client, hold Line 1, dispatch an outbound alert to you on Line 2, receive your ETA, and auto-open Google Meet on your PC.
                </p>
              </div>
              <button
                onClick={handleSimulateReel}
                disabled={isSimulating}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 whitespace-nowrap active:scale-95 disabled:opacity-50"
              >
                {isSimulating ? 'Executing Simulation...' : 'Run Live Reel Demo'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: MEETINGS */}
        {activeTab === 'meetings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-200">Automated Workstation Meetings</h3>
                <p className="text-xs text-slate-400">Launch client Google Meet rooms hands-free via voice command ("Jarvis, pull up the meeting, please")</p>
              </div>
              <button
                onClick={() => handlePullUpMeeting(meetings[0])}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
              >
                <Video className="w-4 h-4" />
                PULL UP ACTIVE MEETING NOW
              </button>
            </div>

            {/* Meetings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {meetings.map((m) => (
                <div key={m.id} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-cyan-950/80 border border-cyan-800/60 text-cyan-300">
                          {m.platform || 'Google Meet'}
                        </span>
                        <h4 className="font-bold text-sm text-slate-100 mt-1.5">{m.title}</h4>
                        <div className="text-xs text-slate-400">{m.clientName} {m.company && `• ${m.company}`}</div>
                      </div>
                      {m.dealValue > 0 && (
                        <div className="text-right">
                          <span className="text-xs font-bold text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded">
                            ${m.dealValue.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-2 text-xs text-slate-400 flex items-center gap-1 font-mono truncate">
                      <ExternalLink className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      <a href={m.url} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline truncate">
                        {m.url}
                      </a>
                    </div>
                  </div>

                  <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {m.scheduledTime || 'Flexible'}
                    </span>
                    <button
                      onClick={() => handlePullUpMeeting(m)}
                      className="px-3 py-1 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/50 text-cyan-200 font-semibold text-xs flex items-center gap-1 transition-all"
                    >
                      <Play className="w-3 h-3 text-cyan-400" />
                      Launch on PC
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Schedule New Meeting Form */}
            <form onSubmit={handleAddMeeting} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300">Register / Schedule New Client Meeting</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Meeting Title (e.g. Contract Closing)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                />
                <input
                  type="text"
                  placeholder="Client Name (e.g. Miami Client)"
                  value={newClient}
                  onChange={(e) => setNewClient(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                />
                <input
                  type="number"
                  placeholder="Deal Value ($ USD)"
                  value={newVal}
                  onChange={(e) => setNewVal(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Meeting URL (Google Meet / Zoom)"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                />
                <input
                  type="text"
                  placeholder="Scheduled Time (e.g. Tonight 9:00 PM)"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                >
                  Save Meeting
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: LOGS */}
        {activeTab === 'logs' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-200">Call Intelligence & Transcripts</h3>
              <button onClick={fetchData} className="p-1 rounded text-slate-400 hover:text-white">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {logs.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">No call logs recorded yet.</div>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1.5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                          log.direction === 'inbound' 
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' 
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}>
                          {log.direction.toUpperCase()}
                        </span>
                        <span className="font-bold text-slate-200">{log.callerName || log.from}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {log.dealValue > 0 && (
                          <span className="font-bold text-amber-400 font-mono">
                            ${log.dealValue.toLocaleString()}
                          </span>
                        )}
                        <span className="text-slate-500 text-[11px]">{log.displayTime}</span>
                      </div>
                    </div>
                    {log.speechTranscript && (
                      <p className="text-slate-300 italic font-serif bg-slate-900/60 p-2 rounded">
                        "{log.speechTranscript}"
                      </p>
                    )}
                    {log.relayMessageToClient && (
                      <p className="text-emerald-300 text-[11px]">
                        <span className="font-bold uppercase font-mono text-[9px] text-emerald-500">Relayed: </span>
                        {log.relayMessageToClient}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CONFIG */}
        {activeTab === 'config' && (
          <form onSubmit={handleSaveConfig} className="space-y-4 max-w-2xl mx-auto">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
              <h3 className="font-bold text-sm text-cyan-300 uppercase tracking-wide border-b border-slate-800 pb-2">
                Autonomous Telephony & Voice Persona Configuration
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">AI Persona Name</label>
                  <input
                    type="text"
                    value={config.receptionistName}
                    onChange={(e) => setConfig({ ...config, receptionistName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Voice Profile (Polly / ElevenLabs)</label>
                  <input
                    type="text"
                    value={config.voice}
                    onChange={(e) => setConfig({ ...config, voice: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Founder / Owner Personal Phone (Outbound Alert Line)</label>
                <input
                  type="text"
                  value={config.ownerPhoneNumber}
                  onChange={(e) => setConfig({ ...config, ownerPhoneNumber: e.target.value })}
                  placeholder="+1 (555) 0199 or +91 98765 43210"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">JASPER dials this number urgently when a high-value or time-sensitive deal is detected.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Urgency Valuation Threshold ($ USD)</label>
                <input
                  type="number"
                  value={config.urgentThresholdDollars}
                  onChange={(e) => setConfig({ ...config, urgentThresholdDollars: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">Calls with deal valuations above this number automatically trigger Line 1 hold and Line 2 owner dialing.</p>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-2">Twilio Telephony Credentials (Optional)</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Twilio Phone Number</label>
                    <input
                      type="text"
                      value={config.twilioPhoneNumber}
                      onChange={(e) => setConfig({ ...config, twilioPhoneNumber: e.target.value })}
                      placeholder="+1 800 555 0199"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Account SID</label>
                      <input
                        type="password"
                        value={config.twilioAccountSid}
                        onChange={(e) => setConfig({ ...config, twilioAccountSid: e.target.value })}
                        placeholder="ACxxxxxxxxxxxxxxxx"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Auth Token</label>
                      <input
                        type="password"
                        value={config.twilioAuthToken}
                        onChange={(e) => setConfig({ ...config, twilioAuthToken: e.target.value })}
                        placeholder="••••••••••••••••"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 active:scale-95 disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
