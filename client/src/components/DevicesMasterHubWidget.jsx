import React, { useState } from 'react';
import PhoneControlWidget from './PhoneControlWidget';
import HealthFitbandWidget from './HealthFitbandWidget';
import TvRemoteWidget from './TvRemoteWidget';
import { 
  Smartphone, 
  Tv, 
  Activity, 
  XCircle, 
  Radio, 
  Heart, 
  Sliders 
} from 'lucide-react';

export default function DevicesMasterHubWidget({ onClose }) {
  const [activeTab, setActiveTab] = useState('phone'); // phone, tv, health

  return (
    <div className="bg-slate-950/95 border border-cyan-500/40 rounded-2xl p-5 text-slate-100 backdrop-blur-2xl shadow-2xl max-w-5xl w-full mx-auto relative overflow-hidden font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/40 rounded-xl text-cyan-400">
            <Smartphone className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-wider text-cyan-300 uppercase font-orbitron flex items-center gap-2">
              Smart Devices Master Hub
            </h2>
            <p className="text-xs text-slate-400 font-mono">Android Phone Uplink • Samsung Smart TV Remote • Fitband Health Telemetry</p>
          </div>
        </div>

        {onClose && (
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800/60 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-all">
            <XCircle className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-4 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
        {[
          { id: 'phone', label: 'Android Smartphone Uplink', icon: Smartphone, color: 'text-cyan-400' },
          { id: 'tv', label: 'Samsung Smart TV Remote', icon: Tv, color: 'text-purple-400' },
          { id: 'health', label: 'Fitband Health Telemetry', icon: Heart, color: 'text-rose-400' }
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
              <Icon className={`w-4 h-4 ${tab.color}`} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === 'phone' && <PhoneControlWidget />}
      {activeTab === 'tv' && <TvRemoteWidget />}
      {activeTab === 'health' && <HealthFitbandWidget />}
    </div>
  );
}
