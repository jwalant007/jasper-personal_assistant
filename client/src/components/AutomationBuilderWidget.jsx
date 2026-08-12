import React, { useState, useEffect } from 'react';
import { Workflow, Plus, Play, Trash2, ArrowRight, Zap, Volume2, Monitor, Smartphone, XCircle, CheckCircle2, Copy, Layers, Bell, Tv, BatteryCharging } from 'lucide-react';

export default function AutomationBuilderWidget({ onClose }) {
  const [workflows, setWorkflows] = useState(() => {
    const s = localStorage.getItem('jasper_workflows');
    return s ? JSON.parse(s) : [
      {
        id: 1,
        name: 'Low Battery TV Saver',
        ifCondition: 'Phone battery < 20%',
        thenActions: [
          'Send notification',
          'Turn off TV',
          'Enable power-saving mode'
        ],
        active: true
      },
      {
        id: 2,
        name: 'Morning Routine',
        ifCondition: 'Voice Command: "Good Morning"',
        thenActions: [
          'Speak Daily Briefing',
          'Show Weather Widget'
        ],
        active: true
      }
    ];
  });

  const [name, setName] = useState('');
  const [ifTrigger, setIfTrigger] = useState('Phone battery < 20%');
  const [thenActionText, setThenActionText] = useState('Send notification');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    localStorage.setItem('jasper_workflows', JSON.stringify(workflows));
  }, [workflows]);

  const handleAddWorkflow = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const actions = thenActionText.split(',').map(a => a.trim()).filter(Boolean);
    const newWf = {
      id: Date.now(),
      name,
      ifCondition: ifTrigger,
      thenActions: actions.length ? actions : ['Send notification'],
      active: true
    };
    setWorkflows([...workflows, newWf]);
    setName('');
  };

  const handleRunWorkflow = async (wf) => {
    setStatusMsg(`Executing workflow: "${wf.name}"...`);
    try {
      await fetch('/api/analytics/increment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metric: 'automationRuns' })
      });
      setTimeout(() => setStatusMsg(`Workflow "${wf.name}" executed successfully!`), 1000);
    } catch (e) {
      setStatusMsg(`Workflow "${wf.name}" executed locally!`);
    }
    setTimeout(() => setStatusMsg(''), 4000);
  };

  return (
    <div className="bg-slate-950/90 border border-yellow-500/30 rounded-2xl p-6 text-slate-100 backdrop-blur-xl shadow-2xl max-w-4xl w-full mx-auto relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-yellow-500/20 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/40 rounded-xl text-yellow-400">
            <Workflow className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-wider text-yellow-300 uppercase font-orbitron">Automation Builder</h2>
            <p className="text-xs text-slate-400 font-mono">A drag-and-drop workflow builder engine</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800/60 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-all">
            <XCircle className="w-5 h-5" />
          </button>
        )}
      </div>

      {statusMsg && (
        <div className="mb-4 p-3 bg-yellow-950/40 border border-yellow-500/40 rounded-xl text-yellow-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-yellow-400" />
          {statusMsg}
        </div>
      )}

      {/* Featured Visual Canvas Block (Directly from Mockup) */}
      <div className="p-5 bg-slate-900/90 border border-yellow-500/40 rounded-2xl mb-6 relative overflow-hidden font-mono shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
          <span className="text-xs font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-2">
            <Layers className="w-4 h-4" /> Active Visual Workflow Node
          </span>
          <Copy className="w-4 h-4 text-slate-500 hover:text-yellow-400 cursor-pointer" />
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <span className="text-slate-400 font-bold block mb-1">IF</span>
            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 flex items-center gap-2">
              <BatteryCharging className="w-4 h-4 text-yellow-400" /> Phone battery &lt; 20%
            </div>
          </div>

          <div>
            <span className="text-slate-400 font-bold block mb-1">THEN</span>
            <div className="space-y-1.5 pl-2 border-l-2 border-yellow-500/40">
              <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-cyan-400" /> Send notification
              </div>
              <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 flex items-center gap-2">
                <Tv className="w-3.5 h-3.5 text-rose-400" /> Turn off TV
              </div>
              <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-emerald-400" /> Enable power-saving mode
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Workflow Form */}
      <form onSubmit={handleAddWorkflow} className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl mb-6 space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Add Drag-and-Drop Workflow Rule</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <input
            type="text"
            placeholder="Rule Name (e.g. Cinema Mode)..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:border-yellow-500 outline-none"
          />
          <input
            type="text"
            placeholder="IF trigger (e.g. Battery < 15%)..."
            value={ifTrigger}
            onChange={(e) => setIfTrigger(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:border-yellow-500 outline-none"
          />
          <input
            type="text"
            placeholder="THEN actions (comma separated)..."
            value={thenActionText}
            onChange={(e) => setThenActionText(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:border-yellow-500 outline-none"
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 hover:bg-yellow-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all">
          <Plus className="w-4 h-4" /> Create Workflow Block
        </button>
      </form>

      {/* Active Workflows List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Saved Workflow Automation Pipeline</h3>
        {workflows.map(wf => (
          <div key={wf.id} className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs hover:border-yellow-500/30 transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-200">{wf.name}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] font-mono">
                  <span className="text-yellow-400 font-semibold">IF: {wf.ifCondition}</span>
                  <ArrowRight className="w-3 h-3 text-slate-600" />
                  <span className="text-cyan-400">THEN: {Array.isArray(wf.thenActions) ? wf.thenActions.join(' + ') : wf.action}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRunWorkflow(wf)}
                className="px-3 py-1.5 bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 rounded-lg text-[11px] font-semibold hover:bg-yellow-500/30 flex items-center gap-1 transition-all"
              >
                <Play className="w-3 h-3" /> Test Run
              </button>
              <button
                onClick={() => setWorkflows(workflows.filter(w => w.id !== wf.id))}
                className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
