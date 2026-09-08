import React, { useState } from 'react';
import { Calculator, Sparkles, Copy, Check, BookOpen, Trash2, Cpu, HelpCircle } from 'lucide-react';
import geminiClient from '../utils/geminiClient';
import { solveAlgebra } from '../utils/algebraSolver';

export default function JasperCalculatorApp() {
  const [display, setDisplay] = useState('0');
  const [lastAns, setLastAns] = useState('0');
  const [aiMathQuery, setAiMathQuery] = useState('');
  const [aiMathSolution, setAiMathSolution] = useState('');
  const [isSolving, setIsSolving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState('algebra'); // 'algebra' | 'standard'

  const exampleEquations = [
    '3x + 5 = 20',
    'x^2 - 5x + 6 = 0',
    '2(x - 3) = 14',
    '5x - 8 = 2x + 7',
    '2x^2 + 3x - 5 = 0',
    'x^2 + 4 = 0',
    'sqrt(144) + 5^2 * 2'
  ];

  const handleSolve = (exprToSolve) => {
    const raw = (exprToSolve !== undefined ? exprToSolve : display).trim();
    if (!raw || raw === '0') return;

    // Run local algebraic & arithmetic solver engine
    const localRes = solveAlgebra(raw);

    if (localRes.success) {
      setDisplay(localRes.result);
      setLastAns(localRes.result);
      setAiMathSolution(localRes.formatted);
      setAiMathQuery(raw);
    } else {
      // If contains algebra terms but local parsing errored, fall back to AI solver
      if (/[a-zA-Z=]/.test(raw)) {
        solveMathWithAi(raw);
      } else {
        setDisplay('Error');
        setAiMathSolution(localRes.formatted || 'Syntax error in mathematical expression.');
      }
    }
  };

  const handleBtnClick = (val) => {
    if (val === 'C') {
      setDisplay('0');
    } else if (val === 'DEL') {
      setDisplay(prev => {
        if (prev.length <= 1 || prev === 'Error') return '0';
        return prev.slice(0, -1);
      });
    } else if (val === '=' || val === 'SOLVE') {
      handleSolve(display);
    } else if (val === 'Ans') {
      setDisplay(prev => prev === '0' || prev === 'Error' ? lastAns : prev + lastAns);
    } else {
      setDisplay(prev => {
        if (prev === '0' || prev === 'Error') {
          // If typing an operator right after 0, keep 0
          if (['+', '×', '÷', '*', '/', '^', '%'].includes(val)) {
            return prev + val;
          }
          return val;
        }
        return prev + val;
      });
    }
  };

  const solveMathWithAi = async (explicitQuery) => {
    const query = (explicitQuery || aiMathQuery).trim();
    if (!query) return;
    setIsSolving(true);

    // 1. Try local algebraic engine first for instant response
    const localResult = solveAlgebra(query);
    if (localResult.success) {
      setAiMathSolution(localResult.formatted);
    }

    // 2. Query Jasper Neural Engine for comprehensive analysis / word problems
    try {
      const prompt = `Solve this mathematical expression, algebra equation, or word problem with complete step-by-step reasoning from first principles: "${query}". Format clearly with bold step headers and state the final numerical answer clearly at the end.`;
      const aiResponse = await geminiClient.generateContent(prompt);
      
      if (aiResponse && typeof aiResponse === 'string' && aiResponse.trim().length > 0) {
        setAiMathSolution(aiResponse);
      } else if (!localResult.success) {
        setAiMathSolution('Unable to generate AI solution for this equation. Please check the equation syntax.');
      }
    } catch (e) {
      if (!localResult.success) {
        setAiMathSolution(`[Error]: ${e.message || 'Error solving equation via AI.'}\nPlease ensure the equation is in standard notation (e.g. 3x + 5 = 20 or x^2 - 4 = 0).`);
      }
    } finally {
      setIsSolving(false);
    }
  };

  const copySolution = () => {
    if (!aiMathSolution) return;
    navigator.clipboard.writeText(aiMathSolution);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadExample = (eq) => {
    setDisplay(eq);
    setAiMathQuery(eq);
    handleSolve(eq);
  };

  // 5x5 Grid tailored for both Algebra and Standard Arithmetic
  const calcButtons = [
    ['C', 'DEL', '(', ')', '÷'],
    ['7', '8', '9', '^', '×'],
    ['4', '5', '6', '√', '-'],
    ['1', '2', '3', 'x', '+'],
    ['0', '.', '=', 'Ans', 'SOLVE']
  ];

  return (
    <div className="flex flex-col h-full bg-black text-slate-100 font-sans p-4 rounded-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-black/90 border border-cyan-500/30 p-2.5 rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.9)]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-500/10 border border-cyan-400/40 rounded-lg text-cyan-400">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <span className="font-orbitron font-extrabold text-xs text-cyan-200 uppercase tracking-wider block">
              JASPER Neural Calculator & Algebra Solver
            </span>
            <span className="text-[10px] text-cyan-400/70 font-mono">
              Linear, Quadratic, Polynomial & Complex Math Engine
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setMode(m => m === 'algebra' ? 'standard' : 'algebra')}
            className="px-2.5 py-1 text-[11px] font-mono rounded-lg border border-neutral-800 bg-black text-cyan-300 hover:bg-neutral-900 transition-all flex items-center gap-1"
          >
            <Cpu className="w-3 h-3 text-cyan-400" />
            <span>Mode: {mode === 'algebra' ? 'Algebra' : 'Standard'}</span>
          </button>
        </div>
      </div>

      {/* Quick Example Equation Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono custom-scrollbar">
        <span className="text-[10px] text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1 pl-1">
          <BookOpen className="w-3 h-3 text-purple-400" /> Examples:
        </span>
        {exampleEquations.map((eq, i) => (
          <button
            key={i}
            onClick={() => loadExample(eq)}
            className="shrink-0 px-2 py-0.5 bg-black hover:bg-neutral-900 border border-neutral-800 hover:border-cyan-400/50 rounded-md text-[11px] text-cyan-300 transition-all"
          >
            {eq}
          </button>
        ))}
      </div>

      {/* Main Grid: Keypad Left, Steps & AI Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        
        {/* Left Column: Calculator Keypad */}
        <div className="bg-black border border-neutral-800 rounded-xl p-3 flex flex-col space-y-3 shadow-[0_4px_25px_rgba(0,0,0,1)]">
          {/* Display screen (editable / typable) */}
          <div className="relative">
            <input
              type="text"
              value={display}
              onChange={(e) => setDisplay(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSolve(display)}
              placeholder="Enter equation (e.g. 3x + 5 = 20)"
              className="w-full p-3 bg-black border border-cyan-500/50 rounded-xl text-right font-mono text-lg font-bold text-cyan-300 tracking-wider focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 shadow-[inset_0_2px_12px_rgba(0,0,0,1)]"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-cyan-500/50 uppercase tracking-wider pointer-events-none">
              {/[a-zA-Z=]/.test(display) ? 'ALGEBRA' : 'MATH'}
            </div>
          </div>

          {/* 5x5 Keypad Grid */}
          <div className="grid grid-cols-5 gap-2 flex-1">
            {calcButtons.flat().map((btn, idx) => {
              const isSolve = btn === '=' || btn === 'SOLVE';
              const isClear = btn === 'C' || btn === 'DEL';
              const isAlgebraVar = btn === 'x';
              const isSpecialOp = ['^', '√', '(', ')'].includes(btn);
              const isArithOp = ['÷', '×', '-', '+'].includes(btn);

              let btnClasses = 'bg-[#080808] hover:bg-neutral-900 border border-neutral-800 text-cyan-200';
              if (isSolve) {
                btnClasses = 'bg-cyan-500/25 hover:bg-cyan-500/40 border border-cyan-400 text-cyan-100 shadow-[0_0_15px_rgba(0,240,255,0.3)] font-black';
              } else if (isClear) {
                btnClasses = 'bg-[#150206] hover:bg-rose-950/50 border border-rose-900/60 text-rose-300';
              } else if (isAlgebraVar) {
                btnClasses = 'bg-[#140a00] hover:bg-amber-950/50 border border-amber-800/60 text-amber-300 font-black italic';
              } else if (isSpecialOp) {
                btnClasses = 'bg-[#0e0017] hover:bg-purple-950/50 border border-purple-900/60 text-purple-300';
              } else if (isArithOp) {
                btnClasses = 'bg-[#020d14] hover:bg-cyan-950/50 border border-cyan-900/60 text-cyan-300 font-bold';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleBtnClick(btn)}
                  className={`p-2.5 sm:p-3 rounded-xl font-mono text-sm font-bold transition-all active:scale-95 flex items-center justify-center ${btnClasses}`}
                >
                  {btn}
                </button>
              );
            })}
          </div>

          <div className="text-[11px] font-mono text-slate-400/80 flex items-center justify-between px-1">
            <span>Tip: Type directly or click chips for instant solutions</span>
            <span>Ans: {lastAns}</span>
          </div>
        </div>

        {/* Right Column: Step-by-Step Algebraic Working & AI Solver */}
        <div className="bg-black border border-neutral-800 rounded-xl p-3 flex flex-col space-y-3 shadow-[0_4px_25px_rgba(0,0,0,1)]">
          <div className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center justify-between border-b border-neutral-800 pb-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className={`w-4 h-4 text-purple-400 ${isSolving ? 'animate-spin' : ''}`} />
              <span>Step-by-Step Solution & Neural Proof</span>
            </div>

            {aiMathSolution && (
              <button
                onClick={copySolution}
                className="px-2 py-0.5 bg-black hover:bg-neutral-900 border border-neutral-800 rounded text-[10px] text-cyan-300 flex items-center gap-1 transition-all"
                title="Copy Solution"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>

          {/* AI / Query Input Bar */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={aiMathQuery}
              onChange={(e) => setAiMathQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && solveMathWithAi()}
              placeholder="e.g. solve 3x + 5 = 20 or derivative of sin(x^2)"
              className="flex-1 px-3 py-2 bg-black border border-neutral-800 focus:border-cyan-400 rounded-lg text-xs font-mono text-cyan-200 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />
            <button
              onClick={() => solveMathWithAi()}
              disabled={isSolving || !aiMathQuery.trim()}
              className="px-3.5 py-2 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-600/60 text-purple-200 rounded-lg font-mono text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {isSolving ? 'Solving...' : 'Solve'}
            </button>
          </div>

          {/* Solution Pane */}
          <div className="flex-1 min-h-[220px] bg-black border border-neutral-800 rounded-xl p-3 font-mono text-xs text-slate-200 overflow-y-auto whitespace-pre-wrap leading-relaxed custom-scrollbar selection:bg-purple-500/30">
            {aiMathSolution ? (
              <div className="space-y-1 text-slate-200">
                {aiMathSolution}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400 space-y-2">
                <HelpCircle className="w-8 h-8 text-cyan-500/40 stroke-1" />
                <p className="text-xs font-mono">
                  Enter an algebraic equation (e.g. <span className="text-cyan-300 font-bold">3x + 5 = 20</span> or <span className="text-cyan-300 font-bold">x^2 - 5x + 6 = 0</span>) and press <span className="text-cyan-400 font-bold">SOLVE</span> to get the full step-by-step mathematical working.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
