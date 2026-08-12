import React, { useState } from 'react';
import { 
  Trophy, 
  Activity, 
  Table, 
  Newspaper, 
  BarChart3, 
  Volume2, 
  Play, 
  Pause, 
  XCircle, 
  ChevronRight,
  Flame,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function SportsHubWidget({ onClose }) {
  const [activeTab, setActiveTab] = useState('briefing'); // briefing, scores, table, transfers, analysis
  const [isPlayingBriefing, setIsPlayingBriefing] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState('Premier League');

  const liveMatches = [
    { home: 'Real Madrid', away: 'Man City', homeScore: 2, awayScore: 1, minute: "78'", league: 'Champions League', status: 'LIVE' },
    { home: 'Arsenal', away: 'Chelsea', homeScore: 3, awayScore: 0, minute: 'FT', league: 'Premier League', status: 'ENDED' },
    { home: 'Barcelona', away: 'Atletico Madrid', homeScore: 1, awayScore: 1, minute: "54'", league: 'La Liga', status: 'LIVE' },
    { home: 'Bayern Munich', away: 'Dortmund', homeScore: 4, awayScore: 2, minute: 'FT', league: 'Bundesliga', status: 'ENDED' }
  ];

  const leagueTable = [
    { rank: 1, team: 'Arsenal', mp: 33, w: 24, d: 5, l: 4, gd: '+51', pts: 77 },
    { rank: 2, team: 'Manchester City', mp: 32, w: 23, d: 5, l: 4, gd: '+48', pts: 74 },
    { rank: 3, team: 'Liverpool', mp: 33, w: 21, d: 8, l: 4, gd: '+41', pts: 71 },
    { rank: 4, team: 'Aston Villa', mp: 34, w: 20, d: 6, l: 8, gd: '+21', pts: 66 },
    { rank: 5, team: 'Tottenham', mp: 32, w: 18, d: 6, l: 8, gd: '+16', pts: 60 },
  ];

  const transferNews = [
    { headline: 'Kylian Mbappé completes Real Madrid agreement', tier: 'Tier 1 Verified', time: '1h ago', source: 'Fabrizio Romano' },
    { headline: 'Arsenal target Real Sociedad midfielder Zubimendi', tier: 'Developing', time: '3h ago', source: 'The Athletic' },
    { headline: 'Bayern Munich inquire about Premier League winger', tier: 'Rumor', time: '5h ago', source: 'Sky Sports' }
  ];

  const teamAnalysis = {
    team: 'Arsenal FC',
    formation: '4-3-3 Attacking',
    possessionAvg: '61.4%',
    xGPerGame: '2.14',
    cleanSheets: '16 Matches',
    keyPlayer: 'Bukayo Saka (14 Goals, 11 Assists)'
  };

  const toggleBriefingAudio = () => {
    setIsPlayingBriefing(!isPlayingBriefing);
  };

  return (
    <div className="bg-slate-950/90 border border-emerald-500/30 rounded-2xl p-6 text-slate-100 backdrop-blur-xl shadow-2xl max-w-5xl w-full mx-auto relative overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/40 rounded-xl text-emerald-400">
            <Trophy className="w-6 h-6 animate-bounce" style={{ animationDuration: '3s' }} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-wider text-emerald-300 uppercase font-orbitron">Football Sports Hub</h2>
            <p className="text-xs text-slate-400 font-mono">Personalized Football Briefing • Live Ticker • Tables • Tactical Analytics</p>
          </div>
        </div>

        {onClose && (
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800/60 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-all">
            <XCircle className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-5 border-b border-slate-800 pb-3">
        {[
          { id: 'briefing', label: 'Personalized Briefing', icon: Sparkles },
          { id: 'scores', label: 'Live Match Scores', icon: Activity },
          { id: 'table', label: 'League Tables', icon: Table },
          { id: 'transfers', label: 'Transfer News', icon: Newspaper },
          { id: 'analysis', label: 'Team Analysis', icon: BarChart3 },
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                active 
                  ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 shadow-lg shadow-emerald-500/10' 
                  : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Personalized Football Briefing */}
      {activeTab === 'briefing' && (
        <div className="p-5 bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
              <Flame className="w-4 h-4 text-emerald-400" /> J.A.S.P.E.R. Daily Football Briefing
            </div>
            <button
              onClick={toggleBriefingAudio}
              className="px-3.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
            >
              {isPlayingBriefing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlayingBriefing ? 'Pause Audio Briefing' : 'Listen to Audio Briefing'}
            </button>
          </div>

          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans space-y-2">
            <p className="font-semibold text-emerald-300">
              "Good morning, Jwalant! Here is your curated football briefing for today:"
            </p>
            <p>
              • <strong>Champions League Thriller:</strong> Real Madrid lead Manchester City 2-1 in the 78th minute of an intense quarter-final battle at the Bernabéu.
            </p>
            <p>
              • <strong>Title Race Dynamics:</strong> Arsenal secured a convincing 3-0 victory against Chelsea, extending their lead at the top of the Premier League to 3 points over Manchester City.
            </p>
            <p>
              • <strong>Transfer Headlines:</strong> Kylian Mbappé has finalized all personal terms for his summer move. Meanwhile, Arsenal are pushing to complete the signing of Zubimendi.
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Live Match Scores */}
      {activeTab === 'scores' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {liveMatches.map((match, idx) => (
            <div key={idx} className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl flex items-center justify-between hover:border-emerald-500/30 transition-all">
              <div>
                <div className="text-[10px] text-slate-400 font-mono mb-1">{match.league}</div>
                <div className="font-bold text-slate-100">{match.home}</div>
                <div className="font-bold text-slate-100">{match.away}</div>
              </div>
              <div className="text-right">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  match.status === 'LIVE' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse' : 'bg-slate-800 text-slate-400'
                }`}>
                  {match.minute}
                </span>
                <div className="text-lg font-black text-emerald-400 font-orbitron mt-1">
                  {match.homeScore} - {match.awayScore}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: League Tables */}
      {activeTab === 'table' && (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Club</th>
                <th className="p-3">MP</th>
                <th className="p-3">W</th>
                <th className="p-3">D</th>
                <th className="p-3">L</th>
                <th className="p-3">GD</th>
                <th className="p-3 font-bold text-emerald-400">PTS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/60 font-mono">
              {leagueTable.map((row) => (
                <tr key={row.rank} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3 font-bold text-slate-400">{row.rank}</td>
                  <td className="p-3 font-sans font-bold text-slate-200">{row.team}</td>
                  <td className="p-3 text-slate-300">{row.mp}</td>
                  <td className="p-3 text-slate-300">{row.w}</td>
                  <td className="p-3 text-slate-300">{row.d}</td>
                  <td className="p-3 text-slate-300">{row.l}</td>
                  <td className="p-3 text-slate-300">{row.gd}</td>
                  <td className="p-3 font-black text-emerald-400 text-sm">{row.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Transfer News */}
      {activeTab === 'transfers' && (
        <div className="space-y-2 text-xs">
          {transferNews.map((news, idx) => (
            <div key={idx} className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between hover:border-emerald-500/30 transition-all">
              <div>
                <div className="font-bold text-slate-200">{news.headline}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-1">Source: {news.source} • {news.time}</div>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-lg shrink-0 font-semibold">
                {news.tier}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Tab 5: Team Analysis */}
      {activeTab === 'analysis' && (
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-bold text-slate-200 text-sm">{teamAnalysis.team} Tactical Radar</h3>
            <span className="text-[10px] text-emerald-400 font-mono">{teamAnalysis.formation}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">AVG POSSESSION</div>
              <div className="text-base font-bold text-emerald-400 mt-1">{teamAnalysis.possessionAvg}</div>
            </div>
            <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">EXPECTED GOALS (xG)</div>
              <div className="text-base font-bold text-emerald-400 mt-1">{teamAnalysis.xGPerGame}</div>
            </div>
            <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">CLEAN SHEETS</div>
              <div className="text-base font-bold text-emerald-400 mt-1">{teamAnalysis.cleanSheets}</div>
            </div>
            <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">KEY INFLUENCER</div>
              <div className="text-xs font-bold text-slate-200 mt-1">{teamAnalysis.keyPlayer}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
