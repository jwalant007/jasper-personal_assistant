import React, { useState, useEffect } from 'react';
import { Cpu, Database, HardDrive, RefreshCw } from 'lucide-react';
import { API_BASE } from '../utils/apiConfig.js';

export default function DiagnosticWidget() {
  const [data, setData] = useState({
    platform: 'win32',
    arch: 'x64',
    hostname: 'Stark-Core-01',
    uptime: 0,
    cpuModel: 'Intel Core i9',
    cpuCount: 16,
    memory: {
      total: 16000000000,
      free: 8000000000,
      used: 8000000000,
      usagePercent: 50
    }
  });

  const [logs, setLogs] = useState([
    'Initializing Stark OS v4.1...',
    'System core load: Nominal',
    'Port 3001 Express socket bind: OK',
    'Voice trigger loop background hook: ACTIVE',
    'Waiting for wake command...'
  ]);

  useEffect(() => {
    fetchDiagnostics();
    const interval = setInterval(fetchDiagnostics, 3000);
    
    // Diagnostic stream generator for cool hacky feel
    const logInterval = setInterval(() => {
      const phrases = [
        'Syncing matrix core voltages...',
        'Memory stack cleanup completed.',
        'Analyzing neural pathways...',
        'Power levels stable at 100%.',
        'Local WebSocket clients active: 1',
        'Scouting TV network nodes...',
        'Ping default playback audio: NOMINAL',
        'Ready for voice query trigger...'
      ];
      const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
      const timestamp = new Date().toLocaleTimeString();
      setLogs((prev) => [`[${timestamp}] ${randomPhrase}`, ...prev.slice(0, 10)]);
    }, 4500);

    return () => {
      clearInterval(interval);
      clearInterval(logInterval);
    };
  }, []);

  const fetchDiagnostics = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/system/diagnostics`);
      if (res.ok) {
        const diagData = await res.json();
        setData(diagData);
      }
    } catch (e) {
      // Keep static mock fallback if offline
    }
  };

  const formatUptime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatBytes = (bytes) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)} GB`;
  };

  return (
    <div className="flex flex-col h-full font-sans text-xs select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5 mb-3">
        <div className="flex items-center gap-2 font-semibold text-white">
          <Cpu size={15} className="text-indigo-400" />
          <span>System Diagnostics</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          <RefreshCw size={10} className="animate-spin" style={{ animationDuration: '6s' }} />
          <span>Live Feed</span>
        </div>
      </div>

      {/* Grid Diagnostics */}
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        {/* CPU Panel */}
        <div className="bg-slate-900/60 border border-white/[0.08] p-3 rounded-xl flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-slate-400 font-medium text-[11px]">
            <Cpu size={12} className="text-indigo-400" /> CPU Telemetry
          </div>
          <div className="text-xs text-slate-200 truncate font-semibold" title={data.cpuModel}>
            {data.cpuModel}
          </div>
          <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-400 font-mono">
            <div>Cores: <span className="text-white font-semibold">{data.cpuCount}</span></div>
            <div>Arch: <span className="text-white font-semibold">{data.arch}</span></div>
          </div>
          {/* Live CPU core indicators */}
          <div className="flex gap-1 mt-1.5">
            {Array.from({ length: Math.min(data.cpuCount, 16) }).map((_, idx) => {
              const isActive = (idx * 7 + Date.now() / 1000) % 3 > 0.8;
              return (
                <div 
                  key={idx} 
                  className={`w-1.5 h-3.5 rounded-full transition-colors duration-300 ${isActive ? 'bg-indigo-400' : 'bg-slate-800'}`}
                />
              );
            })}
          </div>
        </div>

        {/* RAM Panel */}
        <div className="bg-slate-900/60 border border-white/[0.08] p-3 rounded-xl flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium text-[11px]">
              <Database size={12} className="text-sky-400" /> Memory (RAM)
            </div>
            <span className="text-sky-400 text-xs font-mono font-semibold">{data.memory.usagePercent}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden my-1">
            <div className="h-full bg-sky-400 rounded-full transition-all duration-300" style={{ width: `${data.memory.usagePercent}%` }} />
          </div>
          <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-400 font-mono">
            <div>Used: <span className="text-white font-semibold">{formatBytes(data.memory.used)}</span></div>
            <div>Free: <span className="text-white font-semibold">{formatBytes(data.memory.free)}</span></div>
          </div>
        </div>
      </div>

      {/* OS Details Banner */}
      <div className="bg-slate-900/60 border border-white/[0.08] p-2.5 rounded-xl grid grid-cols-3 gap-2 mb-3 text-xs text-slate-400 text-center font-mono">
        <div>
          Host: <span className="text-white font-semibold uppercase block truncate">{data.hostname}</span>
        </div>
        <div>
          Platform: <span className="text-white font-semibold uppercase block">{data.platform}</span>
        </div>
        <div>
          Uptime: <span className="text-white font-semibold block">{formatUptime(data.uptime)}</span>
        </div>
      </div>

      {/* Logging Terminal Output */}
      <div className="flex-1 bg-slate-950/70 border border-white/[0.08] rounded-xl p-3 flex flex-col overflow-hidden">
        <div className="text-[11px] text-slate-400 font-medium border-b border-white/[0.06] pb-1.5 mb-2 flex justify-between items-center">
          <span>System Action Stream</span>
          <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Connected
          </span>
        </div>
        <div className="flex-1 overflow-y-auto font-mono text-[10px] text-slate-300 flex flex-col gap-1 pr-1 custom-scrollbar">
          {logs.map((log, index) => (
            <div key={index} className="truncate select-text">
              <span className="text-indigo-400 font-semibold">&gt;&gt;</span> {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
