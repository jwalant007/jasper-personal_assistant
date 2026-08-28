import React, { useState } from 'react';
import { Calculator, ArrowRightLeft, Sparkles, RefreshCw } from 'lucide-react';
import geminiClient from '../utils/geminiClient';

export default function JasperCalculatorApp() {
  const [display, setDisplay] = useState('0');
  const [aiMathQuery, setAiMathQuery] = useState('');
  const [aiMathSolution, setAiMathSolution] = useState('');
  const [isSolving, setIsSolving] = useState(false);

  const handleBtnClick = (val) => {
    if (val === 'C') {
      setDisplay('0');
    } else if (val === '=') {
      try {
        const sanitized = display.replace(/×/g, '*').replace(/÷/g, '/');
        const res = Function(`"use strict"; return (${sanitized})`)();
        setDisplay(String(res));
      } catch (e) {
        setDisplay('Error');
      }
    } else {
      setDisplay(prev => prev === '0' || prev === 'Error' ? val : prev + val);
    }
  };

  const solveMathWithAi = async () => {
    if (!aiMathQuery.trim()) return;
    setIsSolving(true);
    try {
      const prompt = `Solve this mathematical expression or word problem step by step: "${aiMathQuery}". Provide the final numerical answer clearly at the end.`;
      const res = await geminiClient.generateContent(prompt);
      setAiMathSolution(res);
    } catch (e) {
      setAiMathSolution('Error solving equation via AI.');
    } finally {
      setIsSolving(false);
    }
  };

  const calcButtons = [
    ['C', '(', ')', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '%', '=']
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950/90 text-slate-100 font-sans p-4 rounded-xl space-y-4">
      <div className="flex items-center gap-2 bg-cyan-950/50 border border-cyan-500/30 p-2.5 rounded-xl">
        <Calculator className="w-5 h-5 text-cyan-400" />
        <span className="font-orbitron font-extrabold text-xs text-cyan-200 uppercase tracking-wider">JASPER Scientific Calculator & Math Solver</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Standard Calculator Keypad */}
        <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-xl p-3 flex flex-col space-y-3">
          <div className="p-3 bg-black/80 border border-cyan-500/40 rounded-xl text-right font-mono text-xl font-bold text-cyan-300 tracking-wider truncate">
            {display}
          </div>
          <div className="grid grid-cols-4 gap-2 flex-1">
            {calcButtons.flat().map((btn, idx) => (
              <button
                key={idx}
                onClick={() => handleBtnClick(btn)}
                className={`p-3 rounded-xl font-mono text-sm font-bold transition-all ${
                  btn === '='
                    ? 'bg-cyan-500/40 border border-cyan-300 text-cyan-100 shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                    : btn === 'C'
                    ? 'bg-rose-500/30 border border-rose-400 text-rose-200'
                    : 'bg-cyan-950/60 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-200'
                }`}
              >
                {btn}
              </button>
            ))}
          </div>
        </div>

        {/* AI Math Problem Solver */}
        <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-xl p-3 flex flex-col space-y-3">
          <div className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-cyan-500/30 pb-2">
            <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
            <span>AI Neural Math & Physics Solver</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={aiMathQuery}
              onChange={(e) => setAiMathQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && solveMathWithAi()}
              placeholder="e.g. solve 3x + 5 = 20 or derivative of sin(x^2)"
              className="flex-1 px-3 py-1.5 bg-cyan-950/70 border border-cyan-500/40 rounded-lg text-xs font-mono text-cyan-200 focus:outline-none"
            />
            <button
              onClick={solveMathWithAi}
              disabled={isSolving || !aiMathQuery.trim()}
              className="px-3 py-1.5 bg-purple-500/30 border border-purple-400 text-purple-200 rounded-lg font-mono text-xs font-bold"
            >
              Solve
            </button>
          </div>

          <div className="flex-1 bg-slate-900/60 border border-cyan-500/20 rounded-xl p-3 font-mono text-xs text-slate-200 overflow-y-auto whitespace-pre-wrap leading-relaxed custom-scrollbar">
            {aiMathSolution || '// Enter an equation or word problem above to get step-by-step AI solutions...'}
          </div>
        </div>
      </div>
    </div>
  );
}
