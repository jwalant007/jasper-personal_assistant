import React, { useState, useEffect } from 'react';
import { 
  Lightbulb, 
  Power, 
  Tv, 
  Wind, 
  Zap, 
  Sun, 
  Sliders, 
  Sparkles, 
  Home, 
  ShieldCheck, 
  Activity, 
  Check, 
  RotateCw,
  Palette
} from 'lucide-react';
import { playJarvisBeep } from '../utils/jarvisAudioSynth';

export default function SmartHomeMatrixWidget({ onClose }) {
  const [activeRoom, setActiveRoom] = useState('all');
  const [activePreset, setActivePreset] = useState('focus');
  const [devices, setDevices] = useState(() => {
    const saved = localStorage.getItem('jasper_smarthome_devices');
    if (saved) {
      try { return JSON.parse(saved); } catch (_) {}
    }
    return [
      { id: 'light_main', name: 'Main Ambient Ring', room: 'lab', type: 'light', state: true, brightness: 85, color: '#38bdf8', watts: 18 },
      { id: 'light_strip', name: 'Desk Neon Backlight', room: 'lab', type: 'light', state: true, brightness: 100, color: '#06b6d4', watts: 12 },
      { id: 'ac_unit', name: 'Climate Control AC', room: 'lab', type: 'ac', state: true, temp: 22, mode: 'Cool', watts: 820 },
      { id: 'smart_plug_1', name: 'Dual Monitor Rig', room: 'lab', type: 'plug', state: true, watts: 140 },
      { id: 'living_tv', name: 'Samsung Crystal 4K', room: 'living', type: 'tv', state: true, volume: 24, watts: 110 },
      { id: 'living_light', name: 'Chandelier Dimmers', room: 'living', type: 'light', state: false, brightness: 40, color: '#f59e0b', watts: 0 },
      { id: 'bed_lamp', name: 'Nightstand Aura Lamp', room: 'bedroom', type: 'light', state: false, brightness: 30, color: '#ec4899', watts: 0 },
      { id: 'bed_fan', name: 'Whisper Ceiling Fan', room: 'bedroom', type: 'fan', state: true, speed: 3, watts: 45 },
      { id: 'kitchen_coffee', name: 'Smart Espresso Maker', room: 'kitchen', type: 'plug', state: false, watts: 0 },
      { id: 'kitchen_lights', name: 'Under-Cabinet LEDs', room: 'kitchen', type: 'light', state: true, brightness: 75, color: '#ffffff', watts: 24 }
    ];
  });

  useEffect(() => {
    localStorage.setItem('jasper_smarthome_devices', JSON.stringify(devices));
  }, [devices]);

  const toggleDevice = (id) => {
    playJarvisBeep('click');
    setDevices(prev => prev.map(d => {
      if (d.id === id) {
        const nextState = !d.state;
        return { 
          ...d, 
          state: nextState,
          watts: nextState ? (d.type === 'ac' ? 820 : d.type === 'light' ? 18 : 65) : 0
        };
      }
      return d;
    }));
  };

  const updateDevice = (id, updates) => {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const applyScene = (presetKey) => {
    playJarvisBeep('command');
    setActivePreset(presetKey);

    const sceneConfigs = {
      focus: { color: '#38bdf8', brightness: 90, acTemp: 21 },
      cyberpunk: { color: '#ec4899', brightness: 100, acTemp: 22 },
      cinema: { color: '#f59e0b', brightness: 25, acTemp: 23 },
      night: { color: '#6366f1', brightness: 20, acTemp: 24 },
      stark: { color: '#06b6d4', brightness: 100, acTemp: 20 }
    };

    const cfg = sceneConfigs[presetKey];
    if (!cfg) return;

    setDevices(prev => prev.map(d => {
      if (d.type === 'light') {
        return { ...d, state: true, color: cfg.color, brightness: cfg.brightness, watts: 15 };
      }
      if (d.type === 'ac') {
        return { ...d, state: true, temp: cfg.acTemp, watts: 800 };
      }
      return d;
    }));
  };

  const allOn = () => {
    playJarvisBeep('command');
    setDevices(prev => prev.map(d => ({ ...d, state: true, watts: d.watts || 25 })));
  };

  const allOff = () => {
    playJarvisBeep('command');
    setDevices(prev => prev.map(d => ({ ...d, state: false, watts: 0 })));
  };

  const totalWatts = devices.reduce((acc, d) => acc + (d.state ? (d.watts || 0) : 0), 0);
  const activeCount = devices.filter(d => d.state).length;

  const filteredDevices = activeRoom === 'all' 
    ? devices 
    : devices.filter(d => d.room === activeRoom);

  const rooms = [
    { id: 'all', label: 'All Rooms', icon: Home },
    { id: 'lab', label: 'Workstation Lab', icon: Zap },
    { id: 'living', label: 'Living Room', icon: Tv },
    { id: 'bedroom', label: 'Bedroom', icon: Sun },
    { id: 'kitchen', label: 'Kitchen', icon: Sliders }
  ];

  const presets = [
    { id: 'focus', label: 'Focus Lab', color: 'from-cyan-500 to-blue-600', border: 'border-cyan-400' },
    { id: 'cyberpunk', label: 'Cyberpunk Neon', color: 'from-pink-500 to-purple-600', border: 'border-pink-400' },
    { id: 'cinema', label: 'Cinema Theater', color: 'from-amber-500 to-red-600', border: 'border-amber-400' },
    { id: 'night', label: 'Night Slumber', color: 'from-indigo-600 to-slate-800', border: 'border-indigo-400' },
    { id: 'stark', label: 'Stark Arc Reactor', color: 'from-teal-400 to-emerald-600', border: 'border-teal-400' }
  ];

  return (
    <div className="flex flex-col h-full bg-[#0d1117]/95 text-slate-100 rounded-2xl overflow-hidden border border-cyan-500/20 backdrop-blur-2xl shadow-2xl">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <Home className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold font-orbitron tracking-wider text-cyan-300 flex items-center gap-2 uppercase">
              Smart Home & IoT Matrix
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-mono">
                Zigbee / Tuya / LAN
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Centralized ambient environment automation & power coordinator
            </p>
          </div>
        </div>

        {/* Live Power Gauge */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-950/80 border border-cyan-500/30 px-3.5 py-1.5 rounded-xl font-mono text-xs shadow-inner">
            <Zap className="w-4 h-4 text-amber-400 animate-bounce" style={{ animationDuration: '2s' }} />
            <div>
              <span className="text-slate-400">Total Load: </span>
              <span className="text-amber-300 font-bold">{totalWatts} W</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={allOn}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition-all cursor-pointer"
            >
              All On
            </button>
            <button
              onClick={allOff}
              className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-semibold transition-all cursor-pointer"
            >
              All Off
            </button>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
        {/* Holographic Scene Presets */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Ambient Holographic Scenes
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {presets.map(preset => (
              <button
                key={preset.id}
                onClick={() => applyScene(preset.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                  activePreset === preset.id 
                    ? `${preset.border} bg-cyan-950/40 shadow-[0_0_20px_rgba(6,182,212,0.15)]` 
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${preset.color} mb-1.5 shadow-sm`} />
                <div className="text-xs font-semibold text-slate-200 group-hover:text-white">
                  {preset.label}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">1-Touch Apply</div>
              </button>
            ))}
          </div>
        </div>

        {/* Room Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
          {rooms.map(room => {
            const RoomIcon = room.icon;
            const count = room.id === 'all' 
              ? devices.length 
              : devices.filter(d => d.room === room.id).length;

            return (
              <button
                key={room.id}
                onClick={() => setActiveRoom(room.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  activeRoom === room.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <RoomIcon className="w-3.5 h-3.5" />
                <span>{room.label}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Devices Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredDevices.map(dev => (
            <div
              key={dev.id}
              className={`p-4 rounded-xl border transition-all relative overflow-hidden backdrop-blur-md ${
                dev.state
                  ? 'border-cyan-500/40 bg-gradient-to-br from-slate-900/90 to-cyan-950/20 shadow-[0_0_15px_rgba(6,182,212,0.08)]'
                  : 'border-slate-800 bg-slate-900/40 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2.5 rounded-xl border ${
                    dev.state 
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]' 
                      : 'bg-slate-800/80 border-slate-700 text-slate-500'
                  }`}>
                    {dev.type === 'light' && <Lightbulb className="w-4 h-4" style={{ color: dev.state ? dev.color : undefined }} />}
                    {dev.type === 'ac' && <Wind className="w-4 h-4" />}
                    {dev.type === 'tv' && <Tv className="w-4 h-4" />}
                    {dev.type === 'fan' && <RotateCw className={`w-4 h-4 ${dev.state ? 'animate-spin' : ''}`} style={{ animationDuration: '2s' }} />}
                    {dev.type === 'plug' && <Zap className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                      {dev.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono capitalize">
                      {dev.room} &bull; {dev.state ? `${dev.watts} W` : 'Offline / Standby'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => toggleDevice(dev.id)}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    dev.state
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                  title="Toggle Device Power"
                >
                  <Power className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Light Controls */}
              {dev.type === 'light' && dev.state && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Brightness</span>
                    <span className="text-cyan-300">{dev.brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={dev.brightness}
                    onChange={(e) => updateDevice(dev.id, { brightness: Number(e.target.value) })}
                    className="w-full accent-cyan-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-500 font-mono">Chroma Tint</span>
                    <div className="flex items-center gap-1.5">
                      {['#38bdf8', '#06b6d4', '#ec4899', '#f59e0b', '#10b981', '#ffffff'].map(c => (
                        <button
                          key={c}
                          onClick={() => updateDevice(dev.id, { color: c })}
                          style={{ backgroundColor: c }}
                          className={`w-3.5 h-3.5 rounded-full border transition-transform cursor-pointer ${
                            dev.color === c ? 'scale-125 border-white shadow-sm' : 'border-transparent'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* AC Climate Controls */}
              {dev.type === 'ac' && dev.state && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block">Set Target</span>
                    <span className="text-lg font-bold font-orbitron text-cyan-300">{dev.temp}&deg;C</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateDevice(dev.id, { temp: Math.max(16, dev.temp - 1) })}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-sm cursor-pointer"
                    >
                      -
                    </button>
                    <button
                      onClick={() => updateDevice(dev.id, { temp: Math.min(30, dev.temp + 1) })}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-sm cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Fan Speed Controls */}
              {dev.type === 'fan' && dev.state && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">Fan Speed</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button
                        key={s}
                        onClick={() => updateDevice(dev.id, { speed: s })}
                        className={`w-5 h-5 rounded-md text-[10px] font-bold cursor-pointer transition-all ${
                          dev.speed === s 
                            ? 'bg-cyan-500 text-slate-950 font-bold' 
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Hub Sentinel: {activeCount} of {devices.length} appliances active</span>
        </div>
        <div className="text-[11px] text-cyan-400">
          Subnet Gateway: 192.168.29.1
        </div>
      </div>
    </div>
  );
}
