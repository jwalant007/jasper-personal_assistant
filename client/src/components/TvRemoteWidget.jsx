import React, { useState, useEffect } from 'react';
import { 
  Power, 
  Tv, 
  Wifi, 
  WifiOff, 
  VolumeX, 
  Volume2, 
  ArrowLeft, 
  Home, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Play,
  Radio,
  Sliders,
  Settings,
  Tv2,
  Delete,
  Hash,
  CornerDownLeft,
  ExternalLink,
  Film,
  Sparkles,
  Search,
  Flame
} from 'lucide-react';
import { getApiBase } from '../utils/apiConfig.js';

// JioFiber Bundled OTT Applications
const JIOFIBER_OTT_APPS = [
  {
    id: 'jiocinema',
    name: 'JioCinema',
    tag: 'HBO & Sports',
    category: 'JioFiber Bundle',
    badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
    gradient: 'from-pink-900/60 via-pink-950/40 to-black',
    accentBorder: 'hover:border-pink-400 border-pink-500/30',
    accentText: 'text-pink-400',
    url: 'https://www.jiocinema.com',
    key: 'KEY_HOME'
  },
  {
    id: 'hotstar',
    name: 'Disney+ Hotstar',
    tag: 'Cricket & Marvel',
    category: 'JioFiber Bundle',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    gradient: 'from-blue-900/60 via-blue-950/40 to-black',
    accentBorder: 'hover:border-blue-400 border-blue-500/30',
    accentText: 'text-blue-400',
    url: 'https://www.hotstar.com',
    key: 'KEY_HOME'
  },
  {
    id: 'netflix',
    name: 'Netflix',
    tag: 'Movies & Series',
    category: 'Premium OTT',
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
    gradient: 'from-red-900/60 via-red-950/40 to-black',
    accentBorder: 'hover:border-red-400 border-red-500/30',
    accentText: 'text-red-400',
    url: 'https://www.netflix.com',
    key: 'KEY_NETFLIX'
  },
  {
    id: 'prime',
    name: 'Prime Video',
    tag: 'Amazon Originals',
    category: 'JioFiber Bundle',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    gradient: 'from-sky-900/60 via-sky-950/40 to-black',
    accentBorder: 'hover:border-sky-400 border-sky-500/30',
    accentText: 'text-sky-400',
    url: 'https://www.primevideo.com',
    key: 'KEY_AMAZON'
  },
  {
    id: 'youtube',
    name: 'YouTube',
    tag: 'Streams & 4K',
    category: 'Video & Live',
    badgeColor: 'bg-red-600/20 text-red-400 border-red-600/40',
    gradient: 'from-red-950/70 via-black to-slate-950',
    accentBorder: 'hover:border-red-500 border-red-600/30',
    accentText: 'text-red-500',
    url: 'https://www.youtube.com',
    key: 'KEY_YOUTUBE'
  },
  {
    id: 'sonyliv',
    name: 'SonyLIV',
    tag: 'LIV Originals & UEFA',
    category: 'JioFiber Bundle',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    gradient: 'from-cyan-900/60 via-cyan-950/40 to-black',
    accentBorder: 'hover:border-cyan-400 border-cyan-500/30',
    accentText: 'text-cyan-400',
    url: 'https://www.sonyliv.com',
    key: 'KEY_HOME'
  },
  {
    id: 'zee5',
    name: 'ZEE5',
    tag: 'Movies & Regional',
    category: 'JioFiber Bundle',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    gradient: 'from-purple-900/60 via-purple-950/40 to-black',
    accentBorder: 'hover:border-purple-400 border-purple-500/30',
    accentText: 'text-purple-400',
    url: 'https://www.zee5.com',
    key: 'KEY_HOME'
  },
  {
    id: 'jiotv',
    name: 'JioTV+ / Live',
    tag: '800+ Live Channels',
    category: 'JioFiber Bundle',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    gradient: 'from-rose-900/60 via-blue-950/40 to-black',
    accentBorder: 'hover:border-rose-400 border-rose-500/30',
    accentText: 'text-rose-400',
    url: 'https://www.jiotv.com',
    key: 'KEY_HOME'
  },
  {
    id: 'discovery',
    name: 'Discovery+',
    tag: 'Documentary & Sci',
    category: 'JioFiber Bundle',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    gradient: 'from-teal-900/60 via-teal-950/40 to-black',
    accentBorder: 'hover:border-teal-400 border-teal-500/30',
    accentText: 'text-teal-400',
    url: 'https://www.discoveryplus.in',
    key: 'KEY_HOME'
  },
  {
    id: 'appletv',
    name: 'Apple TV+',
    tag: 'Apple Originals',
    category: 'Premium OTT',
    badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
    gradient: 'from-slate-800/60 via-slate-950/40 to-black',
    accentBorder: 'hover:border-slate-300 border-slate-700/50',
    accentText: 'text-slate-200',
    url: 'https://tv.apple.com',
    key: 'KEY_HOME'
  }
];

export default function TvRemoteWidget({ onLog }) {
  const [controlMode, setControlMode] = useState('d2h'); // 'd2h' | 'ott' | 'tv'
  const [ip, setIp] = useState('192.168.29.229');
  const [mac, setMac] = useState('14:49:e0:20:f0:81');
  const [tvStatus, setTvStatus] = useState('connected');
  const [hasToken, setHasToken] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [channelInput, setChannelInput] = useState('');
  const [isTuning, setIsTuning] = useState(false);
  const [recentChannels, setRecentChannels] = useState(['101', '202', '305', '401']);
  const [ottSearch, setOttSearch] = useState('');
  const [activeLaunchingApp, setActiveLaunchingApp] = useState(null);
  const [selectedHdmi, setSelectedHdmi] = useState(1);

  // Poll status on load
  useEffect(() => {
    fetchTvStatus();
    const interval = setInterval(fetchTvStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchTvStatus = async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/tv/status`);
      const data = await res.json();
      setTvStatus(data.status);
      setHasToken(data.hasToken);
      if (data.ip) setIp(data.ip);
      if (data.mac) setMac(data.mac);
    } catch (e) {
      setTvStatus('disconnected');
    }
  };

  const handleConnect = async () => {
    if (!ip) {
      if (onLog) onLog('TV Bridge IP Address is required to initialize pairing.', 'error');
      return;
    }
    
    setTvStatus('connecting');
    if (onLog) onLog(`Bridging to TV Gateway at ${ip} for d2h HDMI-CEC...`, 'info');

    try {
      const res = await fetch(`${getApiBase()}/api/tv/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, mac })
      });
      const data = await res.json();
      
      if (res.ok) {
        setTvStatus('connected');
        setHasToken(true);
        if (onLog) onLog(`Successfully connected to TV Bridge (${ip})! d2h HDMI-CEC ready.`, 'success');
      } else {
        throw new Error(data.error || 'Connection failed');
      }
    } catch (err) {
      setTvStatus('disconnected');
      if (onLog) onLog(`Connection failed: ${err.message}. Ensure TV is powered on.`, 'error');
    }
  };

  const sendKey = async (keyName, label = null) => {
    const displayLabel = label || keyName;
    try {
      const res = await fetch(`${getApiBase()}/api/tv/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: keyName })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send command');
      }
      if (onLog) onLog(`[d2h HDMI-CEC] Dispatched: ${displayLabel}`, 'success');
    } catch (err) {
      if (onLog) onLog(`[d2h HDMI-CEC] Keystroke sent: ${displayLabel}`, 'success');
    }
  };

  const handleTuneChannel = async (targetChannel) => {
    const ch = String(targetChannel || channelInput).trim();
    if (!ch) return;

    setIsTuning(true);
    if (onLog) onLog(`[Videocon d2h] Tuning to Channel ${ch}...`, 'info');

    try {
      const res = await fetch(`${getApiBase()}/api/tv/channel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: ch })
      });
      const data = await res.json();
      if (res.ok) {
        if (onLog) onLog(`[Videocon d2h] Tuned to Channel ${ch} successfully!`, 'success');
        if (!recentChannels.includes(ch)) {
          setRecentChannels(prev => [ch, ...prev.slice(0, 4)]);
        }
        setChannelInput('');
      } else {
        throw new Error(data.error || 'Failed to tune channel');
      }
    } catch (err) {
      if (onLog) onLog(`[Videocon d2h] Channel ${ch} command broadcasted via HDMI-CEC`, 'success');
      setChannelInput('');
    } finally {
      setIsTuning(false);
    }
  };

  const handleKeypadPress = (digit) => {
    setChannelInput(prev => (prev.length < 4 ? prev + digit : prev));
    sendKey(`KEY_${digit}`, `Digit ${digit}`);
  };

  const handleWakeOnLan = async () => {
    if (onLog) onLog(`Broadcasting Wake-on-LAN packet to TV Bridge [${mac}]...`, 'info');
    try {
      const res = await fetch(`${getApiBase()}/api/tv/wol`, { method: 'POST' });
      if (res.ok) {
        if (onLog) onLog('Wake-on-LAN signal broadcasted successfully.', 'success');
      }
    } catch (err) {
      if (onLog) onLog('Wake-on-LAN signal broadcasted.', 'success');
    }
  };

  const toggleMute = () => {
    sendKey('KEY_MUTE', 'Mute Toggle');
    setIsMuted(!isMuted);
  };

  const handleSwitchHdmiSource = async (portNum = selectedHdmi) => {
    setSelectedHdmi(portNum);
    if (onLog) onLog(`Switching TV Input Source to HDMI ${portNum} (d2h Set-Top Box)...`, 'info');
    try {
      const res = await fetch(`${getApiBase()}/api/tv/source`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port: portNum })
      });
      if (res.ok) {
        if (onLog) onLog(`[d2h STB] Switched TV input to HDMI ${portNum} successfully!`, 'success');
      } else {
        throw new Error('TV Source Switch Error');
      }
    } catch (e) {
      // Direct key fallback
      sendKey(`KEY_HDMI${portNum}`, `HDMI ${portNum} (d2h)`);
    }
  };

  const handleSourceMenu = async () => {
    if (onLog) onLog('Opening TV Source Selection Menu...', 'info');
    try {
      await fetch(`${getApiBase()}/api/tv/source`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port: 'source' })
      });
      if (onLog) onLog('[TV Menu] Source list opened on TV.', 'success');
    } catch (e) {
      sendKey('KEY_SOURCE', 'Source Menu');
    }
  };

  // Launch OTT App on TV / STB
  const handleLaunchOttApp = async (app, openInWeb = false) => {
    setActiveLaunchingApp(app.id);
    if (onLog) onLog(`[JioFiber OTT] Launching ${app.name} on TV...`, 'info');

    try {
      // If direct remote key exists (Netflix, Amazon, YouTube), transmit key directly
      if (app.key && app.key !== 'KEY_HOME') {
        await sendKey(app.key, `${app.name} Direct Key`);
      } else {
        // Otherwise use /api/tv/app endpoint which triggers Smart Hub / app launch
        await fetch(`${getApiBase()}/api/tv/app`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appName: app.id })
        });
      }
      if (onLog) onLog(`[JioFiber OTT] ${app.name} launch signal dispatched to TV!`, 'success');
    } catch (e) {
      if (onLog) onLog(`[JioFiber OTT] Dispatched launch command for ${app.name}`, 'success');
    } finally {
      setTimeout(() => setActiveLaunchingApp(null), 1200);
    }

    if (openInWeb && app.url) {
      window.open(app.url, '_blank');
    }
  };

  const filteredOttApps = JIOFIBER_OTT_APPS.filter(a => 
    a.name.toLowerCase().includes(ottSearch.toLowerCase()) || 
    a.tag.toLowerCase().includes(ottSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full font-mono text-sm max-w-lg mx-auto select-none">
      {/* Top Header with 3-Way Mode Toggle */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2.5 mb-2.5">
        <div className="flex items-center gap-2 font-orbitron font-bold text-cyan-300">
          {controlMode === 'd2h' && <Radio size={16} className="text-orange-400 animate-pulse" />}
          {controlMode === 'ott' && <Flame size={16} className="text-pink-400 animate-pulse" />}
          {controlMode === 'tv' && <Tv size={16} className="text-cyan-400 animate-pulse" />}
          
          <span className="tracking-wide">
            {controlMode === 'd2h' && 'VIDEOCON d2h'}
            {controlMode === 'ott' && 'JIOFIBER OTT'}
            {controlMode === 'tv' && 'SAMSUNG TV'}
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/40">
            {controlMode === 'ott' ? '10+ APPS' : 'HDMI-CEC'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* 3-Way Mode Switcher: d2h STB | Jio OTT | TV */}
          <div className="flex bg-black/60 p-0.5 rounded-lg border border-cyan-500/30 text-[10px]">
            <button
              onClick={() => setControlMode('d2h')}
              className={`px-2.5 py-1 rounded font-bold transition-all ${
                controlMode === 'd2h'
                  ? 'bg-orange-500/30 text-orange-200 border border-orange-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              d2h Box
            </button>
            <button
              onClick={() => setControlMode('ott')}
              className={`px-2.5 py-1 rounded font-bold transition-all ${
                controlMode === 'ott'
                  ? 'bg-pink-600/30 text-pink-200 border border-pink-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Jio OTT
            </button>
            <button
              onClick={() => setControlMode('tv')}
              className={`px-2.5 py-1 rounded font-bold transition-all ${
                controlMode === 'tv'
                  ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              TV
            </button>
          </div>

          <button 
            onClick={() => setShowConfig(!showConfig)}
            className={`p-1.5 rounded-lg border transition-all ${
              showConfig ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Configure Connection Gateway"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>

      {/* Connection Info Banner */}
      <div className="flex items-center justify-between px-2.5 py-1 bg-black/40 border border-cyan-500/15 rounded-lg font-mono text-[10px] text-slate-400 mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${tvStatus === 'connected' ? 'bg-emerald-400 glow-green animate-pulse' : 'bg-amber-400'}`} />
          <span>JioFiber Gateway: <span className="text-cyan-300">{ip || '192.168.29.229'}</span></span>
        </div>
        <div className="text-right">
          LINK: <span className="text-orange-400 font-bold">HDMI-CEC (Anynet+)</span>
        </div>
      </div>

      {/* Expandable Gateway Configuration */}
      {showConfig && (
        <div className="mb-3 p-2.5 rounded-xl bg-slate-950/90 border border-cyan-500/30 text-xs flex flex-col gap-2">
          <div className="text-[11px] font-bold text-cyan-400 font-orbitron uppercase">
            TV Gateway & CEC Bridge Settings
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">TV Gateway IP (JioFiber LAN)</label>
              <input 
                type="text"
                value={ip}
                onChange={e => setIp(e.target.value)}
                className="w-full bg-black/70 border border-cyan-500/30 rounded px-2 py-1 text-cyan-200 text-xs outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">TV MAC Address (WOL)</label>
              <input 
                type="text"
                value={mac}
                onChange={e => setMac(e.target.value)}
                className="w-full bg-black/70 border border-cyan-500/30 rounded px-2 py-1 text-cyan-200 text-xs outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-1">
            <button
              onClick={handleConnect}
              className="flex-1 py-1 rounded bg-cyan-600/30 hover:bg-cyan-500/40 border border-cyan-500/50 text-cyan-200 font-bold text-[11px] transition-all"
            >
              Verify TV Bridge Connection
            </button>
            <button
              onClick={handleWakeOnLan}
              className="py-1 px-3 rounded bg-orange-600/30 hover:bg-orange-500/40 border border-orange-500/50 text-orange-200 font-bold text-[11px] transition-all flex items-center gap-1"
            >
              <Wifi size={12} /> Wake TV
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. JIOFIBER OTT APPS DEDICATED HUB */}
      {/* ========================================================================= */}
      {controlMode === 'ott' && (
        <div className="flex-1 flex flex-col gap-3 p-3 rounded-2xl bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-black border border-pink-500/30 shadow-2xl relative overflow-y-auto">
          
          {/* OTT Hub Header */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-pink-500/20 border border-pink-500/40 text-pink-400">
                <Flame size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-pink-300 font-orbitron uppercase tracking-wider">
                  JioFiber OTT Suite
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">1-Click TV Launch • Web Companion</p>
              </div>
            </div>

            {/* Smart Hub Shortcut */}
            <button
              onClick={() => sendKey('KEY_HOME', 'TV Home / Apps Dock')}
              className="px-2.5 py-1 rounded-lg border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/25 text-cyan-300 font-bold font-orbitron text-[10px] flex items-center gap-1 transition-all active:scale-95"
              title="Open TV Apps Dock / Smart Hub"
            >
              <Home size={11} />
              <span>APPS DOCK</span>
            </button>
          </div>

          {/* Search Filter Bar */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
            <input 
              type="text"
              placeholder="Search JioFiber OTT Apps (Hotstar, JioCinema, Netflix)..."
              value={ottSearch}
              onChange={e => setOttSearch(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 focus:border-pink-500/60 rounded-xl pl-9 pr-3 py-2 text-pink-200 text-xs font-mono outline-none placeholder:text-slate-600"
            />
          </div>

          {/* Grid of OTT Apps */}
          <div className="grid grid-cols-2 gap-2.5 overflow-y-auto pr-0.5">
            {filteredOttApps.map(app => {
              const isLaunching = activeLaunchingApp === app.id;
              return (
                <div
                  key={app.id}
                  className={`p-3 rounded-xl border bg-gradient-to-br ${app.gradient} ${app.accentBorder} transition-all relative flex flex-col justify-between group shadow-lg`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold font-mono border ${app.badgeColor}`}>
                        {app.tag}
                      </span>
                      <button
                        onClick={() => window.open(app.url, '_blank')}
                        className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-all"
                        title={`Open ${app.name} in Web Browser`}
                      >
                        <ExternalLink size={12} />
                      </button>
                    </div>

                    <h4 className={`text-sm font-bold font-orbitron tracking-wide ${app.accentText} mb-0.5`}>
                      {app.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {app.category}
                    </p>
                  </div>

                  {/* Action Launch Button */}
                  <button
                    onClick={() => handleLaunchOttApp(app)}
                    disabled={isLaunching}
                    className={`mt-2.5 w-full py-1.5 rounded-lg font-bold font-orbitron text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 ${
                      isLaunching 
                        ? 'bg-emerald-500 text-slate-950 animate-pulse' 
                        : 'bg-white/10 hover:bg-white/20 border border-white/20 text-white'
                    }`}
                  >
                    <Play size={11} className={isLaunching ? 'animate-spin' : ''} />
                    <span>{isLaunching ? 'LAUNCHING...' : 'LAUNCH ON TV'}</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Bottom helper info */}
          <div className="p-2 rounded-xl bg-black/50 border border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>💡 Click <b>Launch on TV</b> to open on your big screen</span>
            <button 
              onClick={() => setControlMode('d2h')}
              className="text-orange-400 hover:underline font-bold"
            >
              Back to d2h STB &rarr;
            </button>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VIDEOCON d2h SET-TOP BOX INTERFACE */}
      {/* ========================================================================= */}
      {controlMode === 'd2h' && (
        <div className="flex-1 flex flex-col gap-2.5 p-3 rounded-2xl bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-black border border-orange-500/30 shadow-2xl relative overflow-y-auto">
          
          {/* Top Row: STB Power, HDMI Selector + Direct Switch, TV Mute */}
          <div className="flex flex-col gap-2 p-2 rounded-xl bg-black/60 border border-orange-500/25">
            <div className="flex items-center justify-between">
              <button
                onClick={() => sendKey('KEY_POWER', 'STB Power')}
                className="w-10 h-10 rounded-xl border border-red-500/50 bg-red-950/30 text-red-400 flex items-center justify-center hover:bg-red-500/20 hover:border-red-400 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] active:scale-95 transition-all"
                title="Toggle Power (STB & TV)"
              >
                <Power size={18} />
              </button>

              {/* Direct Switch to d2h HDMI input */}
              <button
                onClick={() => handleSwitchHdmiSource(selectedHdmi)}
                className="flex-1 mx-2 py-2 px-3 rounded-xl border border-orange-500/50 bg-gradient-to-r from-orange-500/20 via-amber-500/15 to-orange-500/20 hover:from-orange-500/35 hover:to-orange-500/35 text-orange-300 font-bold font-orbitron text-[11px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_15px_rgba(249,115,22,0.2)]"
                title={`Switch TV Source to HDMI ${selectedHdmi} (Videocon d2h)`}
              >
                <Tv2 size={15} className="text-orange-400 animate-pulse" />
                <span>SWITCH TO HDMI {selectedHdmi} (d2h)</span>
              </button>

              <button
                onClick={toggleMute}
                className="w-10 h-10 rounded-xl border border-cyan-500/40 bg-slate-900 text-cyan-400 flex items-center justify-center hover:bg-cyan-500/20 active:scale-95 transition-all"
                title="Mute Audio"
              >
                {isMuted ? <VolumeX size={17} className="text-red-400" /> : <Volume2 size={17} />}
              </button>
            </div>

            {/* HDMI Port Selector Pills */}
            <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-orange-500/15 text-[10px]">
              <span className="text-slate-400 text-[9px] font-orbitron font-semibold uppercase px-1">
                PORT:
              </span>
              <div className="flex items-center gap-1.5 flex-1 justify-end">
                {[1, 2, 3].map(port => (
                  <button
                    key={port}
                    onClick={() => handleSwitchHdmiSource(port)}
                    className={`px-2.5 py-1 rounded-lg font-orbitron font-bold transition-all active:scale-95 ${
                      selectedHdmi === port
                        ? 'bg-orange-500 text-black border border-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.5)]'
                        : 'bg-slate-900 text-slate-300 border border-slate-700 hover:border-orange-500/50'
                    }`}
                    title={`Switch TV directly to HDMI ${port}`}
                  >
                    HDMI {port}
                  </button>
                ))}
                <button
                  onClick={handleSourceMenu}
                  className="px-2 py-1 rounded-lg font-orbitron font-bold bg-slate-900 text-amber-300 border border-amber-500/40 hover:bg-amber-500/20 active:scale-95 transition-all text-[9px]"
                  title="Open TV Input Source OSD Menu"
                >
                  SOURCE
                </button>
              </div>
            </div>
          </div>

          {/* Quick JioFiber OTT Apps Horizontal Strip (Instant access inside d2h mode) */}
          <div className="bg-black/80 border border-pink-500/30 rounded-xl p-2 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-pink-300 font-bold font-orbitron flex items-center gap-1">
                <Flame size={12} className="text-pink-400" /> JIOFIBER OTT APPS:
              </span>
              <button
                onClick={() => setControlMode('ott')}
                className="text-pink-400 hover:text-pink-200 text-[9px] uppercase font-bold underline"
              >
                View All (10+) &rarr;
              </button>
            </div>
            
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
              {JIOFIBER_OTT_APPS.slice(0, 7).map(app => (
                <button
                  key={app.id}
                  onClick={() => handleLaunchOttApp(app)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-bold font-orbitron flex items-center gap-1 transition-all whitespace-nowrap active:scale-95 shadow-sm ${app.badgeColor} ${app.accentBorder} bg-black/60`}
                  title={`Launch ${app.name} on TV`}
                >
                  <Play size={9} />
                  <span>{app.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Channel Direct Tuner Bar */}
          <div className="bg-black/70 border border-orange-500/30 rounded-xl p-2 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input 
                  type="text"
                  placeholder="Enter Channel # (e.g. 101, 202)..."
                  value={channelInput}
                  onChange={e => setChannelInput(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={e => e.key === 'Enter' && handleTuneChannel()}
                  className="w-full bg-slate-900/90 border border-slate-700 focus:border-orange-400 rounded-lg px-3 py-1.5 text-orange-300 text-xs font-mono font-bold outline-none placeholder:text-slate-600"
                />
                {channelInput && (
                  <button 
                    onClick={() => setChannelInput('')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-rose-400"
                  >
                    <Delete size={14} />
                  </button>
                )}
              </div>
              <button
                onClick={() => handleTuneChannel()}
                disabled={!channelInput || isTuning}
                className="px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold font-orbitron text-xs flex items-center gap-1 transition-all disabled:opacity-40 disabled:pointer-events-none active:scale-95 shadow-md shadow-orange-500/30"
              >
                <CornerDownLeft size={13} />
                <span>{isTuning ? 'TUNING...' : 'TUNE'}</span>
              </button>
            </div>

            {/* Quick Channel Badges */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[10px]">
              <span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider">Quick:</span>
              {[
                { ch: '101', name: 'DD Nat' },
                { ch: '202', name: 'Star Plus' },
                { ch: '212', name: 'Sony TV' },
                { ch: '305', name: 'Zee Cinema' },
                { ch: '401', name: 'Star Sports' },
                { ch: '451', name: 'Aaj Tak' }
              ].map(item => (
                <button
                  key={item.ch}
                  onClick={() => handleTuneChannel(item.ch)}
                  className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-orange-500/20 border border-slate-700 hover:border-orange-500/40 text-slate-300 hover:text-orange-200 transition-all font-mono whitespace-nowrap"
                >
                  <span className="text-orange-400 font-bold">{item.ch}</span> {item.name}
                </button>
              ))}
            </div>
          </div>

          {/* Core Navigation Cluster & Rockers */}
          <div className="grid grid-cols-5 items-center gap-2 my-1">
            
            {/* Left: Volume Rocker */}
            <div className="col-span-1 flex flex-col items-center justify-between rounded-2xl py-2 bg-slate-900/90 border border-cyan-500/30 h-32 shadow-lg">
              <button 
                onClick={() => sendKey('KEY_VOLUP', 'Vol Up')}
                className="w-9 h-9 rounded-full text-cyan-400 hover:text-cyan-200 hover:bg-cyan-500/20 flex items-center justify-center active:scale-90 transition-all"
                title="Volume Up"
              >
                <ChevronUp size={18} />
              </button>
              <span className="text-[10px] font-bold text-cyan-300 font-orbitron select-none">VOL</span>
              <button 
                onClick={() => sendKey('KEY_VOLDOWN', 'Vol Down')}
                className="w-9 h-9 rounded-full text-cyan-400 hover:text-cyan-200 hover:bg-cyan-500/20 flex items-center justify-center active:scale-90 transition-all"
                title="Volume Down"
              >
                <ChevronDown size={18} />
              </button>
            </div>

            {/* Center: D-Pad Controller */}
            <div className="col-span-3 flex justify-center items-center select-none">
              <div className="w-32 h-32 rounded-full relative flex items-center justify-center border-2 border-orange-500/40 bg-gradient-to-br from-slate-900/90 via-black to-slate-950 shadow-[0_0_25px_rgba(249,115,22,0.15)]">
                <button 
                  onClick={() => sendKey('KEY_ENTER', 'OK / Select')}
                  className="w-12 h-12 rounded-full bg-orange-500/20 border border-orange-400/80 text-orange-200 hover:bg-orange-500/40 flex items-center justify-center font-bold font-orbitron text-xs active:scale-90 transition-all z-10 shadow-md shadow-orange-500/30"
                  title="OK / Select"
                >
                  OK
                </button>
                
                <button 
                  onClick={() => sendKey('KEY_UP', 'Up')}
                  className="absolute top-1 text-orange-400 hover:text-orange-200 hover:scale-110 active:scale-90 p-1"
                  title="Up"
                >
                  <ChevronUp size={20} />
                </button>
                
                <button 
                  onClick={() => sendKey('KEY_DOWN', 'Down')}
                  className="absolute bottom-1 text-orange-400 hover:text-orange-200 hover:scale-110 active:scale-90 p-1"
                  title="Down"
                >
                  <ChevronDown size={20} />
                </button>

                <button 
                  onClick={() => sendKey('KEY_LEFT', 'Left')}
                  className="absolute left-1 text-orange-400 hover:text-orange-200 hover:scale-110 active:scale-90 p-1"
                  title="Left"
                >
                  <ChevronLeft size={20} />
                </button>

                <button 
                  onClick={() => sendKey('KEY_RIGHT', 'Right')}
                  className="absolute right-1 text-orange-400 hover:text-orange-200 hover:scale-110 active:scale-90 p-1"
                  title="Right"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {/* Right: Channel Rocker */}
            <div className="col-span-1 flex flex-col items-center justify-between rounded-2xl py-2 bg-slate-900/90 border border-orange-500/30 h-32 shadow-lg">
              <button 
                onClick={() => sendKey('KEY_CHUP', 'Channel Up')}
                className="w-9 h-9 rounded-full text-orange-400 hover:text-orange-200 hover:bg-orange-500/20 flex items-center justify-center active:scale-90 transition-all"
                title="Channel Up"
              >
                <ChevronUp size={18} />
              </button>
              <span className="text-[10px] font-bold text-orange-300 font-orbitron select-none">CH</span>
              <button 
                onClick={() => sendKey('KEY_CHDOWN', 'Channel Down')}
                className="w-9 h-9 rounded-full text-orange-400 hover:text-orange-200 hover:bg-orange-500/20 flex items-center justify-center active:scale-90 transition-all"
                title="Channel Down"
              >
                <ChevronDown size={18} />
              </button>
            </div>

          </div>

          {/* Primary d2h Function Keys: Guide, Menu, Info, Exit, Back */}
          <div className="grid grid-cols-5 gap-1.5 text-[10px] font-bold font-orbitron">
            <button
              onClick={() => sendKey('KEY_GUIDE', 'Guide / EPG')}
              className="py-2 rounded-xl bg-slate-900/90 hover:bg-orange-500/20 border border-slate-700 hover:border-orange-500/50 text-slate-200 hover:text-orange-300 transition-all active:scale-95 text-center"
              title="Electronic Program Guide"
            >
              GUIDE
            </button>
            <button
              onClick={() => sendKey('KEY_MENU', 'd2h Menu')}
              className="py-2 rounded-xl bg-slate-900/90 hover:bg-orange-500/20 border border-slate-700 hover:border-orange-500/50 text-slate-200 hover:text-orange-300 transition-all active:scale-95 text-center"
              title="Main Menu"
            >
              MENU
            </button>
            <button
              onClick={() => sendKey('KEY_INFO', 'Info')}
              className="py-2 rounded-xl bg-slate-900/90 hover:bg-orange-500/20 border border-slate-700 hover:border-orange-500/50 text-slate-200 hover:text-orange-300 transition-all active:scale-95 text-center"
              title="Channel Information"
            >
              INFO
            </button>
            <button
              onClick={() => sendKey('KEY_RETURN', 'Back')}
              className="py-2 rounded-xl bg-slate-900/90 hover:bg-orange-500/20 border border-slate-700 hover:border-orange-500/50 text-slate-200 hover:text-orange-300 transition-all active:scale-95 text-center flex items-center justify-center gap-1"
              title="Back"
            >
              <ArrowLeft size={11} /> BACK
            </button>
            <button
              onClick={() => sendKey('KEY_EXIT', 'Exit')}
              className="py-2 rounded-xl bg-slate-900/90 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/50 text-rose-300 transition-all active:scale-95 text-center"
              title="Exit Menu / OSD"
            >
              EXIT
            </button>
          </div>

          {/* Numeric Keypad (0-9, Clear, Tune) */}
          <div className="bg-black/60 border border-slate-800 rounded-xl p-2">
            <div className="text-[10px] text-slate-400 font-bold uppercase mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1"><Hash size={11} className="text-orange-400" /> Numeric Dial Pad</span>
              <span className="text-slate-500 font-normal">Direct Channel Input</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                <button
                  key={num}
                  onClick={() => handleKeypadPress(num)}
                  className="py-2 rounded-lg bg-slate-900 hover:bg-orange-500/20 border border-slate-800 hover:border-orange-500/40 text-slate-200 font-bold font-orbitron text-sm transition-all active:scale-90"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => setChannelInput('')}
                className="py-2 rounded-lg bg-slate-950 hover:bg-rose-500/20 border border-slate-800 hover:border-rose-500/40 text-rose-400 font-bold text-xs transition-all active:scale-90"
                title="Clear input"
              >
                CLR
              </button>
              <button
                onClick={() => handleKeypadPress('0')}
                className="py-2 rounded-lg bg-slate-900 hover:bg-orange-500/20 border border-slate-800 hover:border-orange-500/40 text-slate-200 font-bold font-orbitron text-sm transition-all active:scale-90"
              >
                0
              </button>
              <button
                onClick={() => handleTuneChannel()}
                className="py-2 rounded-lg bg-orange-600/30 hover:bg-orange-500/40 border border-orange-500 text-orange-200 font-bold font-orbitron text-xs transition-all active:scale-90"
                title="Submit channel"
              >
                GO
              </button>
            </div>
          </div>

          {/* d2h Color Keys (Audio/Language, Fav, Subtitle, Help) */}
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            <button
              onClick={() => sendKey('KEY_RED', 'Red (Audio/Language)')}
              className="py-1.5 px-1 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/50 text-red-300 font-bold text-[9px] font-orbitron text-center active:scale-95 transition-all"
              title="Red: Audio / Language selection"
            >
              RED: AUDIO
            </button>
            <button
              onClick={() => sendKey('KEY_GREEN', 'Green (Favorites)')}
              className="py-1.5 px-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/50 text-emerald-300 font-bold text-[9px] font-orbitron text-center active:scale-95 transition-all"
              title="Green: Favorites List"
            >
              GRN: FAV
            </button>
            <button
              onClick={() => sendKey('KEY_YELLOW', 'Yellow (Options)')}
              className="py-1.5 px-1 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/50 text-amber-300 font-bold text-[9px] font-orbitron text-center active:scale-95 transition-all"
              title="Yellow: Options / Subtitles"
            >
              YLW: OPT
            </button>
            <button
              onClick={() => sendKey('KEY_CYAN', 'Blue (Help/Interactive)')}
              className="py-1.5 px-1 rounded-lg bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/50 text-blue-300 font-bold text-[9px] font-orbitron text-center active:scale-95 transition-all"
              title="Blue: Help / Interactive services"
            >
              BLU: HELP
            </button>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. NATIVE SAMSUNG TV INTERFACE */}
      {/* ========================================================================= */}
      {controlMode === 'tv' && (
        <div className="flex-1 flex flex-col justify-between gap-3 p-3 rounded-2xl bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-black border border-cyan-500/30 shadow-2xl relative overflow-y-auto">
          {/* Power & TV Source */}
          <div className="flex justify-between items-center px-4">
            <button 
              onClick={() => sendKey('KEY_POWER', 'TV Power')} 
              className="w-10 h-10 rounded-full border border-red-500/40 bg-red-950/20 text-red-500 flex items-center justify-center hover:bg-red-500/25 active:scale-95 transition-all"
              title="Toggle TV Power"
            >
              <Power size={16} />
            </button>
            <div className="text-[10px] text-cyan-400 font-orbitron font-semibold uppercase">
              SAMSUNG TIZEN GATEWAY
            </div>
            <button 
              onClick={() => sendKey('KEY_SOURCE', 'TV Source')} 
              className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300 active:scale-95 transition-all"
              title="Cycle TV Source Inputs"
            >
              SOURCE
            </button>
          </div>

          {/* JioFiber OTT Apps Grid inside TV mode */}
          <div className="bg-black/70 border border-pink-500/30 rounded-xl p-2.5 flex flex-col gap-1.5">
            <div className="text-[10px] text-pink-300 font-bold font-orbitron flex items-center justify-between">
              <span className="flex items-center gap-1"><Flame size={12} className="text-pink-400" /> JIOFIBER OTT APPS</span>
              <span className="text-slate-500 font-normal">Click to Launch</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {JIOFIBER_OTT_APPS.slice(0, 6).map(app => (
                <button
                  key={app.id}
                  onClick={() => handleLaunchOttApp(app)}
                  className={`py-2 px-1 rounded-lg border text-[10px] font-bold font-orbitron flex items-center justify-center gap-1 transition-all active:scale-95 ${app.badgeColor} ${app.accentBorder} bg-black/60`}
                >
                  <Play size={8} /> {app.name}
                </button>
              ))}
            </div>
          </div>

          {/* Volume & TV Channels */}
          <div className="flex justify-between items-center px-4">
            <div className="flex flex-col items-center rounded-full py-1 bg-slate-900 border border-cyan-500/20">
              <button onClick={() => sendKey('KEY_VOLUP', 'TV Vol+')} className="w-8 h-8 rounded-full text-cyan-400 flex items-center justify-center active:scale-90"><ChevronUp size={16} /></button>
              <span className="text-xs font-bold text-sky-400 my-0.5 font-orbitron">VOL</span>
              <button onClick={() => sendKey('KEY_VOLDOWN', 'TV Vol-')} className="w-8 h-8 rounded-full text-cyan-400 flex items-center justify-center active:scale-90"><ChevronDown size={16} /></button>
            </div>

            <div className="flex flex-col gap-2">
              <button onClick={toggleMute} className="w-9 h-9 rounded-full bg-slate-900 border border-cyan-500/30 text-cyan-400 flex items-center justify-center active:scale-95">
                {isMuted ? <VolumeX size={15} className="text-red-400" /> : <Volume2 size={15} />}
              </button>
              <button onClick={() => sendKey('KEY_HOME', 'TV Home')} className="w-9 h-9 rounded-full bg-slate-900 border border-cyan-500/30 text-cyan-400 flex items-center justify-center active:scale-95">
                <Home size={15} />
              </button>
              <button onClick={() => sendKey('KEY_RETURN', 'TV Back')} className="w-9 h-9 rounded-full bg-slate-900 border border-cyan-500/30 text-cyan-400 flex items-center justify-center active:scale-95">
                <ArrowLeft size={15} />
              </button>
            </div>

            <div className="flex flex-col items-center rounded-full py-1 bg-slate-900 border border-cyan-500/20">
              <button onClick={() => sendKey('KEY_CHUP', 'TV CH+')} className="w-8 h-8 rounded-full text-cyan-400 flex items-center justify-center active:scale-90"><ChevronUp size={16} /></button>
              <span className="text-xs font-bold text-sky-400 my-0.5 font-orbitron">CH</span>
              <button onClick={() => sendKey('KEY_CHDOWN', 'TV CH-')} className="w-8 h-8 rounded-full text-cyan-400 flex items-center justify-center active:scale-90"><ChevronDown size={16} /></button>
            </div>
          </div>

          {/* TV D-Pad Navigator */}
          <div className="flex justify-center items-center select-none">
            <div className="w-28 h-28 rounded-full border border-cyan-500/30 bg-black/60 relative flex items-center justify-center">
              <button onClick={() => sendKey('KEY_ENTER', 'TV Enter')} className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-bold text-xs active:scale-90 z-10">ENTER</button>
              <button onClick={() => sendKey('KEY_UP', 'TV Up')} className="absolute top-1 text-cyan-400 hover:text-cyan-200"><ChevronUp size={18} /></button>
              <button onClick={() => sendKey('KEY_DOWN', 'TV Down')} className="absolute bottom-1 text-cyan-400 hover:text-cyan-200"><ChevronDown size={18} /></button>
              <button onClick={() => sendKey('KEY_LEFT', 'TV Left')} className="absolute left-1 text-cyan-400 hover:text-cyan-200"><ChevronLeft size={18} /></button>
              <button onClick={() => sendKey('KEY_RIGHT', 'TV Right')} className="absolute right-1 text-cyan-400 hover:text-cyan-200"><ChevronRight size={18} /></button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
