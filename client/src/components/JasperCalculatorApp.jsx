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

    const localResult = solveAlgebra(query);
    if (localResult.success) {
      setAiMathSolution(localResult.formatted);
    }

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
    <div className="flex flex-col h-full bg-[#090b10] text-slate-100 font-sans p-4 rounded-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-[#0e111a]/60 border border-white/[0.07] p-3 rounded-xl">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-white/[0.05] border border-white/[0.08] rounded-lg text-slate-300">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-xs text-slate-100 tracking-tight block">
              Calculator & Algebra Engine
            </span>
            <span className="text-[11px] text-slate-400">
              Polynomial, Linear, & Symbolic Mathematics
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setMode(m => m === 'algebra' ? 'standard' : 'algebra')}
            className="px-2.5 py-1 text-xs rounded-lg border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 transition-all flex items-center gap-1.5"
          >
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <span>Mode: {mode === 'algebra' ? 'Algebra' : 'Standard'}</span>
          </button>
        </div>
      </div>

      {/* Quick Example Equation Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs custom-scrollbar">
        <span className="text-[11px] text-slate-400 shrink-0 flex items-center gap-1 pl-1 font-medium">
          <BookOpen className="w-3 h-3 text-slate-500" /> Examples:
        </span>
        {exampleEquations.map((eq, i) => (
          <button
            key={i}
            onClick={() => loadExample(eq)}
            className="shrink-0 px-2.5 py-1 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/20 rounded-lg text-[11px] text-slate-300 font-mono transition-all"
          >
            {eq}
          </button>
        ))}
      </div>

      {/* Main Grid: Keypad Left, Steps & AI Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        
        {/* Left Column: Calculator Keypad */}
        <div className="bg-[#0e111a]/40 border border-white/[0.07] rounded-xl p-3.5 flex flex-col space-y-3 shadow-sm">
          {/* Display screen (editable / typable) */}
          <div className="relative">
            <input
              type="text"
              value={display}
              onChange={(e) => setDisplay(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSolve(display)}
              placeholder="Enter equation (e.g. 3x + 5 = 20)"
              className="w-full p-3.5 bg-black/30 border border-white/[0.08] rounded-xl text-right font-mono text-xl font-medium text-slate-100 tracking-wide focus:outline-none focus:border-white/20"
            />
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500 uppercase tracking-wider pointer-events-none">
              {/[a-zA-Z=]/.test(display) ? 'Algebra' : 'Arithmetic'}
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

              let btnClasses = 'bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-slate-200';
              if (isSolve) {
                btnClasses = 'bg-indigo-600 hover:bg-indigo-500 border border-indigo-400 text-white font-semibold shadow-sm';
              } else if (isClear) {
                btnClasses = 'bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300';
              } else if (isAlgebraVar) {
                btnClasses = 'bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 font-semibold italic';
              } else if (isSpecialOp) {
                btnClasses = 'bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-slate-200';
              } else if (isArithOp) {
                btnClasses = 'bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.1] text-indigo-300 font-medium';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleBtnClick(btn)}
                  className={`p-2.5 sm:p-3 rounded-lg font-mono text-sm transition-all active:scale-95 flex items-center justify-center ${btnClasses}`}
                >
                  {btn}
                </button>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-500 flex items-center justify-between px-1">
            <span>Click buttons or type directly</span>
            <span className="font-mono">Ans: {lastAns}</span>
          </div>
        </div>

        {/* Right Column: Step-by-Step Algebraic Working & AI Solver */}
        <div className="bg-[#0e111a]/40 border border-white/[0.07] rounded-xl p-3.5 flex flex-col space-y-3 shadow-sm">
          <div className="text-xs font-semibold text-slate-200 flex items-center justify-between border-b border-white/[0.06] pb-2.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className={`w-3.5 h-3.5 text-indigo-400 ${isSolving ? 'animate-spin' : ''}`} />
              <span>Step-by-Step Reasoning</span>
            </div>

            {aiMathSolution && (
              <button
                onClick={copySolution}
                className="px-2 py-0.5 bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] rounded text-[11px] text-slate-300 flex items-center gap-1 transition-all"
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
              className="flex-1 px-3 py-2 bg-black/30 border border-white/[0.08] focus:border-white/20 rounded-lg text-xs font-mono text-slate-200 focus:outline-none"
            />
            <button
              onClick={() => solveMathWithAi()}
              disabled={isSolving || !aiMathQuery.trim()}
              className="px-3.5 py-2 bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] text-slate-100 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {isSolving ? 'Solving...' : 'Solve'}
            </button>
          </div>

          {/* Solution Pane */}
          <div className="flex-1 min-h-[220px] bg-black/25 border border-white/[0.06] rounded-xl p-3.5 font-mono text-xs text-slate-300 overflow-y-auto whitespace-pre-wrap leading-relaxed custom-scrollbar selection:bg-indigo-500/30">
            {aiMathSolution ? (
              <div className="space-y-1 text-slate-200">
                {aiMathSolution}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500 space-y-2">
                <HelpCircle className="w-6 h-6 text-slate-600 stroke-1" />
                <p className="text-xs">
                  Enter an algebraic equation or expression above and click <span className="text-slate-300 font-medium">Solve</span> to view step-by-step mathematical working.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
