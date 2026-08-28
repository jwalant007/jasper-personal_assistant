import React, { useState, useEffect } from 'react';
import { getApiBase } from '../utils/apiConfig.js';
import { BarChart3, MessageSquare, Mic, Image as ImageIcon, Zap, Smartphone, Clock, RefreshCw, XCircle } from 'lucide-react';

export default function AnalyticsWidget({ onClose }) {
  const [stats, setStats] = useState({
    conversations: 42,
    voiceCommands: 128,
    imagesGenerated: 15,
    automationRuns: 24,
    connectedDevices: 3,
    uptimeSeconds: 3600
  });

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/analytics`);
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (secs) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="bg-slate-950/90 border border-indigo-500/30 rounded-2xl p-6 text-slate-100 backdrop-blur-xl shadow-2xl max-w-4xl w-full mx-auto relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-indigo-500/20 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/40 rounded-xl text-indigo-400">
            <BarChart3 className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-wider text-indigo-300 uppercase">System Analytics</h2>
            <p className="text-xs text-slate-400">Live Metric Dashboard & Usage Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAnalytics} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-indigo-300">
            <RefreshCw className="w-4 h-4" />
          </button>
          {onClose && (
            <button onClick={onClose} className="p-2 rounded-lg bg-slate-800/60 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400">
              <XCircle className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Conversations', val: stats.conversations, icon: MessageSquare, color: 'text-blue-400', border: 'border-blue-500/30' },
          { label: 'Voice Commands', val: stats.voiceCommands, icon: Mic, color: 'text-emerald-400', border: 'border-emerald-500/30' },
          { label: 'Images Generated', val: stats.imagesGenerated, icon: ImageIcon, color: 'text-purple-400', border: 'border-purple-500/30' },
          { label: 'Automation Runs', val: stats.automationRuns, icon: Zap, color: 'text-amber-400', border: 'border-amber-500/30' },
          { label: 'Connected Devices', val: stats.connectedDevices, icon: Smartphone, color: 'text-cyan-400', border: 'border-cyan-500/30' },
          { label: 'System Uptime', val: formatUptime(stats.uptimeSeconds || 0), icon: Clock, color: 'text-rose-400', border: 'border-rose-500/30' }
        ].map((item, idx) => {
          const IconComp = item.icon;
          return (
            <div key={idx} className={`p-4 bg-slate-900/80 border ${item.border} rounded-xl hover:scale-[1.02] transition-transform`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-medium">{item.label}</span>
                <IconComp className={`w-4 h-4 ${item.color}`} />
              </div>
              <p className={`text-2xl font-extrabold ${item.color} font-mono`}>{item.val}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
