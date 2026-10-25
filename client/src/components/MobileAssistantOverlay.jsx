import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Square, Sparkles, Send, Volume2, X, Maximize2, 
  Clock, CloudSun, Calculator, FileText, Calendar, Search, 
  Music, Flashlight, Battery, Wifi, Bluetooth, Settings, 
  AlertCircle, CheckCircle2, ChevronUp, ChevronDown, RotateCcw,
  ArrowLeft, Home, Radio, Sun, TrendingUp, Cpu, Camera, Headphones,
  Newspaper, Zap, Trophy, Shield
} from 'lucide-react';
import { getApiBase } from '../utils/apiConfig.js';
import { speakDeviceAudio } from '../utils/speakDeviceAudio.js';
import { playChime } from './VoiceController.jsx';
import { playJarvisBeep } from '../utils/jarvisAudioSynth.js';

// Lazy load all widgets for embedded inline viewing
const SmartHomeMatrixWidget = React.lazy(() => import('./SmartHomeMatrixWidget.jsx'));
const NetworkRadarWidget = React.lazy(() => import('./NetworkRadarWidget.jsx'));
const MorningBriefingWidget = React.lazy(() => import('./MorningBriefingWidget.jsx'));
const MarketIntelWidget = React.lazy(() => import('./MarketIntelWidget.jsx'));
const HardwareHudWidget = React.lazy(() => import('./HardwareHudWidget.jsx'));
const VisionSentinelWidget = React.lazy(() => import('./VisionSentinelWidget.jsx'));
const FocusMatrixWidget = React.lazy(() => import('./FocusMatrixWidget.jsx'));
const AiNewsDigestWidget = React.lazy(() => import('./AiNewsDigestWidget.jsx'));
const AiCostSentinelWidget = React.lazy(() => import('./AiCostSentinelWidget.jsx'));
const HabitMatrixWidget = React.lazy(() => import('./HabitMatrixWidget.jsx'));

export default function MobileAssistantOverlay({ onClose, autoWake = true, embedded = false }) {
  const [state, setState] = useState(autoWake ? 'listening' : 'idle'); // 'listening' | 'thinking' | 'speaking' | 'idle'
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [textInput, setTextInput] = useState('');
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [activeTimer, setActiveTimer] = useState(null);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(0);
  const [activeWidget, setActiveWidget] = useState(null); // 'smartHome' | 'networkRadar' | etc.

  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Resize Electron floating window when widget opens/closes
  useEffect(() => {
    if (window.jasperElectron?.resizeFloatingBar) {
      if (activeWidget) {
        window.jasperElectron.resizeFloatingBar({ width: 500, height: 720 });
      } else {
        window.jasperElectron.resizeFloatingBar({ width: 440, height: 620 });
      }
    }
  }, [activeWidget]);

  // Read Battery API
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      navigator.getBattery().then((battery) => {
        setBatteryLevel({
          level: Math.round(battery.level * 100),
          charging: battery.charging
        });
        battery.addEventListener('levelchange', () => {
          setBatteryLevel({
            level: Math.round(battery.level * 100),
            charging: battery.charging
          });
        });
      }).catch(() => {});
    }
  }, []);

  // Initialize Speech Recognition on Mount
  useEffect(() => {
    try {
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognitionClass) {
        console.warn('[MobileAssistant] Web Speech recognition not supported.');
        return;
      }

      const rec = new SpeechRecognitionClass();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setState('listening');
      };

      rec.onresult = (event) => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const heard = (final || interim).trim();
        if (heard) setTranscript(heard);

        if (final.trim()) {
          rec.stop();
          processCommand(final.trim());
        } else {
          silenceTimerRef.current = setTimeout(() => {
            try { rec.stop(); } catch (_) {}
            if (interim.trim()) {
              processCommand(interim.trim());
            }
          }, 2000);
        }
      };

      rec.onerror = () => {
        setState('idle');
      };

      rec.onend = () => {
        if (state === 'listening' && !transcript) {
          setState('idle');
        }
      };

      recognitionRef.current = rec;
      // Auto-start listening on assistant invocation if autoWake enabled
      if (autoWake) {
        playChime('wake');
        setTimeout(() => {
          try { rec.start(); } catch (_) {}
        }, 200);
      } else {
        setState('idle');
      }

    } catch (e) {
      console.warn('[MobileAssistant] Speech Recognition init caught:', e);
    }

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
      }
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const startVoiceCapture = () => {
    playChime('wake');
    setTranscript('');
    setResponse('');
    setState('listening');
    try {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
        setTimeout(() => {
          try { recognitionRef.current.start(); } catch (_) {}
        }, 150);
      }
    } catch (_) {}
  };

  const processCommand = async (queryText) => {
    const clean = String(queryText || textInput).trim();
    if (!clean) return;

    setTranscript(clean);
    setTextInput('');
    const lower = clean.toLowerCase();

    // Voice Directives to Open Widgets Immediately
    if (lower.includes('smart home') || lower.includes('lights') || lower.includes('iot')) {
      setActiveWidget('smartHome');
      playJarvisBeep('success');
      setResponse('Opening Smart Home & IoT Matrix, Sir.');
      speakDeviceAudio('Opening Smart Home and IoT Matrix.');
      setState('idle');
      return;
    }
    if (lower.includes('radar') || lower.includes('network') || lower.includes('subnet') || lower.includes('sniffer')) {
      setActiveWidget('networkRadar');
      playJarvisBeep('success');
      setResponse('LAN Cyber Radar active. Sweeping 192.168.29.0/24 subnet.');
      speakDeviceAudio('Activating LAN Cyber Radar and subnet sniffer.');
      setState('idle');
      return;
    }
    if (lower.includes('morning') || lower.includes('briefing') || lower.includes('debrief')) {
      setActiveWidget('morningBriefing');
      playJarvisBeep('success');
      setResponse('Accessing your synthesized Morning Executive Briefing.');
      speakDeviceAudio('Accessing your Morning Executive Briefing.');
      setState('idle');
      return;
    }
    if (lower.includes('crypto') || lower.includes('market') || lower.includes('bitcoin') || lower.includes('stock')) {
      setActiveWidget('marketIntel');
      playJarvisBeep('success');
      setResponse('Displaying real-time market sparklines and crypto intel.');
      speakDeviceAudio('Displaying real-time market intelligence.');
      setState('idle');
      return;
    }
    if (lower.includes('focus') || lower.includes('deep work') || lower.includes('binaural') || lower.includes('pomodoro')) {
      setActiveWidget('focusMatrix');
      playJarvisBeep('success');
      setResponse('Initiating Deep Work flow state and binaural soundscape generator.');
      speakDeviceAudio('Initiating Deep Work flow state.');
      setState('idle');
      return;
    }
    if (lower.includes('vision') || lower.includes('cctv') || lower.includes('camera') || lower.includes('sentry')) {
      setActiveWidget('visionSentinel');
      playJarvisBeep('success');
      setResponse('Arming Vision Sentinel and live computer vision motion sentry.');
      speakDeviceAudio('Arming Vision Sentinel and camera feed.');
      setState('idle');
      return;
    }
    if (lower.includes('habit') || lower.includes('quest') || lower.includes('streak') || lower.includes('xp')) {
      setActiveWidget('habitMatrix');
      playJarvisBeep('success');
      setResponse('Opening your 90-day Habit Consistency and Quest Matrix.');
      speakDeviceAudio('Opening Habit and Quest Matrix.');
      setState('idle');
      return;
    }
    if (lower.includes('ai news') || lower.includes('news digest') || lower.includes('arxiv')) {
      setActiveWidget('aiNewsDigest');
      playJarvisBeep('success');
      setResponse('Curating executive 3-bullet AI intelligence summaries.');
      speakDeviceAudio('Curating AI intelligence digest.');
      setState('idle');
      return;
    }
    if (lower.includes('cost') || lower.includes('token') || lower.includes('burn') || lower.includes('ollama')) {
      setActiveWidget('aiCostSentinel');
      playJarvisBeep('success');
      setResponse('Displaying LLM token quotas, cloud spend, and edge fallback status.');
      speakDeviceAudio('Displaying LLM token cost sentinel.');
      setState('idle');
      return;
    }
    if (lower.includes('hardware') || lower.includes('cpu temp') || lower.includes('thermals') || lower.includes('battery')) {
      setActiveWidget('hardwareHud');
      playJarvisBeep('success');
      setResponse('Hardware thermal gauges and peripheral battery deck online.');
      speakDeviceAudio('Displaying hardware telemetry and thermal HUD.');
      setState('idle');
      return;
    }

    setState('thinking');

    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/agent/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: clean })
      });

      const data = await res.json();
      const answer = data.response || data.text || 'Directive processed, Sir.';
      setResponse(answer);

      // Handle custom mobile timer action
      if (data.action === 'start_timer' && data.timer?.totalSeconds) {
        startMobileTimer(data.timer.totalSeconds, `${data.timer.value} ${data.timer.unit}`);
      }

      setState('speaking');
      speakDeviceAudio(answer, {
        onEnd: () => setState('idle'),
        onError: () => setState('idle')
      });
    } catch (e) {
      console.error('[MobileAssistant] Execution error:', e);
      setResponse('Connection failure with JASPER server core.');
      setState('idle');
    }
  };

  const stopAll = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch (_) {}
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
    }
    setState('idle');
  };

  const toggleFlashlight = async () => {
    const next = !isFlashlightOn;
    setIsFlashlightOn(next);
    try {
      if (next) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        mediaStreamRef.current = stream;
        const track = stream.getVideoTracks()[0];
        await track.applyConstraints({
          advanced: [{ torch: true }]
        });
      } else {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(t => t.stop());
          mediaStreamRef.current = null;
        }
      }
    } catch (e) {
      console.warn('Torch error:', e);
    }
  };

  const startMobileTimer = (seconds, label = 'Timer') => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setActiveTimer(label);
    setTimerSecondsLeft(seconds);

    timerIntervalRef.current = setInterval(() => {
      setTimerSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          setActiveTimer(null);
          playChime('success');
          speakDeviceAudio(`Sir, your ${label} has finished.`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (activeWidget) {
          setActiveWidget(null);
        } else {
          closeAssistant();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeWidget, onClose]);

  const openFullApp = () => {
    if (embedded && onClose) {
      onClose();
    } else {
      window.location.href = '/';
    }
  };

  const closeAssistant = () => {
    stopAll();
    if (onClose) {
      onClose();
      return;
    }
    if (window.AndroidAssistant?.finish) {
      window.AndroidAssistant.finish();
    } else {
      window.close();
      window.location.href = '/';
    }
  };

  // Full Widget Catalog List
  const allWidgetsList = [
    { id: 'smartHome', name: 'Smart Home', desc: 'IoT Lighting & AC', icon: Home, color: 'text-cyan-400' },
    { id: 'networkRadar', name: 'Cyber Radar', desc: 'LAN Sniffer & Ports', icon: Radio, color: 'text-emerald-400' },
    { id: 'morningBriefing', name: 'Morning Brief', desc: 'Day Intel & Spoken', icon: Sun, color: 'text-amber-400' },
    { id: 'marketIntel', name: 'Market Intel', desc: 'Crypto & Equities', icon: TrendingUp, color: 'text-emerald-400' },
    { id: 'hardwareHud', name: 'Hardware HUD', desc: 'Thermals & Peripherals', icon: Cpu, color: 'text-sky-400' },
    { id: 'visionSentinel', name: 'Vision Sentinel', desc: 'CCTV & Motion Sentry', icon: Camera, color: 'text-rose-400' },
    { id: 'focusMatrix', name: 'Deep Work', desc: 'Binaural Flow State', icon: Headphones, color: 'text-purple-400' },
    { id: 'aiNewsDigest', name: 'AI News Digest', desc: 'Executive Curations', icon: Newspaper, color: 'text-sky-300' },
    { id: 'aiCostSentinel', name: 'Token Sentinel', desc: 'API Burn & Quotas', icon: Zap, color: 'text-emerald-400' },
    { id: 'habitMatrix', name: 'Habit Matrix', desc: '90-Day Quests & XP', icon: Trophy, color: 'text-amber-400' }
  ];

  return (
    <div 
      className="fixed inset-0 z-[99999] flex flex-col justify-end bg-black/60 backdrop-blur-md font-sans text-white animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeAssistant();
        }
      }}
    >
      {/* ── JASPER WIDGET CARD ────────────────────────────────────────── */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${activeWidget ? 'max-w-xl max-h-[90vh]' : 'max-w-lg'} mx-auto bg-gradient-to-b from-[#0c0f17] via-[#080b12] to-[#05070a] border-t border-cyan-500/30 rounded-t-3xl shadow-[0_-15px_40px_rgba(0,229,255,0.18)] p-5 flex flex-col gap-3.5 transition-all duration-300`}
      >
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-1 relative">
          <div className="w-10 h-1 bg-gray-600/60 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 -top-2" />
          
          {activeWidget ? (
            <button 
              onClick={() => {
                playJarvisBeep('click');
                setActiveWidget(null);
              }}
              className="flex items-center gap-1.5 text-xs text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 hover:bg-cyan-900/60 px-3 py-1 rounded-full font-mono transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Voice</span>
            </button>
          ) : (
            <button 
              onClick={openFullApp}
              className="flex items-center gap-1.5 text-xs text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 hover:bg-cyan-900/40 px-2.5 py-1 rounded-full font-mono transition-all cursor-pointer"
              title="Expand to Full J.A.S.P.E.R. HUD"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Full OS</span>
            </button>
          )}

          <div className="text-center">
            <span className="text-[12px] font-mono tracking-widest text-cyan-300 font-bold uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              JASPER WIDGET
            </span>
          </div>

          <button 
            onClick={closeAssistant}
            className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            title="Close Widget"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* IF A WIDGET IS SELECTED: RENDER EMBEDDED WIDGET */}
        {activeWidget ? (
          <div className="flex-1 overflow-y-auto max-h-[70vh] rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-2 custom-scrollbar">
            <React.Suspense fallback={
              <div className="py-20 text-center text-xs font-mono text-cyan-400 flex flex-col items-center justify-center gap-2">
                <Sparkles className="w-6 h-6 animate-spin text-cyan-400" />
                <span>Launching {activeWidget} module...</span>
              </div>
            }>
              {activeWidget === 'smartHome' && <SmartHomeMatrixWidget onClose={() => setActiveWidget(null)} />}
              {activeWidget === 'networkRadar' && <NetworkRadarWidget onClose={() => setActiveWidget(null)} />}
              {activeWidget === 'morningBriefing' && <MorningBriefingWidget onClose={() => setActiveWidget(null)} />}
              {activeWidget === 'marketIntel' && <MarketIntelWidget onClose={() => setActiveWidget(null)} />}
              {activeWidget === 'hardwareHud' && <HardwareHudWidget onClose={() => setActiveWidget(null)} />}
              {activeWidget === 'visionSentinel' && <VisionSentinelWidget onClose={() => setActiveWidget(null)} />}
              {activeWidget === 'focusMatrix' && <FocusMatrixWidget onClose={() => setActiveWidget(null)} />}
              {activeWidget === 'aiNewsDigest' && <AiNewsDigestWidget onClose={() => setActiveWidget(null)} />}
              {activeWidget === 'aiCostSentinel' && <AiCostSentinelWidget onClose={() => setActiveWidget(null)} />}
              {activeWidget === 'habitMatrix' && <HabitMatrixWidget onClose={() => setActiveWidget(null)} />}
            </React.Suspense>
          </div>
        ) : (
          /* OTHERWISE: RENDER MAIN VOICE ORB & CONVERSATION */
          <>
            {/* Center: Glowing Animated Arc Orb */}
            <div className="flex flex-col items-center justify-center py-1">
              <div 
                onClick={startVoiceCapture}
                className="relative w-22 h-22 flex items-center justify-center cursor-pointer group"
                title="Tap to Speak with JASPER"
              >
                {/* Outer Pulsing Rings */}
                <div className={`absolute inset-0 rounded-full border border-cyan-400/30 transition-all duration-500 ${
                  state === 'listening' ? 'scale-125 border-cyan-400 border-2 shadow-[0_0_25px_#00e5ff] animate-ping' :
                  state === 'thinking' ? 'scale-110 border-purple-400 border-2 shadow-[0_0_20px_#a855f7] animate-spin' :
                  state === 'speaking' ? 'scale-120 border-cyan-300 shadow-[0_0_20px_#00e5ff] animate-pulse' : ''
                }`} />

                <div className={`absolute inset-2 rounded-full border border-dashed transition-all duration-500 ${
                  state === 'thinking' ? 'border-purple-400 animate-spin-reverse' : 'border-cyan-500/40'
                }`} />

                {/* Inner Core */}
                <div className={`w-13 h-13 rounded-full flex items-center justify-center transition-all duration-300 ${
                  state === 'listening' ? 'bg-gradient-to-tr from-cyan-500 to-emerald-400 shadow-[0_0_20px_#00e5ff]' :
                  state === 'thinking' ? 'bg-gradient-to-tr from-purple-500 to-pink-500 shadow-[0_0_20px_#a855f7]' :
                  state === 'speaking' ? 'bg-gradient-to-tr from-cyan-400 to-blue-500 shadow-[0_0_20px_#00e5ff]' :
                  'bg-gradient-to-tr from-cyan-800 to-cyan-600 shadow-[0_0_10px_#00e5ff]'
                }`}>
                  <Mic className="w-5 h-5 text-black" />
                </div>
              </div>

              {/* Status Label */}
              <div className="flex items-center gap-2 mt-2.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[11px] font-mono text-cyan-300 uppercase tracking-wider">
                  {state === 'listening' ? 'Listening for command...' :
                   state === 'thinking' ? 'Synthesizing response...' :
                   state === 'speaking' ? 'J.A.S.P.E.R. Speaking...' : 'Ready for directive'}
                </span>
              </div>
            </div>

            {/* Live Conversation Bubbles */}
            {(transcript || response) && (
              <div className="flex flex-col gap-2 max-h-32 overflow-y-auto px-1 text-xs custom-scrollbar">
                {transcript && (
                  <div className="self-end bg-cyan-950/60 border border-cyan-500/40 rounded-2xl rounded-tr-sm px-3.5 py-1.5 text-cyan-200 max-w-[85%] font-mono">
                    <span className="font-semibold text-cyan-400">You: </span>
                    {transcript}
                  </div>
                )}
                {response && (
                  <div className="self-start bg-black/60 border border-white/10 rounded-2xl rounded-tl-sm px-3.5 py-2 text-gray-100 max-w-[90%] leading-relaxed">
                    <div className="flex items-center justify-between text-[10px] text-cyan-400 font-mono mb-1">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        J.A.S.P.E.R.
                      </span>
                      <button onClick={() => speakDeviceAudio(response)}>
                        <Volume2 className="w-3 h-3" />
                      </button>
                    </div>
                    {response}
                  </div>
                )}
              </div>
            )}

            {/* Active Timer Pill if Running */}
            {activeTimer && (
              <div className="flex items-center justify-between bg-amber-500/15 border border-amber-500/40 rounded-xl px-3 py-1.5 text-xs text-amber-300 font-mono">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                  {activeTimer}: {Math.floor(timerSecondsLeft / 60)}:{(timerSecondsLeft % 60).toString().padStart(2, '0')}
                </span>
                <button 
                  onClick={() => {
                    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
                    setActiveTimer(null);
                  }}
                  className="text-red-400 text-[10px] hover:underline"
                >
                  Cancel
                </button>
              </div>
            )}
          </>
        )}

        {/* ── ALL WIDGETS TRAY (Horizontally Scrollable) ──────────────────── */}
        <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400 px-1">
            <span>Integrated Widgets ({allWidgetsList.length})</span>
            <span className="text-cyan-400">Tap to Launch</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none text-xs">
            {allWidgetsList.map(w => {
              const IconComp = w.icon;
              const isSelected = activeWidget === w.id;

              return (
                <button
                  key={w.id}
                  onClick={() => {
                    playJarvisBeep('click');
                    setActiveWidget(isSelected ? null : w.id);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                      : 'bg-white/[0.04] border-white/10 text-slate-300 hover:text-white hover:border-cyan-500/40 hover:bg-cyan-950/20'
                  }`}
                  title={`${w.name}: ${w.desc}`}
                >
                  <IconComp className={`w-3.5 h-3.5 ${w.color}`} />
                  <span className="font-medium text-[11px]">{w.name}</span>
                </button>
              );
            })}

            {/* Quick Tools: 5-Min Timer */}
            <button
              onClick={() => processCommand('start a 5 minute timer')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-cyan-500/40 text-slate-300 hover:text-white transition-colors shrink-0 cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px]">5m Timer</span>
            </button>

            {/* Quick Tools: Weather */}
            <button
              onClick={() => processCommand('what is the weather')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-amber-500/40 text-slate-300 hover:text-white transition-colors shrink-0 cursor-pointer"
            >
              <CloudSun className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px]">Weather</span>
            </button>

            {/* Quick Tools: Flashlight Toggle */}
            <button
              onClick={toggleFlashlight}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                isFlashlightOn 
                  ? 'bg-amber-400/25 border-amber-400 text-amber-300' 
                  : 'bg-white/[0.04] border-white/10 text-slate-300 hover:border-cyan-500/40'
              }`}
            >
              <Flashlight className="w-3.5 h-3.5 text-yellow-300" />
              <span className="text-[11px]">{isFlashlightOn ? 'Torch ON' : 'Torch'}</span>
            </button>

            {/* Quick Tools: Calculator */}
            <button
              onClick={() => setTextInput('calculate ')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-emerald-500/40 text-slate-300 hover:text-white transition-colors shrink-0 cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px]">Calc</span>
            </button>

            {/* Quick Tools: Battery */}
            {batteryLevel && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 whitespace-nowrap text-slate-300 shrink-0 font-mono text-[11px]">
                <Battery className="w-3.5 h-3.5 text-green-400" />
                <span>{batteryLevel.level}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Input & Action Bar */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={stopAll}
            className="p-2.5 rounded-xl bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-colors shrink-0 cursor-pointer"
            title="Stop Speech / Reset"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>

          <form 
            onSubmit={(e) => { e.preventDefault(); processCommand(); }}
            className="flex-1 flex items-center bg-black/60 border border-white/15 focus-within:border-cyan-400 rounded-xl px-3 py-2 transition-colors"
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Ask anything or speak (e.g. 'open radar', 'crypto')..."
              className="flex-1 bg-transparent text-xs text-white placeholder-gray-500 outline-none"
            />
            <button type="submit" className="text-cyan-400 hover:text-cyan-300 p-0.5 cursor-pointer">
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          <button
            onClick={startVoiceCapture}
            className={`p-2.5 rounded-xl font-bold flex items-center justify-center transition-all shrink-0 cursor-pointer ${
              state === 'listening'
                ? 'bg-cyan-400 text-black shadow-[0_0_15px_#00e5ff]'
                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
            }`}
            title="Tap to Speak"
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
