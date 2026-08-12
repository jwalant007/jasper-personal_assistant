import React, { useState } from 'react';
import { Globe, FileText, CheckSquare, Search, ExternalLink, Sparkles, XCircle, Loader2 } from 'lucide-react';

export default function BrowserAgentWidget({ onClose }) {
  const [activeTab, setActiveTab] = useState('research'); // open, summarize, fill, research
  const [urlInput, setUrlInput] = useState('');
  const [articleSummary, setArticleSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [researchTopic, setResearchTopic] = useState('');
  const [researchData, setResearchData] = useState(null);
  const [formData, setFormData] = useState({
    name: 'J.A.S.P.E.R. User',
    email: 'user@jasper.ai',
    phone: '+1 555-0199',
    address: '100 Silicon Way, Tech City'
  });

  // Open Website
  const handleOpenUrl = (e) => {
    e.preventDefault();
    let target = urlInput.trim();
    if (!target) return;
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = 'https://' + target;
    }
    fetch('/api/system/launch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: target })
    });
  };

  // Summarize Article
  const handleSummarize = async (e) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setLoading(true);
    setArticleSummary(null);
    try {
      let target = urlInput.trim();
      if (!target.startsWith('http')) target = 'https://' + target;
      const res = await fetch('/api/fetch-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: target })
      });
      const data = await res.json();
      if (data.content) {
        setArticleSummary({
          url: target,
          text: data.content.substring(0, 1200) + '...',
          charCount: data.charCount
        });
      } else {
        setArticleSummary({ error: data.error || 'Failed to extract article content' });
      }
    } catch (e) {
      setArticleSummary({ error: e.message });
    } finally {
      setLoading(false);
    }
  };

  // Autonomous Research Agent
  const handleResearch = async (e) => {
    e.preventDefault();
    if (!researchTopic.trim()) return;
    setLoading(true);
    setResearchData(null);
    try {
      const res = await fetch('/api/agent/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: researchTopic })
      });
      const data = await res.json();
      setResearchData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-950/90 border border-blue-500/30 rounded-2xl p-6 text-slate-100 backdrop-blur-xl shadow-2xl max-w-4xl w-full mx-auto relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-blue-500/20 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/40 rounded-xl text-blue-400">
            <Globe className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-wider text-blue-300 uppercase">Browser Agent</h2>
            <p className="text-xs text-slate-400">Autonomous Web Assistant, Research & Summarizer</p>
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

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-800 pb-3">
        {[
          { id: 'research', label: 'Research Automatically', icon: Search },
          { id: 'summarize', label: 'Summarize Articles', icon: FileText },
          { id: 'open', label: 'Open Websites', icon: ExternalLink },
          { id: 'fill', label: 'Fill Forms', icon: CheckSquare }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-500/20 border border-blue-500/60 text-blue-300 shadow-lg shadow-blue-500/10' 
                  : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="min-h-[300px]">
        {/* Tab 1: Research Automatically */}
        {activeTab === 'research' && (
          <div>
            <form onSubmit={handleResearch} className="flex gap-2 mb-6">
              <input
                type="text"
                placeholder="Enter research topic (e.g. Latest Breakthroughs in Quantum Computing)..."
                value={researchTopic}
                onChange={(e) => setResearchTopic(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/60"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600/30 border border-blue-500/60 text-blue-200 hover:bg-blue-600/50 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-blue-400" />}
                {loading ? 'Agent Researching...' : 'Start Research'}
              </button>
            </form>

            {researchData && (
              <div className="space-y-4 animate-in fade-in">
                <div className="p-4 bg-slate-900/80 border border-blue-500/30 rounded-xl">
                  <h3 className="text-sm font-bold text-blue-300 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400" /> Research Synthesis: {researchData.topic}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{researchData.summary}</p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Top Sources Found</h4>
                  <div className="space-y-2">
                    {researchData.sources?.map((s, idx) => (
                      <div key={idx} className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl text-xs flex justify-between items-start gap-4">
                        <div>
                          <a href={s.url} target="_blank" rel="noreferrer" className="font-bold text-blue-400 hover:underline flex items-center gap-1">
                            {s.title} <ExternalLink className="w-3 h-3" />
                          </a>
                          <p className="text-slate-400 text-[11px] mt-1">{s.snippet}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Summarize Article */}
        {activeTab === 'summarize' && (
          <div>
            <form onSubmit={handleSummarize} className="flex gap-2 mb-6">
              <input
                type="text"
                placeholder="Enter article URL to read & summarize..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/60"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600/30 border border-blue-500/60 text-blue-200 hover:bg-blue-600/50 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4 text-blue-400" />}
                {loading ? 'Fetching Page...' : 'Summarize'}
              </button>
            </form>

            {articleSummary && (
              <div className="p-4 bg-slate-900/80 border border-blue-500/30 rounded-xl">
                {articleSummary.error ? (
                  <p className="text-xs text-rose-400">{articleSummary.error}</p>
                ) : (
                  <div>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-mono mb-2 inline-block">
                      {articleSummary.charCount} characters processed
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed">{articleSummary.text}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Open Websites */}
        {activeTab === 'open' && (
          <div>
            <form onSubmit={handleOpenUrl} className="flex gap-2 mb-6">
              <input
                type="text"
                placeholder="Enter website URL (e.g. wikipedia.org)..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/60"
              />
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600/30 border border-blue-500/60 text-blue-200 hover:bg-blue-600/50 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all"
              >
                <ExternalLink className="w-4 h-4" /> Open Site
              </button>
            </form>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { name: 'Google', url: 'https://google.com' },
                { name: 'YouTube', url: 'https://youtube.com' },
                { name: 'GitHub', url: 'https://github.com' },
                { name: 'Wikipedia', url: 'https://wikipedia.org' }
              ].map(site => (
                <button
                  key={site.url}
                  onClick={() => {
                    setUrlInput(site.url);
                    fetch('/api/system/launch', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ url: site.url })
                    });
                  }}
                  className="p-3 bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 rounded-xl text-xs font-medium text-slate-300 hover:text-blue-300 transition-all flex items-center justify-between"
                >
                  <span>{site.name}</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Fill Forms */}
        {activeTab === 'fill' && (
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
            <h3 className="text-sm font-bold text-slate-200 mb-3">Auto-Fill Profile Preset</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Email Address</label>
                <input
                  type="text"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>
            </div>
            <p className="text-[11px] text-blue-400 mt-3 flex items-center gap-1">
              <CheckSquare className="w-3.5 h-3.5" /> Preset saved! Use voice command "fill my details" during form navigation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
