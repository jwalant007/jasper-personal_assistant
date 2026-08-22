import React, { useState, useEffect } from 'react';
import { getApiBase } from '../utils/apiConfig.js';
import { Brain, Plus, Trash2, Search, Sparkles, XCircle, CheckCircle2, RefreshCw } from 'lucide-react';

export default function MemoryDashboardWidget({ onClose }) {
  const [activeTab, setActiveTab] = useState('recent'); // recent, learned, preferences, semantic
  const [memories, setMemories] = useState([]);
  const [newMemoryText, setNewMemoryText] = useState('');
  const [newCategory, setNewCategory] = useState('learned');
  const [searchQuery, setSearchQuery] = useState('');
  const [semanticResults, setSemanticResults] = useState([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractStatus, setExtractStatus] = useState('');

  const fetchMemories = async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/memory`);
      const data = await res.json();
      setMemories(data.memories || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  const handleAddMemory = async (e) => {
    e.preventDefault();
    if (!newMemoryText.trim()) return;
    try {
      const res = await fetch(`${getApiBase()}/api/memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newMemoryText, category: newCategory })
      });
      const data = await res.json();
      if (data.memories) setMemories(data.memories);
      setNewMemoryText('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMemory = async (id) => {
    try {
      const res = await fetch(`${getApiBase()}/api/memory/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.memories) setMemories(data.memories);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSemanticSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSemanticResults([]);
      return;
    }
    try {
      const res = await fetch(`${getApiBase()}/api/memory/semantic-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit: 5 })
      });
      const data = await res.json();
      setSemanticResults(data.memories || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAutoExtract = async () => {
    setIsExtracting(true);
    setExtractStatus('Extracting user facts from chat logs...');
    try {
      const res = await fetch(`${getApiBase()}/api/memory/auto-extract`, { method: 'POST' });
      const data = await res.json();
      if (data.memories) setMemories(data.memories);
      setExtractStatus(`Extracted ${data.extractedCount || 0} memory facts!`);
      setTimeout(() => setExtractStatus(''), 4000);
    } catch (e) {
      setExtractStatus('Failed to extract memories');
    } finally {
      setIsExtracting(false);
    }
  };

  const filteredMemories = activeTab === 'semantic' && searchQuery.trim() 
    ? semanticResults
    : memories.filter(m => {
        const matchesSearch = m.text.toLowerCase().includes(searchQuery.toLowerCase());
        if (activeTab === 'recent') return matchesSearch;
        if (activeTab === 'learned') return matchesSearch && (m.category === 'learned' || m.category === 'knowledge' || m.category === 'auto-extracted');
        if (activeTab === 'preferences') return matchesSearch && (m.category === 'preference' || m.category === 'device' || m.category === 'user-fact');
        return matchesSearch;
      });

  return (
    <div className="bg-slate-950/90 border border-purple-500/30 rounded-2xl p-6 text-slate-100 backdrop-blur-xl shadow-2xl max-w-4xl w-full mx-auto relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-purple-500/20 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 border border-purple-500/40 rounded-xl text-purple-400">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-wider text-purple-300 uppercase">Semantic Memory Engine</h2>
            <p className="text-xs text-slate-400">Long-term TF-IDF Vector & Conversational Memory</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoExtract}
            disabled={isExtracting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 rounded-xl text-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isExtracting ? 'animate-spin' : ''}`} />
            Auto-Extract Memory
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800/60 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {extractStatus && (
        <div className="mb-4 text-xs font-mono text-purple-400 bg-purple-900/30 border border-purple-500/30 rounded-xl p-2.5 text-center">
          {extractStatus}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-4 border-b border-slate-800 pb-3">
        {[
          { id: 'recent', label: 'Recent Memories', icon: Brain },
          { id: 'semantic', label: 'Vector Semantic Search', icon: Search },
          { id: 'learned', label: 'Auto-Extracted Facts', icon: Sparkles },
          { id: 'preferences', label: 'User Preferences', icon: CheckCircle2 }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                isActive 
                  ? 'bg-purple-500/20 border border-purple-500/60 text-purple-300 shadow-lg shadow-purple-500/10' 
                  : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Add & Search Controls */}
      <div className="space-y-3 mb-6">
        <form onSubmit={handleAddMemory} className="flex gap-2">
          <input
            type="text"
            placeholder="Add new memory fact or preference..."
            value={newMemoryText}
            onChange={(e) => setNewMemoryText(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500/60"
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 text-xs text-slate-300"
          >
            <option value="learned">Learned Fact</option>
            <option value="preference">User Preference</option>
            <option value="general">General</option>
          </select>
          <button type="submit" className="px-5 py-2.5 bg-purple-600/30 border border-purple-500/60 text-purple-200 hover:bg-purple-600/50 rounded-xl text-xs font-semibold flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Add Memory
          </button>
        </form>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder={activeTab === 'semantic' ? 'Type to perform semantic vector search...' : 'Filter memories...'}
            value={searchQuery}
            onChange={(e) => activeTab === 'semantic' ? handleSemanticSearch(e.target.value) : setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-800/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-300 focus:border-purple-500/50"
          />
        </div>
      </div>

      {/* Memories List */}
      <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1">
        {filteredMemories.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-8">No memories found in this view.</p>
        ) : (
          filteredMemories.map(m => (
            <div key={m.id} className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs group hover:border-purple-500/40 transition-all">
              <div className="flex items-center gap-3 overflow-hidden pr-2">
                <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase bg-purple-500/10 text-purple-300 border border-purple-500/30 shrink-0">
                  {m.category || 'general'}
                </span>
                <span className="text-slate-200 truncate">{m.text}</span>
                {m.score !== undefined && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded font-mono shrink-0">
                    {(m.score * 100).toFixed(0)}% match
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                  {m.date ? new Date(m.date).toLocaleDateString() : ''}
                </span>
                <button
                  onClick={() => handleDeleteMemory(m.id)}
                  className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
