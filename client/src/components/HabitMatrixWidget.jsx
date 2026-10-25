import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Flame, 
  ShieldCheck, 
  CheckCircle2, 
  Award, 
  Sparkles, 
  Star, 
  Zap, 
  Plus, 
  RefreshCw,
  Calendar
} from 'lucide-react';
import { playJarvisBeep, playJarvisPowerUp } from '../utils/jarvisAudioSynth';

export default function HabitMatrixWidget({ onClose }) {
  const [level, setLevel] = useState(7);
  const [xp, setXp] = useState(780);
  const [streakDays, setStreakDays] = useState(24);
  const [freezeShields, setFreezeShields] = useState(2);

  const [quests, setQuests] = useState(() => {
    const saved = localStorage.getItem('jasper_daily_quests');
    if (saved) {
      try { return JSON.parse(saved); } catch (_) {}
    }
    return [
      { id: 'q1', title: 'Deep Work Coding (90 mins)', xp: 60, completed: true, category: 'Coding' },
      { id: 'q2', title: 'Daily Workout & Physical Training', xp: 50, completed: true, category: 'Fitness' },
      { id: 'q3', title: 'Optimal Hydration (2.5L water)', xp: 25, completed: false, category: 'Health' },
      { id: 'q4', title: 'Read 20 Pages AI / Systems Literature', xp: 40, completed: false, category: 'Learning' },
      { id: 'q5', title: 'Reflect & Plan Tomorrow Agenda', xp: 30, completed: false, category: 'Mindset' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('jasper_daily_quests', JSON.stringify(quests));
  }, [quests]);

  const toggleQuest = (id) => {
    setQuests(prev => prev.map(q => {
      if (q.id === id) {
        const nextDone = !q.completed;
        if (nextDone) {
          playJarvisPowerUp();
          const nextXp = xp + q.xp;
          if (nextXp >= 1000) {
            setLevel(l => l + 1);
            setXp(nextXp - 1000);
          } else {
            setXp(nextXp);
          }
        } else {
          playJarvisBeep('click');
          setXp(Math.max(0, xp - q.xp));
        }
        return { ...q, completed: nextDone };
      }
      return q;
    }));
  };

  const badges = [
    { title: 'Level 7 Operative', desc: 'Consistent excellence', icon: Award, unlocked: true },
    { title: '24-Day Fire Streak', desc: 'Unbroken habit chain', icon: Flame, unlocked: true },
    { title: 'Iron Body 100', desc: '100 workouts completed', icon: Zap, unlocked: true },
    { title: 'Master Architect', desc: 'Reach Level 10', icon: Star, unlocked: false }
  ];

  // Generate 90-day mock heatmap data (13 weeks x 7 days)
  const renderHeatmap = () => {
    const cells = [];
    for (let i = 0; i < 91; i++) {
      // Deterministic pseudo-random pattern for realistic activity
      const val = (i * 7 + 13) % 5;
      const colors = [
        'bg-slate-900 border-slate-800',
        'bg-emerald-950 border-emerald-900',
        'bg-emerald-800 border-emerald-700',
        'bg-emerald-600 border-emerald-500',
        'bg-emerald-400 border-emerald-300 shadow-[0_0_8px_#34d399]'
      ];
      cells.push(
        <div
          key={i}
          className={`w-3 h-3 rounded-[3px] border ${colors[val]} transition-transform hover:scale-150 cursor-pointer`}
          title={`Day ${i + 1}: ${val * 2} habits completed`}
        />
      );
    }
    return cells;
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0f16]/95 text-slate-100 rounded-2xl overflow-hidden border border-emerald-500/25 backdrop-blur-2xl shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-500/20 bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
            <Trophy className="w-5 h-5 animate-bounce" style={{ animationDuration: '3s' }} />
          </div>
          <div>
            <h2 className="text-base font-bold font-orbitron tracking-wider text-emerald-300 flex items-center gap-2 uppercase">
              Gamified Habit & Quest Matrix
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 font-mono">
                Level {level}
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              90-Day Commit Consistency Heatmap & RPG Quest Engine
            </p>
          </div>
        </div>

        {/* Streak & Freeze Badges */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold shadow-sm">
            <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>{streakDays} Days Streak</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-bold">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>{freezeShields} Shields</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
        {/* XP Level Bar Card */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-slate-950 font-bold font-orbitron text-xl flex items-center justify-center shadow-lg">
                {level}
              </div>
              <div>
                <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  J.A.S.P.E.R. Operative Tier
                  <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    XP Multiplier: 1.5x
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {xp} / 1,000 XP until Level {level + 1}
                </div>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-300">
              {Math.round((xp / 1000) * 100)}%
            </span>
          </div>

          <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${(xp / 1000) * 100}%` }}
            />
          </div>
        </div>

        {/* 90-Day Contribution Heatmap */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              90-Day Habit Execution Heatmap
            </span>
            <span className="text-[10px] font-mono text-slate-400">Past Quarter</span>
          </div>

          <div className="flex flex-wrap gap-1.5 p-2 bg-slate-950 rounded-xl border border-slate-900 justify-center">
            {renderHeatmap()}
          </div>
        </div>

        {/* Daily Quests List */}
        <div className="space-y-2.5">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Today's Daily Quests ({quests.filter(q => q.completed).length}/{quests.length})</span>
            <span className="text-[10px] font-mono text-emerald-400">+205 Total XP Available</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {quests.map(q => (
              <button
                key={q.id}
                onClick={() => toggleQuest(q.id)}
                className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  q.completed
                    ? 'bg-emerald-950/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className={`w-5 h-5 shrink-0 ${q.completed ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <div>
                    <div className={`text-xs font-semibold ${q.completed ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                      {q.title}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">{q.category}</div>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-950/40 border border-amber-500/30 shrink-0">
                  +{q.xp} XP
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Streak Freeze Vault: 2 Available (Auto-Protects at 23:59)</span>
        </div>
        <div className="text-emerald-400">
          Rank: Top 1% Consistent
        </div>
      </div>
    </div>
  );
}
