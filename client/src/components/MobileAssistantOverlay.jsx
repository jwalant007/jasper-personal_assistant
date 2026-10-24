import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Square, Sparkles, Send, Volume2, X, Maximize2, 
  Clock, CloudSun, Calculator, FileText, Calendar, Search, 
  Music, Flashlight, Battery, Wifi, Bluetooth, Settings, 
  AlertCircle, CheckCircle2, ChevronUp, ChevronDown, RotateCcw
} from 'lucide-react';
import { getApiBase } from '../utils/apiConfig.js';
import { speakDeviceAudio } from '../utils/speakDeviceAudio.js';
import { playChime } from './VoiceController.jsx';

export default function MobileAssistantOverlay({ onClose, autoWake = true, embedded = false }) {
  const [state, setState] = useState(autoWake ? 'listening' : 'idle'); // 'listening' | 'thinking' | 'speaking' | 'idle'
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [textInput, setTextInput] = useState('');
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [activeTimer, setActiveTimer] = useState(null);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(0);

  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const mediaStreamRef = useRef(null);

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
      // Clean up torch if active
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
        closeAssistant();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
    // If Android Bridge is available
    if (window.AndroidAssistant?.finish) {
      window.AndroidAssistant.finish();
    } else {
      window.close();
      window.location.href = '/';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[99999] flex flex-col justify-end bg-black/60 backdrop-blur-md font-sans text-white animate-in fade-in duration-200"
      onClick={(e) => {
        // Close if clicking the backdrop itself
        if (e.target === e.currentTarget) {
          closeAssistant();
        }
      }}
    >
      {/* ── Siri/Google Assistant Bottom Sheet Card ────────────────────── */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg mx-auto bg-gradient-to-b from-[#0c0f17] to-[#07090e] border-t border-cyan-500/30 rounded-t-3xl shadow-[0_-15px_40px_rgba(0,229,255,0.15)] p-5 flex flex-col gap-4 animate-slideUp"
      >
        
        {/* Top Header: Drag Handle & Controls */}
        <div className="flex items-center justify-between pb-1">
          <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
          
          <button 
            onClick={openFullApp}
            className="flex items-center gap-1.5 text-xs text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2.5 py-1 rounded-full font-mono"
            title="Expand to Full J.A.S.P.E.R. HUD"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Full HUD</span>
          </button>

          <span className="text-[11px] font-mono tracking-widest text-cyan-300 font-bold uppercase">
            JASPER Mobile Assistant
          </span>

          <button 
            onClick={closeAssistant}
            className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
            title="Close Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Glowing Animated Arc Orb */}
        <div className="flex flex-col items-center justify-center py-2">
          <div 
            onClick={startVoiceCapture}
            className="relative w-24 h-24 flex items-center justify-center cursor-pointer group"
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
            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
              state === 'listening' ? 'bg-gradient-to-tr from-cyan-500 to-emerald-400 shadow-[0_0_20px_#00e5ff]' :
              state === 'thinking' ? 'bg-gradient-to-tr from-purple-500 to-pink-500 shadow-[0_0_20px_#a855f7]' :
              state === 'speaking' ? 'bg-gradient-to-tr from-cyan-400 to-blue-500 shadow-[0_0_20px_#00e5ff]' :
              'bg-gradient-to-tr from-cyan-800 to-cyan-600 shadow-[0_0_10px_#00e5ff]'
            }`}>
              <Mic className="w-6 h-6 text-black" />
            </div>
          </div>

          {/* Status Label & Waveform */}
          <div className="flex items-center gap-2 mt-3">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-mono text-cyan-300 uppercase tracking-wider">
              {state === 'listening' ? 'Listening for command...' :
               state === 'thinking' ? 'Synthesizing response...' :
               state === 'speaking' ? 'J.A.S.P.E.R. Speaking...' : 'Ready for directive'}
            </span>
          </div>

          {/* Active Audio Wave Bars */}
          {state === 'listening' || state === 'speaking' ? (
            <div className="flex items-center gap-1 h-5 mt-1.5">
              <span className="w-1 bg-cyan-400 rounded-full animate-bounce h-2" />
              <span className="w-1 bg-cyan-300 rounded-full animate-bounce h-5" style={{ animationDelay: '150ms' }} />
              <span className="w-1 bg-cyan-400 rounded-full animate-bounce h-3" style={{ animationDelay: '300ms' }} />
              <span className="w-1 bg-cyan-200 rounded-full animate-bounce h-4" style={{ animationDelay: '450ms' }} />
            </div>
          ) : null}
        </div>

        {/* Live Conversation Bubbles */}
        {(transcript || response) && (
          <div className="flex flex-col gap-2 max-h-36 overflow-y-auto px-1 text-xs">
            {transcript && (
              <div className="self-end bg-cyan-950/60 border border-cyan-500/40 rounded-2xl rounded-tr-sm px-3.5 py-2 text-cyan-200 max-w-[85%]">
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

        {/* ── Quick Tools Grid (Horizontally Scrollable) ──────────────────── */}
        <div className="flex items-center gap-2 overflow-x-auto py-1.5 scrollbar-none text-xs">
          {/* Quick Tool: 5-Min Timer */}
          <button
            onClick={() => {
              processCommand('start a 5 minute timer');
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/40 hover:bg-cyan-950/30 whitespace-nowrap text-gray-300 hover:text-cyan-300 transition-colors shrink-0"
          >
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>5m Timer</span>
          </button>

          {/* Quick Tool: Weather */}
          <button
            onClick={() => {
              processCommand('what is the weather');
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/40 hover:bg-cyan-950/30 whitespace-nowrap text-gray-300 hover:text-cyan-300 transition-colors shrink-0"
          >
            <CloudSun className="w-3.5 h-3.5 text-amber-400" />
            <span>Weather</span>
          </button>

          {/* Quick Tool: Flashlight Toggle */}
          <button
            onClick={toggleFlashlight}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border whitespace-nowrap transition-colors shrink-0 ${
              isFlashlightOn 
                ? 'bg-amber-400/25 border-amber-400 text-amber-300' 
                : 'bg-white/5 border-white/10 text-gray-300 hover:border-cyan-500/40'
            }`}
          >
            <Flashlight className="w-3.5 h-3.5 text-yellow-300" />
            <span>{isFlashlightOn ? 'Torch ON' : 'Torch'}</span>
          </button>

          {/* Quick Tool: Calculator */}
          <button
            onClick={() => {
              setTextInput('calculate ');
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/40 hover:bg-cyan-950/30 whitespace-nowrap text-gray-300 hover:text-cyan-300 transition-colors shrink-0"
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-400" />
            <span>Calculate</span>
          </button>

          {/* Quick Tool: Notes */}
          <button
            onClick={() => {
              processCommand('take a note');
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/40 hover:bg-cyan-950/30 whitespace-nowrap text-gray-300 hover:text-cyan-300 transition-colors shrink-0"
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>Take Note</span>
          </button>

          {/* Quick Tool: Battery Info */}
          {batteryLevel && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 whitespace-nowrap text-gray-300 shrink-0 font-mono">
              <Battery className="w-3.5 h-3.5 text-green-400" />
              <span>{batteryLevel.level}% {batteryLevel.charging ? '⚡' : ''}</span>
            </div>
          )}

          {/* Quick Tool: Web Search */}
          <button
            onClick={() => {
              setTextInput('search for ');
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/40 hover:bg-cyan-950/30 whitespace-nowrap text-gray-300 hover:text-cyan-300 transition-colors shrink-0"
          >
            <Search className="w-3.5 h-3.5 text-purple-400" />
            <span>Search</span>
          </button>

          {/* Quick Tool: Music Toggle */}
          <button
            onClick={() => {
              processCommand('toggle music');
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/40 hover:bg-cyan-950/30 whitespace-nowrap text-gray-300 hover:text-cyan-300 transition-colors shrink-0"
          >
            <Music className="w-3.5 h-3.5 text-pink-400" />
            <span>Music</span>
          </button>
        </div>

        {/* Bottom Input & Action Bar */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={stopAll}
            className="p-2.5 rounded-xl bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-colors shrink-0"
            title="Stop Speech / Reset"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>

          <form 
            onSubmit={(e) => { e.preventDefault(); processCommand(); }}
            className="flex-1 flex items-center bg-black/60 border border-white/15 focus-within:border-cyan-400 rounded-xl px-3 py-2 transition-colors"
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Ask anything or speak..."
              className="flex-1 bg-transparent text-xs text-white placeholder-gray-500 outline-none"
            />
            <button type="submit" className="text-cyan-400 hover:text-cyan-300 p-0.5">
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          <button
            onClick={startVoiceCapture}
            className={`p-2.5 rounded-xl font-bold flex items-center justify-center transition-all shrink-0 ${
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
