import React, { useState } from 'react';
import { Search, Mic, Sparkles, ExternalLink, Globe, Image as ImageIcon, FileText, Code, ShieldCheck, Zap, ArrowRight } from 'lucide-react';
import { getServerIp } from '../utils/apiConfig';
import geminiClient from '../utils/geminiClient';

export default function JasperSearchApp() {
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState([]);
  const [aiSummary, setAiSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTab, setSearchTab] = useState('all');

  const performSearch = async (searchQuery) => {
    const targetQuery = searchQuery || query;
    if (!targetQuery.trim()) return;

    setLoading(true);
    setHasSearched(true);
    setAiSummary('');
    setResults([]);

    try {
      const serverIp = getServerIp();
      const searchRes = await fetch(`http://${serverIp}:3001/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: targetQuery })
      });
      const data = await searchRes.json();

      if (data.success && data.results) {
        setResults(data.results);
      } else {
        setResults([
          { title: `${targetQuery} - Google & Wikipedia Results`, snippet: `Instant information search results for ${targetQuery}.`, url: `https://www.google.com/search?q=${encodeURIComponent(targetQuery)}` }
        ]);
      }

      // Generate Google AI Overview Synthesis
      try {
        const aiPrompt = `Generate a Google AI Overview executive summary for the search query: "${targetQuery}". Keep it crisp, factual, and formatted with 3 bullet points for quick reading.`;
        const aiAnswer = await geminiClient.generateContent(aiPrompt);
        setAiSummary(aiAnswer);
      } catch (err) {
        setAiSummary(`Google AI Search Engine active for: ${targetQuery}`);
      }
    } catch (err) {
      console.error('[JASPER Search Error]:', err);
      setResults([
        { title: `${targetQuery} - Web Search`, snippet: `Direct Google web search for "${targetQuery}". Click to open in browser.`, url: `https://www.google.com/search?q=${encodeURIComponent(targetQuery)}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans p-6 rounded-xl space-y-6 overflow-hidden">
      {!hasSearched ? (
        /* GOOGLE-STYLE SEARCH HOMEPAGE VIEW */
        <div className="flex-1 flex flex-col items-center justify-center space-y-6 max-w-2xl mx-auto w-full">
          {/* Iconic Multi-Color Google-Style JASPER Logo */}
          <div className="text-center">
            <h1 className="font-orbitron font-extrabold text-5xl tracking-widest flex items-center justify-center gap-1 select-none">
              <span className="text-[#4285F4]">J</span>
              <span className="text-[#EA4335]">A</span>
              <span className="text-[#FBBC05]">S</span>
              <span className="text-[#4285F4]">P</span>
              <span className="text-[#34A853]">E</span>
              <span className="text-[#EA4335]">R</span>
              <span className="text-xs font-mono text-cyan-400 font-bold ml-2 uppercase px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40">AI Search</span>
            </h1>
            <p className="text-xs font-mono text-slate-400 mt-2">Next-Gen Google Search & AI Knowledge Engine</p>
          </div>

          {/* Central Google Search Bar */}
          <div className="w-full relative shadow-[0_0_30px_rgba(0,240,255,0.15)] rounded-full">
            <Search className="w-5 h-5 absolute left-4 top-3.5 text-cyan-400/60" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search Google, AI Knowledge Base, or type a query..."
              className="w-full pl-12 pr-12 py-3 bg-cyan-950/40 border border-cyan-500/40 rounded-full text-sm font-mono text-cyan-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
            />
            <button className="absolute right-4 top-3.5 text-cyan-400 hover:text-cyan-200">
              <Mic className="w-5 h-5" />
            </button>
          </div>

          {/* Google Search Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => performSearch()}
              disabled={loading || !query.trim()}
              className="px-5 py-2 bg-cyan-950/80 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-200 rounded-xl font-mono text-xs font-bold transition-all disabled:opacity-50"
            >
              Google Search
            </button>
            <button
              onClick={() => {
                if (query.trim()) performSearch();
                else performSearch('Quantum AI Breakthroughs 2026');
              }}
              className="px-5 py-2 bg-cyan-950/80 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-200 rounded-xl font-mono text-xs font-bold transition-all"
            >
              I'm Feeling Lucky ✨
            </button>
          </div>

          {/* Quick Trending Searches */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4 border-t border-cyan-500/20 w-full">
            <span className="text-[11px] font-mono text-slate-400">Trending:</span>
            {['SpaceX Starship', 'React 19 Server Components', 'Quantum AI 2026', 'JASPER OS Kernel'].map((trend, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(trend);
                  performSearch(trend);
                }}
                className="px-3 py-1 bg-cyan-950/40 border border-cyan-500/30 hover:border-cyan-400 text-xs font-mono text-slate-300 hover:text-cyan-200 rounded-lg transition-all"
              >
                🔍 {trend}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* GOOGLE-STYLE SEARCH RESULTS VIEW */
        <div className="flex-1 flex flex-col space-y-4 min-h-0">
          {/* Header Search Input Bar */}
          <div className="flex items-center gap-4 border-b border-cyan-500/30 pb-3">
            <h1
              onClick={() => setHasSearched(false)}
              className="font-orbitron font-extrabold text-xl tracking-wider cursor-pointer flex items-center gap-0.5 select-none"
            >
              <span className="text-[#4285F4]">J</span>
              <span className="text-[#EA4335]">A</span>
              <span className="text-[#FBBC05]">S</span>
              <span className="text-[#4285F4]">P</span>
              <span className="text-[#34A853]">E</span>
              <span className="text-[#EA4335]">R</span>
            </h1>

            <div className="flex-1 relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-4 pr-10 py-2 bg-cyan-950/60 border border-cyan-500/40 rounded-xl text-xs font-mono text-cyan-100 focus:outline-none focus:border-cyan-400"
              />
              <button onClick={() => performSearch()} className="absolute right-3 top-2 text-cyan-400">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Result Category Tabs */}
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400 border-b border-cyan-500/20 pb-2">
            {[
              { id: 'all', label: '🌐 All Results' },
              { id: 'ai', label: '🧠 AI Overview' },
              { id: 'images', label: '🖼️ Images' },
              { id: 'news', label: '📰 News' },
              { id: 'videos', label: '🎬 Videos' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSearchTab(tab.id)}
                className={`pb-1 transition-all ${
                  searchTab === tab.id ? 'text-cyan-400 font-bold border-b-2 border-cyan-400' : 'hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Results List View */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {/* Google AI Overview Box */}
            {aiSummary && (
              <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-400/50 space-y-2 shadow-[0_0_20px_rgba(0,240,255,0.1)]">
                <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                  <span>Google AI Overview</span>
                </div>
                <div className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-line bg-slate-900/60 p-3 rounded-lg border border-cyan-500/20">
                  {aiSummary}
                </div>
              </div>
            )}

            {/* Result Cards */}
            {results.map((res, idx) => (
              <div key={idx} className="space-y-1 p-3 rounded-xl hover:bg-cyan-950/30 transition-all border border-transparent hover:border-cyan-500/30">
                <div className="text-[10px] font-mono text-cyan-400/80 truncate">{res.url}</div>
                <a
                  href={res.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-bold text-cyan-300 hover:text-cyan-100 hover:underline flex items-center gap-1.5"
                >
                  <span>{res.title}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400/70" />
                </a>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">{res.snippet}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
