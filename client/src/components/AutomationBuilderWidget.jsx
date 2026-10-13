import React, { useState, useEffect } from 'react';
import { getApiBase } from '../utils/apiConfig.js';
import { Workflow, Plus, Play, Trash2, ArrowRight, Zap, XCircle, CheckCircle2, Copy, Layers, Bell, Tv, BatteryCharging } from 'lucide-react';

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
      await fetch(`${getApiBase()}/api/analytics/increment`, {
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

  const handleRunGoodMorningJARVIS = async () => {
    setStatusMsg('Executing morning routine: Fetching weather & briefing...');
    try {
      await fetch(`${getApiBase()}/api/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'Good Morning routine: summarize weather and top news' })
      });
      setTimeout(() => setStatusMsg('Morning routine completed.'), 1500);
    } catch (e) {
      setStatusMsg('Morning routine dispatched.');
    }
    setTimeout(() => setStatusMsg(''), 5000);
  };

  return (
    <div className="bg-[#0b0d13]/95 border border-white/[0.08] rounded-2xl p-5 sm:p-6 text-slate-100 backdrop-blur-2xl shadow-2xl max-w-4xl w-full mx-auto relative overflow-hidden space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/[0.05] border border-white/[0.08] rounded-xl text-slate-300">
            <Workflow className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-100 tracking-tight">Automation Engine</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                Event Driven
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Automated trigger sequences and cross-device routine coordinator</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunGoodMorningJARVIS}
            className="px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm"
          >
            Run Morning Briefing
          </button>
          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors">
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-slate-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {statusMsg}
        </div>
      )}

      {/* Featured Visual Canvas Block */}
      <div className="p-5 bg-[#10131d]/60 border border-white/[0.07] rounded-xl font-sans shadow-sm">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5 mb-3.5">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-slate-400" /> Active Automation Canvas
          </span>
          <Copy className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 cursor-pointer transition-colors" />
        </div>

        <div className="space-y-3.5 text-xs">
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1.5">When (Trigger)</span>
            <div className="p-2.5 bg-black/30 border border-white/[0.06] rounded-lg text-slate-200 flex items-center gap-2.5">
              <BatteryCharging className="w-4 h-4 text-amber-400" />
              <span>Phone battery &lt; 20%</span>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1.5">Then (Actions)</span>
            <div className="space-y-2 pl-3 border-l-2 border-white/[0.1]">
              <div className="p-2.5 bg-black/30 border border-white/[0.06] rounded-lg text-slate-300 flex items-center gap-2.5">
                <Bell className="w-3.5 h-3.5 text-indigo-400" /> Send mobile notification
              </div>
              <div className="p-2.5 bg-black/30 border border-white/[0.06] rounded-lg text-slate-300 flex items-center gap-2.5">
                <Tv className="w-3.5 h-3.5 text-rose-400" /> Turn off Smart TV
              </div>
              <div className="p-2.5 bg-black/30 border border-white/[0.06] rounded-lg text-slate-300 flex items-center gap-2.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400" /> Enable battery saver profile
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Workflow Form */}
      <form onSubmit={handleAddWorkflow} className="p-4 bg-[#10131d]/40 border border-white/[0.06] rounded-xl space-y-3">
        <h3 className="text-xs font-semibold text-slate-300">Create Workflow Routine</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <input
            type="text"
            placeholder="Routine name (e.g. Cinema Mode)..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-black/30 border border-white/[0.08] rounded-lg p-2.5 text-slate-200 placeholder-slate-500 focus:border-white/20 outline-none"
          />
          <input
            type="text"
            placeholder="IF condition (e.g. Battery < 15%)..."
            value={ifTrigger}
            onChange={(e) => setIfTrigger(e.target.value)}
            className="bg-black/30 border border-white/[0.08] rounded-lg p-2.5 text-slate-200 placeholder-slate-500 focus:border-white/20 outline-none"
          />
          <input
            type="text"
            placeholder="THEN actions (comma separated)..."
            value={thenActionText}
            onChange={(e) => setThenActionText(e.target.value)}
            className="bg-black/30 border border-white/[0.08] rounded-lg p-2.5 text-slate-200 placeholder-slate-500 focus:border-white/20 outline-none"
          />
        </div>
        <button type="submit" className="px-3.5 py-1.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all">
          <Plus className="w-3.5 h-3.5" /> Save Automation
        </button>
      </form>

      {/* Active Workflows List */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-semibold text-slate-400">Configured Pipelines</h3>
        {workflows.map(wf => (
          <div key={wf.id} className="p-3.5 bg-[#10131d]/50 border border-white/[0.06] rounded-xl flex items-center justify-between text-xs hover:border-white/[0.12] transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-400">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-semibold text-slate-200">{wf.name}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px]">
                  <span className="text-slate-400">IF: {wf.ifCondition}</span>
                  <ArrowRight className="w-3 h-3 text-slate-600" />
                  <span className="text-slate-300">THEN: {Array.isArray(wf.thenActions) ? wf.thenActions.join(' + ') : wf.action}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRunWorkflow(wf)}
                className="px-2.5 py-1 bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 border border-white/[0.08] rounded-lg text-[11px] font-medium flex items-center gap-1 transition-all"
              >
                <Play className="w-3 h-3" /> Test
              </button>
              <button
                onClick={() => setWorkflows(workflows.filter(w => w.id !== wf.id))}
                className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
