import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Home, Star, ShieldCheck, Lock, Plus, X, Globe, Search, Sparkles, BookOpen, ExternalLink } from 'lucide-react';
import { getServerIp } from '../utils/apiConfig';
import geminiClient from '../utils/geminiClient';

export default function JasperBrowserApp() {
  const [tabs, setTabs] = useState([
    { id: 1, title: 'JASPER Search Engine', url: 'https://www.google.com', active: true },
    { id: 2, title: 'Wikipedia - Technology', url: 'https://en.wikipedia.org', active: false }
  ]);
  const [activeTabId, setActiveTabId] = useState(1);
  const [urlInput, setUrlInput] = useState('https://www.google.com');
  const [isReaderMode, setIsReaderMode] = useState(false);
  const [readerContent, setReaderContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('');

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  const handleNavigate = (targetUrl) => {
    let finalUrl = targetUrl || urlInput;
    if (!finalUrl.trim()) return;

    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      if (finalUrl.includes('.') && !finalUrl.includes(' ')) {
        finalUrl = `https://${finalUrl}`;
      } else {
        finalUrl = `https://www.google.com/search?q=${encodeURIComponent(finalUrl)}`;
      }
    }

    setUrlInput(finalUrl);
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, url: finalUrl, title: finalUrl.replace(/^https?:\/\//, '').split('/')[0] } : t));
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 800);
  };

  const addNewTab = () => {
    const newId = Date.now();
    const newTab = { id: newId, title: 'New Tab', url: 'https://www.google.com', active: true };
    setTabs(prev => [...prev.map(t => ({ ...t, active: false })), newTab]);
    setActiveTabId(newId);
    setUrlInput('https://www.google.com');
  };

  const closeTab = (tabId, e) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const remaining = tabs.filter(t => t.id !== tabId);
    setTabs(remaining);
    if (activeTabId === tabId) {
      setActiveTabId(remaining[0].id);
      setUrlInput(remaining[0].url);
    }
  };

  const toggleReaderView = async () => {
    if (isReaderMode) {
      setIsReaderMode(false);
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
        // Generate AI Summary of page
        try {
          const summary = await geminiClient.generateContent(`Summarize the key points of this webpage content:\n\n${data.content.substring(0, 2000)}`);
          setAiSummary(summary);
        } catch (e) {}
      } else {
        setReaderContent(`Failed to extract reader content for ${activeTab.url}`);
        setIsReaderMode(true);
      }
    } catch (err) {
      setReaderContent(`Reader mode active for ${activeTab.url}. Open directly to view.`);
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
            onClick={() => {
              setActiveTabId(tab.id);
              setUrlInput(tab.url);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-t-xl text-xs font-mono max-w-xs cursor-pointer transition-all border-t border-x ${
              tab.id === activeTabId
                ? 'bg-slate-900 border-cyan-500/40 text-cyan-200 font-semibold shadow-[0_-2px_10px_rgba(0,240,255,0.1)]'
                : 'bg-cyan-950/40 border-transparent text-slate-400 hover:text-slate-200 hover:bg-cyan-950/70'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
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
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
          <button onClick={() => handleNavigate('https://www.google.com')} className="p-1.5 rounded-lg hover:bg-cyan-500/20 text-slate-300">
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
            placeholder="Search Google or type a URL..."
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
            title="Toggle Reader Mode"
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
        <span>Bookmarks:</span>
        {[
          { name: '🌐 Google', url: 'https://www.google.com' },
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
        {isReaderMode ? (
          <div className="h-full overflow-y-auto p-6 max-w-4xl mx-auto space-y-4 font-sans text-slate-200 leading-relaxed custom-scrollbar">
            <div className="border-b border-cyan-500/30 pb-3">
              <h2 className="text-xl font-bold text-cyan-200 font-orbitron">JASPER Reader View</h2>
              <a href={activeTab.url} target="_blank" rel="noreferrer" className="text-xs text-cyan-400 hover:underline flex items-center gap-1 mt-1">
                <span>{activeTab.url}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {aiSummary && (
              <div className="p-4 bg-cyan-950/40 border border-cyan-400/40 rounded-xl space-y-2">
                <div className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> AI Executive Summary
                </div>
                <p className="text-xs text-slate-200">{aiSummary}</p>
              </div>
            )}

            <div className="bg-slate-950/60 p-4 rounded-xl border border-cyan-500/20 text-xs font-sans whitespace-pre-wrap">
              {readerContent || 'Extracting page text content...'}
            </div>
          </div>
        ) : (
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
