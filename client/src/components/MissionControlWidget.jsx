import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Tv, 
  Smartphone, 
  Laptop, 
  Calendar, 
  CloudSun, 
  Trophy, 
  MessageSquare, 
  BatteryCharging, 
  Cpu, 
  Sparkles, 
  Box,
  Bell, 
  Zap, 
  CheckCircle2, 
  ArrowUpRight,
  RefreshCw,
  XCircle
} from 'lucide-react';
import { subscribeLocation } from '../utils/locationService';

export default function MissionControlWidget({ onClose, onNavigate }) {
  const [cpuLoad, setCpuLoad] = useState(38);
  const [memoryUsage, setMemoryUsage] = useState(64);
  const [batteryLevel, setBatteryLevel] = useState(84);
  const [timeStr, setTimeStr] = useState('');
  const [locationInfo, setLocationInfo] = useState(null);
  const [weatherData, setWeatherData] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeLocation((loc) => {
      if (loc) {
        setLocationInfo(loc);
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current_weather=true`)
          .then(res => res.json())
          .then(data => {
            if (data && data.current_weather) {
              setWeatherData(data.current_weather);
            }
          })
          .catch(err => console.warn('[MissionControl] Weather fetch error:', err));
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTimeStr(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const cpuInterval = setInterval(() => {
      setCpuLoad(prev => Math.min(95, Math.max(15, prev + Math.floor(Math.random() * 9 - 4))));
    }, 2000);
    return () => clearInterval(cpuInterval);
  }, []);

  const scheduleItems = [
    { time: '09:00 AM', title: 'AI Architecture Review', status: 'Completed', icon: 'check' },
    { time: '11:30 AM', title: 'Football Match: Real Madrid vs Man City', status: 'Upcoming', icon: 'sports' },
    { time: '03:00 PM', title: 'System Diagnostics & Sync', status: 'Scheduled', icon: 'sync' },
    { time: '07:30 PM', title: 'Evening Automation Run', status: 'Pending', icon: 'auto' },
  ];

  const unreadMessages = [
    { sender: 'J.A.S.P.E.R. Core', text: 'All neural modules synchronized cleanly.', time: '2m ago', priority: 'high' },
    { sender: 'Home Automation', text: 'TV power saving rule triggered at 20% battery.', time: '14m ago', priority: 'normal' },
    { sender: 'Sports Alert', text: 'Arsenal signed new midfielder! Tap for briefing.', time: '1h ago', priority: 'medium' }
  ];

  return (
    <div className="bg-slate-950/90 border border-cyan-500/30 rounded-2xl p-6 text-slate-100 backdrop-blur-xl shadow-2xl max-w-5xl w-full mx-auto relative overflow-hidden">
      {/* Background Holographic Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-cyan-500/20 pb-5 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono tracking-widest uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5 animate-spin" /> Mission Control • Command Center
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-wider font-orbitron flex items-center gap-3">
            GOOD MORNING, JWALANT
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            System status: Optimal • Voice synthesis operational • {timeStr}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => onNavigate && onNavigate('hologram3d')}
            className="px-3.5 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400 rounded-xl text-xs font-semibold text-purple-200 flex items-center gap-1.5 transition-all shadow-md shadow-purple-500/10"
          >
            <Box className="w-4 h-4 text-purple-400 animate-pulse" /> 3D Hologram
          </button>
          <button 
            onClick={() => onNavigate && onNavigate('swarm')}
            className="px-3.5 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 rounded-xl text-xs font-semibold text-cyan-200 flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/10"
          >
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" /> Swarm Coordinator
          </button>
          <button 
            onClick={() => onNavigate && onNavigate('sports')}
            className="px-3.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400 rounded-xl text-xs font-semibold text-emerald-200 flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/10"
          >
            <Trophy className="w-4 h-4 text-emerald-400" /> Sports Hub
          </button>
          <button 
            onClick={() => onNavigate && onNavigate('automation')}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-all"
          >
            <Zap className="w-4 h-4 text-cyan-400" /> Automations
          </button>
          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded-xl bg-slate-800/60 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-all">
              <XCircle className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Connected Nodes Status Bar (From Mockup) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-3 bg-slate-900/80 border border-emerald-500/30 rounded-xl flex items-center gap-3 shadow-lg">
          <div className="p-2 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-emerald-400">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-300 font-mono">Memory Active</div>
            <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> 100% Operational
            </div>
          </div>
        </div>

        <div className="p-3 bg-slate-900/80 border border-cyan-500/30 rounded-xl flex items-center gap-3 shadow-lg">
          <div className="p-2 bg-cyan-500/15 border border-cyan-500/30 rounded-lg text-cyan-400">
            <Tv className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-300 font-mono">TV Connected</div>
            <div className="text-[10px] text-cyan-400 flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Living Room OLED
            </div>
          </div>
        </div>

        <div className="p-3 bg-slate-900/80 border border-blue-500/30 rounded-xl flex items-center gap-3 shadow-lg">
          <div className="p-2 bg-blue-500/15 border border-blue-500/30 rounded-lg text-blue-400">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-300 font-mono">Phone Connected</div>
            <div className="text-[10px] text-blue-400 flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Galaxy Ultra • 84%
            </div>
          </div>
        </div>

        <div className="p-3 bg-slate-900/80 border border-purple-500/30 rounded-xl flex items-center gap-3 shadow-lg">
          <div className="p-2 bg-purple-500/15 border border-purple-500/30 rounded-lg text-purple-400">
            <Laptop className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-300 font-mono">Laptop Online</div>
            <div className="text-[10px] text-purple-400 flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> Antigravity Workstation
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today's Schedule */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 hover:border-cyan-500/30 rounded-xl transition-all">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" /> Today's Schedule
            </h3>
            <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20 font-mono">
              4 Events
            </span>
          </div>
          <div className="space-y-2.5">
            {scheduleItems.map((item, idx) => (
              <div key={idx} className="p-2.5 bg-slate-950/70 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-200">{item.title}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.time}</div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                  item.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  item.status === 'Upcoming' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-slate-800 text-slate-400'
                }`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Weather & Football News */}
        <div className="space-y-4">
          {/* Weather Widget */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 hover:border-cyan-500/30 rounded-xl transition-all">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <CloudSun className="w-4 h-4 text-amber-400" /> Weather
              </h3>
              <button 
                onClick={() => onNavigate && onNavigate('weather')}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
              >
                Forecast <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-black text-white font-orbitron">
                  {weatherData ? `${weatherData.temperature}°C` : '--°C'}
                </div>
                <div className="text-xs text-slate-300 font-medium mt-0.5">
                  {locationInfo?.city || 'Detecting Location...'} {locationInfo?.country ? `• ${locationInfo.country}` : ''}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-1">
                  Wind: {weatherData ? `${weatherData.windspeed} km/h` : '--'} • Live GPS Telemetry
                </div>
              </div>
              <CloudSun className="w-12 h-12 text-amber-400/80 animate-bounce" style={{ animationDuration: '4s' }} />
            </div>
          </div>

          {/* Football News */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 hover:border-emerald-500/30 rounded-xl transition-all">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Trophy className="w-4 h-4 text-emerald-400" /> Football News
              </h3>
              <button 
                onClick={() => onNavigate && onNavigate('sports')}
                className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono"
              >
                Sports Hub <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-2">
              <div className="p-2 bg-slate-950/70 rounded-lg border border-slate-800 text-xs">
                <div className="font-bold text-emerald-300">UCL Quarter Final Tonight</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Real Madrid vs Manchester City kickoff at 00:30 IST.</div>
              </div>
              <div className="p-2 bg-slate-950/70 rounded-lg border border-slate-800 text-xs">
                <div className="font-bold text-slate-200">Premier League Title Race</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Arsenal lead table by 2 points with 5 matches left.</div>
              </div>
            </div>
          </div>
        </div>

        {/* System Stats (Battery, Messages, CPU) */}
        <div className="space-y-4">
          {/* Unread Messages */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 hover:border-purple-500/30 rounded-xl transition-all">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-400" /> Unread Messages
              </h3>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-mono">
                3 New
              </span>
            </div>
            <div className="space-y-2">
              {unreadMessages.map((msg, idx) => (
                <div key={idx} className="p-2 bg-slate-950/70 rounded-lg border border-slate-800 text-xs flex justify-between items-start">
                  <div>
                    <span className="font-semibold text-slate-200">{msg.sender}: </span>
                    <span className="text-slate-400 text-[11px]">{msg.text}</span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono ml-2 shrink-0">{msg.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Battery & CPU Monitoring */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl grid grid-cols-2 gap-3">
            {/* Battery Status */}
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-2 font-mono">
                <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" /> Battery
              </div>
              <div className="text-lg font-black text-emerald-400 font-orbitron">{batteryLevel}%</div>
              <div className="w-full bg-slate-950 rounded-full h-1.5 mt-2 border border-slate-800 overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: `${batteryLevel}%` }} />
              </div>
              <div className="text-[9px] text-slate-400 mt-1 font-mono">Estimated 6h 40m</div>
            </div>

            {/* CPU Usage */}
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-2 font-mono">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" /> CPU Usage
              </div>
              <div className="text-lg font-black text-cyan-400 font-orbitron">{cpuLoad}%</div>
              <div className="w-full bg-slate-950 rounded-full h-1.5 mt-2 border border-slate-800 overflow-hidden">
                <div className="bg-cyan-400 h-full rounded-full transition-all duration-500" style={{ width: `${cpuLoad}%` }} />
              </div>
              <div className="text-[9px] text-slate-400 mt-1 font-mono">8 Cores • 3.8 GHz</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
