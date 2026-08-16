import React, { useState, useEffect, useRef } from 'react';
import { 
  Smartphone, 
  Wifi, 
  Bluetooth, 
  Sun, 
  Camera, 
  PhoneCall, 
  MessageSquare, 
  Lock, 
  Settings, 
  ChevronRight, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  ChevronDown, 
  ChevronUp, 
  Bell, 
  Search,
  RotateCw,
  ArrowLeft,
  Circle,
  Square,
  Power,
  Tv,
  Folder,
  FolderOpen,
  Maximize2,
  Minimize2,
  Grid,
  Layers,
  Sparkles,
  Share2,
  Globe,
  Film
} from 'lucide-react';
import { API_BASE } from '../utils/apiConfig.js';
import { getPhoneBrainMode, setPhoneBrainMode, togglePhoneBrainMode } from '../utils/mobileBrain.js';

function AppIcon({ packageName, cleanName }) {
  const [iconUrl, setIconUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchIcon = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/phone/app/icon/${packageName}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (active && data.icon) {
          setIconUrl(data.icon);
        }
      } catch (e) {
        if (active) setFailed(true);
      }
    };
    fetchIcon();
    return () => {
      active = false;
    };
  }, [packageName]);

  if (failed || !iconUrl) {
    const firstChar = cleanName ? cleanName.charAt(0).toUpperCase() : 'A';
    return (
      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 text-cyan-300 select-none shadow-sm">
        {firstChar}
      </div>
    );
  }

  return (
    <img
      src={iconUrl}
      alt={cleanName}
      className="w-7 h-7 rounded-lg object-cover border border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.2)]"
      onError={() => setFailed(true)}
    />
  );
}

// App Folder categorization utility
function getAppCategory(packageName) {
  const pkg = packageName.toLowerCase();
  
  if (
    pkg.includes('setting') || pkg.includes('phone') || pkg.includes('dialer') ||
    pkg.includes('mms') || pkg.includes('messaging') || pkg.includes('camera') ||
    pkg.includes('clock') || pkg.includes('contact') || pkg.includes('gallery') ||
    pkg.includes('file') || pkg.includes('android.incallui')
  ) {
    return 'system';
  }
  
  if (
    pkg.includes('whatsapp') || pkg.includes('instagram') || pkg.includes('telegram') ||
    pkg.includes('facebook') || pkg.includes('twitter') || pkg.includes('messenger') ||
    pkg.includes('gmail') || pkg.includes('discord') || pkg.includes('snapchat') ||
    pkg.includes('tiktok') || pkg.includes('social')
  ) {
    return 'social';
  }
  
  if (
    pkg.includes('chrome') || pkg.includes('drive') || pkg.includes('maps') ||
    pkg.includes('note') || pkg.includes('keep') || pkg.includes('calculator') ||
    pkg.includes('calendar') || pkg.includes('docs') || pkg.includes('sheets') ||
    pkg.includes('office') || pkg.includes('pdf')
  ) {
    return 'productivity';
  }

  if (
    pkg.includes('youtube') || pkg.includes('spotify') || pkg.includes('netflix') ||
    pkg.includes('music') || pkg.includes('vlc') || pkg.includes('primevideo') ||
    pkg.includes('media') || pkg.includes('video') || pkg.includes('audio') ||
    pkg.includes('tv')
  ) {
    return 'media';
  }

  if (
    pkg.includes('vending') || pkg.includes('play') || pkg.includes('store') ||
    pkg.includes('utility') || pkg.includes('weather') || pkg.includes('download') ||
    pkg.includes('tool') || pkg.includes('provider')
  ) {
    return 'utilities';
  }

  return 'other';
}

export default function PhoneControlWidget() {
  const [status, setStatus] = useState({ connected: false });
  const [ip, setIp] = useState('192.168.29.159:42931');
  const [loading, setLoading] = useState(false);
  const [brightness, setBrightness] = useState(50);
  const [notifications, setNotifications] = useState([]);
  const [apps, setApps] = useState([]);
  const [appsDropdownOpen, setAppsDropdownOpen] = useState(true);
  const [notificationsDropdownOpen, setNotificationsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFolder, setActiveFolder] = useState('all'); // 'all', 'system', 'social', 'productivity', 'media', 'utilities'

  // Screen Size Mode State: 'standard' (256px), 'large' (320px), 'xl' (380px)
  const [screenSize, setScreenSize] = useState('large');
  const [isBrainMode, setIsBrainMode] = useState(() => getPhoneBrainMode());

  // Live Screen Mirror State
  const [screenImg, setScreenImg] = useState(null);
  const [isLiveMirroring, setIsLiveMirroring] = useState(true);
  const [isCapturingScreen, setIsCapturingScreen] = useState(false);

  // Group apps by category
  const categorizedApps = {
    all: apps,
    system: apps.filter(pkg => getAppCategory(pkg) === 'system'),
    social: apps.filter(pkg => getAppCategory(pkg) === 'social'),
    productivity: apps.filter(pkg => getAppCategory(pkg) === 'productivity'),
    media: apps.filter(pkg => getAppCategory(pkg) === 'media'),
    utilities: apps.filter(pkg => getAppCategory(pkg) === 'utilities' || getAppCategory(pkg) === 'other'),
  };

  const currentFolderApps = categorizedApps[activeFolder] || apps;

  const filteredApps = currentFolderApps.filter(app => {
    const parts = app.split('.');
    const cleanName = parts[parts.length - 1] || '';
    return app.toLowerCase().includes(searchQuery.toLowerCase()) || 
           cleanName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Fetch status on load & start polling interval
  useEffect(() => {
    checkStatus();
    const interval = setInterval(() => {
      checkStatus();
    }, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Live Screen Stream Refresh Loop
  useEffect(() => {
    let timer;
    if (status.connected && isLiveMirroring) {
      refreshScreen();
      timer = setInterval(() => {
        refreshScreen();
      }, 2000); // Refresh screen every 2 seconds
    }
    return () => clearInterval(timer);
  }, [status.connected, isLiveMirroring]);

  const checkStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/phone/status`);
      const data = await res.json();
      setStatus(data);
      if (data.connected) {
        fetchNotifications();
        fetchApps();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const refreshScreen = async () => {
    if (isCapturingScreen) return;
    setIsCapturingScreen(true);
    try {
      const res = await fetch(`${API_BASE}/api/phone/screenshot`);
      const data = await res.json();
      if (data.result) {
        setScreenImg(data.result);
      }
    } catch (e) {
      console.error('Screen capture error:', e);
    } finally {
      setIsCapturingScreen(false);
    }
  };

  const handleScreenTouch = async (e) => {
    if (!status.connected) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Standard phone screen coordinate mapping (1080 x 2400 default)
    const phoneWidth = 1080;
    const phoneHeight = 2400;

    const realX = Math.round((clickX / rect.width) * phoneWidth);
    const realY = Math.round((clickY / rect.height) * phoneHeight);

    try {
      await fetch(`${API_BASE}/api/phone/tap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x: realX, y: realY })
      });
      setTimeout(refreshScreen, 400);
    } catch (err) {
      console.error('Tap failed:', err);
    }
  };

  const sendKeyevent = async (keycode) => {
    try {
      await fetch(`${API_BASE}/api/phone/keyevent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keycode })
      });
      setTimeout(refreshScreen, 400);
    } catch (err) {
      console.error('Keyevent error:', err);
    }
  };

  const connectPhone = async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE}/api/phone/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip })
      });
      await checkStatus();
      refreshScreen();
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const disconnectPhone = async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE}/api/phone/disconnect`, { method: 'POST' });
      setStatus({ connected: false });
      setScreenImg(null);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/phone/notifications`);
      const data = await res.json();
      setNotifications(data.result || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchApps = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/phone/app/list`);
      const data = await res.json();
      setApps(data.result || []);
    } catch (e) {
      console.error(e);
    }
  };

  const sendCommand = async (endpoint, payload = {}) => {
    try {
      await fetch(`${API_BASE}/api/phone/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setTimeout(refreshScreen, 500);
    } catch (e) {
      console.error(e);
    }
  };

  // Dimensional styles based on screenSize state
  const getScreenDimensions = () => {
    if (screenSize === 'standard') return { frame: 'w-64 h-[440px]', inner: 'rounded-[20px]' };
    if (screenSize === 'large') return { frame: 'w-80 h-[530px]', inner: 'rounded-[24px]' };
    return { frame: 'w-[380px] h-[610px]', inner: 'rounded-[28px]' }; // 'xl'
  };

  const dims = getScreenDimensions();

  if (!status.connected) {
    return (
      <div className="phone-panel select-none">
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-cyan-400 font-orbitron font-bold">
            <Smartphone size={16} />
            PHONE UPLINK BRIDGE
          </div>
          <div className="text-xs font-mono text-cyan-100/60">
            Connect to your Android phone via Wireless ADB (IP:Port) or USB cable.
          </div>
          <input 
            type="text" 
            value={ip} 
            onChange={(e) => setIp(e.target.value)}
            className="remote-input p-2 w-full rounded font-mono text-xs"
            placeholder="IP Address & Port (e.g. 192.168.29.159:42931)"
          />
          <button 
            onClick={connectPhone}
            disabled={loading}
            className="btn-control p-2 text-xs font-bold text-cyan-400 border-cyan-500/40 bg-cyan-950/20"
          >
            {loading ? 'CONNECTING...' : 'CONNECT PHYSICAL MOBILE'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="phone-panel p-4 flex flex-col gap-4 max-h-[85vh] overflow-y-auto select-none font-mono">
      {/* Header / Status */}
      <div className="flex justify-between items-start border-b border-cyan-500/20 pb-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-cyan-400 font-orbitron font-bold text-sm">
            <Smartphone size={16} />
            {status.model || 'ANDROID DEVICE'}
          </div>
          <div className="text-[9px] font-mono text-sky-400 tracking-wider flex items-center gap-2 mt-0.5">
            <span>BATT: {status.batteryLevel}%</span>
            <span>|</span>
            <span>OS: Android {status.androidVersion}</span>
            <span>|</span>
            <span className="text-emerald-400 font-semibold">{status.isVirtual ? 'Virtual' : 'Physical Live'}</span>
          </div>
        </div>
        <div className="flex gap-1.5">
          <button 
            onClick={() => { checkStatus(); refreshScreen(); }}
            className="text-[9px] text-cyan-400 hover:text-cyan-300 font-mono border border-cyan-500/30 px-2 py-1 rounded flex items-center gap-1"
          >
            <RotateCw size={10} className={isCapturingScreen ? 'animate-spin' : ''} /> REFRESH
          </button>
          <button 
            onClick={disconnectPhone}
            className="text-[9px] text-red-400 hover:text-red-300 font-mono border border-red-500/30 px-2 py-1 rounded"
          >
            DISCONNECT
          </button>
      </div>

      {/* MOBILE MASTER BRAIN BANNER */}
      <div className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
        isBrainMode 
          ? 'bg-purple-950/40 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]' 
          : 'bg-slate-950/40 border-cyan-500/20'
      }`}>
        <div className="flex flex-col">
          <span className="text-xs font-bold font-mono text-purple-300 flex items-center gap-1.5">
            📱 {isBrainMode ? 'PHONE IS MASTER BRAIN (ACTIVE)' : 'PHONE BRAIN STANDBY'}
          </span>
          <span className="text-[9px] text-slate-400 font-mono mt-0.5">
            {isBrainMode 
              ? 'Android phone hosts Neural AI Core & controls PC/TV remotely over LAN.' 
              : 'Promote this phone to central AI Controller.'}
          </span>
        </div>
        <button
          onClick={() => {
            const updated = togglePhoneBrainMode();
            setIsBrainMode(updated);
          }}
          className={`px-3 py-1 rounded text-[10px] font-bold font-mono border transition-all ${
            isBrainMode
              ? 'bg-purple-500/30 text-purple-200 border-purple-400 shadow-md'
              : 'bg-cyan-950/40 text-cyan-400 border-cyan-500/40 hover:bg-cyan-500/20'
          }`}
        >
          {isBrainMode ? '✓ MASTER BRAIN' : 'MAKE PHONE BRAIN'}
        </button>
      </div>

      {/* LIVE MOBILE SCREEN MIRROR VIEW WITH SIZE SELECTOR */}
      <div className="flex flex-col items-center bg-slate-950/80 p-3 rounded-2xl border border-cyan-500/30 shadow-2xl relative">
        <div className="flex items-center justify-between w-full mb-3 px-1 text-xs">
          <div className="flex items-center gap-2 font-mono text-[10px] text-cyan-300 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            LIVE SCREEN MIRROR ({status.model || 'Mobile'})
          </div>

          {/* Interactive Screen Size Selector Buttons */}
          <div className="flex items-center gap-1 bg-slate-900/90 border border-cyan-500/30 p-1 rounded-lg">
            <span className="text-[9px] text-slate-400 px-1 font-bold">SIZE:</span>
            <button
              onClick={() => setScreenSize('standard')}
              className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${
                screenSize === 'standard' ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Std (256px)
            </button>
            <button
              onClick={() => setScreenSize('large')}
              className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${
                screenSize === 'large' ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Large (320px)
            </button>
            <button
              onClick={() => setScreenSize('xl')}
              className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${
                screenSize === 'xl' ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              XL (380px)
            </button>

            <button
              onClick={() => setIsLiveMirroring(!isLiveMirroring)}
              className={`ml-1 px-2 py-0.5 rounded text-[9px] font-bold border transition-all ${
                isLiveMirroring ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {isLiveMirroring ? 'LIVE (2s)' : 'PAUSED'}
            </button>
          </div>
        </div>

        {/* Smartphone Hardware Frame (Scales dynamically based on screenSize state) */}
        <div className={`relative ${dims.frame} bg-slate-900 rounded-[32px] p-2.5 border-4 border-slate-800 shadow-2xl flex flex-col items-center justify-between overflow-hidden group transition-all duration-300`}>
          {/* Top Speaker Notch */}
          <div className="w-24 h-3.5 bg-slate-950 rounded-full mb-1 flex items-center justify-center z-20 shadow-inner">
            <div className="w-10 h-1 bg-slate-800 rounded-full" />
          </div>

          {/* Interactive Screen Display Canvas */}
          <div 
            onClick={handleScreenTouch}
            className={`relative w-full flex-1 ${dims.inner} overflow-hidden bg-slate-950 flex items-center justify-center cursor-pointer border border-cyan-500/20`}
            title="Click anywhere to tap phone screen"
          >
            {screenImg ? (
              <img 
                src={screenImg} 
                alt="Live Mobile Screen"
                className="w-full h-full object-contain pointer-events-auto"
              />
            ) : (
              <div className="text-center p-4 text-xs font-mono text-cyan-400/70 flex flex-col items-center gap-2">
                <RotateCw className="w-6 h-6 animate-spin text-cyan-400" />
                Fetching live screen feed...
              </div>
            )}

            {/* Click/Touch Overlay Prompt */}
            <div className="absolute inset-0 bg-cyan-950/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <span className="px-3 py-1 bg-slate-950/90 text-cyan-300 rounded-full text-[10px] font-mono border border-cyan-500/40 shadow-xl flex items-center gap-1">
                👆 Click to Tap Mobile
              </span>
            </div>
          </div>

          {/* Android Navigation Touch Bar */}
          <div className="w-full flex justify-around items-center pt-2 pb-0.5 z-20 border-t border-slate-800/80 mt-1">
            <button 
              onClick={() => sendKeyevent('KEYCODE_BACK')} 
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/20 transition-all"
              title="Back"
            >
              <ArrowLeft size={16} />
            </button>
            <button 
              onClick={() => sendKeyevent('KEYCODE_HOME')} 
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/20 transition-all"
              title="Home"
            >
              <Circle size={14} />
            </button>
            <button 
              onClick={() => sendKeyevent('KEYCODE_APP_SWITCH')} 
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/20 transition-all"
              title="Recent Apps"
            >
              <Square size={14} />
            </button>
            <button 
              onClick={() => sendCommand('lock')} 
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition-all"
              title="Power / Lock Screen"
            >
              <Power size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Hardware Toggles */}
      <div className="grid grid-cols-5 gap-2">
        <button onClick={() => sendCommand('wifi', { enabled: true })} className="phone-btn" title="Toggle Wi-Fi">
          <Wifi size={14} />
        </button>
        <button onClick={() => sendCommand('bluetooth', { enabled: true })} className="phone-btn" title="Toggle Bluetooth">
          <Bluetooth size={14} />
        </button>
        <button onClick={refreshScreen} className="phone-btn" title="Instant Screen Capture">
          <Camera size={14} />
        </button>
        <button 
          onClick={async () => {
            try {
              await fetch(`${API_BASE}/api/phone/find`, { method: 'POST' });
              alert("Find My Phone alarm triggered at max volume!");
            } catch (e) { console.error(e); }
          }} 
          className="phone-btn text-yellow-400 font-bold" 
          title="Find My Phone (Ring Alarm)"
        >
          🔔 FIND
        </button>
        <button onClick={() => sendCommand('lock')} className="phone-btn text-rose-400" title="Lock/Unlock">
          <Lock size={14} />
        </button>
      </div>

      {/* Brightness Slider */}
      <div className="flex items-center gap-3 bg-cyan-950/20 p-2 rounded border border-cyan-500/10">
        <Sun size={12} className="text-cyan-400" />
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={brightness} 
          onChange={(e) => {
            setBrightness(e.target.value);
            sendCommand('brightness', { level: e.target.value });
          }}
          className="w-full h-1 bg-cyan-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />
        <span className="text-[9px] font-mono text-cyan-300 w-6">{brightness}%</span>
      </div>

      {/* CATEGORIZED APP FOLDERS & LAUNCHER SECTION */}
      <div className="border border-cyan-500/30 rounded-xl p-3 bg-slate-950/60 shadow-xl flex flex-col gap-3">
        <div className="flex justify-between items-center border-b border-cyan-500/20 pb-2">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-300 font-bold">
            <FolderOpen size={16} className="text-cyan-400" />
            APP FOLDERS ({apps.length} Apps Installed)
          </div>
          <button 
            onClick={() => setAppsDropdownOpen(!appsDropdownOpen)}
            className="text-[10px] text-sky-400 hover:text-cyan-300 font-mono flex items-center gap-1"
          >
            {appsDropdownOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {appsDropdownOpen && (
          <div className="flex flex-col gap-3">
            {/* Folder Selection Grid / Tabs */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {[
                { id: 'all', name: 'All Apps', count: categorizedApps.all.length, icon: Grid, color: 'text-cyan-400' },
                { id: 'system', name: 'System', count: categorizedApps.system.length, icon: Settings, color: 'text-amber-400' },
                { id: 'social', name: 'Social', count: categorizedApps.social.length, icon: Share2, color: 'text-pink-400' },
                { id: 'productivity', name: 'Productivity', count: categorizedApps.productivity.length, icon: Globe, color: 'text-blue-400' },
                { id: 'media', name: 'Media', count: categorizedApps.media.length, icon: Film, color: 'text-purple-400' },
                { id: 'utilities', name: 'Utilities', count: categorizedApps.utilities.length, icon: Layers, color: 'text-emerald-400' },
              ].map(f => {
                const IconComponent = f.icon;
                const isActive = activeFolder === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setActiveFolder(f.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all text-center ${
                      isActive 
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.25)]' 
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <IconComponent size={14} className={f.color} />
                    <span className="text-[10px] font-bold mt-1 truncate max-w-full">{f.name}</span>
                    <span className="text-[8px] text-slate-400 font-mono">({f.count})</span>
                  </button>
                );
              })}
            </div>

            {/* App Search Bar */}
            <div className="flex items-center gap-2 bg-slate-900/90 p-2 rounded-lg border border-slate-800">
              <Search size={14} className="text-cyan-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search in ${activeFolder.toUpperCase()} apps...`}
                className="bg-transparent text-xs text-slate-200 outline-none w-full font-mono placeholder-slate-500"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-[10px] text-slate-400 hover:text-slate-200 font-bold"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Folder Apps Grid View */}
            <div className="max-h-56 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1.5 pr-1">
              {filteredApps.length === 0 ? (
                <div className="col-span-2 p-4 text-center text-xs text-slate-500 font-mono">
                  No apps found in "{activeFolder}" matching query.
                </div>
              ) : (
                filteredApps.map((pkg, idx) => {
                  const parts = pkg.split('.');
                  const cleanName = parts[parts.length - 1] || pkg;
                  return (
                    <button
                      key={idx}
                      onClick={() => sendCommand('app/open', { packageName: pkg })}
                      className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900/70 border border-slate-800/80 hover:border-cyan-500/40 hover:bg-cyan-500/10 text-xs font-mono text-slate-200 text-left transition-all group"
                      title={`Click to launch ${pkg}`}
                    >
                      <AppIcon packageName={pkg} cleanName={cleanName} />
                      <div className="flex flex-col truncate">
                        <span className="font-bold text-cyan-200 group-hover:text-cyan-300 truncate">{cleanName}</span>
                        <span className="text-[8px] text-slate-500 truncate">{pkg}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Notifications Section */}
      <div className="border border-cyan-500/20 rounded-xl p-3 bg-slate-950/40">
        <button 
          onClick={() => setNotificationsDropdownOpen(!notificationsDropdownOpen)}
          className="flex justify-between items-center w-full text-xs font-mono text-cyan-300 font-bold"
        >
          <span>LIVE NOTIFICATIONS ({notifications.length})</span>
          {notificationsDropdownOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {notificationsDropdownOpen && (
          <div className="mt-2 max-h-40 overflow-y-auto flex flex-col gap-1.5 pr-1">
            {notifications.map((notif, idx) => (
              <div key={idx} className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono flex flex-col gap-0.5">
                <div className="text-cyan-400 font-bold flex items-center gap-1">
                  <Bell size={10} /> {notif.title || notif.package}
                </div>
                <div className="text-slate-300 text-[10px]">{notif.text}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
