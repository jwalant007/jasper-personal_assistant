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
          { title: `${targetQuery} - Overview & Web Results`, snippet: `Web search information and encyclopedic results for ${targetQuery}.`, url: `https://www.google.com/search?q=${encodeURIComponent(targetQuery)}` }
        ]);
      }

      // Generate AI Synthesis
      try {
        const aiPrompt = `Generate a concise, factual executive summary for the search query: "${targetQuery}". Keep it crisp, factual, and formatted with 3 bullet points.`;
        const aiAnswer = await geminiClient.generateContent(aiPrompt);
        setAiSummary(aiAnswer);
      } catch (err) {
        setAiSummary(`Neural synthesis active for: ${targetQuery}`);
      }
    } catch (err) {
      console.error('[JASPER Search Error]:', err);
      setResults([
        { title: `${targetQuery} - Web Search`, snippet: `Direct web search results for "${targetQuery}".`, url: `https://www.google.com/search?q=${encodeURIComponent(targetQuery)}` }
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
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans p-6 rounded-2xl space-y-6 overflow-hidden">
      {!hasSearched ? (
        /* PERPLEXITY / RAYCAST STYLE HOMEPAGE VIEW */
        <div className="flex-1 flex flex-col items-center justify-center space-y-6 max-w-2xl mx-auto w-full">
          {/* Sleek Minimalist Monochromatic Brand */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Neural Knowledge Engine</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white select-none">
              Jasper Search
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">Search web sources, research papers, and AI memory models</p>
          </div>

          {/* Central Spotlight Search Bar */}
          <div className="w-full relative group">
            <div className="relative flex items-center bg-slate-900/90 border border-white/10 hover:border-white/20 focus-within:border-indigo-500/60 focus-within:ring-2 focus-within:ring-indigo-500/20 rounded-2xl shadow-2xl transition-all">
              <Search className="w-5 h-5 ml-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything or enter a search query..."
                className="w-full px-3.5 py-3.5 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
              />
              <button 
                onClick={() => performSearch()}
                disabled={loading || !query.trim()}
                className="mr-3 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-medium transition-all cursor-pointer shadow-sm shadow-indigo-500/20 flex items-center gap-1.5"
              >
                <span>Search</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Trending Searches */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 w-full">
            <span className="text-xs text-slate-500">Popular:</span>
            {['React 19 Server Components', 'SpaceX Starship Telemetry', 'Quantum Computing 2026', 'macOS Sequoia UI Design'].map((trend, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(trend);
                  performSearch(trend);
                }}
                className="px-3 py-1 bg-slate-900 hover:bg-slate-850 border border-white/[0.08] hover:border-white/20 text-xs text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer"
              >
                {trend}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* SEARCH RESULTS VIEW */
        <div className="flex-1 flex flex-col space-y-4 min-h-0">
          {/* Header Search Input Bar */}
          <div className="flex items-center gap-4 border-b border-white/[0.08] pb-3.5">
            <h1
              onClick={() => setHasSearched(false)}
              className="text-base font-semibold tracking-tight text-white cursor-pointer hover:text-indigo-400 select-none flex items-center gap-1.5 shrink-0"
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Jasper</span>
            </h1>

            <div className="flex-1 relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-4 pr-10 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button onClick={() => performSearch()} className="absolute right-3 top-2.5 text-slate-400 hover:text-white cursor-pointer">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Result Category Tabs */}
          <div className="flex items-center gap-4 text-xs font-medium text-slate-400 border-b border-white/[0.06] pb-2">
            {[
              { id: 'all', label: 'All Results' },
              { id: 'ai', label: 'AI Overview' },
              { id: 'images', label: 'Images' },
              { id: 'news', label: 'News' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSearchTab(tab.id)}
                className={`pb-1 transition-all cursor-pointer ${
                  searchTab === tab.id ? 'text-indigo-400 font-semibold border-b-2 border-indigo-500' : 'hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Results List View */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {/* AI Overview Box */}
            {aiSummary && (
              <div className="p-4 rounded-xl bg-slate-900/80 border border-indigo-500/30 space-y-2.5 shadow-sm">
                <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>AI Executive Summary</span>
                </div>
                <div className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line bg-slate-950/60 p-3 rounded-lg border border-white/[0.06]">
                  {aiSummary}
                </div>
              </div>
            )}

            {/* Result Cards */}
            {results.map((res, idx) => (
              <div key={idx} className="space-y-1 p-3.5 rounded-xl hover:bg-slate-900/60 transition-all border border-transparent hover:border-white/[0.08]">
                <div className="text-[11px] text-slate-500 font-mono truncate">{res.url}</div>
                <a
                  href={res.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1.5"
                >
                  <span>{res.title}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">{res.snippet}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
