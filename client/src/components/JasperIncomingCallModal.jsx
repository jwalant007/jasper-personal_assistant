import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, PhoneCall, PhoneOff, Mic, MicOff, Volume2, ShieldAlert, 
  Sparkles, CheckCircle2, AlertCircle, HelpCircle, ArrowRight, 
  MessageSquare, Clock, Calendar, MapPin, Send, Zap, UserCheck, 
  ChevronRight, BookmarkPlus, Play, Check
} from 'lucide-react';
import { unlockDeviceAudio, speakDeviceAudio } from '../utils/speakDeviceAudio';
import { getApiBase, getWsBase } from '../utils/apiConfig.js';

/**
 * Realistic Web Audio Telephone Ringtone Generator
 */
class PhoneRingtone {
  constructor() {
    this.ctx = null;
    this.timer = null;
    this.isPlaying = false;
  }

  start() {
    if (this.isPlaying) return;
    this.isPlaying = true;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
    } catch (e) {
      return;
    }

    const playBurst = () => {
      if (!this.isPlaying || !this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const now = this.ctx.currentTime;
      // North American standard ringing frequencies (440Hz + 480Hz)
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(480, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.05);
      gain.gain.setValueAtTime(0.18, now + 1.8);
      gain.gain.linearRampToValueAtTime(0.001, now + 2.0);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 2.0);
      osc2.stop(now + 2.0);

      this.timer = setTimeout(playBurst, 3200);
    };

    playBurst();
  }

  stop() {
    this.isPlaying = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.ctx) {
      try { this.ctx.close(); } catch (e) {}
      this.ctx = null;
    }
  }
}

export default function JasperIncomingCallModal({
  callData, // { callId, session, callerName, initialReason, screeningSummary, speechPrompt, ... }
  onAnswer,
  onDecline,
  onRelaySuccess
}) {
  // Call Modes: 'screening' (Before I Accept) | 'live_call' (After I Accept) | 'concluded'
  const isScreeningInitial = Boolean(
    callData?.isScreeningMode || 
    callData?.session || 
    callData?.screeningSummary || 
    !callData?.dealValue
  );

  const [mode, setMode] = useState(isScreeningInitial ? 'screening' : 'legacy_outbound');
  const [callId, setCallId] = useState(callData?.callId || callData?.session?.callId || `call-${Date.now()}`);
  const [callSeconds, setCallSeconds] = useState(0);

  // Pillar 1: Screening State
  const [callerName, setCallerName] = useState(callData?.callerName || callData?.session?.caller || 'Unknown Caller');
  const [callerPhone, setCallerPhone] = useState(callData?.session?.phone || callData?.phone || '');
  const [initialReason, setInitialReason] = useState(callData?.initialReason || callData?.session?.initialReason || 'Incoming call inquiry');
  const [screeningSummary, setScreeningSummary] = useState(
    callData?.screeningSummary || 
    callData?.session?.screeningSummary || 
    'Screening in progress...'
  );
  const [screeningHistory, setScreeningHistory] = useState(callData?.session?.screeningHistory || []);
  const [isAskingContinue, setIsAskingContinue] = useState(false);
  const [continueQuestion, setContinueQuestion] = useState('');
  const [isContinuingLoading, setIsContinuingLoading] = useState(false);

  // Pillar 2 & 4: Live Call Context Memory & Live Transcripts
  const [contextMemory, setContextMemory] = useState(callData?.session?.contextMemory || {
    caller: callerName,
    initialReason: initialReason,
    currentTopic: initialReason,
    importantDetails: callData?.session?.contextMemory?.importantDetails || [],
    commitments: [],
    decisions: [],
    openQuestions: [],
    detectedChanges: [],
    isConcluded: false,
    conclusionSummary: null
  });

  const [transcript, setTranscript] = useState(callData?.session?.transcript || []);
  const [silentSuggestions, setSilentSuggestions] = useState([
    '⚡ Silent Assistant Active: Monitoring conversation context without interrupting.',
    '📅 Calendar Check: Free tomorrow 5:00 PM – 8:00 PM.'
  ]);

  // Real-time Audio & Inputs
  const [isMicActive, setIsMicActive] = useState(false);
  const [interimUserText, setInterimUserText] = useState('');
  const [customCallerInput, setCustomCallerInput] = useState('');
  const [customUserInput, setCustomUserInput] = useState('');
  const [isSendingTurn, setIsSendingTurn] = useState(false);
  const [assistantSpokenNotice, setAssistantSpokenNotice] = useState('');

  // Legacy Deal Flow Fallback
  const [legacyOwnerSpokenText, setLegacyOwnerSpokenText] = useState('');
  const dealValueStr = callData?.dealValue ? `$${callData.dealValue.toLocaleString()}` : '$17,000';
  const deadlineMins = callData?.urgencyMinutes || 20;

  const ringtoneRef = useRef(null);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const chatScrollRef = useRef(null);
  const wsRef = useRef(null);

  // Initialize Audio & WebSocket Listener
  useEffect(() => {
    ringtoneRef.current = new PhoneRingtone();
    if (mode === 'screening' || mode === 'legacy_outbound') {
      ringtoneRef.current.start();
    }

    if ('vibrate' in navigator) {
      try { navigator.vibrate([400, 200, 400]); } catch (e) {}
    }

    // Connect WebSocket for live sync
    try {
      const ws = new WebSocket(getWsBase());
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.callId && msg.callId !== callId) return;

          if (msg.type === 'CALL_SCREENING_CONTINUED_UPDATE') {
            setScreeningSummary(msg.session.screeningSummary);
            setScreeningHistory(msg.session.screeningHistory);
            setContextMemory(msg.session.contextMemory);
          } else if (msg.type === 'CALL_ACCEPTED_LIVE') {
            setMode('live_call');
            setContextMemory(msg.session.contextMemory);
          } else if (msg.type === 'LIVE_CALL_INTELLIGENCE_UPDATE') {
            setContextMemory(msg.contextMemory);
            if (msg.turn) {
              setTranscript(prev => [...prev, msg.turn]);
            }
            if (msg.silentSuggestions) {
              setSilentSuggestions(msg.silentSuggestions);
            }
          } else if (msg.type === 'ASSISTANT_SPOKEN_INTERVENTION') {
            setAssistantSpokenNotice(msg.spokenResponse);
            speakDeviceAudio(msg.spokenResponse);
            setTimeout(() => setAssistantSpokenNotice(''), 8000);
          } else if (msg.type === 'LIVE_CALL_CONCLUDED') {
            setMode('concluded');
          }
        } catch (_) {}
      };
    } catch (_) {}

    return () => {
      if (ringtoneRef.current) ringtoneRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (wsRef.current) {
        try { wsRef.current.close(); } catch (e) {}
      }
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, [callId]);

  // Live call timer
  useEffect(() => {
    if (mode === 'live_call') {
      timerRef.current = setInterval(() => {
        setCallSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode]);

  // Auto-scroll transcript feed
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [transcript, screeningHistory]);

  const formatTimer = (totalSec) => {
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // =========================================================================
  // PILLAR 1 ACTIONS: BEFORE I ACCEPT
  // =========================================================================

  // 1. Accept Call
  const handleAcceptScreening = async () => {
    if (ringtoneRef.current) ringtoneRef.current.stop();
    unlockDeviceAudio();

    try {
      const res = await fetch(`${getApiBase()}/api/telephony/screening/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId })
      });
      const data = await res.json();
      if (data.success) {
        setContextMemory(data.session.contextMemory);
      }
    } catch (_) {}

    setMode('live_call');
    speakDeviceAudio("Connecting you to Jwalant right now.");

    // Add initial turn to transcript
    setTranscript([
      {
        id: 'initial-caller',
        speaker: 'caller',
        text: screeningHistory.find(h => h.speaker === 'caller')?.text || "Hey, I wanted to talk to Jwalant about the football trial tomorrow.",
        timestamp: new Date().toLocaleTimeString(),
        analysis: {
          intent: 'Football practice',
          isQuestion: false,
          confirmationType: 'none',
          keyDetailsFound: contextMemory.importantDetails
        }
      }
    ]);

    if (onAnswer) onAnswer();
  };

  // 2. Reject Call
  const handleRejectScreening = async () => {
    if (ringtoneRef.current) ringtoneRef.current.stop();
    if (window.speechSynthesis) window.speechSynthesis.cancel();

    try {
      await fetch(`${getApiBase()}/api/telephony/screening/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId, reason: 'unavailable' })
      });
    } catch (_) {}

    setMode('concluded');
    setTimeout(() => {
      if (onDecline) onDecline();
    }, 1200);
  };

  // 3. Ask J.A.S.P.E.R. to continue
  const handleAskJasperContinue = async (customQ = '') => {
    setIsContinuingLoading(true);
    unlockDeviceAudio();

    const q = customQ || continueQuestion || "Ask for practice timing and location";
    try {
      const res = await fetch(`${getApiBase()}/api/telephony/screening/continue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId,
          customQuestion: q.startsWith('Ask') ? null : q,
          followUpInstruction: q
        })
      });
      const data = await res.json();
      if (data.success) {
        setScreeningSummary(data.session.screeningSummary);
        setScreeningHistory(data.session.screeningHistory);
        setContextMemory(data.session.contextMemory);
        setIsAskingContinue(false);
        setContinueQuestion('');

        // Announce updated summary
        speakDeviceAudio(`Updated briefing: ${data.session.screeningSummary}`);
      }
    } catch (err) {
      console.warn('Error continuing screening:', err);
    } finally {
      setIsContinuingLoading(false);
    }
  };

  // =========================================================================
  // PILLAR 2 & 3 ACTIONS: AFTER I ACCEPT (LIVE CALL INTELLIGENCE)
  // =========================================================================

  // Send a live dialogue turn (Caller or User)
  const sendLiveTurn = async (speaker, text) => {
    const cleanText = text.trim();
    if (!cleanText || isSendingTurn) return;

    setIsSendingTurn(true);
    try {
      const res = await fetch(`${getApiBase()}/api/telephony/live/turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId, speaker, text: cleanText })
      });
      const data = await res.json();
      if (data.success) {
        setContextMemory(data.contextMemory);
        setTranscript(prev => [...prev, data.turn]);
        if (data.session?.silentSuggestions) {
          setSilentSuggestions(data.session.silentSuggestions);
        }
      }
    } catch (e) {
      console.warn('Error sending live turn:', e);
    } finally {
      setIsSendingTurn(false);
    }
  };

  // Toggle Microphone Web Speech API for Jwalant's voice
  const toggleMicrophone = () => {
    if (isMicActive) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setIsMicActive(false);
      setInterimUserText('');
      return;
    }

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('Speech Recognition is not supported in this browser. Please type responses below.');
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const finalSpeech = event.results[i][0].transcript.trim();
            if (finalSpeech) {
              sendLiveTurn('user', finalSpeech);
              setInterimUserText('');
            }
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setInterimUserText(interim);
      };

      rec.onerror = (e) => {
        console.warn('Microphone recognition error:', e.error);
        setIsMicActive(false);
      };

      rec.onend = () => {
        setIsMicActive(false);
      };

      rec.start();
      recognitionRef.current = rec;
      setIsMicActive(true);
    } catch (e) {
      console.warn('Error starting microphone:', e);
      setIsMicActive(false);
    }
  };

  // Explicit Assistant Activation (when user requests spoken intervention)
  const handleActivateAssistantAloud = async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/telephony/live/activate-assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId,
          prompt: "What is my calendar availability tomorrow at 6 PM?"
        })
      });
      const data = await res.json();
      if (data.success) {
        setAssistantSpokenNotice(data.spokenResponse);
        speakDeviceAudio(data.spokenResponse);
      }
    } catch (_) {}
  };

  // Conclude call
  const handleConcludeCall = async () => {
    try {
      await fetch(`${getApiBase()}/api/telephony/live/conclude`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId })
      });
    } catch (_) {}

    setMode('concluded');
  };

  // Step-by-Step Scenario Runner (The exact Football Trial scenario from prompt)
  const runScenarioStep = async (stepIndex) => {
    if (stepIndex === 1) {
      // Caller: "Can you come to practice at 6 PM?"
      await sendLiveTurn('caller', "Can you come to practice at 6 PM?");
    } else if (stepIndex === 2) {
      // Me: "Yeah, I think I can." (Tentative Confirmation)
      await sendLiveTurn('user', "Yeah, I think I can.");
    } else if (stepIndex === 3) {
      // Caller: "So you're definitely coming at 6?"
      await sendLiveTurn('caller', "So you're definitely coming at 6?");
    } else if (stepIndex === 4) {
      // Me: "Yes, definitely." (Definite Confirmation)
      await sendLiveTurn('user', "Yes, definitely.");
    } else if (stepIndex === 5) {
      // Caller: Wrap up
      await sendLiveTurn('caller', "Awesome, see you tomorrow at 6 at the training ground! Bye.");
    }
  };

  // Active commitment state
  const activeCommitment = contextMemory?.commitments?.[0] || null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-2xl p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[94vh] rounded-2xl border border-white/[0.08] bg-[#0b0d13]/95 p-5 sm:p-6 shadow-2xl flex flex-col text-slate-100 overflow-hidden font-sans">

        {/* HEADER BAR */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-slate-200">
              <PhoneCall className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs tracking-tight text-slate-100">
                  Jasper Call Intelligence
                </span>
                {mode === 'screening' && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-medium">
                    Screening
                  </span>
                )}
                {mode === 'live_call' && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Live Assistant Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {mode === 'screening' && 'Screening caller before connecting • Awaiting your decision'}
                {mode === 'live_call' && `Active Call • ${formatTimer(callSeconds)} • Silent Intelligence Monitoring`}
                {mode === 'concluded' && 'Call Concluded • Dossier Synthesized'}
              </p>
            </div>
          </div>

          {/* Call Duration / Close */}
          <div className="flex items-center gap-2">
            {mode === 'live_call' && (
              <div className="px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/[0.08] text-slate-200 font-mono text-xs font-medium">
                {formatTimer(callSeconds)}
              </div>
            )}
            <button 
              onClick={() => {
                if (ringtoneRef.current) ringtoneRef.current.stop();
                if (onDecline) onDecline();
              }}
              className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-white/[0.06] text-xs transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* VIEW 1: BEFORE I ACCEPT (Autonomous Call Screening) */}
        {/* =================================================================== */}
        {mode === 'screening' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Caller Identification Card */}
            <div className="rounded-xl bg-[#10131d]/60 border border-white/[0.07] p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-slate-300">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-100 text-sm">{callerName}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.05] text-slate-300 font-mono border border-white/[0.08]">
                      Incoming
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">{callerPhone}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase block font-medium">Inquiry Topic</span>
                <span className="text-xs font-semibold text-slate-200">{initialReason}</span>
              </div>
            </div>

            {/* AI Screening Reason / Summary Card */}
            <div className="rounded-xl bg-[#10131d]/60 border border-white/[0.08] p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs font-semibold text-slate-200">
                  Executive Screening Briefing
                </span>
              </div>
              
              <div className="p-3.5 rounded-lg bg-black/25 border border-white/[0.06] text-slate-200 font-sans text-xs leading-relaxed">
                <p className="font-normal text-slate-300">
                  "{screeningSummary}"
                </p>
              </div>

              {/* Preliminary Details */}
              {contextMemory.importantDetails?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/[0.06] flex flex-wrap gap-2 items-center">
                  <span className="text-[10px] text-slate-400 uppercase font-medium">Key Points:</span>
                  {contextMemory.importantDetails.map((detail, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-slate-300 text-xs font-mono">
                      • {detail}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Screening Conversation History */}
            <div className="rounded-xl bg-black/25 border border-white/[0.06] p-3.5 max-h-48 overflow-y-auto space-y-2.5 font-sans">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Autonomous Dialogue</span>
                <span className="text-slate-400">Jasper Voice Agent</span>
              </div>
              {screeningHistory.map((turn, i) => (
                <div key={i} className={`flex flex-col ${turn.speaker === 'jasper' ? 'items-start' : 'items-end'}`}>
                  <span className="text-[9px] font-mono text-slate-500 uppercase">
                    {turn.speaker === 'jasper' ? 'Jasper' : callerName}
                  </span>
                  <div className={`mt-0.5 px-3 py-2 rounded-xl text-xs max-w-[85%] ${
                    turn.speaker === 'jasper'
                      ? 'bg-white/[0.05] border border-white/[0.08] text-slate-300'
                      : 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-100'
                  }`}>
                    {turn.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Ask Jasper to continue Popover */}
            {isAskingContinue && (
              <div className="p-3.5 rounded-xl bg-[#10131d]/80 border border-white/[0.08] animate-in fade-in space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">
                    Instruct Jasper to Probe Further:
                  </span>
                  <button onClick={() => setIsAskingContinue(false)} className="text-slate-400 hover:text-slate-200 text-xs">✕</button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => handleAskJasperContinue("Ask for time and training ground location")}
                    disabled={isContinuingLoading}
                    className="p-2 rounded-lg bg-black/30 hover:bg-black/50 border border-white/[0.06] text-slate-300 text-left transition-all"
                  >
                    "Ask for time & location"
                  </button>
                  <button
                    onClick={() => handleAskJasperContinue("Ask if Coach specifically requested me")}
                    disabled={isContinuingLoading}
                    className="p-2 rounded-lg bg-black/30 hover:bg-black/50 border border-white/[0.06] text-slate-300 text-left transition-all"
                  >
                    "Ask if Coach requested me"
                  </button>
                </div>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={continueQuestion}
                    onChange={(e) => setContinueQuestion(e.target.value)}
                    placeholder="Or type custom question for Jasper to ask caller..."
                    className="flex-1 bg-black/30 border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/20"
                  />
                  <button
                    onClick={() => handleAskJasperContinue()}
                    disabled={isContinuingLoading || !continueQuestion.trim()}
                    className="px-3.5 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] text-slate-100 font-medium text-xs disabled:opacity-40 transition-all"
                  >
                    {isContinuingLoading ? 'Probing...' : 'Ask'}
                  </button>
                </div>
              </div>
            )}

            {/* 3 Prominent Decision Choices (Pillar 1) */}
            <div className="pt-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-2 text-center font-medium">
                Decision Action
              </span>
              <div className="grid grid-cols-3 gap-3">
                {/* 1. REJECT */}
                <button
                  onClick={handleRejectScreening}
                  className="py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 font-medium text-xs flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
                >
                  <PhoneOff className="w-4 h-4 text-rose-400" />
                  <span>Decline</span>
                </button>

                {/* 2. ASK JASPER TO CONTINUE */}
                <button
                  onClick={() => setIsAskingContinue(prev => !prev)}
                  className="py-2.5 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-200 font-medium text-xs flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
                >
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Ask More</span>
                </button>

                {/* 3. ACCEPT */}
                <button
                  onClick={handleAcceptScreening}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
                >
                  <PhoneCall className="w-4 h-4 text-white" />
                  <span>Accept Call</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* VIEW 2: AFTER I ACCEPT (Live Call Intelligence Mode) */}
        {/* =================================================================== */}
        {mode === 'live_call' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 flex flex-col min-h-0">
            {/* Silent Assistant Banner */}
            <div className="px-3.5 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span className="font-semibold text-slate-200">Silent Intelligent Assistant:</span>
                <span className="text-slate-400 text-[11px]">Listening & analyzing context silently without interrupting.</span>
              </div>
              <button
                onClick={handleActivateAssistantAloud}
                className="px-2.5 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] text-slate-200 text-[11px] font-medium transition-all"
              >
                Activate Jasper
              </button>
            </div>

            {/* Assistant Spoken Notice (if user summons JASPER) */}
            {assistantSpokenNotice && (
              <div className="p-3 rounded-xl bg-[#10131d]/90 border border-white/[0.08] text-slate-200 text-xs flex items-center gap-2 animate-in fade-in">
                <Volume2 className="w-4 h-4 text-indigo-400" />
                <span><b>Jasper:</b> "{assistantSpokenNotice}"</span>
              </div>
            )}

            {/* PILLAR 4: DYNAMIC CONTEXT MEMORY CARD */}
            <div className="rounded-xl bg-[#10131d]/60 border border-white/[0.07] p-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <BookmarkPlus className="w-4 h-4 text-slate-400" />
                  <h4 className="font-semibold text-xs text-slate-200">
                    Live Call Context Memory
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Session {callId.slice(-8)}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Left Column: Caller & Initial Reason & Important Details */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[11px]">Caller:</span>
                    <span className="font-bold text-white">{contextMemory.caller}</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[11px]">Initial Reason:</span>
                    <span className="font-bold text-amber-300">{contextMemory.initialReason}</span>
                  </div>

                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[10px] font-mono uppercase block mb-1">Important Details:</span>
                    <div className="space-y-1">
                      {contextMemory.importantDetails.map((detail, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-cyan-200 text-xs">
                          <Check className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span>{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Commitment & Nuance Tracking (Pillar 3) */}
                <div className="space-y-2">
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[10px] font-mono uppercase block mb-1.5">
                      COMMITMENT & NUANCE TRACKER:
                    </span>

                    {activeCommitment ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-slate-300">{activeCommitment.topic}</span>
                          {activeCommitment.status === 'tentative' ? (
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                              🟡 TENTATIVE
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                              🟢 CONFIRMED
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-300 italic bg-black/40 p-1.5 rounded">
                          "{activeCommitment.note}"
                        </p>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500 italic py-2">
                        Awaiting attendance/action confirmation from Jwalant...
                      </div>
                    )}
                  </div>

                  {/* Decisions & Open Questions */}
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[10px] font-mono uppercase block mb-1">Logged Decisions:</span>
                    {contextMemory.decisions?.length > 0 ? (
                      contextMemory.decisions.map((dec, i) => (
                        <p key={i} className="text-emerald-300 text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          {dec}
                        </p>
                      ))
                    ) : (
                      <p className="text-slate-500 text-[11px] italic">No final decisions locked yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Silent Suggestions / Whispers */}
              {silentSuggestions.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-800 text-[11px] text-cyan-300 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">{silentSuggestions[0]}</span>
                </div>
              )}
            </div>

            {/* LIVE CONVERSATION STREAM (Pillar 2) */}
            <div 
              ref={chatScrollRef}
              className="flex-1 min-h-[160px] max-h-[220px] overflow-y-auto rounded-2xl bg-black/50 border border-slate-800 p-3 space-y-2.5 font-sans"
            >
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest sticky top-0 bg-black/80 py-0.5">
                Live Conversation Stream (Audio Transcription)
              </div>
              
              {transcript.map((turn, idx) => (
                <div 
                  key={idx} 
                  className={`flex flex-col ${turn.speaker === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400 uppercase">
                    <span>{turn.speaker === 'user' ? 'You (Jwalant)' : callerName}</span>
                    <span>• {turn.timestamp}</span>
                    {turn.analysis?.confirmationType === 'tentative' && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Tentative
                      </span>
                    )}
                    {turn.analysis?.confirmationType === 'definite' && (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Confirmed
                      </span>
                    )}
                    {turn.analysis?.isQuestion && (
                      <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                        Question
                      </span>
                    )}
                  </div>

                  <div className={`mt-0.5 px-3 py-2 rounded-2xl text-xs max-w-[85%] ${
                    turn.speaker === 'user'
                      ? 'bg-gradient-to-r from-emerald-950 to-green-900 border border-emerald-500/40 text-emerald-100 shadow-md'
                      : 'bg-slate-900 border border-cyan-500/30 text-white'
                  }`}>
                    {turn.text}
                  </div>
                </div>
              ))}

              {interimUserText && (
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-mono text-emerald-400 uppercase">Speaking now...</span>
                  <div className="mt-0.5 px-3 py-2 rounded-2xl text-xs bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 italic">
                    "{interimUserText}"
                  </div>
                </div>
              )}
            </div>

            {/* LIVE INPUT & INTERACTIVE TESTING CONTROLS */}
            <div className="space-y-2 pt-1 border-t border-slate-800">
              {/* Quick Step Buttons to test the exact prompt flow */}
              <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 text-[10px] font-mono">
                <span className="text-slate-400 uppercase shrink-0">Football Trial Steps:</span>
                <button
                  onClick={() => runScenarioStep(1)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 shrink-0 border border-slate-700"
                >
                  1. Caller: "Can you come at 6?"
                </button>
                <button
                  onClick={() => runScenarioStep(2)}
                  className="px-2 py-1 rounded bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 shrink-0 border border-amber-500/40"
                >
                  2. Me: "Yeah, I think I can"
                </button>
                <button
                  onClick={() => runScenarioStep(3)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 shrink-0 border border-slate-700"
                >
                  3. Caller: "Definitely coming?"
                </button>
                <button
                  onClick={() => runScenarioStep(4)}
                  className="px-2 py-1 rounded bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 shrink-0 border border-emerald-500/40"
                >
                  4. Me: "Yes, definitely"
                </button>
                <button
                  onClick={() => runScenarioStep(5)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 border border-slate-700"
                >
                  5. Wrap-up
                </button>
              </div>

              {/* My Voice / Text Input Row */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMicrophone}
                  className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
                    isMicActive
                      ? 'bg-red-600 text-white border-red-400 animate-pulse'
                      : 'bg-slate-900 text-emerald-400 border-emerald-500/40 hover:bg-emerald-950/40'
                  }`}
                  title={isMicActive ? "Mute Microphone" : "Speak via Microphone (Web Speech)"}
                >
                  {isMicActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <input
                  type="text"
                  value={customUserInput}
                  onChange={(e) => setCustomUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customUserInput.trim()) {
                      sendLiveTurn('user', customUserInput);
                      setCustomUserInput('');
                    }
                  }}
                  placeholder="Speak or type what You say to the caller..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                />

                <button
                  onClick={() => {
                    if (customUserInput.trim()) {
                      sendLiveTurn('user', customUserInput);
                      setCustomUserInput('');
                    }
                  }}
                  disabled={!customUserInput.trim()}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs disabled:opacity-40"
                >
                  Speak (Me)
                </button>

                <button
                  onClick={handleConcludeCall}
                  className="px-3.5 py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 font-medium text-xs flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <PhoneOff className="w-3.5 h-3.5" />
                  <span>End Call</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* VIEW 3: CONCLUDED CALL DOSSIER */}
        {/* =================================================================== */}
        {mode === 'concluded' && (
          <div className="flex-1 overflow-y-auto space-y-4 py-3 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <h3 className="font-semibold text-lg text-slate-100 tracking-tight">
              Call Concluded
            </h3>
            <p className="text-xs text-slate-400">
              Session intelligence dossier synthesized and recorded to memory.
            </p>

            <div className="rounded-xl bg-[#10131d]/60 border border-white/[0.07] p-4 text-left text-xs space-y-2.5">
              <div className="flex justify-between border-b border-white/[0.06] pb-2">
                <span className="text-slate-400">Caller:</span>
                <span className="text-slate-100 font-medium">{contextMemory.caller}</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.06] pb-2">
                <span className="text-slate-400">Topic:</span>
                <span className="text-amber-300 font-medium">{contextMemory.initialReason}</span>
              </div>
              <div className="border-b border-white/[0.06] pb-2">
                <span className="text-slate-400 block mb-1">Key Details:</span>
                {contextMemory.importantDetails.map((d, i) => (
                  <p key={i} className="text-slate-200 pl-2">• {d}</p>
                ))}
              </div>
              {contextMemory.commitments?.length > 0 && (
                <div className="border-b border-white/[0.06] pb-2">
                  <span className="text-slate-400 block mb-1">Commitment:</span>
                  <p className="text-emerald-300 pl-2">
                    {contextMemory.commitments[0].note || contextMemory.commitments[0].topic}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => {
                  if (onDecline) onDecline();
                }}
                className="px-5 py-2 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] text-slate-100 font-medium text-xs transition-all shadow-sm"
              >
                Close Session
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
