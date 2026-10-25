import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Brain, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  Headphones,
  Sliders,
  Flame,
  Zap
} from 'lucide-react';
import { playJarvisBeep, playJarvisPowerUp } from '../utils/jarvisAudioSynth';

export default function FocusMatrixWidget({ onClose }) {
  const [timerMode, setTimerMode] = useState('focus'); // focus (25m/50m), break (5m/10m)
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(3);
  const [distractionShield, setDistractionShield] = useState(true);

  // Audio Synthesizer states
  const [activeSound, setActiveSound] = useState('none'); // none, gamma, alpha, brown, rain
  const [volume, setVolume] = useState(0.4);

  const audioCtxRef = useRef(null);
  const leftOscRef = useRef(null);
  const rightOscRef = useRef(null);
  const noiseNodeRef = useRef(null);
  const gainNodeRef = useRef(null);

  // Timer Tick
  useEffect(() => {
    let timer;
    if (isRunning && secondsRemaining > 0) {
      timer = setInterval(() => {
        setSecondsRemaining(prev => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0 && isRunning) {
      setIsRunning(false);
      playJarvisPowerUp();
      if (timerMode === 'focus') {
        setCompletedSessions(prev => prev + 1);
        setTimerMode('break');
        setSecondsRemaining(5 * 60);
      } else {
        setTimerMode('focus');
        setSecondsRemaining(durationMinutes * 60);
      }
    }
    return () => clearInterval(timer);
  }, [isRunning, secondsRemaining, timerMode, durationMinutes]);

  const toggleTimer = () => {
    playJarvisBeep('command');
    setIsRunning(prev => !prev);
  };

  const resetTimer = () => {
    playJarvisBeep('click');
    setIsRunning(false);
    setSecondsRemaining(durationMinutes * 60);
  };

  const setDuration = (mins) => {
    playJarvisBeep('click');
    setDurationMinutes(mins);
    setSecondsRemaining(mins * 60);
    setIsRunning(false);
  };

  // Web Audio Synthesizer Controls
  const stopAllAudio = () => {
    if (leftOscRef.current) {
      try { leftOscRef.current.stop(); } catch (_) {}
      leftOscRef.current = null;
    }
    if (rightOscRef.current) {
      try { rightOscRef.current.stop(); } catch (_) {}
      rightOscRef.current = null;
    }
    if (noiseNodeRef.current) {
      try { noiseNodeRef.current.stop(); } catch (_) {}
      noiseNodeRef.current = null;
    }
    setActiveSound('none');
  };

  const startSoundscape = (soundType) => {
    playJarvisBeep('click');
    if (activeSound === soundType) {
      stopAllAudio();
      return;
    }

    stopAllAudio();

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume, ctx.currentTime);
      masterGain.connect(ctx.destination);
      gainNodeRef.current = masterGain;

      if (soundType === 'gamma' || soundType === 'alpha') {
        // Binaural beat synthesis: Left = 200Hz, Right = 200 + delta
        const beatDelta = soundType === 'gamma' ? 40 : 14;

        // Channel merger for true stereo binaural
        const merger = ctx.createChannelMerger(2);

        const oscL = ctx.createOscillator();
        oscL.type = 'sine';
        oscL.frequency.setValueAtTime(200, ctx.currentTime);

        const oscR = ctx.createOscillator();
        oscR.type = 'sine';
        oscR.frequency.setValueAtTime(200 + beatDelta, ctx.currentTime);

        oscL.connect(merger, 0, 0); // left channel
        oscR.connect(merger, 0, 1); // right channel
        merger.connect(masterGain);

        oscL.start();
        oscR.start();

        leftOscRef.current = oscL;
        rightOscRef.current = oscR;
      } else if (soundType === 'brown' || soundType === 'rain') {
        // Procedural noise buffer
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;

        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + (0.02 * white)) / 1.02; // Brown noise formula
          lastOut = output[i];
          output[i] *= soundType === 'rain' ? 3.0 : 2.5;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        if (soundType === 'rain') {
          // Lowpass filter for rain droplets
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(800, ctx.currentTime);
          whiteNoise.connect(filter);
          filter.connect(masterGain);
        } else {
          whiteNoise.connect(masterGain);
        }

        whiteNoise.start();
        noiseNodeRef.current = whiteNoise;
      }

      setActiveSound(soundType);
    } catch (e) {
      console.warn('Audio Synthesis error:', e);
    }
  };

  const handleVolumeChange = (newVol) => {
    setVolume(newVol);
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(newVol, audioCtxRef.current.currentTime);
    }
  };

  useEffect(() => {
    return () => {
      stopAllAudio();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const totalSecs = durationMinutes * 60;
  const progressPercent = Math.round(((totalSecs - secondsRemaining) / totalSecs) * 100);

  return (
    <div className="flex flex-col h-full bg-[#0a0f1d]/95 text-slate-100 rounded-2xl overflow-hidden border border-purple-500/25 backdrop-blur-2xl shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-purple-500/20 bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.25)]">
            <Brain className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold font-orbitron tracking-wider text-purple-300 flex items-center gap-2 uppercase">
              Deep Work & Binaural Soundscape
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 border border-purple-500/40 text-purple-400 font-mono">
                Flow State
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Pomodoro Interval Engine with Web Audio Frequency Generator
            </p>
          </div>
        </div>

        {/* Distraction Shield */}
        <button
          onClick={() => {
            playJarvisBeep('click');
            setDistractionShield(prev => !prev);
          }}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
            distractionShield
              ? 'bg-purple-500/30 border-purple-500 text-purple-300 shadow-sm'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{distractionShield ? 'Distraction Shield: ON' : 'Shield Off'}</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
        {/* Pomodoro Circular HUD */}
        <div className="p-6 rounded-2xl bg-slate-950/80 border border-purple-500/20 flex flex-col items-center justify-center relative overflow-hidden">
          {/* Preset Buttons */}
          <div className="flex items-center gap-2 mb-4">
            {[
              { m: 25, label: '25m Sprint' },
              { m: 50, label: '50m Deep Flow' },
              { m: 90, label: '90m Master' }
            ].map(preset => (
              <button
                key={preset.m}
                onClick={() => setDuration(preset.m)}
                className={`px-3 py-1 rounded-xl text-xs font-mono transition-all cursor-pointer border ${
                  durationMinutes === preset.m
                    ? 'bg-purple-500 text-slate-950 font-bold border-purple-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Time Display */}
          <div className="relative w-48 h-48 flex items-center justify-center my-2">
            <svg className="w-full h-full -rotate-90">
              <circle cx="96" cy="96" r="80" stroke="#1e1b4b" strokeWidth="8" fill="transparent" />
              <circle
                cx="96"
                cy="96"
                r="80"
                stroke="#c084fc"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray="502"
                strokeDashoffset={502 - (502 * progressPercent) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center space-y-0.5">
              <div className="text-4xl font-bold font-orbitron text-purple-200 tracking-wider">
                {formatTime(secondsRemaining)}
              </div>
              <div className="text-[11px] font-mono uppercase text-purple-400">
                {timerMode === 'focus' ? 'Focus Interval' : 'Restorative Break'}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={toggleTimer}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg transition-transform hover:scale-105 ${
                isRunning
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                  : 'bg-purple-500 text-slate-950 hover:bg-purple-400'
              }`}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isRunning ? 'Pause Flow' : 'Begin Sprint'}</span>
            </button>
            <button
              onClick={resetTimer}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Synthesizer Deck */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Headphones className="w-4 h-4 text-purple-400" />
              Procedural Soundscape Synthesizer
            </span>
            <span className="text-[10px] font-mono text-purple-400">Pure Web Audio</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'gamma', name: '40Hz Gamma Focus', desc: 'Peak cognitive throughput' },
              { id: 'alpha', name: '14Hz Alpha Flow', desc: 'Relaxed creative focus' },
              { id: 'brown', name: 'Deep Brown Noise', desc: 'Acoustic background mask' },
              { id: 'rain', name: 'Procedural Rain', desc: 'Calming rainstorm' }
            ].map(snd => (
              <button
                key={snd.id}
                onClick={() => startSoundscape(snd.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  activeSound === snd.id
                    ? 'bg-purple-500/25 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold text-slate-200 mb-0.5">{snd.name}</div>
                <div className="text-[10px] text-slate-400 font-mono">{snd.desc}</div>
              </button>
            ))}
          </div>

          {/* Volume Slider */}
          <div className="flex items-center gap-3 pt-2">
            <Volume2 className="w-4 h-4 text-slate-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="flex-1 accent-purple-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="text-xs font-mono text-purple-300 w-10 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span>Daily Flow Streak: {completedSessions} Sessions Completed</span>
        </div>
        <div className="text-purple-400">
          State: {isRunning ? 'IN FLOW' : 'PAUSED'}
        </div>
      </div>
    </div>
  );
}
