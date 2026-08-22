import React, { useState, useEffect } from 'react';
import { getApiBase } from '../utils/apiConfig.js';
import { speakMessage } from '../utils/speakDeviceAudio.js';
import { 
  Trophy, 
  Activity, 
  Table, 
  Newspaper, 
  BarChart3, 
  Play, 
  Pause, 
  XCircle, 
  Sparkles,
  Flame,
  RefreshCw,
  Calendar
} from 'lucide-react';

export default function SportsHubWidget({ onClose }) {
  const [activeTab, setActiveTab] = useState('briefing'); // briefing, scores, table, transfers, analysis
  const [selectedSport, setSelectedSport] = useState('football'); // football, cricket, basketball, tennis, formula1
  const [isPlayingBriefing, setIsPlayingBriefing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sportsData, setSportsData] = useState(null);

  const fetchSportsData = async (sport = selectedSport) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api/sports/hub?sport=${sport}`);
      if (res.ok) {
        const data = await res.json();
        setSportsData(data);
      }
    } catch (e) {
      console.error('[SportsHub] Fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSportsData(selectedSport);
  }, [selectedSport]);

  const toggleBriefingAudio = () => {
    if (!isPlayingBriefing) {
      const textToSpeak = sportsData?.briefingText || "Sports Hub telemetry active. All live scores and news updated for today.";
      speakMessage(textToSpeak, () => setIsPlayingBriefing(false));
      setIsPlayingBriefing(true);
    } else {
      window.speechSynthesis.cancel();
      setIsPlayingBriefing(false);
    }
  };

  const sportsCategories = [
    { id: 'football', label: 'Football / Soccer', emoji: '⚽' },
    { id: 'cricket', label: 'Cricket', emoji: '🏏' },
    { id: 'basketball', label: 'Basketball (NBA)', emoji: '🏀' },
    { id: 'tennis', label: 'Tennis', emoji: '🎾' },
    { id: 'formula1', label: 'Formula 1', emoji: '🏎️' }
  ];

  const liveMatches = sportsData?.liveMatches || [];
  const newsStream = sportsData?.newsStream || [];
  const leagueTable = sportsData?.leagueTable || [];
  const todayStr = sportsData?.todayStr || new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="bg-slate-950/90 border border-emerald-500/30 rounded-2xl p-6 text-slate-100 backdrop-blur-xl shadow-2xl max-w-5xl w-full mx-auto relative overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/40 rounded-xl text-emerald-400">
            <Trophy className="w-6 h-6 animate-bounce" style={{ animationDuration: '3s' }} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-wider text-emerald-300 uppercase font-orbitron flex items-center gap-2">
              Multi-Sport Telemetry Center
            </h2>
            <p className="text-xs text-slate-400 font-mono flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Today: <span className="text-emerald-300 font-bold">{todayStr}</span> • Live Real-Time Telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchSportsData(selectedSport)}
            disabled={isLoading}
            className="p-2 bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-400 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          {onClose && (
            <button onClick={onClose} className="p-2 rounded-xl bg-slate-800/60 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-all">
              <XCircle className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Multi-Sport Category Pills */}
      <div className="flex flex-wrap gap-2 mb-4 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
        {sportsCategories.map(cat => {
          const isSelected = selectedSport === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedSport(cat.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-200 shadow-md shadow-emerald-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>{cat.emoji}</span> {cat.label}
            </button>
          );
        })}
      </div>

      {/* Sub-Tabs */}
      <div className="flex flex-wrap gap-2 mb-5 border-b border-slate-800 pb-3">
        {[
          { id: 'briefing', label: 'Today\'s Briefing', icon: Sparkles },
          { id: 'scores', label: 'Live & Recent Matches', icon: Activity },
          { id: 'transfers', label: 'Real-Time News Stream', icon: Newspaper },
          { id: 'table', label: 'League Standings', icon: Table },
          { id: 'analysis', label: 'Tactical Radar', icon: BarChart3 },
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

      {/* Tab 1: Today's Briefing */}
      {activeTab === 'briefing' && (
        <div className="p-5 bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
              <Flame className="w-4 h-4 text-emerald-400" /> J.A.S.P.E.R. Live Sports Briefing • {todayStr}
            </div>
            <button
              onClick={toggleBriefingAudio}
              className="px-3.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
            >
              {isPlayingBriefing ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
              {isPlayingBriefing ? 'Pause Audio Briefing' : 'Listen to Live Audio Briefing'}
            </button>
          </div>

          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans space-y-2">
            <p className="font-semibold text-emerald-300">
              "{sportsData?.briefingText || `Good day, Sir! Here is your curated sports briefing for ${todayStr}: All live scores and news streams are updated.`}"
            </p>
            {newsStream.slice(0, 3).map((n, i) => (
              <p key={i}>
                • <strong>{n.headline}:</strong> {n.summary}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Live Match Scores */}
      {activeTab === 'scores' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {liveMatches.length === 0 ? (
            <p className="text-slate-500 text-xs col-span-2 text-center py-8">Fetching live match scores for today...</p>
          ) : (
            liveMatches.map((match, idx) => (
              <div key={idx} className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl flex items-center justify-between hover:border-emerald-500/30 transition-all">
                <div>
                  <div className="text-[10px] text-slate-400 font-mono mb-1">{match.league} • {match.date || todayStr}</div>
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
            ))
          )}
        </div>
      )}

      {/* Tab 3: Real-Time News Stream */}
      {activeTab === 'transfers' && (
        <div className="space-y-2 text-xs">
          {newsStream.length === 0 ? (
            <p className="text-slate-500 text-xs text-center py-8">Fetching live sports news RSS stream...</p>
          ) : (
            newsStream.map((news) => (
              <div key={news.id} className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between hover:border-emerald-500/30 transition-all">
                <div>
                  <div className="font-bold text-slate-200">{news.headline}</div>
                  <div className="text-[11px] text-slate-400 mt-1">{news.summary}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">Source: {news.source} • {news.time}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 4: League Standings */}
      {activeTab === 'table' && (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Club / Athlete</th>
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

      {/* Tab 5: Tactical Radar / Analysis */}
      {activeTab === 'analysis' && (
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-bold text-slate-200 text-sm">Tactical Radar & Advanced Metrics</h3>
            <span className="text-[10px] text-emerald-400 font-mono">4-3-3 Attacking</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">AVG POSSESSION</div>
              <div className="text-base font-bold text-emerald-400 mt-1">61.4%</div>
            </div>
            <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">EXPECTED GOALS (xG)</div>
              <div className="text-base font-bold text-emerald-400 mt-1">2.14</div>
            </div>
            <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">CLEAN SHEETS</div>
              <div className="text-base font-bold text-emerald-400 mt-1">16 Matches</div>
            </div>
            <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">KEY INFLUENCER</div>
              <div className="text-xs font-bold text-slate-200 mt-1">Bukayo Saka (14 G, 11 A)</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
