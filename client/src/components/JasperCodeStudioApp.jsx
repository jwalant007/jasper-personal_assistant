import React, { useState } from 'react';
import { Code, Play, Terminal, Sparkles, Copy, Check, Cpu, RefreshCw, FileCode, Layers } from 'lucide-react';
import geminiClient from '../utils/geminiClient';

const TEMPLATES = {
  javascript: `// JASPER OS Host Node.js Script
const os = require('os');

console.log("[JASPER Host Node.js] Platform:", os.platform(), os.arch());
console.log("[JASPER Host Node.js] CPU Cores:", os.cpus().length);
console.log("[JASPER Host Node.js] Free Memory:", Math.round(os.freemem() / 1024 / 1024), "MB");

const energy = (1.5 * Math.pow(299792458, 2)).toExponential(4);
console.log("[JASPER Computation] E = mc^2 ->", energy, "Joules");`,

  python: `# JASPER OS Host Python 3 Script
import sys
import platform

print(f"[JASPER Python] Version: {platform.python_version()}")
print(f"[JASPER Python] System: {platform.system()} {platform.machine()}")

# Quick compute demo
squares = [x**2 for x in range(1, 11)]
print(f"[JASPER Python] First 10 squares: {squares}")`,

  powershell: `# JASPER OS Host PowerShell Script
Write-Host "[JASPER PowerShell] Querying Host Machine Specs..." -ForegroundColor Cyan

$computer = Get-CimInstance Win32_OperatingSystem | Select-Object Caption, Version, TotalVisibleMemorySize
Write-Host "OS: $($computer.Caption) (Build $($computer.Version))" -ForegroundColor Green
Write-Host "Total RAM: $([math]::Round($computer.TotalVisibleMemorySize / 1MB, 2)) GB" -ForegroundColor Yellow`
};

export default function JasperCodeStudioApp() {
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(TEMPLATES.javascript);
  const [output, setOutput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [aiRefactoring, setAiRefactoring] = useState(false);

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    if (TEMPLATES[newLang]) {
      setCode(TEMPLATES[newLang]);
    }
  };

  const runCode = async () => {
    setIsExecuting(true);
    setOutput(`[JASPER Executor] Dispatching ${language.toUpperCase()} script to host backend runtime...\n`);

    try {
      const res = await fetch('/api/code/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language })
      });

      const data = await res.json();
      if (data.success) {
        setOutput(data.output || '[Script executed cleanly with zero console output]');
      } else {
        setOutput(`[Execution Failed / Exit Code ${data.exitCode || 1}]:\n${data.output || data.error}`);
      }
    } catch (err) {
      setOutput(`[JASPER Runtime Connection Error]: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
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
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="ml-2 px-2.5 py-1 bg-cyan-950/80 border border-cyan-500/40 rounded-lg text-xs font-mono text-cyan-300 focus:outline-none"
          >
            <option value="javascript">JavaScript (Node.js Host)</option>
            <option value="python">Python 3 (Host Runtime)</option>
            <option value="powershell">PowerShell (Host CLI)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refactorWithAi}
            disabled={aiRefactoring}
            className="px-3 py-1.5 bg-purple-500/25 hover:bg-purple-500/35 border border-purple-400/60 text-purple-200 rounded-lg font-mono text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 text-purple-300 ${aiRefactoring ? 'animate-spin' : ''}`} />
            <span>AI Refactor</span>
          </button>

          <button
            onClick={runCode}
            disabled={isExecuting}
            className="px-4 py-1.5 bg-cyan-500/30 hover:bg-cyan-500/40 border border-cyan-400 text-cyan-200 rounded-lg font-mono text-xs font-bold uppercase flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)] disabled:opacity-50"
          >
            {isExecuting ? <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />}
            <span>{isExecuting ? 'Running...' : 'Run Code'}</span>
          </button>
        </div>
      </div>

      {/* Editor & Output Split View */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 min-h-0">
        {/* Editor Box */}
        <div className="flex flex-col bg-cyan-950/20 border border-cyan-500/30 rounded-xl overflow-hidden">
          <div className="px-3 py-1.5 bg-cyan-950/70 border-b border-cyan-500/30 text-[11px] font-mono text-cyan-300 uppercase tracking-wider flex items-center justify-between">
            <span>Editor Script ({language.toUpperCase()})</span>
            <span>UTF-8 • Real Host Runtime</span>
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
            <span>JASPER Host OS Terminal Output</span>
          </div>
          <pre className="flex-1 p-3 text-emerald-400 overflow-y-auto whitespace-pre-wrap leading-relaxed custom-scrollbar selection:bg-emerald-500/30">
            {output || '// Click "Run Code" to execute script on host runtime...'}
          </pre>
        </div>
      </div>
    </div>
  );
}
