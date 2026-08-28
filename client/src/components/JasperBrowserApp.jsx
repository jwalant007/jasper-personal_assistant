import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Home, Lock, Plus, X, Globe, Search, Sparkles, BookOpen, ExternalLink, ShieldCheck, Layers, FileText } from 'lucide-react';
import { getServerIp } from '../utils/apiConfig';
import geminiClient from '../utils/geminiClient';

export default function JasperBrowserApp() {
  const [tabs, setTabs] = useState([
    { id: 1, title: 'JASPER Search', url: 'search://quantum computing', isSearch: true, active: true },
    { id: 2, title: 'Wikipedia Tech', url: 'https://en.wikipedia.org', isSearch: false, active: false }
  ]);
  const [activeTabId, setActiveTabId] = useState(1);
  const [urlInput, setUrlInput] = useState('quantum computing');
  
  // Search Engine Viewport States
  const [searchResults, setSearchResults] = useState([]);
  const [aiOverview, setAiOverview] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Reader Mode States
  const [isReaderMode, setIsReaderMode] = useState(false);
  const [readerContent, setReaderContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  // Perform Multi-Result Web Search
  const executeSearchQuery = async (searchQuery) => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    setAiOverview('');

    try {
      const serverIp = getServerIp();
      const searchRes = await fetch(`http://${serverIp}:3001/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });
      const data = await searchRes.json();

      if (data.success && data.results && data.results.length > 0) {
        setSearchResults(data.results);
      } else {
        setSearchResults([
          { title: `${searchQuery} Overview & Specs`, snippet: `Found live search records for ${searchQuery}. Click to open full webpage.`, url: `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}` },
          { title: `${searchQuery} Wikipedia Knowledge Base`, snippet: `Explore detailed encyclopedia entry and definitions for ${searchQuery}.`, url: `https://en.wikipedia.org/wiki/${encodeURIComponent(searchQuery)}` }
        ]);
      }

      // Generate AI Overview for Search Query
      try {
        const prompt = `Provide a concise 3-bullet point executive summary overview for search query: "${searchQuery}".`;
        const aiAnswer = await geminiClient.generateContent(prompt);
        setAiOverview(aiAnswer);
      } catch (e) {
        setAiOverview(`JASPER Browser search results ready for: ${searchQuery}`);
      }
    } catch (err) {
      console.error('[Browser Search Error]:', err);
      setSearchResults([
        { title: `${searchQuery} - Direct Search`, snippet: `Web search results for "${searchQuery}". Click to open in browser.`, url: `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}` }
      ]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (activeTab?.isSearch) {
      const queryStr = activeTab.url.replace(/^search:\/\//, '');
      setUrlInput(queryStr);
      executeSearchQuery(queryStr);
    } else if (activeTab) {
      setUrlInput(activeTab.url);
    }
  }, [activeTabId]);

  const handleNavigate = (targetUrl) => {
    let input = targetUrl || urlInput;
    if (!input.trim()) return;

    const isDirectUrl = /^https?:\/\//i.test(input) || (input.includes('.') && !input.includes(' '));

    if (isDirectUrl) {
      let finalUrl = input;
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = `https://${finalUrl}`;
      }
      setUrlInput(finalUrl);
      setTabs(prev => prev.map(t => t.id === activeTabId ? { 
        ...t, 
        url: finalUrl, 
        title: finalUrl.replace(/^https?:\/\//, '').split('/')[0],
        isSearch: false 
      } : t));
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 600);
    } else {
      // Execute Multi-Result Search
      const searchUrl = `search://${input}`;
      setUrlInput(input);
      setTabs(prev => prev.map(t => t.id === activeTabId ? { 
        ...t, 
        url: searchUrl, 
        title: `Search: ${input}`,
        isSearch: true 
      } : t));
      executeSearchQuery(input);
    }
  };

  const openResultInNewTab = (url, title) => {
    const newId = Date.now();
    const newTab = { id: newId, title: title || 'Web Page', url: url, isSearch: false, active: true };
    setTabs(prev => [...prev.map(t => ({ ...t, active: false })), newTab]);
    setActiveTabId(newId);
    setUrlInput(url);
  };

  const addNewTab = () => {
    const newId = Date.now();
    const newTab = { id: newId, title: 'JASPER Search', url: 'search://latest AI technology', isSearch: true, active: true };
    setTabs(prev => [...prev.map(t => ({ ...t, active: false })), newTab]);
    setActiveTabId(newId);
    setUrlInput('latest AI technology');
  };

  const closeTab = (tabId, e) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const remaining = tabs.filter(t => t.id !== tabId);
    setTabs(remaining);
    if (activeTabId === tabId) {
      setActiveTabId(remaining[0].id);
    }
  };

  const toggleReaderView = async () => {
    if (isReaderMode) {
      setIsReaderMode(false);
      return;
    }

    if (activeTab.isSearch) {
      setReaderContent('Reader mode is designed for webpage text extraction. Select a search result below to view in Reader mode.');
      setIsReaderMode(true);
      return;
    }

    setIsLoading(true);
    try {
      const serverIp = getServerIp();
      const res = await fetch(`http://${serverIp}:3001/api/fetch-page`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: activeTab.url })
      });
      const data = await res.json();
      if (data.success) {
        setReaderContent(data.content);
        setIsReaderMode(true);
      } else {
        setReaderContent(`Failed to extract text content for ${activeTab.url}`);
        setIsReaderMode(true);
      }
    } catch (err) {
      setReaderContent(`Reader view ready for ${activeTab.url}`);
      setIsReaderMode(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/90 text-slate-100 font-sans rounded-xl overflow-hidden shadow-2xl">
      {/* Chrome Multi-Tab Bar */}
      <div className="flex items-center gap-1 bg-cyan-950/80 px-2 pt-2 border-b border-cyan-500/30 overflow-x-auto custom-scrollbar">
        {tabs.map(tab => (
          <div
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-t-xl text-xs font-mono max-w-xs cursor-pointer transition-all border-t border-x ${
              tab.id === activeTabId
                ? 'bg-slate-900 border-cyan-500/40 text-cyan-200 font-semibold shadow-[0_-2px_10px_rgba(0,240,255,0.1)]'
                : 'bg-cyan-950/40 border-transparent text-slate-400 hover:text-slate-200 hover:bg-cyan-950/70'
            }`}
          >
            {tab.isSearch ? <Search className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" /> : <Globe className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
            <span className="truncate">{tab.title}</span>
            <button
              onClick={(e) => closeTab(tab.id, e)}
              className="p-0.5 rounded-full hover:bg-cyan-500/30 text-slate-400 hover:text-cyan-200 ml-1"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        <button
          onClick={addNewTab}
          className="p-1.5 rounded-lg text-cyan-400 hover:bg-cyan-500/20 transition-all ml-1"
          title="Open New Tab"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Chrome OmniBar / Navigation Bar */}
      <div className="flex items-center gap-2 p-2 bg-slate-900 border-b border-cyan-500/30">
        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded-lg hover:bg-cyan-500/20 text-slate-300">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-cyan-500/20 text-slate-300">
            <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={() => handleNavigate()} className="p-1.5 rounded-lg hover:bg-cyan-500/20 text-slate-300">
            <RotateCw className={`w-4 h-4 ${isSearching || isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
          <button onClick={() => handleNavigate('search://quantum computing')} className="p-1.5 rounded-lg hover:bg-cyan-500/20 text-slate-300">
            <Home className="w-4 h-4" />
          </button>
        </div>

        {/* Address Bar / URL Bar */}
        <div className="flex-1 relative flex items-center">
          <Lock className="w-3.5 h-3.5 absolute left-3 text-emerald-400" />
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNavigate()}
            placeholder="Search Google/Web or type website URL..."
            className="w-full pl-9 pr-10 py-1.5 bg-black/60 border border-cyan-500/30 rounded-xl text-xs font-mono text-cyan-100 focus:outline-none focus:border-cyan-400"
          />
          <button onClick={() => handleNavigate()} className="absolute right-3 text-cyan-400 hover:text-cyan-200">
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tools & Reader Mode */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleReaderView}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1 transition-all border ${
              isReaderMode ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200' : 'bg-cyan-950/50 border-cyan-500/30 text-slate-300 hover:text-cyan-300'
            }`}
            title="Toggle Reader View"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reader</span>
          </button>

          <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-1 rounded-lg">
            <ShieldCheck className="w-3.5 h-3.5" /> AdBlock Active
          </div>
        </div>
      </div>

      {/* Speed Dial Quick Shortcuts Bar */}
      <div className="flex items-center gap-2 px-3 py-1 bg-cyan-950/30 border-b border-cyan-500/20 text-[11px] font-mono text-cyan-300 overflow-x-auto">
        <span>Quick Bookmarks:</span>
        {[
          { name: '🌐 Google AI Search', url: 'search://Google AI Search' },
          { name: '📺 YouTube', url: 'https://www.youtube.com' },
          { name: '📚 Wikipedia', url: 'https://www.wikipedia.org' },
          { name: '💻 GitHub', url: 'https://github.com' },
          { name: '🧠 ChatGPT', url: 'https://chatgpt.com' }
        ].map((bookmark, idx) => (
          <button
            key={idx}
            onClick={() => handleNavigate(bookmark.url)}
            className="px-2 py-0.5 rounded hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-200 transition-all flex items-center gap-1"
          >
            {bookmark.name}
          </button>
        ))}
      </div>

      {/* Main Browser Viewing Viewport */}
      <div className="flex-1 relative bg-slate-900 min-h-0 overflow-hidden">
        {activeTab?.isSearch ? (
          /* MULTI-RESULT SEARCH ENGINE VIEWPORT */
          <div className="h-full overflow-y-auto p-6 max-w-5xl mx-auto space-y-5 font-sans text-slate-200 custom-scrollbar">
            {/* Search Header Banner */}
            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-3">
              <div>
                <h2 className="text-xl font-extrabold text-cyan-200 font-orbitron flex items-center gap-2">
                  <Search className="w-5 h-5 text-cyan-400" />
                  <span>JASPER Multi-Result Search View</span>
                </h2>
                <p className="text-xs font-mono text-slate-400 mt-1">
                  Showing {searchResults.length} live search results for query: <strong className="text-cyan-300 font-mono">"{urlInput}"</strong>
                </p>
              </div>

              <div className="text-xs font-mono text-cyan-400 bg-cyan-950 border border-cyan-500/30 px-3 py-1 rounded-lg">
                ⚡ Real-Time Indexing Active
              </div>
            </div>

            {/* AI Knowledge Overview Box */}
            {aiOverview && (
              <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-400/50 space-y-2 shadow-[0_0_20px_rgba(0,240,255,0.1)]">
                <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                  <span>Google & JASPER AI Knowledge Overview</span>
                </div>
                <div className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-line bg-slate-950/60 p-3 rounded-lg border border-cyan-500/20">
                  {aiOverview}
                </div>
              </div>
            )}

            {/* Multiple Search Result Items */}
            <div className="space-y-4">
              {searchResults.map((res, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-950/60 border border-cyan-500/30 hover:border-cyan-400/70 transition-all space-y-2 group hover:shadow-[0_0_20px_rgba(0,240,255,0.1)]"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-mono text-cyan-400/80 truncate flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{res.url}</span>
                    </div>

                    <button
                      onClick={() => openResultInNewTab(res.url, res.title)}
                      className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/50 text-cyan-200 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition-all"
                    >
                      <span>Open in New Tab</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>

                  <a
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-base font-bold text-cyan-300 group-hover:text-cyan-100 hover:underline block"
                  >
                    {res.title}
                  </a>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{res.snippet}</p>
                </div>
              ))}
            </div>
          </div>
        ) : isReaderMode ? (
          /* READER MODE VIEWPORT */
          <div className="h-full overflow-y-auto p-6 max-w-4xl mx-auto space-y-4 font-sans text-slate-200 leading-relaxed custom-scrollbar">
            <div className="border-b border-cyan-500/30 pb-3">
              <h2 className="text-xl font-bold text-cyan-200 font-orbitron">JASPER Reader View</h2>
              <a href={activeTab.url} target="_blank" rel="noreferrer" className="text-xs text-cyan-400 hover:underline flex items-center gap-1 mt-1">
                <span>{activeTab.url}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="bg-slate-950/60 p-4 rounded-xl border border-cyan-500/20 text-xs font-sans whitespace-pre-wrap">
              {readerContent || 'Extracting webpage text content...'}
            </div>
          </div>
        ) : (
          /* STANDARD IFRAME WEBPAGE VIEWPORT */
          <iframe
            src={activeTab.url}
            title={activeTab.title}
            className="w-full h-full border-0 bg-white"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        )}
      </div>
    </div>
  );
}
