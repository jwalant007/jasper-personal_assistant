import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Square, Play, Sparkles, Settings as SettingsIcon, 
  Maximize2, Minimize2, X, Send, Volume2, VolumeX, Shield, 
  ChevronRight, ArrowRight, CornerDownLeft, Activity, Radio,
  Laptop, Clock, CheckCircle2, AlertCircle
} from 'lucide-react';
import { getApiBase, getWsBase } from '../utils/apiConfig.js';
import { speakDeviceAudio } from '../utils/speakDeviceAudio.js';
import { playChime } from './VoiceController.jsx';

export default function FloatingFunctionBar() {
  // State: 'idle' | 'listening' | 'activated' | 'processing' | 'speaking' | 'muted'
  const [voiceState, setVoiceState] = useState('listening');
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [settings, setSettings] = useState({
    startWithWindows: true,
    backgroundListening: true,
    wakeWordEnabled: true,
    wakeWordSensitivity: 0.65,
    microphoneDevice: 'Default',
    voiceResponsesEnabled: true,
    speechRate: 1.0,
    speechPitch: 1.0,
    globalShortcut: 'CommandOrControl+Alt+J',
    speechRecognitionMode: 'local'
  });

  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const socketRef = useRef(null);
  const containerRef = useRef(null);

  // Sync window size with Electron based on expansion state
  useEffect(() => {
    if (window.jasperElectron?.resizeFloatingBar) {
      if (showSettings) {
        window.jasperElectron.resizeFloatingBar({ width: 480, height: 440 });
      } else if (isExpanded || response || transcript || voiceState === 'activated' || voiceState === 'processing' || voiceState === 'speaking') {
        window.jasperElectron.resizeFloatingBar({ width: 480, height: 280 });
      } else {
        window.jasperElectron.resizeFloatingBar({ width: 480, height: 72 });
      }
    }
  }, [isExpanded, showSettings, response, transcript, voiceState]);

  // Load Initial Settings from Electron if available
  useEffect(() => {
    if (window.jasperElectron?.getSettings) {
      window.jasperElectron.getSettings().then((s) => {
        if (s) {
          setSettings(s);
          if (s.backgroundListening === false) {
            setIsMuted(true);
            setVoiceState('muted');
          }
        }
      }).catch(() => {});
    }
  }, []);

  // Initialize Web Speech Recognition for voice command capture
  useEffect(() => {
    try {
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognitionClass) {
        console.warn('[FloatingBar] Web Speech recognition not supported in this runtime.');
        return;
      }

      const rec = new SpeechRecognitionClass();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setVoiceState('listening');
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

        const text = (final || interim).trim();
        if (text) {
          setTranscript(text);
          setIsExpanded(true);
        }

        if (final.trim()) {
          rec.stop();
          handleCommandSubmit(final.trim());
        } else {
          // Silence detection timeout
          silenceTimerRef.current = setTimeout(() => {
            try { rec.stop(); } catch (_) {}
            if (interim.trim()) {
              handleCommandSubmit(interim.trim());
            }
          }, 2400);
        }
      };

      rec.onerror = (e) => {
        console.warn('[FloatingBar] Speech error:', e);
        if (voiceState === 'activated') {
          setVoiceState('listening');
        }
      };

      rec.onend = () => {
        if (voiceState === 'activated') {
          setVoiceState('listening');
        }
      };

      recognitionRef.current = rec;
    } catch (e) {
      console.warn('[FloatingBar] Speech recognition init failed:', e);
    }

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
      }
    };
  }, [voiceState]);

  // Listen to Electron IPC Events (Wake-Word detection, Tray actions, Listening state)
  useEffect(() => {
    if (!window.jasperElectron) return;

    const unWake = window.jasperElectron.onWakeDetected?.((data) => {
      console.log('[FloatingBar] Wake word detected from background service!', data);
      handleWakeActivation();
    });

    const unListening = window.jasperElectron.onListeningChanged?.((data) => {
      if (data.isListening === false) {
        setIsMuted(true);
        setVoiceState('muted');
      } else {
        setIsMuted(false);
        setVoiceState('listening');
      }
    });

    const unSettings = window.jasperElectron.onOpenSettings?.(() => {
      setShowSettings(true);
    });

    const unToggle = window.jasperElectron.onToggleCommandBar?.(() => {
      setIsExpanded(curr => !curr);
    });

    return () => {
      if (unWake) unWake();
      if (unListening) unListening();
      if (unSettings) unSettings();
      if (unToggle) unToggle();
    };
  }, []);

  // Connect to Backend WebSocket as fallback / cross-process notification
  useEffect(() => {
    const wsUrl = getWsBase();
    if (!wsUrl) return;

    let socket;
    try {
      socket = new WebSocket(wsUrl);
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'WAKE_UP') {
            console.log('[FloatingBar WS] Wake trigger received via WebSocket');
            handleWakeActivation();
          }
        } catch (_) {}
      };
      socketRef.current = socket;
    } catch (_) {}

    return () => {
      if (socket) {
        try { socket.close(); } catch (_) {}
      }
    };
  }, []);

  const handleWakeActivation = () => {
    playChime('wake');
    setVoiceState('activated');
    setTranscript('');
    setResponse('');
    setIsExpanded(true);

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

  const handleCommandSubmit = async (queryText) => {
    const clean = String(queryText || textInput).trim();
    if (!clean) return;

    setTranscript(clean);
    setTextInput('');
    setVoiceState('processing');
    setIsExpanded(true);

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

      // Handle desktop shell actions
      if (data.action === 'hide_bar' && window.jasperElectron?.hideFloatingBar) {
        setTimeout(() => window.jasperElectron.hideFloatingBar(), 2000);
      } else if (data.action === 'mute_listening' && window.jasperElectron?.setListening) {
        window.jasperElectron.setListening(false);
      } else if (data.action === 'unmute_listening' && window.jasperElectron?.setListening) {
        window.jasperElectron.setListening(true);
      } else if (data.action === 'open_main_window' && window.jasperElectron?.openMainWindow) {
        window.jasperElectron.openMainWindow();
      }

      // Voice Response via Text-to-Speech
      if (settings.voiceResponsesEnabled) {
        setVoiceState('speaking');
        speakDeviceAudio(answer, {
          rate: settings.speechRate || 1.0,
          pitch: settings.speechPitch || 1.0,
          onEnd: () => {
            setVoiceState(isMuted ? 'muted' : 'listening');
          },
          onError: () => {
            setVoiceState(isMuted ? 'muted' : 'listening');
          }
        });
      } else {
        setVoiceState(isMuted ? 'muted' : 'listening');
      }
    } catch (e) {
      console.error('[FloatingBar] Query execution error:', e);
      setResponse('Connection failure with JASPER server core.');
      setVoiceState(isMuted ? 'muted' : 'listening');
    }
  };

  const toggleListening = async () => {
    if (window.jasperElectron?.toggleListening) {
      const res = await window.jasperElectron.toggleListening();
      setIsMuted(!res.isListening);
      setVoiceState(res.isListening ? 'listening' : 'muted');
    } else {
      setIsMuted(!isMuted);
      setVoiceState(!isMuted ? 'muted' : 'listening');
    }
  };

  const stopCurrentAction = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch (_) {}
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
    }
    if (window.jasperElectron?.stopSpeech) {
      window.jasperElectron.stopSpeech();
    }
    setVoiceState(isMuted ? 'muted' : 'listening');
    setResponse('Action stopped.');
  };

  const openFullApp = () => {
    if (window.jasperElectron?.openMainWindow) {
      window.jasperElectron.openMainWindow();
    } else {
      window.open('/', '_blank');
    }
  };

  const minimizeOrHideBar = () => {
    if (window.jasperElectron?.hideFloatingBar) {
      window.jasperElectron.hideFloatingBar();
    } else {
      setIsExpanded(false);
    }
  };

  const saveSettingsUpdate = (updates) => {
    const next = { ...settings, ...updates };
    setSettings(next);
    if (window.jasperElectron?.saveSettings) {
      window.jasperElectron.saveSettings(next);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="select-none flex flex-col w-full max-w-[480px] p-2 text-white font-sans antialiased"
      style={{ WebkitAppRegion: 'no-drag' }}
    >
      {/* ── Main Compact Floating Pill ─────────────────────────────────── */}
      <div 
        className="relative flex items-center justify-between px-3 py-2 rounded-2xl bg-[#090b10]/90 backdrop-blur-2xl border border-cyan-500/30 shadow-[0_10px_35px_rgba(0,229,255,0.18)] transition-all duration-300"
        style={{ WebkitAppRegion: 'drag' }}
      >
        {/* Left: Animated Arc Reactor Orb (opens full HUD on click) */}
        <div 
          onClick={openFullApp}
          className="flex items-center gap-2.5 cursor-pointer group"
          title="Click to Open Full J.A.S.P.E.R. HUD"
          style={{ WebkitAppRegion: 'no-drag' }}
        >
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className={`absolute inset-0 rounded-full border border-cyan-400/40 animate-spin-slow transition-opacity ${
              voiceState === 'activated' ? 'border-amber-400 border-2 scale-110 shadow-[0_0_15px_#f59e0b]' :
              voiceState === 'processing' ? 'border-purple-400 shadow-[0_0_15px_#a855f7]' :
              voiceState === 'speaking' ? 'border-cyan-400 shadow-[0_0_15px_#00e5ff]' : ''
            }`} />
            <div className={`w-4 h-4 rounded-full transition-all duration-300 ${
              voiceState === 'muted' ? 'bg-red-500/80 shadow-[0_0_8px_#ef4444]' :
              voiceState === 'activated' ? 'bg-amber-400 shadow-[0_0_12px_#f59e0b] scale-125' :
              voiceState === 'processing' ? 'bg-purple-400 shadow-[0_0_10px_#a855f7] animate-pulse' :
              voiceState === 'speaking' ? 'bg-cyan-300 shadow-[0_0_12px_#00e5ff] scale-110' :
              'bg-cyan-500 shadow-[0_0_8px_#00e5ff]'
            }`} />
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] font-bold tracking-widest text-cyan-400 font-mono flex items-center gap-1.5">
              J.A.S.P.E.R.
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            </span>
            <span className="text-[9px] text-gray-400 tracking-wider">
              {voiceState === 'muted' ? 'MIC MUTED' :
               voiceState === 'activated' ? 'LISTENING...' :
               voiceState === 'processing' ? 'THINKING...' :
               voiceState === 'speaking' ? 'SPEAKING...' : 'ALWAYS-ON STANDBY'}
            </span>
          </div>
        </div>

        {/* Center: Dynamic Waveform Activity Indicator */}
        <div 
          onClick={handleWakeActivation}
          className="flex items-center gap-1 px-3 py-1 rounded-full bg-black/40 border border-white/5 cursor-pointer hover:border-cyan-500/40 transition-colors"
          title="Click to Speak Directive"
          style={{ WebkitAppRegion: 'no-drag' }}
        >
          {voiceState === 'speaking' || voiceState === 'activated' ? (
            <div className="flex items-center gap-0.5 h-4">
              <span className="w-1 bg-cyan-400 rounded-full animate-bounce h-2" style={{ animationDelay: '0ms' }} />
              <span className="w-1 bg-cyan-300 rounded-full animate-bounce h-4" style={{ animationDelay: '150ms' }} />
              <span className="w-1 bg-cyan-400 rounded-full animate-bounce h-3" style={{ animationDelay: '300ms' }} />
              <span className="w-1 bg-cyan-200 rounded-full animate-bounce h-4" style={{ animationDelay: '450ms' }} />
            </div>
          ) : voiceState === 'processing' ? (
            <div className="flex items-center gap-1 text-[10px] text-purple-300 animate-pulse font-mono">
              <Sparkles className="w-3 h-3 animate-spin" />
              <span>Reasoning...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[10px] text-cyan-300/80 font-mono">
              <Radio className={`w-3 h-3 ${voiceState === 'muted' ? 'text-red-400' : 'text-cyan-400 animate-pulse'}`} />
              <span>{voiceState === 'muted' ? 'Muted' : '"Hey Jasper"'}</span>
            </div>
          )}
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-1.5" style={{ WebkitAppRegion: 'no-drag' }}>
          {/* Mic Toggle Button */}
          <button
            onClick={toggleListening}
            className={`p-1.5 rounded-lg transition-colors ${
              voiceState === 'muted'
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25'
            }`}
            title={voiceState === 'muted' ? 'Unmute Background Listening' : 'Mute Microphone'}
          >
            {voiceState === 'muted' ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>

          {/* Stop Button (visible or active during speech/processing) */}
          <button
            onClick={stopCurrentAction}
            className={`p-1.5 rounded-lg transition-colors ${
              voiceState === 'speaking' || voiceState === 'processing'
                ? 'bg-red-500/30 text-red-300 animate-pulse'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
            title="Stop Speech / Cancel"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>

          {/* Expand / Collapse Command Overlay */}
          <button
            onClick={() => {
              setIsExpanded(!isExpanded);
              setShowSettings(false);
            }}
            className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title={isExpanded ? 'Collapse' : 'Type Command'}
          >
            <Send className="w-3.5 h-3.5" />
          </button>

          {/* Settings Button */}
          <button
            onClick={() => {
              setShowSettings(!showSettings);
              setIsExpanded(false);
            }}
            className={`p-1.5 rounded-lg transition-colors ${
              showSettings ? 'bg-cyan-500/30 text-cyan-300' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
            title="Assistant Settings"
          >
            <SettingsIcon className="w-3.5 h-3.5" />
          </button>

          {/* Minimize / Hide Button */}
          <button
            onClick={minimizeOrHideBar}
            className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Hide Floating Bar (Runs in Tray)"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Expanded Interaction Panel (Speech & AI Response) ──────────── */}
      {(isExpanded || response || transcript) && !showSettings && (
        <div 
          className="mt-2 p-3 rounded-2xl bg-[#090b10]/95 backdrop-blur-2xl border border-cyan-500/30 shadow-2xl flex flex-col gap-2.5 animate-fadeIn"
          style={{ WebkitAppRegion: 'no-drag' }}
        >
          {/* Transcript / Input Row */}
          {transcript && (
            <div className="flex items-start gap-2 text-xs text-cyan-300 bg-cyan-950/30 border border-cyan-800/40 p-2 rounded-xl">
              <span className="font-bold text-cyan-400">You:</span>
              <span className="flex-1 italic">{transcript}</span>
            </div>
          )}

          {/* Jasper Response Bubble */}
          {response && (
            <div className="flex flex-col gap-1 text-xs text-gray-200 bg-black/50 border border-white/10 p-2.5 rounded-xl max-h-32 overflow-y-auto leading-relaxed">
              <div className="flex items-center justify-between text-[10px] text-cyan-400 font-mono">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  J.A.S.P.E.R. Core
                </span>
                <button 
                  onClick={() => speakDeviceAudio(response)}
                  className="hover:text-white p-0.5"
                  title="Replay Voice"
                >
                  <Volume2 className="w-3 h-3" />
                </button>
              </div>
              <p className="text-gray-100">{response}</p>
            </div>
          )}

          {/* Text Input Row */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleCommandSubmit(); }}
            className="flex items-center gap-1.5"
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Ask Jasper, open app, set timer..."
              className="flex-1 bg-black/60 border border-white/15 focus:border-cyan-400 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none transition-colors"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center gap-1 transition-colors"
            >
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>
      )}

      {/* ── Settings Drawer ────────────────────────────────────────────── */}
      {showSettings && (
        <div 
          className="mt-2 p-3.5 rounded-2xl bg-[#090b10]/95 backdrop-blur-2xl border border-cyan-500/30 shadow-2xl flex flex-col gap-3 max-h-80 overflow-y-auto animate-fadeIn text-xs"
          style={{ WebkitAppRegion: 'no-drag' }}
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="font-bold text-cyan-400 flex items-center gap-1.5 text-sm">
              <SettingsIcon className="w-4 h-4" />
              Desktop Assistant Settings
            </span>
            <button 
              onClick={() => setShowSettings(false)}
              className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Setting: Start with Windows */}
          <div className="flex items-center justify-between py-1">
            <div className="flex flex-col">
              <span className="text-gray-200 font-medium">Start with Windows</span>
              <span className="text-[10px] text-gray-400">Launch Jasper minimized to tray on boot</span>
            </div>
            <input
              type="checkbox"
              checked={settings.startWithWindows}
              onChange={(e) => saveSettingsUpdate({ startWithWindows: e.target.checked })}
              className="accent-cyan-400 w-4 h-4 cursor-pointer"
            />
          </div>

          {/* Setting: Background Listening */}
          <div className="flex items-center justify-between py-1 border-t border-white/5 pt-2">
            <div className="flex flex-col">
              <span className="text-gray-200 font-medium">Always-On Voice Activation</span>
              <span className="text-[10px] text-gray-400">Listen for "Hey Jasper" in background</span>
            </div>
            <input
              type="checkbox"
              checked={settings.backgroundListening}
              onChange={(e) => {
                const checked = e.target.checked;
                saveSettingsUpdate({ backgroundListening: checked });
                if (window.jasperElectron?.setListening) {
                  window.jasperElectron.setListening(checked);
                }
              }}
              className="accent-cyan-400 w-4 h-4 cursor-pointer"
            />
          </div>

          {/* Setting: Wake Word Sensitivity */}
          <div className="flex flex-col gap-1 border-t border-white/5 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-200 font-medium">Wake Word Sensitivity</span>
              <span className="text-cyan-400 font-mono text-[10px]">
                {Math.round(settings.wakeWordSensitivity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.50"
              max="0.85"
              step="0.05"
              value={settings.wakeWordSensitivity}
              onChange={(e) => saveSettingsUpdate({ wakeWordSensitivity: parseFloat(e.target.value) })}
              className="accent-cyan-400 cursor-pointer h-1.5 bg-gray-700 rounded-lg"
            />
            <div className="flex justify-between text-[9px] text-gray-500 font-mono">
              <span>Low (Fewer Triggers)</span>
              <span>Medium</span>
              <span>High (More Sensitive)</span>
            </div>
          </div>

          {/* Setting: Voice Responses */}
          <div className="flex items-center justify-between py-1 border-t border-white/5 pt-2">
            <div className="flex flex-col">
              <span className="text-gray-200 font-medium">Voice Responses (TTS)</span>
              <span className="text-[10px] text-gray-400">Speak answers out loud</span>
            </div>
            <input
              type="checkbox"
              checked={settings.voiceResponsesEnabled}
              onChange={(e) => saveSettingsUpdate({ voiceResponsesEnabled: e.target.checked })}
              className="accent-cyan-400 w-4 h-4 cursor-pointer"
            />
          </div>

          {/* Setting: Global Shortcut */}
          <div className="flex items-center justify-between py-1 border-t border-white/5 pt-2">
            <div className="flex flex-col">
              <span className="text-gray-200 font-medium">Global Shortcut</span>
              <span className="text-[10px] text-gray-400">Press anywhere to summon bar</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-black/60 border border-white/10 font-mono text-[10px] text-cyan-300">
              {settings.globalShortcut || 'Ctrl+Alt+J'}
            </span>
          </div>

          {/* Privacy Guarantee Note */}
          <div className="p-2 rounded-xl bg-cyan-950/20 border border-cyan-800/30 flex items-start gap-2 text-[10px] text-cyan-300">
            <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              <strong>Local Privacy Guarantee:</strong> Wake-word recognition runs 100% offline via Windows Speech. Microphone audio is never continuously uploaded to cloud providers.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
