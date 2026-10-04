import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneCall, PhoneOff, Mic, MicOff, Volume2, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { unlockDeviceAudio, speakDeviceAudio } from '../utils/speakDeviceAudio';

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
      // North American / European standard ringing frequencies (440Hz + 480Hz)
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

      // Repeat ring after 3.2s cadence
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
  callData, // { relayId, clientName, dealValue, urgencyMinutes, speechPrompt }
  onAnswer,
  onDecline,
  onRelaySuccess
}) {
  const [callState, setCallState] = useState('ringing'); // 'ringing' | 'connected' | 'listening' | 'relaying' | 'finished'
  const [callSeconds, setCallSeconds] = useState(0);
  const [speechText, setSpeechText] = useState('');
  const [recognizedVoiceText, setRecognizedVoiceText] = useState('');
  const [isMicListening, setIsMicListening] = useState(false);
  const [statusSubtitle, setStatusSubtitle] = useState('Incoming Secure Audio Call...');

  const ringtoneRef = useRef(null);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  const clientName = callData?.clientName || 'Miami Enterprise Client';
  const dealValueStr = callData?.dealValue ? `$${callData.dealValue.toLocaleString()}` : '$17,000';
  const deadlineMins = callData?.urgencyMinutes || 20;
  const promptToSpeak = callData?.speechPrompt || `Sir, the ${clientName} is on the other line. He wants to sign tonight for ${dealValueStr}, but I am the only one with you. He is leaving in ${deadlineMins} minutes. Should I tell him you are on your way?`;

  // Initialize ringtone on mount
  useEffect(() => {
    ringtoneRef.current = new PhoneRingtone();
    ringtoneRef.current.start();

    // Vibrate phone if mobile
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([500, 250, 500, 250, 500]);
      } catch (e) {}
    }

    return () => {
      if (ringtoneRef.current) ringtoneRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  // Call timer when connected
  useEffect(() => {
    if (callState === 'connected' || callState === 'listening' || callState === 'relaying') {
      timerRef.current = setInterval(() => {
        setCallSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  const formatTimer = (totalSec) => {
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Answer the call
  const handleAnswerCall = () => {
    unlockDeviceAudio();
    if (ringtoneRef.current) ringtoneRef.current.stop();
    setCallState('connected');
    setStatusSubtitle('Call Connected • JASPER Speaking...');

    // Speak prompt aloud using TTS
    speakDeviceAudio(promptToSpeak, {
      onStart: () => {
        setSpeechText(promptToSpeak);
      },
      onEnd: () => {
        startListeningForReply();
      },
      onError: () => {
        startListeningForReply();
      }
    });

    if (onAnswer) onAnswer();
  };

  // Decline the call
  const handleDeclineCall = () => {
    if (ringtoneRef.current) ringtoneRef.current.stop();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setCallState('finished');
    if (onDecline) onDecline();
  };

  // Start microphone speech recognition for user's voice reply
  const startListeningForReply = () => {
    setCallState('listening');
    setStatusSubtitle('Listening for your instruction... Speak into mic or tap quick response');
    setIsMicListening(true);

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        const recognition = new SpeechRec();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map(r => r[0].transcript)
            .join('');
          setRecognizedVoiceText(transcript);

          if (event.results[0].isFinal) {
            handleOwnerInstruction(transcript);
          }
        };

        recognition.onerror = () => {
          setIsMicListening(false);
        };

        recognition.onend = () => {
          setIsMicListening(false);
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        setIsMicListening(false);
      }
    }
  };

  // Process the owner's response (voice or button tap)
  const handleOwnerInstruction = async (text) => {
    const responseText = text || "I'm on my way, tell him 1 minute!";
    setCallState('relaying');
    setStatusSubtitle('Relaying instruction to held client on Line 1...');
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    // Jasper speaks confirmation back to owner
    const confirmation = "Understood sir. Relaying to the client on Line 1 and launching Google Meet on your screen right now.";
    speakDeviceAudio(confirmation, {
      onEnd: async () => {
        await executeRelay(responseText);
      }
    });
  };

  const executeRelay = async (responseText) => {
    try {
      const relayId = callData?.relayId;
      // Post to backend relay handler
      const res = await fetch('/api/telephony/relay-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          relayId,
          response: responseText
        })
      });
      const data = await res.json();
      console.log('[JasperIncomingCallModal] Relay dispatched:', data);
    } catch (e) {
      console.warn('[JasperIncomingCallModal] Relay dispatch warning:', e);
    }

    setCallState('finished');
    if (onRelaySuccess) onRelaySuccess();
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-md rounded-3xl border-2 border-cyan-500/40 bg-gradient-to-b from-slate-950 via-slate-900 to-black p-6 sm:p-8 shadow-[0_0_80px_rgba(6,182,212,0.35)] flex flex-col items-center text-center overflow-hidden">
        
        {/* Holographic scanner top highlight */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />

        {/* Header Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[10px] font-orbitron tracking-widest uppercase mb-6">
          <ShieldAlert className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Priority Line 2 • Autonomous Outbound Call</span>
        </div>

        {/* Avatar Ring & Pulse */}
        <div className="relative my-4 flex items-center justify-center">
          {callState === 'ringing' && (
            <>
              <div className="absolute w-36 h-36 rounded-full border-2 border-cyan-400/40 animate-ping" />
              <div className="absolute w-44 h-44 rounded-full border border-cyan-500/20 animate-pulse" />
            </>
          )}

          <div className="relative w-28 h-28 rounded-full bg-gradient-to-tr from-cyan-600 to-sky-400 p-1 shadow-[0_0_40px_rgba(6,182,212,0.6)] flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center">
              <span className="font-orbitron font-black text-2xl text-cyan-400 tracking-wider">J</span>
              <span className="text-[9px] font-mono text-cyan-300 font-bold">JASPER AI</span>
            </div>
          </div>
        </div>

        {/* Caller Title */}
        <h2 className="font-orbitron font-extrabold text-2xl text-white tracking-wide mt-2">
          J.A.S.P.E.R.
        </h2>
        <p className="text-cyan-400 font-mono text-xs mt-1 tracking-wider uppercase font-semibold">
          {callState === 'ringing' ? 'Incoming Audio Call...' : `Call Active • ${formatTimer(callSeconds)}`}
        </p>
        <p className="text-slate-400 text-xs mt-1 font-sans">
          {statusSubtitle}
        </p>

        {/* Urgent Deal Badge */}
        <div className="mt-4 px-4 py-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 w-full text-left font-mono">
          <div className="flex justify-between items-center text-[10px] text-cyan-300">
            <span>CLIENT ON LINE 1:</span>
            <span className="font-bold text-amber-300">{dealValueStr} CONTRACT</span>
          </div>
          <p className="text-sm font-bold text-white mt-0.5 truncate">
            {clientName}
          </p>
          <p className="text-[11px] text-slate-300 mt-1">
            ⚠️ Client leaving in <span className="text-amber-400 font-bold">{deadlineMins} mins</span>. Requesting immediate confirmation.
          </p>
        </div>

        {/* Connected Voice Dialogue Box */}
        {(callState === 'connected' || callState === 'listening' || callState === 'relaying') && (
          <div className="mt-4 w-full p-4 rounded-xl bg-black/60 border border-cyan-500/40 text-left font-mono">
            <div className="flex items-center gap-2 text-[10px] text-cyan-400 uppercase font-bold mb-1">
              <Volume2 className="w-3.5 h-3.5 animate-pulse text-cyan-300" />
              <span>JASPER VOICE BRIEFING:</span>
            </div>
            <p className="text-xs text-cyan-100 italic leading-relaxed">
              "{speechText || promptToSpeak}"
            </p>

            {/* Audio Wave Visualizer Simulation */}
            <div className="flex items-center justify-center gap-1.5 py-3">
              {[40, 70, 95, 60, 85, 45, 90, 75, 50, 80].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-cyan-400 rounded-full animate-pulse"
                  style={{
                    height: `${(h / 100) * 24}px`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '0.8s'
                  }}
                />
              ))}
            </div>

            {recognizedVoiceText && (
              <div className="mt-2 pt-2 border-t border-cyan-500/20 text-xs text-amber-300 font-sans">
                <span className="text-slate-400 text-[10px] font-mono uppercase block">Your Spoken Reply:</span>
                "{recognizedVoiceText}"
              </div>
            )}
          </div>
        )}

        {/* Quick Voice Reply Options (When Connected or Listening) */}
        {(callState === 'connected' || callState === 'listening') && (
          <div className="mt-4 w-full flex flex-col gap-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider text-left">
              Speak into mic or tap quick answer:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleOwnerInstruction("I'm on my way, tell him 1 minute!")}
                className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-orbitron font-bold text-xs tracking-wider shadow-lg shadow-green-900/50 transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                "ON MY WAY (1 MIN)"
              </button>

              <button
                onClick={() => handleOwnerInstruction("Tell him I'll be there in 5 minutes.")}
                className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-200 border border-cyan-500/30 font-orbitron font-bold text-xs tracking-wider transition-all"
              >
                "5 MINUTES"
              </button>
            </div>
          </div>
        )}

        {/* Ringing Call Actions */}
        {callState === 'ringing' && (
          <div className="mt-8 w-full flex items-center justify-around">
            {/* Decline Button */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleDeclineCall}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 text-white flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.6)] transition-all cursor-pointer"
                title="Decline Call"
              >
                <PhoneOff className="w-7 h-7" />
              </button>
              <span className="text-xs font-mono text-slate-400 font-semibold">Decline</span>
            </div>

            {/* Answer Button */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleAnswerCall}
                className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.8)] animate-bounce transition-all cursor-pointer"
                title="Answer Call"
              >
                <PhoneCall className="w-7 h-7" />
              </button>
              <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">Answer Call</span>
            </div>
          </div>
        )}

        {/* Connected Hang-Up Button */}
        {(callState === 'connected' || callState === 'listening' || callState === 'relaying') && (
          <div className="mt-6">
            <button
              onClick={handleDeclineCall}
              className="px-6 py-2.5 rounded-full bg-red-600/80 hover:bg-red-500 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-red-900/40 transition-all cursor-pointer"
            >
              <PhoneOff className="w-4 h-4" />
              <span>End Call</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
