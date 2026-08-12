import React, { useState, useEffect } from 'react';
import { Store, Cloud, Newspaper, TrendingUp, Trophy, Code, Languages, Check, ToggleLeft, ToggleRight, XCircle } from 'lucide-react';

export default function SkillsStoreWidget({ onClose }) {
  const [skills, setSkills] = useState(() => {
    const s = localStorage.getItem('jasper_skills');
    return s ? JSON.parse(s) : [
      { id: 'weather', name: 'Weather Forecast', desc: 'Real-time temperature, humidity & satellite radar', icon: 'Cloud', enabled: true, category: 'Utilities' },
      { id: 'news', name: 'Global News Feed', desc: 'Live headlines from RSS & news APIs', icon: 'Newspaper', enabled: true, category: 'Information' },
      { id: 'finance', name: 'Stock & Crypto Tracker', desc: 'Real-time Yahoo Finance chart & market data', icon: 'TrendingUp', enabled: true, category: 'Finance' },
      { id: 'sports', name: 'Football & Sports Scores', desc: 'Live scores, match schedules & league standings', icon: 'Trophy', enabled: false, category: 'Entertainment' },
      { id: 'coding', name: 'Coding Assistant', desc: 'Code generator, regex helper & syntax debug', icon: 'Code', enabled: true, category: 'Developer' },
      { id: 'translation', name: 'Language Translation', desc: 'Multi-lingual real-time speech and text translator', icon: 'Languages', enabled: true, category: 'AI Tools' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('jasper_skills', JSON.stringify(skills));
  }, [skills]);

  const toggleSkill = (id) => {
    setSkills(skills.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const getIcon = (iconName) => {
    switch (iconName) {
      case 'Cloud': return Cloud;
      case 'Newspaper': return Newspaper;
      case 'TrendingUp': return TrendingUp;
      case 'Trophy': return Trophy;
      case 'Code': return Code;
      case 'Languages': return Languages;
      default: return Store;
    }
  };

  return (
    <div className="bg-slate-950/90 border border-emerald-500/30 rounded-2xl p-6 text-slate-100 backdrop-blur-xl shadow-2xl max-w-4xl w-full mx-auto relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/40 rounded-xl text-emerald-400">
            <Store className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-wider text-emerald-300 uppercase">AI Skills Store</h2>
            <p className="text-xs text-slate-400">Modular Capabilities & Plugin Extensions for J.A.S.P.E.R.</p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800/60 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Grid of Plugins */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {skills.map(skill => {
          const IconComponent = getIcon(skill.icon);
          return (
            <div 
              key={skill.id}
              className={`p-4 rounded-xl border transition-all duration-200 flex items-start justify-between ${
                skill.enabled 
                  ? 'bg-slate-900/80 border-emerald-500/40 shadow-lg shadow-emerald-500/5' 
                  : 'bg-slate-900/40 border-slate-800 opacity-60'
              }`}
            >
              <div className="flex gap-3 items-start">
                <div className={`p-2.5 rounded-xl border ${skill.enabled ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-200">{skill.name}</h3>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                      {skill.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-snug">{skill.desc}</p>
                </div>
              </div>

              <button
                onClick={() => toggleSkill(skill.id)}
                className={`p-1.5 rounded-lg transition-colors ${
                  skill.enabled ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-600 hover:text-slate-400'
                }`}
              >
                {skill.enabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
