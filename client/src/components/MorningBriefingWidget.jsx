import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  AlertCircle, 
  ShieldCheck, 
  Compass, 
  MessageSquare, 
  Wallet, 
  Coffee, 
  Sparkles,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { getApiBase } from '../utils/apiConfig';
import { speakDeviceAudio } from '../utils/speakDeviceAudio';
import { playJarvisBeep } from '../utils/jarvisAudioSynth';

export default function MorningBriefingWidget({ onClose }) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checklist, setChecklist] = useState({
    hydrate: true,
    calendar: false,
    hardware: true,
    plan: false
  });

  const [briefingData, setBriefingData] = useState({
    dateStr: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
    timeGreeting: new Date().getHours() < 12 ? 'Good morning' : 'Good afternoon',
    weather: { city: 'Mumbai', temp: '28°C', condition: 'Clear Sky', aqi: '64 (Moderate)' },
    calendar: [
      { id: 'm1', time: '10:30 AM', title: 'System Architecture Review', team: 'Deepmind AI Core' },
      { id: 'm2', time: '02:00 PM', title: 'Sprint Demo & Release Sync', team: 'JASPER OS Engineering' }
    ],
    priorityTask: 'Compile and distribute unified J.A.S.P.E.R. v2.0 native client packages',
    dailySafeSpend: 285,
    spentToday: 42,
    vipMessages: [
      { from: 'Team Lead', text: 'Staging environment validated for v2 release', time: '08:14 AM' },
      { from: 'Mom', text: 'Have a great day ahead!', time: '07:45 AM' }
    ],
    spokenText: "Good morning, Jwalant. Today is clear in Mumbai at 28 degrees. Your first briefing is at 10:30 AM with the Deepmind AI Core. Your daily budget buffer is 285 rupees, and all overnight security sentinels report green."
  });

  const fetchBriefing = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api/morning-routine/briefing`);
      if (res.ok) {
        const data = await res.json();
        if (data.briefingText) {
          setBriefingData(prev => ({ ...prev, spokenText: data.briefingText }));
        }
      }
    } catch (_) {
      // Local fallback is already populated
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBriefing();
  }, []);

  const toggleSpokenBriefing = () => {
    playJarvisBeep('command');
    if (!isPlayingAudio) {
      setIsPlayingAudio(true);
      speakDeviceAudio(briefingData.spokenText, () => {
        setIsPlayingAudio(false);
      });
    } else {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
  };

  const toggleCheck = (key) => {
    playJarvisBeep('click');
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col h-full bg-[#0c121e]/95 text-slate-100 rounded-2xl overflow-hidden border border-amber-500/25 backdrop-blur-2xl shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/20 bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
            <Sun className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold font-orbitron tracking-wider text-amber-300 flex items-center gap-2 uppercase">
              Morning Executive Briefing
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 border border-amber-500/40 text-amber-400 font-mono">
                Day Intel
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              {briefingData.dateStr}
            </p>
          </div>
        </div>

        {/* Audio Briefing Button */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={toggleSpokenBriefing}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border shadow-md ${
              isPlayingAudio
                ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                : 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-300'
            }`}
          >
            {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{isPlayingAudio ? 'Stop Speech' : 'Spoken Debrief'}</span>
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
        {/* Morning Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-900/60 to-orange-950/30 border border-amber-500/30 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-base font-bold text-amber-200">
              {briefingData.timeGreeting}, Jwalant
            </div>
            <p className="text-xs text-slate-300 font-mono">
              All morning subsystems are nominal. Weather in {briefingData.weather.city} is {briefingData.weather.temp} &bull; AQI {briefingData.weather.aqi}
            </p>
          </div>
          <div className="text-right font-mono text-xs text-amber-400">
            <span className="text-[10px] text-slate-400 block">Safe Daily Spend</span>
            <span className="text-lg font-bold">₹{briefingData.dailySafeSpend}</span>
          </div>
        </div>

        {/* Grid: Schedule & VIP Comms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Schedule */}
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              Today's Key Engagements
            </div>
            <div className="space-y-2">
              {briefingData.calendar.map(m => (
                <div key={m.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-200">{m.title}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{m.team}</div>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-300 px-2 py-0.5 rounded bg-amber-950/50 border border-amber-500/30">
                    {m.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Overnight VIP Comms */}
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
              Overnight Priority Intelligence
            </div>
            <div className="space-y-2">
              {briefingData.vipMessages.map((v, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-cyan-300">{v.from}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{v.time}</span>
                  </div>
                  <div className="text-xs text-slate-300 font-mono">{v.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Priority Mission & Morning Readiness Checklist */}
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Coffee className="w-3.5 h-3.5 text-amber-400" />
              Morning Readiness Protocol
            </span>
            <span className="text-[10px] font-mono text-emerald-400">
              {Object.values(checklist).filter(Boolean).length} of 4 Complete
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {[
              { key: 'hydrate', label: 'Morning Hydration & Mineral intake' },
              { key: 'calendar', label: 'Review Day Agenda & Meeting buffers' },
              { key: 'hardware', label: 'Subnet & ADB device pairing status' },
              { key: 'plan', label: 'Kick off 90-minute Deep Work sprint' }
            ].map(item => (
              <button
                key={item.key}
                onClick={() => toggleCheck(item.key)}
                className={`p-2.5 rounded-lg border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                  checklist[item.key]
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <CheckCircle2 className={`w-4 h-4 ${checklist[item.key] ? 'text-emerald-400' : 'text-slate-600'}`} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Routine Engine Daemon: ARMED</span>
        </div>
        <div className="text-amber-400">
          Next Auto-Alarm: 07:30 AM
        </div>
      </div>
    </div>
  );
}
