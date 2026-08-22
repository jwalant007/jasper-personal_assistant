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
  const [typeInput, setTypeInput] = useState('');
  const [statusLog, setStatusLog] = useState('Remote Desktop Stream Connected');
  const [mouseMode, setMouseMode] = useState('left'); // left, right, double
  const imageRef = useRef(null);

  const fetchScreen = async () => {
    setIsLoadingScreen(true);
    try {
      const res = await fetch(`${getApiBase()}/api/pc/remote/screen`);
      if (res.ok) {
        const data = await res.json();
        if (data.image) setScreenImage(data.image);
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
      interval = setInterval(fetchScreen, 2000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [autoRefresh]);

  const handleScreenClick = async (e) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const xPercent = Math.round((clickX / rect.width) * 100);
    const yPercent = Math.round((clickY / rect.height) * 100);

    setStatusLog(`Sending ${mouseMode} click to Laptop at (${xPercent}%, ${yPercent}%)...`);

    try {
      const res = await fetch(`${getApiBase()}/api/pc/remote/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x: xPercent, y: yPercent, type: mouseMode })
      });
      if (res.ok) {
        setStatusLog(`Click executed at (${xPercent}%, ${yPercent}%)`);
        setTimeout(fetchScreen, 300);
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
    setStatusLog(`Typing text into laptop: "${textToType}"...`);

    try {
      const res = await fetch(`${getApiBase()}/api/pc/remote/type`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToType })
      });
      if (res.ok) {
        setStatusLog(`Typed "${textToType}" successfully into laptop active window.`);
        setTimeout(fetchScreen, 400);
      }
    } catch (err) {
      setStatusLog(`Typing error: ${err.message}`);
    }
  };

  const handleSendHotkey = async (keyName, label) => {
    setStatusLog(`Sending hotkey '${label || keyName}' to laptop...`);
    try {
      const res = await fetch(`${getApiBase()}/api/pc/remote/key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: keyName })
      });
      if (res.ok) {
        setStatusLog(`Hotkey '${label || keyName}' executed on laptop.`);
        setTimeout(fetchScreen, 500);
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

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              autoRefresh 
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' 
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            {autoRefresh ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            {autoRefresh ? 'Auto-Stream ON' : 'Paused'}
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
          <img
            ref={imageRef}
            src={screenImage}
            alt="PC Desktop Live Screen Stream"
            onClick={handleScreenClick}
            className="w-full h-auto max-h-[500px] object-contain cursor-crosshair select-none"
          />
        ) : (
          <div className="text-center py-16 text-slate-500 space-y-2 font-mono">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-2" />
            <p className="text-xs">Connecting to Laptop Screen Mirroring Stream...</p>
          </div>
        )}

        <div className="absolute top-2 left-2 pointer-events-none text-[9px] font-mono bg-black/80 border border-cyan-500/30 px-2 py-0.5 rounded text-cyan-400 uppercase tracking-widest">
          Live Laptop Mirror • Tap to Click
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
