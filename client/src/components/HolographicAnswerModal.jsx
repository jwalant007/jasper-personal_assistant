import React, { useState } from 'react';
import Hologram3dCanvas from './Hologram3dCanvas';
import { speakMessage } from '../utils/speakDeviceAudio';
import { getApiBase } from '../utils/apiConfig';
import { 
  Box, 
  Sparkles, 
  Play, 
  Pause, 
  XCircle, 
  Send, 
  RotateCw, 
  Cpu, 
  Globe, 
  Zap, 
  Atom, 
  Eye
} from 'lucide-react';

export default function HolographicAnswerModal({ onClose, initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery || 'Explain Spider-Man suit engineering & web tech');
  const [active3dMode, setActive3dMode] = useState('spiderman');
  const [autoRotate, setAutoRotate] = useState(true);
  const [responseText, setResponseText] = useState(
    'Sir, the Spider-Man suit integrates a high-tensile carbon-nanotube weave, micro-actuator artificial muscles, and a high-frequency fluid dispenser capable of emitting synthetic web fluid at 450 PSI.'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const modePresets = [
    { id: 'spiderman', label: 'Spider-Man Cyber Web', emoji: '🕸️', icon: Eye },
    { id: 'atom', label: 'Atomic & Quantum Core', emoji: '⚛️', icon: Atom },
    { id: 'planet', label: 'Solar & Planetary Globe', emoji: '🪐', icon: Globe },
    { id: 'reactor', label: 'Stark Arc Reactor', emoji: '⚡', icon: Zap },
    { id: 'chassis', label: 'Engineering Wireframe', emoji: '⚙️', icon: Cpu }
  ];

  const handleAskQuery = async (queryText) => {
    const q = queryText || query;
    if (!q.trim() || isLoading) return;

    setIsLoading(true);
    setResponseText('Processing neural analysis and synthesizing 3D hologram...');

    // Auto-detect topic for 3D mode
    const lower = q.toLowerCase();
    if (lower.includes('spider') || lower.includes('web') || lower.includes('suit')) setActive3dMode('spiderman');
    else if (lower.includes('atom') || lower.includes('nuclear') || lower.includes('quantum') || lower.includes('molecule')) setActive3dMode('atom');
    else if (lower.includes('planet') || lower.includes('solar') || lower.includes('earth') || lower.includes('space') || lower.includes('globe')) setActive3dMode('planet');
    else if (lower.includes('reactor') || lower.includes('stark') || lower.includes('iron') || lower.includes('energy')) setActive3dMode('reactor');
    else if (lower.includes('engine') || lower.includes('car') || lower.includes('wireframe') || lower.includes('chassis')) setActive3dMode('chassis');

    try {
      const res = await fetch(`${getApiBase()}/api/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q })
      });
      const data = await res.json();
      if (data.response) {
        setResponseText(data.response);
      }
    } catch (err) {
      setResponseText(`At your service, Sir. Analyzed "${q}". 3D Holographic model loaded.`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAudioReadout = () => {
    if (!isPlayingAudio) {
      speakMessage(responseText, () => setIsPlayingAudio(false));
      setIsPlayingAudio(true);
    } else {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
  };

  return (
    <div className="bg-slate-950/95 border border-cyan-500/50 rounded-2xl p-6 text-slate-100 backdrop-blur-2xl shadow-2xl max-w-5xl w-full mx-auto relative overflow-hidden font-sans">
      {/* Background Holographic Ambient Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/40 rounded-xl text-cyan-400">
            <Box className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-wider text-cyan-300 uppercase font-orbitron flex items-center gap-2">
              J.A.S.P.E.R. 3D Holographic Visualizer
            </h2>
            <p className="text-xs text-slate-400 font-mono">Interactive WebGL 3D Holographic Rendering Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              autoRotate 
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200' 
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <RotateCw className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
            Auto-Rotate
          </button>

          {onClose && (
            <button onClick={onClose} className="p-2 rounded-xl bg-slate-800/60 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-all">
              <XCircle className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 3D Mode Selector Pills */}
      <div className="flex flex-wrap gap-2 mb-4 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
        {modePresets.map(preset => {
          const isSelected = active3dMode === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => setActive3dMode(preset.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-cyan-500/25 border border-cyan-400 text-cyan-200 shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>{preset.emoji}</span> {preset.label}
            </button>
          );
        })}
      </div>

      {/* Main Grid Section: Left 3D Model, Right AI Answer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        {/* Left: 3D Hologram Canvas */}
        <div>
          <Hologram3dCanvas mode={active3dMode} autoRotate={autoRotate} />
        </div>

        {/* Right: AI Answer & Audio Controls */}
        <div className="flex flex-col justify-between p-5 bg-slate-900/70 border border-slate-800 rounded-xl space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <span className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" /> J.A.S.P.E.R. 3D Synthesis
              </span>
              <button
                onClick={toggleAudioReadout}
                className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                {isPlayingAudio ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-cyan-400" />}
                {isPlayingAudio ? 'Pause Voice' : 'Listen'}
              </button>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-sans max-h-56 overflow-y-auto pr-1">
              {responseText}
            </p>
          </div>

          {/* Quick 3D Demo Prompts */}
          <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
            <span className="text-[10px] text-slate-500 font-mono uppercase">Quick 3D Hologram Prompts:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Spider-Man suit web tech',
                'Quantum nuclear fusion atom',
                'Solar system planetary orbits',
                'Stark Arc Reactor energy core'
              ].map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(sample);
                    handleAskQuery(sample);
                  }}
                  className="text-[10px] px-2.5 py-1 bg-slate-950 hover:bg-cyan-500/20 border border-slate-800 hover:border-cyan-500/40 rounded-lg text-slate-300 hover:text-cyan-300 transition-colors"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Query Bar */}
      <form onSubmit={(e) => { e.preventDefault(); handleAskQuery(); }} className="flex gap-2">
        <input
          type="text"
          placeholder="Ask any question to generate a 3D Holographic Model (e.g. Spider-Man suit, nuclear physics)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-800 focus:border-cyan-500/60 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="px-5 py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
        >
          <Send className="w-4 h-4" /> Ask & Render 3D
        </button>
      </form>
    </div>
  );
}
