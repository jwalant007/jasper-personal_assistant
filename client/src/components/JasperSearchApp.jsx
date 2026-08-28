import React, { useState, useEffect } from 'react';
import { Search, Globe, Sparkles, ExternalLink, RefreshCw, Layers, FileText, Image as ImageIcon, Code, ArrowRight, ShieldCheck, Zap, BookOpen } from 'lucide-react';
import { getServerIp } from '../utils/apiConfig';
import geminiClient from '../utils/geminiClient';

export default function JasperSearchApp() {
  const [query, setQuery] = useState('');
  const [searchTab, setSearchTab] = useState('all'); // all, ai, web, images, code
  const [results, setResults] = useState([]);
  const [aiSummary, setAiSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('jasper_search_history') || '[]');
    } catch (e) {
      return ['Quantum Computing 2026', 'React 19 Server Components', 'SpaceX Starship launch', 'JASPER OS Architecture'];
    }
  });

  const performSearch = async (searchQuery) => {
    const targetQuery = searchQuery || query;
    if (!targetQuery.trim()) return;

    setLoading(true);
    setAiSummary('');
    setResults([]);

    // Update Search History
    setSearchHistory(prev => {
      const updated = [targetQuery, ...prev.filter(q => q !== targetQuery)].slice(0, 10);
      localStorage.setItem('jasper_search_history', JSON.stringify(updated));
      return updated;
    });

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
          { title: `${targetQuery} Overview`, snippet: `Synthesizing neural search data for ${targetQuery}...`, url: `https://www.google.com/search?q=${encodeURIComponent(targetQuery)}` }
        ]);
      }

      // Generate AI Synthesis
      try {
        const aiPrompt = `Provide a concise 3-bullet point executive summary and quick knowledge overview for the search query: "${targetQuery}". Keep it crisp and informative for JASPER OS users.`;
        const aiAnswer = await geminiClient.generateContent(aiPrompt);
        setAiSummary(aiAnswer);
      } catch (err) {
        setAiSummary(`JASPER OS Knowledge Engine active for: ${targetQuery}`);
      }
    } catch (err) {
      console.error('[JASPER Search Error]:', err);
      setResults([
        { title: `${targetQuery} Web Search`, snippet: `Direct web search results for "${targetQuery}". Click to open in browser.`, url: `https://www.google.com/search?q=${encodeURIComponent(targetQuery)}` }
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
    <div className="flex flex-col h-full bg-slate-950/80 text-slate-100 font-sans p-4 rounded-xl space-y-4">
      {/* Top Search Engine Header Bar */}
      <div className="flex items-center gap-3 bg-cyan-950/50 border border-cyan-500/40 p-2.5 rounded-2xl shadow-[0_0_25px_rgba(0,240,255,0.15)] backdrop-blur-xl">
        <div className="p-2 bg-cyan-500/20 border border-cyan-400 rounded-xl text-cyan-300">
          <Search className="w-5 h-5 animate-pulse" />
        </div>
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search the Web, AI Knowledge Base, Code, or Wikipedia..."
            className="w-full pl-4 pr-10 py-2 bg-cyan-950/70 border border-cyan-500/40 rounded-xl text-sm font-mono text-cyan-100 placeholder-cyan-500/50 focus:outline-none focus:border-cyan-400"
          />
          {loading && (
            <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin absolute right-3 top-3" />
          )}
        </div>
        <button
          onClick={() => performSearch()}
          disabled={loading || !query.trim()}
          className="px-4 py-2 bg-cyan-500/30 hover:bg-cyan-500/40 border border-cyan-400 text-cyan-200 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-1.5"
        >
          <span>Search</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tabs & Filters */}
      <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2">
        <div className="flex items-center gap-2">
          {[
            { id: 'all', label: '🌐 All Results', icon: Globe },
            { id: 'ai', label: '🧠 AI Synthesized', icon: Sparkles },
            { id: 'web', label: '📄 Web Pages', icon: FileText },
            { id: 'images', label: '🖼️ Images', icon: ImageIcon },
            { id: 'code', label: '💻 Code & Docs', icon: Code }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSearchTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all ${
                  searchTab === tab.id
                    ? 'bg-cyan-500/25 border border-cyan-400 text-cyan-200 font-bold shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                    : 'text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/40 border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="text-[10px] font-mono text-cyan-400/80 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Safe Search Active
        </div>
      </div>

      {/* Main Search Results Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
        {/* Recent Search History Chips */}
        {results.length === 0 && !loading && (
          <div className="p-4 bg-cyan-950/20 border border-cyan-500/20 rounded-xl">
            <div className="text-xs font-mono text-cyan-300 mb-2 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" /> Recent Search Queries
            </div>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(item);
                    performSearch(item);
                  }}
                  className="px-3 py-1 bg-cyan-950/60 border border-cyan-500/30 hover:border-cyan-400 text-xs font-mono text-slate-300 hover:text-cyan-200 rounded-lg transition-all"
                >
                  🔍 {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AI Answer Card */}
        {aiSummary && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/60 to-purple-950/60 border border-cyan-400/50 shadow-[0_0_20px_rgba(0,240,255,0.15)] relative">
            <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
              <span>JASPER Neural AI Knowledge Synthesis</span>
            </div>
            <div className="text-sm text-slate-200 font-sans leading-relaxed whitespace-pre-line bg-slate-900/50 p-3 rounded-lg border border-cyan-500/20">
              {aiSummary}
            </div>
          </div>
        )}

        {/* Web Search Result Items */}
        {results.map((res, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 hover:border-cyan-400/60 transition-all space-y-1.5 hover:shadow-[0_0_15px_rgba(0,240,255,0.1)] group"
          >
            <div className="flex items-center justify-between">
              <a
                href={res.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-bold text-cyan-300 group-hover:text-cyan-200 hover:underline flex items-center gap-1.5"
              >
                <span>{res.title}</span>
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400/70" />
              </a>
              <span className="text-[10px] font-mono text-cyan-500/70 truncate max-w-xs">{res.url}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">{res.snippet}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
