import React, { useState, useEffect } from 'react';
import { getApiBase } from '../utils/apiConfig.js';
import { Monitor, Power, Search, Music, Cpu, HardDrive, ShieldAlert, RefreshCw, Play, SkipForward, SkipBack, XCircle, CheckCircle2 } from 'lucide-react';

export default function PcCommandCenterWidget({ onClose }) {
  const [activeTab, setActiveTab] = useState('apps'); // apps, power, search, spotify, diagnostics
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [diagnostics, setDiagnostics] = useState(null);
  const [powerModal, setPowerModal] = useState(null); // 'shutdown' | 'restart' | null
  const [powerMessage, setPowerMessage] = useState('');
  const [appLaunchStatus, setAppLaunchStatus] = useState('');

  // Fetch PC Diagnostics
  const fetchDiagnostics = async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/system/diagnostics`);
      const data = await res.json();
      setDiagnostics(data);
    } catch (err) {
      console.error('Failed to fetch diagnostics:', err);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
    const interval = setInterval(fetchDiagnostics, 5000);
    return () => clearInterval(interval);
  }, []);

  // Application launcher handler
  const handleLaunchApp = async (appName) => {
    setAppLaunchStatus(`Launching ${appName}...`);
    try {
      const res = await fetch(`${getApiBase()}/api/system/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appName })
      });
      const data = await res.json();
      if (res.ok) {
        setAppLaunchStatus(`Launched ${appName} successfully!`);
      } else {
        setAppLaunchStatus(`Error: ${data.error}`);
      }
    } catch (e) {
      setAppLaunchStatus(`Failed to launch ${appName}`);
    }
    setTimeout(() => setAppLaunchStatus(''), 4000);
  };

  // Disk File Search
  const handleFileSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`${getApiBase()}/api/system/search-files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      setIsSearching(false);
    }
  };

  // Power control execution
  const handlePowerAction = async (action) => {
    try {
      const res = await fetch(`${getApiBase()}/api/system/power`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, timeout: 30 })
      });
      const data = await res.json();
      setPowerMessage(data.message || data.error);
    } catch (e) {
      setPowerMessage('Power command failed');
    }
    setPowerModal(null);
  };

  // Media controls
  const handleMediaControl = async (action) => {
    try {
      await fetch(`${getApiBase()}/api/system/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
    } catch (e) {
      console.error('Media control failed:', e);
    }
  };

  return (
    <div className="bg-slate-950/90 border border-cyan-500/30 rounded-2xl p-6 text-slate-100 backdrop-blur-xl shadow-2xl max-w-4xl w-full mx-auto relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/40 rounded-xl text-cyan-400">
            <Monitor className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-wider text-cyan-300 uppercase">PC Command Center</h2>
            <p className="text-xs text-slate-400">System Controls, Hardware Diagnostics & File Management</p>
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
          { id: 'apps', label: 'Open Apps', icon: Monitor },
          { id: 'power', label: 'Power Control', icon: Power },
          { id: 'search', label: 'Search Files', icon: Search },
          { id: 'spotify', label: 'Control Spotify', icon: Music },
          { id: 'diagnostics', label: 'Hardware Diagnostics', icon: Cpu }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                isActive 
                  ? 'bg-cyan-500/20 border border-cyan-500/60 text-cyan-300 shadow-lg shadow-cyan-500/10' 
                  : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {appLaunchStatus && (
        <div className="mb-4 p-3 bg-cyan-950/40 border border-cyan-500/40 rounded-xl text-cyan-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          {appLaunchStatus}
        </div>
      )}

      {powerMessage && (
        <div className="mb-4 p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl text-amber-300 text-xs flex items-center justify-between">
          <span>{powerMessage}</span>
          <button onClick={() => setPowerMessage('')} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Content Area */}
      <div className="min-h-[300px]">
        {/* Tab 1: Open Apps */}
        {activeTab === 'apps' && (
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Quick Launch Desktop Applications</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {[
                { name: 'Chrome Browser', app: 'chrome', icon: '🌐' },
                { name: 'Spotify Music', app: 'spotify', icon: '🎵' },
                { name: 'File Explorer', app: 'explorer', icon: '📁' },
                { name: 'Notepad', app: 'notepad', icon: '📝' },
                { name: 'Calculator', app: 'calc', icon: '🔢' },
                { name: 'Task Manager', app: 'taskmgr', icon: '📊' },
                { name: 'Paint', app: 'paint', icon: '🎨' },
                { name: 'Command Prompt', app: 'cmd', icon: '💻' }
              ].map(item => (
                <button
                  key={item.app}
                  onClick={() => handleLaunchApp(item.app)}
                  className="flex flex-col items-center justify-center p-4 bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:bg-slate-800/80 group"
                >
                  <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">{item.icon}</span>
                  <span className="text-xs font-medium text-slate-300 group-hover:text-cyan-300">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Power Control */}
        {activeTab === 'power' && (
          <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-xl flex flex-col items-center justify-center text-center">
            <ShieldAlert className="w-12 h-12 text-rose-400 mb-3 animate-pulse" />
            <h3 className="text-lg font-bold text-slate-100 mb-1">PC Power Management</h3>
            <p className="text-xs text-slate-400 max-w-md mb-6">
              Initiate standard Windows shutdown or restart sequences. A 30-second warning countdown will be triggered.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => setPowerModal('shutdown')}
                className="px-6 py-3 bg-rose-600/30 border border-rose-500/60 hover:bg-rose-600/50 text-rose-200 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all"
              >
                <Power className="w-4 h-4" /> Shutdown PC
              </button>
              <button
                onClick={() => setPowerModal('restart')}
                className="px-6 py-3 bg-amber-600/30 border border-amber-500/60 hover:bg-amber-600/50 text-amber-200 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Restart PC
              </button>
              <button
                onClick={() => handlePowerAction('cancel')}
                className="px-6 py-3 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold text-sm transition-all"
              >
                Cancel Pending Action
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Search Files */}
        {activeTab === 'search' && (
          <div>
            <form onSubmit={handleFileSearch} className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search files on PC by filename..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/60"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="px-5 py-2.5 bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/30 rounded-xl text-sm font-medium transition-all"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </form>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {searchResults.length === 0 && !isSearching && (
                <p className="text-xs text-slate-500 text-center py-8">Enter a query to search disk files.</p>
              )}
              {searchResults.map((file, idx) => (
                <div key={idx} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs hover:border-slate-700 transition-all">
                  <div className="flex items-center gap-2 overflow-hidden pr-2">
                    <span className="text-base">{file.isDir ? '📁' : '📄'}</span>
                    <div className="truncate">
                      <p className="font-semibold text-slate-200 truncate">{file.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{file.path}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                    {file.isDir ? 'DIR' : `${Math.round(file.size / 1024)} KB`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Spotify Control */}
        {activeTab === 'spotify' && (
          <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-xl text-center flex flex-col items-center">
            <Music className="w-10 h-10 text-emerald-400 mb-3 animate-pulse" />
            <h3 className="text-base font-bold text-slate-200 mb-1">Desktop Media & Spotify Controller</h3>
            
            {nowPlaying && nowPlaying.title ? (
              <div className="my-3 p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-lg max-w-sm w-full">
                <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-1">
                  {nowPlaying.isPlaying ? '▶ Now Playing' : '⏸ Paused'}
                </p>
                <p className="text-sm font-bold text-slate-100 truncate">{nowPlaying.title}</p>
                <p className="text-xs text-slate-400 truncate">{nowPlaying.artist || 'Unknown Artist'}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 mb-6">Send system media key events directly to Spotify or media player.</p>
            )}

            <div className="flex gap-4">
              <button 
                onClick={() => handleMediaControl('prev')}
                className="p-4 bg-slate-800 border border-slate-700 rounded-full text-slate-200 hover:bg-slate-700 hover:text-cyan-300 transition-all"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              <button 
                onClick={() => handleMediaControl('playpause')}
                className="p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-full text-emerald-300 hover:bg-emerald-500/30 transition-all shadow-lg shadow-emerald-500/20"
              >
                <Play className="w-6 h-6" />
              </button>
              <button 
                onClick={() => handleMediaControl('next')}
                className="p-4 bg-slate-800 border border-slate-700 rounded-full text-slate-200 hover:bg-slate-700 hover:text-cyan-300 transition-all"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 5: Hardware Diagnostics */}
        {activeTab === 'diagnostics' && (
          <div>
            {diagnostics ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">Memory Usage</span>
                    <HardDrive className="w-4 h-4 text-cyan-400" />
                  </div>
                  <p className="text-2xl font-bold text-cyan-300 font-mono">{diagnostics.memory?.usagePercent}%</p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {Math.round(diagnostics.memory?.used / (1024 * 1024 * 1024))} GB / {Math.round(diagnostics.memory?.total / (1024 * 1024 * 1024))} GB
                  </p>
                </div>

                <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">Processor Cores</span>
                    <Cpu className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-2xl font-bold text-emerald-300 font-mono">{diagnostics.cpuCount} Cores</p>
                  <p className="text-[10px] text-slate-500 truncate mt-1">{diagnostics.cpuModel}</p>
                </div>

                <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">System Hostname</span>
                    <Monitor className="w-4 h-4 text-purple-400" />
                  </div>
                  <p className="text-lg font-bold text-purple-300 font-mono truncate">{diagnostics.hostname}</p>
                  <p className="text-[10px] text-slate-500 mt-1">OS: {diagnostics.platform} ({diagnostics.arch})</p>
                </div>

                <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl sm:col-span-2 md:col-span-3">
                  <span className="text-xs text-slate-400 block mb-1">System Uptime</span>
                  <p className="text-sm font-bold text-amber-300 font-mono">
                    {Math.floor(diagnostics.uptime / 3600)} Hours {Math.floor((diagnostics.uptime % 3600) / 60)} Mins
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-8">Loading system diagnostics...</p>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {powerModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl p-6 max-w-md w-full text-center">
            <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-100 mb-2">Confirm System {powerModal.toUpperCase()}</h3>
            <p className="text-xs text-slate-300 mb-6">
              Are you sure you want to {powerModal} your computer? A 30-second timer will start before execution.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setPowerModal(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePowerAction(powerModal)}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-500 shadow-lg shadow-rose-600/30"
              >
                Yes, {powerModal}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
