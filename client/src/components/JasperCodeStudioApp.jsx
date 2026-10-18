import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Square, Terminal, Sparkles, Copy, Check, RefreshCw, 
  FileCode, ShieldCheck, ShieldAlert, AlertTriangle, Clock, 
  CheckCircle2, XCircle, Ban, Cpu, Activity
} from 'lucide-react';
import geminiClient from '../utils/geminiClient';

const TEMPLATES = {
  javascript: `// J.A.S.P.E.R. Isolated JavaScript Sandbox
// Zero network access • Scrubbed environment • 64MB memory quota
const os = require('os');

console.log("[JASPER Sandbox] Isolated JS Runtime Active");
console.log("[JASPER Sandbox] Architecture:", os.arch());
console.log("[JASPER Sandbox] CPU Cores:", os.cpus().length);

// Demonstrating mathematical calculation inside disposable sandbox
const fibonacci = (n) => {
  let [a, b] = [0, 1];
  for (let i = 0; i < n; i++) [a, b] = [b, a + b];
  return a;
};

console.log("[JASPER Sandbox] Fibonacci(40):", fibonacci(40));
`,

  python: `# J.A.S.P.E.R. Isolated Python 3 Sandbox
# Zero network access • Scrubbed environment • Disposable directory
import sys
import platform

print(f"[JASPER Sandbox] Python Version: {platform.python_version()}")
print(f"[JASPER Sandbox] System: {platform.system()} {platform.machine()}")

# Demonstrating prime number sieve computation
def primes_up_to(limit):
    sieve = [True] * limit
    primes = []
    for p in range(2, limit):
        if sieve[p]:
            primes.append(p)
            for i in range(p * p, limit, p):
                sieve[i] = False
    return primes

sample = primes_up_to(50)
print(f"[JASPER Sandbox] Primes under 50: {sample}")
`
};

export default function JasperCodeStudioApp() {
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(TEMPLATES.javascript);
  const [stdout, setStdout] = useState('');
  const [stderr, setStderr] = useState('');
  const [activeTab, setActiveTab] = useState('stdout'); // 'stdout' | 'stderr'
  const [execState, setExecState] = useState('idle'); // 'idle' | 'running' | 'completed' | 'failed' | 'timed_out' | 'cancelled'
  const [durationMs, setDurationMs] = useState(null);
  const [exitCode, setExitCode] = useState(null);
  const [activeExecutionId, setActiveExecutionId] = useState(null);
  const [aiRefactoring, setAiRefactoring] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sandboxStatus, setSandboxStatus] = useState({
    loading: true,
    enabled: true,
    mode: 'isolated_process',
    message: 'Initializing sandbox status...'
  });

  const abortControllerRef = useRef(null);

  // Fetch sandbox capabilities on mount
  useEffect(() => {
    fetchSandboxStatus();
  }, []);

  const getAuthHeader = () => {
    const token = localStorage.getItem('jasper_token') || localStorage.getItem('jasper_auth_token') || 'jasper';
    return { 'x-jasper-token': token };
  };

  const fetchSandboxStatus = async () => {
    try {
      const res = await fetch('/api/code/status');
      if (res.ok) {
        const data = await res.json();
        setSandboxStatus({
          loading: false,
          enabled: Boolean(data.enabled),
          mode: data.mode || 'disabled',
          message: data.message || '',
          supportedLanguages: data.supportedLanguages || ['javascript', 'python'],
          disabledLanguages: data.disabledLanguages || {},
          maxTimeoutMs: data.maxTimeoutMs || 10000,
          maxCodeBytes: data.maxCodeBytes || 65536
        });
      } else {
        setSandboxStatus({
          loading: false,
          enabled: false,
          mode: 'unavailable',
          message: 'Unable to query sandbox status.'
        });
      }
    } catch (e) {
      setSandboxStatus({
        loading: false,
        enabled: false,
        mode: 'unavailable',
        message: 'Could not connect to sandbox backend.'
      });
    }
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    if (TEMPLATES[newLang]) {
      setCode(TEMPLATES[newLang]);
    }
  };

  const runCode = async () => {
    if (execState === 'running') return;

    setExecState('running');
    setStdout('');
    setStderr('');
    setDurationMs(null);
    setExitCode(null);
    setActiveExecutionId(null);
    setActiveTab('stdout');

    try {
      abortControllerRef.current = new AbortController();

      const res = await fetch('/api/code/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ code, language }),
        signal: abortControllerRef.current.signal
      });

      const data = await res.json();

      if (data.executionId) {
        setActiveExecutionId(data.executionId);
      }
      setDurationMs(data.durationMs ?? null);
      setExitCode(data.exitCode ?? (res.ok ? 0 : 1));

      if (data.stdout !== undefined) setStdout(data.stdout);
      if (data.stderr !== undefined) setStderr(data.stderr);

      if (data.cancelled) {
        setExecState('cancelled');
      } else if (data.timedOut) {
        setExecState('timed_out');
        if (!data.stderr) setStderr(data.error || 'Execution timed out.');
        setActiveTab('stderr');
      } else if (data.success) {
        setExecState('completed');
      } else {
        setExecState('failed');
        if (!data.stderr && data.error) {
          setStderr(data.error);
          setActiveTab('stderr');
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setExecState('cancelled');
        setStderr('Execution cancelled locally.');
      } else {
        setExecState('failed');
        setStderr(`[Connection Error]: ${err.message}`);
        setActiveTab('stderr');
      }
    }
  };

  const cancelExecution = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (activeExecutionId) {
      try {
        await fetch('/api/code/cancel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader()
          },
          body: JSON.stringify({ executionId: activeExecutionId })
        });
      } catch (_) {}
    }

    setExecState('cancelled');
  };

  const refactorWithAi = async () => {
    setAiRefactoring(true);
    try {
      const prompt = `Refactor and optimize the following ${language} code for maximum performance, cleanliness, and security in an isolated sandbox. Return ONLY the refactored code without extra markdown text:\n\n${code}`;
      const refactored = await geminiClient.generateContent(prompt);
      if (refactored && refactored.trim()) {
        setCode(refactored.replace(/```[a-z]*\n?/g, '').trim());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiRefactoring(false);
    }
  };

  const copyOutput = () => {
    const textToCopy = activeTab === 'stdout' ? stdout : stderr;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Environment badge helper
  const getBadgeConfig = () => {
    if (sandboxStatus.loading) {
      return {
        icon: <Activity className="w-3.5 h-3.5 text-cyan-400 animate-spin" />,
        text: 'Checking sandbox...',
        color: 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
      };
    }
    if (!sandboxStatus.enabled) {
      return {
        icon: <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />,
        text: sandboxStatus.mode === 'disabled_in_production' 
          ? 'Cloud Execution Disabled' 
          : 'Execution Disabled (Isolated Runner Required)',
        color: 'bg-amber-950/50 border-amber-500/40 text-amber-300'
      };
    }
    if (sandboxStatus.mode === 'external_runner') {
      return {
        icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
        text: 'Isolated Sandbox Runner Active',
        color: 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
      };
    }
    return {
      icon: <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />,
      text: 'Execution Disabled (Isolated Runner Required)',
      color: 'bg-amber-950/50 border-amber-500/40 text-amber-300'
    };
  };

  const badge = getBadgeConfig();

  return (
    <div className="flex flex-col h-full bg-slate-950/90 text-slate-100 font-sans p-4 rounded-xl space-y-3">
      {/* Studio Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-cyan-950/40 border border-cyan-500/30 p-2.5 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-cyan-400" />
            <span className="font-orbitron font-extrabold text-xs text-cyan-200 uppercase tracking-wider">
              JASPER Sandbox Studio
            </span>
          </div>

          {/* Sandbox Environment Status Badge */}
          <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 border rounded-full text-[11px] font-mono ${badge.color}`}>
            {badge.icon}
            <span>{badge.text}</span>
          </div>

          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            disabled={execState === 'running'}
            className="px-2.5 py-1 bg-cyan-950/80 border border-cyan-500/40 rounded-lg text-xs font-mono text-cyan-300 focus:outline-none"
          >
            <option value="javascript">JavaScript (Isolated Node.js)</option>
            <option value="python">Python 3 (Isolated Runtime)</option>
            <option value="powershell">PowerShell (Disabled for Isolation)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Refactor Button */}
          <button
            onClick={refactorWithAi}
            disabled={aiRefactoring || execState === 'running'}
            className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/50 text-purple-200 rounded-lg font-mono text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
            title="Refactor code with Gemini"
          >
            <Sparkles className={`w-3.5 h-3.5 text-purple-300 ${aiRefactoring ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">AI Refactor</span>
          </button>

          {/* Execution / Cancel Controls */}
          {execState === 'running' ? (
            <button
              onClick={cancelExecution}
              className="px-4 py-1.5 bg-rose-500/30 hover:bg-rose-500/40 border border-rose-400 text-rose-200 rounded-lg font-mono text-xs font-bold uppercase flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(244,63,94,0.3)]"
            >
              <Square className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
              <span>Cancel Job</span>
            </button>
          ) : (
            <button
              onClick={runCode}
              disabled={!sandboxStatus.enabled || language === 'powershell'}
              className="px-4 py-1.5 bg-cyan-500/30 hover:bg-cyan-500/40 border border-cyan-400 text-cyan-200 rounded-lg font-mono text-xs font-bold uppercase flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)] disabled:opacity-40 disabled:cursor-not-allowed"
              title={!sandboxStatus.enabled ? sandboxStatus.message : 'Execute in isolated sandbox'}
            >
              <Play className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
              <span>Run Code</span>
            </button>
          )}
        </div>
      </div>

      {/* Advisory Banners */}
      {!sandboxStatus.loading && !sandboxStatus.enabled && (
        <div className="flex items-start gap-2.5 p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-xl text-amber-200 text-xs font-mono">
          <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <div className="flex-1 leading-relaxed">
            <span className="font-bold">Execution Disabled (Editing Mode Only): </span>
            {sandboxStatus.message || 'Arbitrary code execution is disabled because no isolated sandbox runner (container or microVM) is configured.'}
          </div>
        </div>
      )}

      {language === 'powershell' && (
        <div className="flex items-start gap-2.5 p-2.5 bg-rose-950/40 border border-rose-500/40 rounded-xl text-rose-200 text-xs font-mono">
          <Ban className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
          <div className="flex-1 leading-relaxed">
            <span className="font-bold">PowerShell Execution Disabled: </span>
            PowerShell cannot be safely sandboxed without dedicated Hyper-V container isolation. Host-level arbitrary PowerShell execution is permanently blocked to prevent unauthorized system access. Please select isolated JavaScript or Python.
          </div>
        </div>
      )}

      {/* Editor & Output Split View */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 min-h-0">
        {/* Editor Box */}
        <div className="flex flex-col bg-cyan-950/20 border border-cyan-500/30 rounded-xl overflow-hidden">
          <div className="px-3 py-1.5 bg-cyan-950/70 border-b border-cyan-500/30 text-[11px] font-mono text-cyan-300 uppercase tracking-wider flex items-center justify-between">
            <span>Editor Script ({language.toUpperCase()})</span>
            <span className="text-[10px] text-cyan-400/70">
              {code.length} / {sandboxStatus.maxCodeBytes || 65536} bytes
            </span>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={execState === 'running'}
            className="flex-1 w-full p-3 bg-transparent font-mono text-xs text-cyan-100 focus:outline-none resize-none leading-relaxed custom-scrollbar selection:bg-cyan-500/30"
            spellCheck="false"
            placeholder="// Enter your script here..."
          />
        </div>

        {/* Console Terminal Output Box */}
        <div className="flex flex-col bg-black/90 border border-cyan-500/30 rounded-xl overflow-hidden font-mono text-xs">
          {/* Terminal Tabs & Header */}
          <div className="px-3 py-1.5 bg-cyan-950/70 border-b border-cyan-500/30 text-[11px] text-cyan-300 uppercase tracking-wider flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              {/* STDOUT Tab */}
              <button
                onClick={() => setActiveTab('stdout')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  activeTab === 'stdout'
                    ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                STDOUT {stdout ? `(${stdout.length}B)` : ''}
              </button>
              {/* STDERR Tab */}
              <button
                onClick={() => setActiveTab('stderr')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  activeTab === 'stderr'
                    ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                STDERR {stderr ? `(${stderr.length}B)` : ''}
              </button>
            </div>

            {/* Copy & Status Indicator */}
            <div className="flex items-center gap-2">
              {durationMs !== null && (
                <span className="flex items-center gap-1 text-[10px] text-cyan-400/80">
                  <Clock className="w-3 h-3" />
                  {durationMs}ms
                </span>
              )}
              {exitCode !== null && (
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${exitCode === 0 ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'}`}>
                  Exit {exitCode}
                </span>
              )}
              <button
                onClick={copyOutput}
                className="p-1 hover:bg-cyan-900/50 rounded text-cyan-400 transition-colors"
                title="Copy active terminal output"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Terminal Content Panel */}
          <div className="flex-1 p-3 overflow-y-auto leading-relaxed custom-scrollbar font-mono text-xs">
            {execState === 'running' && (
              <div className="flex items-center gap-2 text-cyan-400">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Executing in isolated disposable sandbox (network disabled)...</span>
              </div>
            )}

            {execState !== 'running' && activeTab === 'stdout' && (
              <pre className="text-emerald-400 whitespace-pre-wrap selection:bg-emerald-500/30">
                {stdout || (execState === 'idle' ? '// Click "Run Code" to execute in sandbox...' : '(Standard output empty)')}
              </pre>
            )}

            {execState !== 'running' && activeTab === 'stderr' && (
              <pre className="text-rose-400 whitespace-pre-wrap selection:bg-rose-500/30">
                {stderr || '(Standard error empty)'}
              </pre>
            )}
          </div>

          {/* Terminal Footer Status Bar */}
          <div className="px-3 py-1 bg-cyan-950/40 border-t border-cyan-500/20 text-[10px] text-cyan-400/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full inline-block"
                style={{
                  backgroundColor:
                    execState === 'running' ? '#06b6d4' :
                    execState === 'completed' ? '#10b981' :
                    execState === 'timed_out' ? '#f59e0b' :
                    execState === 'failed' || execState === 'cancelled' ? '#f43f5e' : '#64748b'
                }}
              />
              <span className="uppercase font-bold tracking-wider">
                {execState}
              </span>
            </div>
            <span>Limits: 64MB RAM • 5s Timeout • 32KB Stream Cap</span>
          </div>
        </div>
      </div>
    </div>
  );
}
