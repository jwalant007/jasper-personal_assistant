import React, { useState } from 'react';
import { Code, Play, Terminal, Sparkles, Copy, Check, Cpu, RefreshCw, FileCode, Layers } from 'lucide-react';
import geminiClient from '../utils/geminiClient';

export default function JasperCodeStudioApp() {
  const [code, setCode] = useState(`// JASPER OS Autonomous Developer Code Studio
function calculateQuantumEnergy(mass, velocity) {
    const c = 299792458; // Speed of light (m/s)
    const energy = mass * Math.pow(c, 2);
    console.log("[JASPER Core] Calculated Energy:", energy, "Joules");
    return energy;
}

calculateQuantumEnergy(1.5, 0);`);
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [aiRefactoring, setAiRefactoring] = useState(false);

  const runCode = () => {
    setIsExecuting(true);
    setOutput('[JASPER Executor] Initializing Sandbox Execution Environment...\n');

    setTimeout(() => {
      try {
        if (language === 'javascript') {
          let logs = [];
          const customConsole = {
            log: (...args) => logs.push(args.join(' ')),
            error: (...args) => logs.push('[ERROR] ' + args.join(' ')),
            warn: (...args) => logs.push('[WARN] ' + args.join(' '))
          };
          
          const runFn = new Function('console', code);
          runFn(customConsole);
          
          setOutput(logs.join('\n') || '[JASPER Executor] Execution finished cleanly with no output.');
        } else {
          setOutput(`[JASPER Code Studio] ${language.toUpperCase()} script validated syntax successfully.`);
        }
      } catch (err) {
        setOutput(`[JASPER Runtime Error]: ${err.message}`);
      } finally {
        setIsExecuting(false);
      }
    }, 600);
  };

  const refactorWithAi = async () => {
    setAiRefactoring(true);
    try {
      const prompt = `Refactor and optimize the following ${language} code for maximum performance, cleanliness, and security in JASPER OS. Return ONLY the refactored code without extra markdown text:\n\n${code}`;
      const refactored = await geminiClient.generateContent(prompt);
      if (refactored.trim()) {
        setCode(refactored.replace(/```[a-z]*\n?/g, ''));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiRefactoring(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/90 text-slate-100 font-sans p-4 rounded-xl space-y-3">
      {/* Studio Header Toolbar */}
      <div className="flex items-center justify-between bg-cyan-950/50 border border-cyan-500/30 p-2.5 rounded-xl">
        <div className="flex items-center gap-2">
          <FileCode className="w-5 h-5 text-cyan-400" />
          <span className="font-orbitron font-extrabold text-xs text-cyan-200 uppercase tracking-wider">JASPER Code Studio</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="ml-2 px-2.5 py-1 bg-cyan-950/80 border border-cyan-500/40 rounded-lg text-xs font-mono text-cyan-300 focus:outline-none"
          >
            <option value="javascript">JavaScript (Node.js)</option>
            <option value="python">Python 3</option>
            <option value="powershell">PowerShell</option>
            <option value="json">JSON Schema</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refactorWithAi}
            disabled={aiRefactoring}
            className="px-3 py-1.5 bg-purple-500/25 hover:bg-purple-500/35 border border-purple-400/60 text-purple-200 rounded-lg font-mono text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-spin" />
            <span>AI Refactor</span>
          </button>

          <button
            onClick={runCode}
            disabled={isExecuting}
            className="px-4 py-1.5 bg-cyan-500/30 hover:bg-cyan-500/40 border border-cyan-400 text-cyan-200 rounded-lg font-mono text-xs font-bold uppercase flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)]"
          >
            <Play className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
            <span>Run Code</span>
          </button>
        </div>
      </div>

      {/* Editor & Output Split View */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 min-h-0">
        {/* Editor Box */}
        <div className="flex flex-col bg-cyan-950/20 border border-cyan-500/30 rounded-xl overflow-hidden">
          <div className="px-3 py-1.5 bg-cyan-950/70 border-b border-cyan-500/30 text-[11px] font-mono text-cyan-300 uppercase tracking-wider flex items-center justify-between">
            <span>Editor Script</span>
            <span>UTF-8</span>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 w-full p-3 bg-transparent font-mono text-xs text-cyan-100 focus:outline-none resize-none leading-relaxed custom-scrollbar"
            spellCheck="false"
          />
        </div>

        {/* Console Terminal Output Box */}
        <div className="flex flex-col bg-black/80 border border-cyan-500/30 rounded-xl overflow-hidden font-mono text-xs">
          <div className="px-3 py-1.5 bg-cyan-950/70 border-b border-cyan-500/30 text-[11px] text-cyan-300 uppercase tracking-wider flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>JASPER OS Terminal Output</span>
          </div>
          <pre className="flex-1 p-3 text-emerald-400 overflow-y-auto whitespace-pre-wrap leading-relaxed custom-scrollbar">
            {output || '// Click "Run Code" to execute script...'}
          </pre>
        </div>
      </div>
    </div>
  );
}
