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
    <div className="flex flex-col h-full font-mono text-xs select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 mb-3">
        <div className="flex items-center gap-1.5 font-orbitron font-bold text-cyan-400 tracking-wider">
          <Cpu size={14} className="text-cyan-400 animate-pulse" />
          JASPER SYSTEM CORE DIAGNOSTICS
        </div>
        <div className="flex items-center gap-1 text-[9px] text-sky-500 font-bold">
          <RefreshCw size={10} className="animate-spin" style={{ animationDuration: '6s' }} />
          LIVE DIAGS
        </div>
      </div>

      {/* Grid Diagnostics */}
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        {/* CPU Panel */}
        <div className="bg-cyan-950/10 border border-cyan-500/10 p-2 rounded flex flex-col gap-1.5">
          <div className="flex items-center gap-1 text-sky-400 font-bold uppercase text-[9px]">
            <Cpu size={11} /> CPU Diagnostics
          </div>
          <div className="text-[10px] text-cyan-100 truncate font-semibold" title={data.cpuModel}>
            {data.cpuModel}
          </div>
          <div className="grid grid-cols-2 gap-1 text-[9px] text-sky-500">
            <div>CORES: <span className="text-cyan-400 font-bold">{data.cpuCount}</span></div>
            <div>ARCH: <span className="text-cyan-400 font-bold">{data.arch}</span></div>
          </div>
          {/* Futuristic live CPU core blocks */}
          <div className="flex gap-0.5 mt-1">
            {Array.from({ length: Math.min(data.cpuCount, 16) }).map((_, idx) => {
              // Mock load variation per core
              const isActive = (idx * 7 + Date.now() / 1000) % 3 > 0.8;
              return (
                <div 
                  key={idx} 
                  className={`w-1.5 h-3 rounded-sm transition-colors duration-300 ${isActive ? 'bg-cyan-400 shadow-[0_0_4px_rgba(0,240,255,0.6)]' : 'bg-cyan-950/40 border border-cyan-850/20'}`}
                />
              );
            })}
          </div>
        </div>

        {/* RAM Panel */}
        <div className="bg-cyan-950/10 border border-cyan-500/10 p-2 rounded flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-sky-400 font-bold uppercase text-[9px]">
              <Database size={11} /> Memory Core
            </div>
            <span className="text-cyan-400 text-[9px] font-bold glow-cyan">{data.memory.usagePercent}%</span>
          </div>
          <div className="progress-container my-1">
            <div className="progress-fill" style={{ width: `${data.memory.usagePercent}%` }} />
          </div>
          <div className="grid grid-cols-2 gap-1 text-[9px] text-sky-500">
            <div>USED: <span className="text-cyan-400 font-bold">{formatBytes(data.memory.used)}</span></div>
            <div>FREE: <span className="text-cyan-400 font-bold">{formatBytes(data.memory.free)}</span></div>
          </div>
          {/* Paging blocks */}
          <div className="flex justify-between text-[7px] text-cyan-800/60 select-none mt-0.5 leading-none">
            <span>[||||||||||||]</span>
            <span>SWAP: NOMINAL</span>
          </div>
        </div>
      </div>

      {/* OS Details Banner */}
      <div className="bg-cyan-950/10 border border-cyan-500/10 p-2 rounded grid grid-cols-3 gap-1 mb-3 text-[9px] text-sky-500 text-center">
        <div>
          HOST: <span className="text-cyan-400 font-bold uppercase block truncate">{data.hostname}</span>
        </div>
        <div>
          PLATFORM: <span className="text-cyan-400 font-bold uppercase block">{data.platform}</span>
        </div>
        <div>
          UPTIME: <span className="text-cyan-400 font-bold block">{formatUptime(data.uptime)}</span>
        </div>
      </div>

      {/* Logging Terminal Output */}
      <div className="flex-1 bg-black/40 border border-cyan-500/10 rounded p-2 flex flex-col overflow-hidden">
        <div className="text-[9px] text-sky-400 font-bold border-b border-cyan-500/10 pb-1 mb-1 uppercase tracking-wider flex justify-between items-center">
          <span>System Action Stream</span>
          <span className="flex items-center gap-1 text-[8px] text-green-400">
            <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
            LIVE FEED
          </span>
        </div>
        <div className="flex-1 overflow-y-auto font-mono text-[9px] text-cyan-300/80 flex flex-col gap-1 pr-1">
          {logs.map((log, index) => (
            <div key={index} className="truncate select-text">
              <span className="text-sky-600 font-semibold">&gt;&gt;</span> {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
