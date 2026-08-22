import React, { useState } from 'react';
import PcRemoteDesktopWidget from './PcRemoteDesktopWidget';
import PcCommandCenterWidget from './PcCommandCenterWidget';
import { 
  Laptop, 
  Monitor, 
  Power, 
  Search, 
  Cpu, 
  XCircle, 
  Sliders, 
  Lock, 
  VolumeX, 
  Volume2, 
  Globe 
} from 'lucide-react';

export default function PcMasterHubWidget({ onClose }) {
  const [activeTab, setActiveTab] = useState('remote'); // remote, command

  return (
    <div className="bg-slate-950/95 border border-cyan-500/40 rounded-2xl p-5 text-slate-100 backdrop-blur-2xl shadow-2xl max-w-5xl w-full mx-auto relative overflow-hidden font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/40 rounded-xl text-cyan-400">
            <Laptop className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-wider text-cyan-300 uppercase font-orbitron flex items-center gap-2">
              PC Master Control Hub
            </h2>
            <p className="text-xs text-slate-400 font-mono">Unified Laptop Remote Desktop, App Launcher, Power & Diagnostics</p>
          </div>
        </div>

        {onClose && (
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800/60 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-all">
            <XCircle className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
        {[
          { id: 'remote', label: 'Remote Desktop & Mouse/Keyboard', icon: Monitor },
          { id: 'command', label: 'App Launcher & Power Diagnostics', icon: Sliders }
        ].map(tab => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold font-orbitron transition-all flex items-center justify-center gap-2 ${
                isSelected
                  ? 'bg-cyan-500/25 border border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === 'remote' ? (
        <PcRemoteDesktopWidget />
      ) : (
        <PcCommandCenterWidget />
      )}
    </div>
  );
}
