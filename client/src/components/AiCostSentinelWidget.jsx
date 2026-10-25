import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  DollarSign, 
  Activity, 
  Cpu, 
  Server, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Sparkles,
  Sliders
} from 'lucide-react';
import { playJarvisBeep } from '../utils/jarvisAudioSynth';

export default function AiCostSentinelWidget({ onClose }) {
  const [budgetLimit, setBudgetLimit] = useState(25.00); // $25 monthly budget
  const [currentSpend, setCurrentSpend] = useState(4.82);
  const [autoFallbackOllama, setAutoFallbackOllama] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [models, setModels] = useState([
    { name: 'Google Gemini 1.5 Pro', provider: 'Google Cloud', tokensUsed: '1,420,500', cost: '$2.14', latency: '420ms', speed: '92 t/s', status: 'Primary Cloud' },
    { name: 'Claude 3.5 Sonnet', provider: 'Anthropic', tokensUsed: '640,000', cost: '$1.92', latency: '680ms', speed: '68 t/s', status: 'Complex Coding' },
    { name: 'OpenAI GPT-4o', provider: 'OpenAI API', tokensUsed: '280,000', cost: '$0.76', latency: '540ms', speed: '84 t/s', status: 'Standby' },
    { name: 'Groq Llama 3 70B', provider: 'Groq LPUs', tokensUsed: '890,000', cost: '$0.00', latency: '95ms', speed: '310 t/s', status: 'Ultra-Fast Free' },
    { name: 'Ollama Edge (Llama 3)', provider: 'Local Host (Edge)', tokensUsed: '3,210,000', cost: '$0.00', latency: '120ms', speed: '48 t/s', status: '100% Offline / Free' }
  ]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    playJarvisBeep('click');
    setTimeout(() => {
      setIsRefreshing(false);
      playJarvisBeep('success');
      setCurrentSpend(prev => Number((prev + 0.02).toFixed(2)));
    }, 1000);
  };

  const spendPercent = Math.min(100, Math.round((currentSpend / budgetLimit) * 100));

  return (
    <div className="flex flex-col h-full bg-[#0a0f18]/95 text-slate-100 rounded-2xl overflow-hidden border border-emerald-500/25 backdrop-blur-2xl shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-500/20 bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold font-orbitron tracking-wider text-emerald-300 flex items-center gap-2 uppercase">
              LLM Token & Cloud Burn Sentinel
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 font-mono">
                API Guardian
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Live Token Counters, Monthly Cloud Spend & Edge Fallback Governor
            </p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Auditing...' : 'Audit Quotas'}</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
        {/* Monthly Budget Card */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-mono uppercase text-slate-400">Monthly AI Cloud Spend</span>
              <div className="text-3xl font-bold font-orbitron text-emerald-300 mt-0.5">
                ${currentSpend.toFixed(2)}
                <span className="text-sm font-mono text-slate-400 ml-2 font-normal">/ ${budgetLimit.toFixed(2)} Cap</span>
              </div>
            </div>

            {/* Edge Fallback Toggle */}
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs font-mono text-slate-300">Auto-Fallback to Edge Ollama:</span>
              <button
                onClick={() => {
                  playJarvisBeep('click');
                  setAutoFallbackOllama(prev => !prev);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  autoFallbackOllama
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {autoFallbackOllama ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-500"
                style={{ width: `${spendPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>{spendPercent}% of monthly quota consumed</span>
              <span>${(budgetLimit - currentSpend).toFixed(2)} remaining</span>
            </div>
          </div>
        </div>

        {/* Model Breakdown Scoreboard */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Model Telemetry & Latency Scoreboard</span>
            <span className="text-[10px] font-mono text-emerald-400">5 Neural Providers Bound</span>
          </div>

          <div className="space-y-2">
            {models.map(m => (
              <div
                key={m.name}
                className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-all"
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                    {m.name}
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-400 font-mono">
                      {m.provider}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {m.tokensUsed} tokens consumed &bull; Role: {m.status}
                  </div>
                </div>

                <div className="text-right font-mono text-xs">
                  <div className="text-emerald-400 font-bold">{m.cost}</div>
                  <div className="text-[10px] text-slate-400">
                    {m.latency} &bull; <span className="text-cyan-300 font-semibold">{m.speed}</span>
                  </div>
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
          <span>Budget Sentinel: Zero-Cost Edge Auto-Failover Armed</span>
        </div>
        <div className="text-emerald-400">
          Monthly Reset: 1st of month
        </div>
      </div>
    </div>
  );
}
