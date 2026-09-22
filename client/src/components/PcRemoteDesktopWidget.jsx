import React, { useState, useEffect, useRef } from 'react';
import { getApiBase } from '../utils/apiConfig.js';
import { 
  Monitor, 
  RefreshCw, 
  Send, 
  Lock, 
  Terminal, 
  XCircle, 
  Play, 
  Pause,
  MousePointer,
  Keyboard,
  Cpu,
  Zap,
  Layout,
  CornerDownLeft,
  Delete
} from 'lucide-react';

export default function PcRemoteDesktopWidget({ onClose }) {
  const [screenImage, setScreenImage] = useState(null);
  const [isLoadingScreen, setIsLoadingScreen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(800);
  const [streamQuality, setStreamQuality] = useState('fast'); // 'fast' | 'hq'
  const [latencyMs, setLatencyMs] = useState(null);
  const [bridgeType, setBridgeType] = useState('native');
  const [typeInput, setTypeInput] = useState('');
  const [statusLog, setStatusLog] = useState('Remote Desktop Stream Connected');
  const [mouseMode, setMouseMode] = useState('left'); // left, right, double
  const [clickRipple, setClickRipple] = useState(null);
  const imageRef = useRef(null);

  const fetchScreen = async () => {
    if (isLoadingScreen) return;
    setIsLoadingScreen(true);
    const startTime = Date.now();
    try {
      const q = streamQuality === 'hq' ? 85 : 60;
      const s = streamQuality === 'hq' ? 0.9 : 0.7;
      const res = await fetch(`${getApiBase()}/api/pc/remote/screen?quality=${q}&scale=${s}`);
      const elapsed = Date.now() - startTime;
      setLatencyMs(elapsed);
      if (res.ok) {
        const data = await res.json();
        if (data.image) {
          setScreenImage(data.image);
          if (data.bridge) setBridgeType(data.bridge);
        }
      }
    } catch (err) {
      setStatusLog(`Connection warning: ${err.message}`);
    } finally {
      setIsLoadingScreen(false);
    }
  };

  useEffect(() => {
    fetchScreen();
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchScreen, refreshInterval);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [autoRefresh, refreshInterval, streamQuality]);

  const handleScreenClick = async (e) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const xPercent = Math.round((clickX / rect.width) * 100);
    const yPercent = Math.round((clickY / rect.height) * 100);

    // Visual ripple effect
    setClickRipple({ x: clickX, y: clickY, id: Date.now() });
    setTimeout(() => setClickRipple(null), 600);

    setStatusLog(`Sending ${mouseMode} click at (${xPercent}%, ${yPercent}%)...`);

    const clickStart = Date.now();
    try {
      const res = await fetch(`${getApiBase()}/api/pc/remote/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x: xPercent, y: yPercent, type: mouseMode })
      });
      const clickElapsed = Date.now() - clickStart;
      if (res.ok) {
        setStatusLog(`Click executed in ${clickElapsed}ms at (${xPercent}%, ${yPercent}%)`);
        setTimeout(fetchScreen, 80);
      }
    } catch (err) {
      setStatusLog(`Click failed: ${err.message}`);
    }
  };

  const handleTypeSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!typeInput.trim()) return;

    const textToType = typeInput;
    setTypeInput('');
    setStatusLog(`Typing: "${textToType}"...`);

    const typeStart = Date.now();
    try {
      const res = await fetch(`${getApiBase()}/api/pc/remote/type`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToType })
      });
      const typeElapsed = Date.now() - typeStart;
      if (res.ok) {
        setStatusLog(`Typed "${textToType}" in ${typeElapsed}ms.`);
        setTimeout(fetchScreen, 120);
      }
    } catch (err) {
      setStatusLog(`Typing error: ${err.message}`);
    }
  };

  const handleSendHotkey = async (keyName, label) => {
    setStatusLog(`Sending hotkey '${label || keyName}'...`);
    const keyStart = Date.now();
    try {
      const res = await fetch(`${getApiBase()}/api/pc/remote/key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: keyName })
      });
      const keyElapsed = Date.now() - keyStart;
      if (res.ok) {
        setStatusLog(`Hotkey '${label || keyName}' sent in ${keyElapsed}ms.`);
        setTimeout(fetchScreen, 150);
      }
    } catch (err) {
      setStatusLog(`Hotkey error: ${err.message}`);
    }
  };

  return (
    <div className="bg-slate-950/95 border border-cyan-500/40 rounded-2xl p-5 text-slate-100 backdrop-blur-2xl shadow-2xl max-w-5xl w-full mx-auto relative overflow-hidden font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/40 rounded-xl text-cyan-400">
            <Monitor className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-wider text-cyan-300 uppercase font-orbitron flex items-center gap-2">
              PC Remote Desktop Mirroring
            </h2>
            <p className="text-xs text-slate-400 font-mono">Live Interactive Screen Streaming & Mouse/Keyboard Control</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {latencyMs !== null && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-[11px] font-mono text-cyan-300">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{bridgeType === 'native' ? 'Win32 GDI' : 'PowerShell'}: <strong className="text-emerald-400">{latencyMs}ms</strong></span>
            </div>
          )}

          {/* Rate Selector */}
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-xl px-2 py-1 font-mono focus:outline-none focus:border-cyan-500/40"
            title="Streaming Rate"
          >
            <option value={500}>500ms (Ultra)</option>
            <option value={800}>800ms (Fast)</option>
            <option value={1500}>1.5s (Balanced)</option>
            <option value={3000}>3s (Battery)</option>
          </select>

          {/* Quality Selector */}
          <button
            onClick={() => setStreamQuality(q => q === 'fast' ? 'hq' : 'fast')}
            className="px-2.5 py-1 rounded-xl text-xs font-mono border border-slate-800 bg-slate-900 text-slate-300 hover:text-cyan-300 transition-all"
            title="Toggle Quality (Fast 70% vs HQ 90%)"
          >
            {streamQuality === 'hq' ? '🎨 HQ' : '⚡ Fast'}
          </button>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              autoRefresh 
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' 
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            {autoRefresh ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            {autoRefresh ? 'Live ON' : 'Paused'}
          </button>

          <button
            onClick={fetchScreen}
            disabled={isLoadingScreen}
            className="p-2 bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-4 h-4 text-cyan-400 ${isLoadingScreen ? 'animate-spin' : ''}`} />
          </button>

          {onClose && (
            <button onClick={onClose} className="p-2 rounded-xl bg-slate-800/60 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-all">
              <XCircle className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Mouse Click Mode Selector */}
      <div className="flex items-center justify-between mb-3 bg-slate-900/80 p-2 rounded-xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 uppercase font-mono flex items-center gap-1">
            <MousePointer className="w-3.5 h-3.5 text-cyan-400" /> Tap Action:
          </span>
          {[
            { id: 'left', label: 'Left Click' },
            { id: 'right', label: 'Right Click' },
            { id: 'double', label: 'Double Click' }
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setMouseMode(m.id)}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                mouseMode === m.id
                  ? 'bg-cyan-500/25 border border-cyan-400 text-cyan-200'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30 truncate max-w-xs">
          {statusLog}
        </span>
      </div>

      {/* Main Interactive Desktop Screen Viewport */}
      <div className="relative rounded-xl overflow-hidden border border-cyan-500/30 bg-black flex items-center justify-center min-h-[300px] sm:min-h-[420px] shadow-2xl mb-4 group">
        {screenImage ? (
          <div className="relative inline-block w-full">
            <img
              ref={imageRef}
              src={screenImage}
              alt="PC Desktop Live Screen Stream"
              onClick={handleScreenClick}
              className="w-full h-auto max-h-[500px] object-contain cursor-crosshair select-none block mx-auto"
            />
            {clickRipple && (
              <span
                key={clickRipple.id}
                style={{ left: clickRipple.x, top: clickRipple.y }}
                className="absolute w-6 h-6 -ml-3 -mt-3 bg-cyan-400/80 rounded-full animate-ping pointer-events-none border border-cyan-200 shadow-[0_0_15px_#00f0ff]"
              />
            )}
          </div>
        ) : (
          <div className="text-center py-16 text-slate-500 space-y-2 font-mono">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-2" />
            <p className="text-xs">Connecting to Laptop Screen Mirroring Stream...</p>
          </div>
        )}

        <div className="absolute top-2 left-2 pointer-events-none text-[9px] font-mono bg-black/80 border border-cyan-500/30 px-2 py-0.5 rounded text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Laptop Mirror • Sub-50ms Native Bridge</span>
        </div>
      </div>

      {/* Keystroke & Hotkey Controls Bar */}
      <div className="space-y-3">
        {/* Remote Typing Bar */}
        <form onSubmit={handleTypeSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Keyboard className="w-4 h-4 absolute left-3.5 top-3 text-cyan-400" />
            <input
              type="text"
              placeholder="Type text to send directly to laptop active window..."
              value={typeInput}
              onChange={(e) => setTypeInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500/60 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 focus:outline-none font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={!typeInput.trim()}
            className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" /> Type on PC
          </button>
        </form>

        {/* Quick Hotkey Buttons */}
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { key: 'win_d', label: 'Show Desktop (Win+D)', icon: Layout, color: 'text-cyan-300' },
            { key: 'alt_tab', label: 'Switch App (Alt+Tab)', icon: RefreshCw, color: 'text-purple-300' },
            { key: 'enter', label: 'Enter', icon: CornerDownLeft, color: 'text-emerald-300' },
            { key: 'backspace', label: 'Backspace', icon: Delete, color: 'text-amber-300' },
            { key: 'esc', label: 'Escape', icon: XCircle, color: 'text-rose-300' },
            { key: 'taskmgr', label: 'Task Manager', icon: Cpu, color: 'text-cyan-400' },
            { key: 'lock', label: 'Lock Laptop', icon: Lock, color: 'text-rose-400' }
          ].map(btn => {
            const Icon = btn.icon;
            return (
              <button
                key={btn.key}
                onClick={() => handleSendHotkey(btn.key, btn.label)}
                className="px-3 py-1.5 bg-slate-900/80 hover:bg-cyan-500/20 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-[11px] font-semibold text-slate-300 hover:text-cyan-200 transition-all flex items-center gap-1.5"
              >
                <Icon className={`w-3.5 h-3.5 ${btn.color}`} /> {btn.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
