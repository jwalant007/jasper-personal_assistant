import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Activity, 
  Zap, 
  Thermometer, 
  HardDrive, 
  BatteryCharging, 
  Sparkles, 
  RefreshCw, 
  ShieldCheck, 
  Flame, 
  Sliders,
  Smartphone,
  Headphones,
  Mouse
} from 'lucide-react';
import { playJarvisBeep, playJarvisPowerUp } from '../utils/jarvisAudioSynth';

export default function HardwareHudWidget({ onClose }) {
  const [turboMode, setTurboMode] = useState(false);
  const [isFlushingRam, setIsFlushingRam] = useState(false);

  const [telemetry, setTelemetry] = useState({
    cpuUsage: 18,
    cpuTemp: 44,
    cpuClock: '4.20 GHz',
    gpuUsage: 26,
    gpuTemp: 52,
    vramUsed: 3.2,
    ramUsed: 7.8,
    ramTotal: 16.0,
    ssdSpeed: '1.8 GB/s',
    fanRpm: 1850
  });

  const [peripherals, setPeripherals] = useState([
    { id: 'mouse', name: 'Logitech MX Master 3S', type: 'mouse', battery: 88, status: 'Connected (2.4GHz)' },
    { id: 'keyboard', name: 'Keychron Mechanical Q1', type: 'keyboard', battery: 72, status: 'Connected (BT5.1)' },
    { id: 'headset', name: 'Sony WH-1000XM5', type: 'headset', battery: 64, status: 'Active (ANC On)' },
    { id: 'fitband', name: 'Galaxy Smart Band 7', type: 'fitband', battery: 91, status: 'Paired & Syncing' }
  ]);

  // Subtle live jitter effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry(prev => ({
        ...prev,
        cpuUsage: Math.min(100, Math.max(5, prev.cpuUsage + Math.floor(Math.random() * 7 - 3))),
        gpuUsage: Math.min(100, Math.max(8, prev.gpuUsage + Math.floor(Math.random() * 5 - 2))),
        fanRpm: turboMode ? 3200 : Math.max(1600, prev.fanRpm + Math.floor(Math.random() * 40 - 20))
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, [turboMode]);

  const toggleTurbo = () => {
    playJarvisPowerUp();
    setTurboMode(prev => !prev);
  };

  const flushRam = () => {
    playJarvisBeep('command');
    setIsFlushingRam(true);
    setTimeout(() => {
      setTelemetry(prev => ({ ...prev, ramUsed: Math.max(3.5, prev.ramUsed - 2.1) }));
      setIsFlushingRam(false);
      playJarvisBeep('success');
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0d14]/95 text-slate-100 rounded-2xl overflow-hidden border border-cyan-500/25 backdrop-blur-2xl shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold font-orbitron tracking-wider text-cyan-300 flex items-center gap-2 uppercase">
              Hardware Telemetry & Thermal H.U.D.
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-mono">
                Stark Arch
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Silicon Core Temperatures, Memory Clocks & Peripheral Batteries
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={flushRam}
            disabled={isFlushingRam}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFlushingRam ? 'animate-spin' : ''}`} />
            <span>{isFlushingRam ? 'Purging...' : 'Flush Standby RAM'}</span>
          </button>
          <button
            onClick={toggleTurbo}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              turboMode 
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{turboMode ? 'Turbo Mode: ENGAGED' : 'Engage Turbo'}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
        {/* Circular Gauges Deck */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {/* CPU Gauge */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/30 flex flex-col items-center text-center">
            <span className="text-[10px] font-mono uppercase text-slate-400 mb-2">CPU Core Utilization</span>
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle cx="40" cy="40" r="32" stroke="#1e293b" strokeWidth="6" fill="transparent" />
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  stroke="#38bdf8"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray="200"
                  strokeDashoffset={200 - (200 * telemetry.cpuUsage) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute font-orbitron font-bold text-sm text-cyan-300">{telemetry.cpuUsage}%</span>
            </div>
            <span className="text-xs font-mono text-slate-300 mt-2">{telemetry.cpuClock} &bull; {telemetry.cpuTemp}&deg;C</span>
          </div>

          {/* GPU Gauge */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 flex flex-col items-center text-center">
            <span className="text-[10px] font-mono uppercase text-slate-400 mb-2">GPU Accelerator Load</span>
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle cx="40" cy="40" r="32" stroke="#1e293b" strokeWidth="6" fill="transparent" />
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  stroke="#10b981"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray="200"
                  strokeDashoffset={200 - (200 * telemetry.gpuUsage) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute font-orbitron font-bold text-sm text-emerald-300">{telemetry.gpuUsage}%</span>
            </div>
            <span className="text-xs font-mono text-slate-300 mt-2">{telemetry.vramUsed} GB VRAM &bull; {telemetry.gpuTemp}&deg;C</span>
          </div>

          {/* RAM Gauge */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30 flex flex-col items-center text-center">
            <span className="text-[10px] font-mono uppercase text-slate-400 mb-2">Unified System Memory</span>
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle cx="40" cy="40" r="32" stroke="#1e293b" strokeWidth="6" fill="transparent" />
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  stroke="#f59e0b"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray="200"
                  strokeDashoffset={200 - (200 * (telemetry.ramUsed / telemetry.ramTotal))}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute font-orbitron font-bold text-sm text-amber-300">
                {Math.round((telemetry.ramUsed / telemetry.ramTotal) * 100)}%
              </span>
            </div>
            <span className="text-xs font-mono text-slate-300 mt-2">{telemetry.ramUsed.toFixed(1)} / {telemetry.ramTotal} GB</span>
          </div>

          {/* Fan RPM Gauge */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-rose-500/30 flex flex-col items-center text-center">
            <span className="text-[10px] font-mono uppercase text-slate-400 mb-2">Active Cooling Fan</span>
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle cx="40" cy="40" r="32" stroke="#1e293b" strokeWidth="6" fill="transparent" />
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  stroke="#f43f5e"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray="200"
                  strokeDashoffset={200 - (200 * (telemetry.fanRpm / 4000))}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute font-orbitron font-bold text-xs text-rose-300">{telemetry.fanRpm}</span>
            </div>
            <span className="text-xs font-mono text-slate-300 mt-2">RPM &bull; Thermal Stable</span>
          </div>
        </div>

        {/* Wireless Peripherals Battery Deck */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BatteryCharging className="w-4 h-4 text-emerald-400" />
              Connected Peripherals Battery Matrix
            </span>
            <span className="text-[10px] font-mono text-slate-400">Bluetooth LE Link</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {peripherals.map(p => (
              <div key={p.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                    {p.type === 'mouse' && <Mouse className="w-3.5 h-3.5 text-cyan-400" />}
                    {p.type === 'keyboard' && <Sliders className="w-3.5 h-3.5 text-amber-400" />}
                    {p.type === 'headset' && <Headphones className="w-3.5 h-3.5 text-purple-400" />}
                    {p.type === 'fitband' && <Smartphone className="w-3.5 h-3.5 text-emerald-400" />}
                    <span className="truncate max-w-[120px]">{p.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">{p.status}</div>
                </div>

                <div className="text-right font-mono">
                  <span className={`text-sm font-bold ${p.battery > 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {p.battery}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Thermal Throttling Protection: ACTIVE (Max 92°C Threshold)</span>
        </div>
        <div className="text-cyan-400">
          Vulkan / DirectML Drivers: Ready
        </div>
      </div>
    </div>
  );
}
