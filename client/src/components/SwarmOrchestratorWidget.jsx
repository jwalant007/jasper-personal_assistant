import React, { useState, useEffect } from 'react';
import { getApiBase } from '../utils/apiConfig.js';
import { 
  Network, 
  Globe, 
  Cpu, 
  Smartphone, 
  Brain, 
  ShieldCheck, 
  Play, 
  Sparkles, 
  XCircle, 
  CheckCircle2, 
  Loader2, 
  Terminal,
  Zap,
  Activity
} from 'lucide-react';

export default function SwarmOrchestratorWidget({ onClose }) {
  const [agents, setAgents] = useState([
    { id: 'research', name: 'Web Research Agent', role: 'Scraper & News', icon: Globe, status: 'idle' },
    { id: 'system', name: 'Coding & PC Agent', role: 'System & Apps', icon: Cpu, status: 'idle' },
    { id: 'mobile', name: 'Mobile & IoT Agent', role: 'Phone & TV Control', icon: Smartphone, status: 'idle' },
    { id: 'memory', name: 'Memory RAG Agent', role: 'Vector Search & Indexer', icon: Brain, status: 'idle' },
    { id: 'security', name: 'Vision & Security Agent', role: 'Biometrics & Telemetry', icon: ShieldCheck, status: 'idle' }
  ]);

  const [goalPrompt, setGoalPrompt] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState([]);
  const [lastResult, setLastResult] = useState(null);

  const fetchAgentStatus = async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/swarm/agents`);
      if (res.ok) {
        const data = await res.json();
        if (data.agents) {
          setAgents(prev => prev.map(a => {
            const updated = data.agents.find(u => u.id === a.id);
            return updated ? { ...a, status: updated.status } : a;
          }));
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchAgentStatus();
  }, []);

  const handleExecuteSwarmGoal = async (promptToRun) => {
    const targetGoal = promptToRun || goalPrompt;
    if (!targetGoal.trim() || isExecuting) return;

    setIsExecuting(true);
    setLastResult(null);
    setLogs([{ time: new Date().toLocaleTimeString(), text: `Master Coordinator decomposing goal: "${targetGoal}"`, type: 'info' }]);

    try {
      const res = await fetch(`${getApiBase()}/api/swarm/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: targetGoal })
      });
      const data = await res.json();
      if (data.logs) setLogs(data.logs);
      if (data.result) setLastResult(data.result);
    } catch (err) {
      setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: `Execution failed: ${err.message}`, type: 'error' }]);
    } finally {
      setIsExecuting(false);
      fetchAgentStatus();
    }
  };

  const presets = [
    { label: 'System & Security Audit', prompt: 'Perform system volume check and biometrics security audit' },
    { label: 'Sports News & Memory Sync', prompt: 'Research latest football news and save to vector memory' },
    { label: 'Smart Home & Device Status', prompt: 'Check phone status and TV connection link' }
  ];

  return (
    <div className="bg-slate-950/90 border border-cyan-500/40 rounded-2xl p-6 text-slate-100 backdrop-blur-xl shadow-2xl max-w-5xl w-full mx-auto relative overflow-hidden">
      {/* Background Holographic Lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/40 rounded-xl text-cyan-400">
            <Network className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-wider text-cyan-300 uppercase font-orbitron flex items-center gap-2">
              J.A.S.P.E.R. Swarm Coordinator
            </h2>
            <p className="text-xs text-slate-400">Multi-Agent Task Decomposition & Sub-Agent Orchestration</p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Sub-Agents Network Topology Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {agents.map(agent => {
          const Icon = agent.icon;
          const isActive = agent.status === 'active';
          const isDone = agent.status === 'completed';

          return (
            <div 
              key={agent.id}
              className={`p-3 rounded-xl border transition-all duration-300 flex flex-col justify-between ${
                isActive 
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-lg shadow-cyan-500/20 scale-105' 
                  : isDone
                  ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${isActive ? 'bg-cyan-400/20 text-cyan-300' : 'bg-slate-800 text-slate-400'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-cyan-400 animate-ping' : isDone ? 'bg-emerald-400' : 'bg-slate-600'}`} />
              </div>
              <div>
                <div className="text-xs font-bold font-orbitron truncate">{agent.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{agent.role}</div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[9px] font-mono uppercase">
                <span className={isActive ? 'text-cyan-400 font-bold' : 'text-slate-500'}>
                  {agent.status}
                </span>
                {isActive && <Activity className="w-3 h-3 text-cyan-400 animate-spin" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Goal Input & Multi-Agent Execution Bar */}
      <div className="space-y-3 mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Zap className="w-4 h-4 absolute left-3.5 top-3 text-cyan-400" />
            <input
              type="text"
              placeholder="Assign a multi-agent goal (e.g., 'Research stock market news and update PC settings')..."
              value={goalPrompt}
              onChange={(e) => setGoalPrompt(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500/60 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 focus:outline-none"
            />
          </div>
          <button
            onClick={() => handleExecuteSwarmGoal()}
            disabled={isExecuting || !goalPrompt.trim()}
            className="px-5 py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Execute Goal
          </button>
        </div>

        {/* Workflow Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] text-slate-500 font-mono uppercase flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" /> Swarm Presets:
          </span>
          {presets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setGoalPrompt(preset.prompt);
                handleExecuteSwarmGoal(preset.prompt);
              }}
              className="text-[11px] px-3 py-1 bg-slate-900/80 hover:bg-cyan-500/20 border border-slate-800 hover:border-cyan-500/40 rounded-lg text-slate-300 hover:text-cyan-300 transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Execution Stream / Logs Panel */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-slate-400 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" /> Multi-Agent Execution Log
          </span>
          <span className="text-[10px] text-slate-500">
            {isExecuting ? 'Active Swarm Stream...' : 'Ready'}
          </span>
        </div>

        <div className="max-h-40 overflow-y-auto space-y-1.5 text-[11px] pr-1">
          {logs.length === 0 ? (
            <p className="text-slate-600 text-center py-4">No active swarm executions. Assign a goal above.</p>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-slate-500 text-[9px] shrink-0">{log.time}</span>
                {log.agent && (
                  <span className="text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded text-[9px] border border-cyan-500/20 shrink-0">
                    [{log.agent}]
                  </span>
                )}
                <span className={log.type === 'error' ? 'text-rose-400' : log.type === 'success' ? 'text-emerald-300' : 'text-slate-300'}>
                  {log.text}
                </span>
              </div>
            ))
          )}
        </div>

        {lastResult && (
          <div className="mt-3 p-3 bg-cyan-950/40 border border-cyan-500/40 rounded-xl text-cyan-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 mb-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Swarm Final Synthesis:
            </div>
            <div className="text-xs">{lastResult}</div>
          </div>
        )}
      </div>
    </div>
  );
}
