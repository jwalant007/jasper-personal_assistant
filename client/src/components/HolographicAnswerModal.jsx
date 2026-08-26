import React, { useState, useEffect, useRef } from 'react';
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
  RotateCcw,
  Clock, 
  Cpu, 
  Globe, 
  Zap, 
  Atom, 
  Eye,
  ZoomIn,
  Maximize2,
  Sliders,
  Layers,
  Flame,
  Sun,
  RefreshCcw,
  Bot,
  Activity
} from 'lucide-react';

export default function HolographicAnswerModal({ onClose, initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery || 'Explain Spider-Man suit engineering & web tech');
  const [active3dMode, setActive3dMode] = useState('spiderman');
  const [poseMode, setPoseMode] = useState('crouch');
  const [bloomEnabled, setBloomEnabled] = useState(true);
  const [webFiring, setWebFiring] = useState(true);
  const [explodedView, setExplodedView] = useState(false);
  const [nanotechReassembling, setNanotechReassembling] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [hudOverlay, setHudOverlay] = useState(true);
  const [cameraPreset, setCameraPresetState] = useState('full');
  
  // 4D TEMPORAL DYNAMICS STATES
  const [is4dEnabled, setIs4dEnabled] = useState(true);
  const [time4d, setTime4d] = useState(0.0);
  const [timeSpeed4d, setTimeSpeed4d] = useState(1.0);
  const [is4dPlaying, setIs4dPlaying] = useState(true);

  const [responseText, setResponseText] = useState(
    'Sir, the Spider-Man suit integrates a high-tensile carbon-nanotube weave, micro-actuator artificial muscles, and a high-frequency fluid dispenser capable of emitting synthetic web fluid at 450 PSI.'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [spidermanSuit, setSpidermanSuit] = useState('upgraded');

  const canvasRef = useRef(null);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      handleAskQuery(initialQuery);
    }
  }, [initialQuery]);

  // 4D Temporal Time Slider Loop
  useEffect(() => {
    let interval;
    if (is4dEnabled && is4dPlaying) {
      interval = setInterval(() => {
        setTime4d(prev => (prev >= 10.0 ? 0 : prev + 0.1 * timeSpeed4d));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [is4dEnabled, is4dPlaying, timeSpeed4d]);

  const modePresets = [
    { id: 'spiderman', label: 'Spider-Man Cyber Web', emoji: '🕸️', icon: Eye },
    { id: 'ironman', label: 'Iron Man Arc Core', emoji: '⚡', icon: Zap },
    { id: 'v8engine', label: 'V8 Engine Blueprint', emoji: '⚙️', icon: Cpu },
    { id: 'cyberdrone', label: 'Autonomous Cyber Drone', emoji: '🚁', icon: Bot },
    { id: 'quantumvortex', label: 'Quantum Particle Vortex', emoji: '🌀', icon: Sparkles },
    { id: 'atom', label: 'Atomic Core', emoji: '⚛️', icon: Atom },
    { id: 'dna', label: 'DNA Genetic Sequence', emoji: '🧬', icon: Sparkles },
    { id: 'planet', label: 'Planetary Globe', emoji: '🪐', icon: Globe }
  ];

  const suitPresets = [
    { id: 'upgraded', label: 'Upgraded Red & Black', color: 'text-rose-400', badge: '🕷️ Red & Black (Far From Home)' },
    { id: 'classic', label: 'Classic Red & Blue', color: 'text-cyan-400', badge: '🔴 Peter Parker' },
    { id: 'ironspider', label: 'Iron Spider Nanotech', color: 'text-amber-400', badge: '⚡ Gold Nanotech' },
    { id: 'symbiote', label: 'Symbiote Black', color: 'text-slate-300', badge: '🖤 Black Suit' },
    { id: 'miles', label: 'Miles Morales', color: 'text-rose-400', badge: '🕷️ Red/Black Web' },
    { id: '2099', label: 'Spider-Man 2099', color: 'text-purple-400', badge: '🤖 Miguel O\'Hara' }
  ];

  const handleAskQuery = async (queryText) => {
    const q = queryText || query;
    if (!q.trim() || isLoading) return;

    setIsLoading(true);
    setResponseText('Processing neural analysis and running 3D/4D simulation...');

    const lower = q.toLowerCase();
    if (lower.includes('4d') || lower.includes('fourth dimension') || lower.includes('temporal') || lower.includes('time warp') || lower.includes('tesseract')) {
      setIs4dEnabled(true);
    }
    if (lower.includes('spider') || lower.includes('web') || lower.includes('suit')) setActive3dMode('spiderman');
    else if (lower.includes('iron') || lower.includes('stark') || lower.includes('arc')) setActive3dMode('ironman');
    else if (lower.includes('engine') || lower.includes('v8') || lower.includes('motor') || lower.includes('piston')) setActive3dMode('v8engine');
    else if (lower.includes('drone') || lower.includes('quad') || lower.includes('uav')) setActive3dMode('cyberdrone');
    else if (lower.includes('vortex') || lower.includes('swirl') || lower.includes('wormhole')) setActive3dMode('quantumvortex');
    else if (lower.includes('atom') || lower.includes('nuclear') || lower.includes('quantum') || lower.includes('physics')) setActive3dMode('atom');
    else if (lower.includes('dna') || lower.includes('gene') || lower.includes('biology')) setActive3dMode('dna');
    else if (lower.includes('planet') || lower.includes('earth') || lower.includes('globe')) setActive3dMode('planet');

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
      setResponseText(`At your service, Sir. Analyzed "${q}". 3D/4D Holographic model loaded.`);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerNanotechReassembly = () => {
    setNanotechReassembling(true);
    setTimeout(() => setNanotechReassembling(false), 2500);
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

  const switchCameraView = (preset) => {
    setCameraPresetState(preset);
    if (canvasRef.current && canvasRef.current.setCameraPreset) {
      canvasRef.current.setCameraPreset(preset);
    }
  };

  return (
    <div className="bg-slate-950/95 border border-cyan-500/50 rounded-2xl p-6 text-slate-100 backdrop-blur-2xl shadow-2xl max-w-5xl w-full mx-auto relative overflow-hidden font-sans">
      {/* Ambient Background Glow */}
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
              J.A.S.P.E.R. 4D Hologram & Nanotech Suite
            </h2>
            <p className="text-xs text-slate-400 font-mono">4D Temporal Dynamics • Exploded 3D Blueprint • Tesseract Projection</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIs4dEnabled(!is4dEnabled)}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              is4dEnabled 
                ? 'bg-purple-500/30 border-purple-400 text-purple-200 animate-pulse shadow-lg shadow-purple-500/30' 
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
            title="Toggle 4D Temporal Dynamics & Tesseract Projection"
          >
            <Clock className="w-4 h-4 text-purple-400" />
            4D Temporal {is4dEnabled ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={() => setExplodedView(!explodedView)}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              explodedView 
                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 animate-pulse' 
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
            title="Toggle 3D Exploded Blueprint View"
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            Exploded View
          </button>

          <button
            onClick={triggerNanotechReassembly}
            className="p-2 bg-amber-500/20 border border-amber-400 text-amber-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-amber-500/30 transition-all"
            title="Trigger Nanotech Suit Reassembly Particles"
          >
            <RefreshCcw className="w-4 h-4 text-amber-400" />
            Reassemble
          </button>

          <button
            onClick={() => setBloomEnabled(!bloomEnabled)}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              bloomEnabled 
                ? 'bg-amber-500/20 border-amber-400 text-amber-200' 
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <Sun className="w-4 h-4" />
            Bloom
          </button>

          {onClose && (
            <button onClick={onClose} className="p-2 rounded-xl bg-slate-800/60 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-all">
              <XCircle className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 4D Temporal Control Timeline Bar */}
      {is4dEnabled && (
        <div className="mb-3 bg-purple-950/40 border border-purple-500/40 rounded-xl p-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-purple-300">
              <Clock className="w-4 h-4 text-purple-400 animate-spin" />
              <span>🌌 4D TEMPORAL DYNAMICS TIMELINE (T = {time4d.toFixed(2)}s)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIs4dPlaying(!is4dPlaying)}
                className="px-2.5 py-1 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/50 rounded-lg text-xs font-semibold text-purple-200 flex items-center gap-1"
              >
                {is4dPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {is4dPlaying ? 'Pause Time' : 'Play Time'}
              </button>

              <button
                onClick={() => setTime4d(0.0)}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300"
                title="Reset Time t = 0"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <span className="text-[10px] font-mono text-purple-300 bg-slate-900 border border-slate-800 px-2 py-1 rounded">
                Speed: {timeSpeed4d}x
              </span>
              {[0.5, 1.0, 2.0, 4.0].map(s => (
                <button
                  key={s}
                  onClick={() => setTimeSpeed4d(s)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    timeSpeed4d === s ? 'bg-purple-500 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-slate-400">t = 0s</span>
            <input
              type="range"
              min="0"
              max="10"
              step="0.05"
              value={time4d}
              onChange={(e) => setTime4d(parseFloat(e.target.value))}
              className="flex-1 accent-purple-400 bg-slate-900 h-2 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] font-mono text-purple-400 font-bold">t = 10s</span>
          </div>
        </div>
      )}

      {/* 3D Mode Selector Pills */}
      <div className="flex flex-wrap gap-2 mb-3 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
        {modePresets.map(preset => {
          const isSelected = active3dMode === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => setActive3dMode(preset.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
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

      {/* Spider-Man Suit & Action Controls Bar */}
      {active3dMode === 'spiderman' && (
        <div className="space-y-2 mb-4">
          <div className="flex flex-wrap items-center gap-2 bg-purple-950/30 p-2 rounded-xl border border-purple-500/30 text-xs">
            <span className="text-[10px] font-orbitron font-bold text-purple-300 uppercase tracking-wider mr-1">
              🕷️ SPIDER-MAN ARMORY SUITS:
            </span>
            {suitPresets.map(suit => (
              <button
                key={suit.id}
                onClick={() => {
                  setSpidermanSuit(suit.id);
                  triggerNanotechReassembly();
                  setResponseText(`Sir, loaded Spider-Man ${suit.label} 3D Holographic Model into view.`);
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  spidermanSuit === suit.id
                    ? 'bg-purple-500/30 border border-purple-400 text-purple-200 shadow-md shadow-purple-500/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {suit.badge}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 bg-rose-950/20 p-2 rounded-xl border border-rose-500/30 text-xs">
            <span className="text-[10px] font-orbitron font-bold text-rose-300 uppercase tracking-wider mr-1">
              🦸 ACTION POSING & WEB CANNON:
            </span>
            <button
              onClick={() => setPoseMode(poseMode === 'crouch' ? 'standing' : 'crouch')}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                poseMode === 'crouch'
                  ? 'bg-rose-500/30 border-rose-400 text-rose-200'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              {poseMode === 'crouch' ? '🦸 Crouch Action Pose' : '🚶 Standing Hero Stance'}
            </button>

            <button
              onClick={() => setWebFiring(!webFiring)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 border ${
                webFiring
                  ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <Flame className="w-3 h-3 text-cyan-400" />
              {webFiring ? '🕸️ 3D Web Stream ON' : '🕸️ Web Stream OFF'}
            </button>
          </div>
        </div>
      )}

      {/* 4K Camera Inspection Presets Bar */}
      <div className="flex flex-wrap items-center gap-2 mb-3 bg-slate-900/60 p-2 rounded-xl border border-cyan-500/20 text-xs">
        <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
          <ZoomIn className="w-3.5 h-3.5 text-cyan-400" /> 4K CAMERA INSPECTOR:
        </span>
        {[
          { id: 'full', label: 'Full Body Model', icon: Maximize2 },
          { id: 'texture', label: '🔍 4K Suit Micro-Texture Zoom', icon: ZoomIn },
          { id: 'lens', label: '👁️ Eye Lens Shutter Close-up', icon: Eye },
          { id: 'shooter', label: '⚙️ Wrist Web-Shooter Close-up', icon: Sliders }
        ].map(cam => (
          <button
            key={cam.id}
            onClick={() => switchCameraView(cam.id)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
              cameraPreset === cam.id
                ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-100 shadow-sm'
                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {cam.label}
          </button>
        ))}
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <div>
          <Hologram3dCanvas
            ref={canvasRef}
            mode={active3dMode}
            spidermanSuit={spidermanSuit}
            poseMode={poseMode}
            autoRotate={autoRotate}
            hudOverlay={hudOverlay}
            bloomEnabled={bloomEnabled}
            webFiring={webFiring}
            explodedView={explodedView}
            nanotechReassembling={nanotechReassembling}
            is4dEnabled={is4dEnabled}
            time4d={time4d}
            timeSpeed4d={timeSpeed4d}
            is4dPlaying={is4dPlaying}
          />
        </div>

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

          <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
            <span className="text-[10px] text-slate-500 font-mono uppercase">Quick 3D Hologram Prompts:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Spider-Man suit web tech',
                'Iron Man Arc Reactor core',
                'V8 Internal combustion engine',
                'Autonomous cyber drone recon',
                'Quantum particle swirl vortex'
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
          placeholder="Ask any question to generate a 3D Holographic Model (e.g. Iron Man core, V8 engine, Cyber drone)..."
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
