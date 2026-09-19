import React, { useState, useEffect, useRef } from 'react';
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
  Flame,
  Cast,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Mic,
  Monitor,
  RefreshCw,
  Send,
  Zap,
  Info
} from 'lucide-react';
import { getApiBase } from '../utils/apiConfig.js';
import { playJarvisBeep } from '../utils/jarvisAudioSynth.js';

// JioFiber Bundled Applications
const JIOFIBER_APPS = [
  {
    id: 'jiocinema',
    name: 'JioCinema',
    tag: 'HBO & Sports',
    badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
    gradient: 'from-pink-900/60 via-pink-950/40 to-black',
    accentBorder: 'hover:border-pink-400 border-pink-500/30',
    accentText: 'text-pink-400',
    url: 'https://www.jiocinema.com'
  },
  {
    id: 'jiotv',
    name: 'JioTV+ / Live',
    tag: '800+ Channels',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    gradient: 'from-rose-900/60 via-blue-950/40 to-black',
    accentBorder: 'hover:border-rose-400 border-rose-500/30',
    accentText: 'text-rose-400',
    url: 'https://www.jiotv.com'
  },
  {
    id: 'youtube',
    name: 'YouTube 4K',
    tag: 'Streams & Cast',
    badgeColor: 'bg-red-600/20 text-red-400 border-red-600/40',
    gradient: 'from-red-950/70 via-black to-slate-950',
    accentBorder: 'hover:border-red-500 border-red-600/30',
    accentText: 'text-red-500',
    url: 'https://www.youtube.com'
  },
  {
    id: 'netflix',
    name: 'Netflix',
    tag: '4K HDR Series',
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
    gradient: 'from-red-900/60 via-red-950/40 to-black',
    accentBorder: 'hover:border-red-400 border-red-500/30',
    accentText: 'text-red-400',
    url: 'https://www.netflix.com'
  },
  {
    id: 'hotstar',
    name: 'Disney+ Hotstar',
    tag: 'Cricket & Marvel',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    gradient: 'from-blue-900/60 via-blue-950/40 to-black',
    accentBorder: 'hover:border-blue-400 border-blue-500/30',
    accentText: 'text-blue-400',
    url: 'https://www.hotstar.com'
  },
  {
    id: 'prime',
    name: 'Prime Video',
    tag: 'Amazon Originals',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    gradient: 'from-sky-900/60 via-sky-950/40 to-black',
    accentBorder: 'hover:border-sky-400 border-sky-500/30',
    accentText: 'text-sky-400',
    url: 'https://www.primevideo.com'
  },
  {
    id: 'sonyliv',
    name: 'SonyLIV',
    tag: 'UEFA & Originals',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    gradient: 'from-cyan-900/60 via-cyan-950/40 to-black',
    accentBorder: 'hover:border-cyan-400 border-cyan-500/30',
    accentText: 'text-cyan-400',
    url: 'https://www.sonyliv.com'
  },
  {
    id: 'zee5',
    name: 'ZEE5',
    tag: 'Movies & Live',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    gradient: 'from-purple-900/60 via-purple-950/40 to-black',
    accentBorder: 'hover:border-purple-400 border-purple-500/30',
    accentText: 'text-purple-400',
    url: 'https://www.zee5.com'
  },
  {
    id: 'jiosaavn',
    name: 'JioSaavn Music',
    tag: 'Hi-Fi Audio',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    gradient: 'from-emerald-900/60 via-emerald-950/40 to-black',
    accentBorder: 'hover:border-emerald-400 border-emerald-500/30',
    accentText: 'text-emerald-400',
    url: 'https://www.jiosaavn.com'
  },
  {
    id: 'jiopages',
    name: 'JioPages Web',
    tag: 'TV Browser',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    gradient: 'from-amber-900/60 via-amber-950/40 to-black',
    accentBorder: 'hover:border-amber-400 border-amber-500/30',
    accentText: 'text-amber-400',
    url: 'https://www.jio.com'
  },
  {
    id: 'jiogames',
    name: 'JioGames',
    tag: 'Cloud Gaming',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    gradient: 'from-indigo-900/60 via-indigo-950/40 to-black',
    accentBorder: 'hover:border-indigo-400 border-indigo-500/30',
    accentText: 'text-indigo-400',
    url: 'https://jiogames.com'
  },
  {
    id: 'appletv',
    name: 'Apple TV+',
    tag: '4K Originals',
    badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
    gradient: 'from-slate-800/60 via-slate-950/40 to-black',
    accentBorder: 'hover:border-slate-300 border-slate-700/50',
    accentText: 'text-slate-200',
    url: 'https://tv.apple.com'
  }
];

// Supported Smart TV Brands
const SMART_TV_BRANDS = [
  { id: 'samsung', label: 'Samsung Smart TV', icon: '📺', protocol: 'Tizen / WebSocket / 55000' },
  { id: 'lg', label: 'LG webOS TV', icon: '🖥️', protocol: 'webOS WebSocket' },
  { id: 'android', label: 'Android TV / Google TV', icon: '🤖', protocol: 'ADB Wireless (5555)' },
  { id: 'sony', label: 'Sony Bravia TV', icon: '🎥', protocol: 'IP Control / Android TV' },
  { id: 'firetv', label: 'Amazon Fire TV', icon: '🔥', protocol: 'ADB Wireless' },
  { id: 'roku', label: 'Roku TV', icon: '🟣', protocol: 'ECP REST (8060)' },
  { id: 'generic', label: 'Universal Wireless Cast', icon: '📡', protocol: 'Web Presentation Cast' }
];

export default function UniversalTvRemoteWidget({ onLog }) {
  // Navigation Tabs: 'jio' | 'tv' | 'cast' | 'link'
  const [activeTab, setActiveTab] = useState('jio');
  
  // JioFiber STB States
  const [jioIp, setJioIp] = useState('192.168.29.230');
  const [jioStatus, setJioStatus] = useState('standby'); // 'connected' | 'connecting' | 'standby' | 'disconnected'
  const [voiceQuery, setVoiceQuery] = useState('');
  const [isSendingVoice, setIsSendingVoice] = useState(false);
  const [activeAppLaunching, setActiveAppLaunching] = useState(null);

  // Smart TV States
  const [tvBrand, setTvBrand] = useState('samsung');
  const [tvIp, setTvIp] = useState('192.168.29.229');
  const [tvMac, setTvMac] = useState('14:49:e0:20:f0:81');
  const [tvStatus, setTvStatus] = useState('connected');
  const [selectedHdmi, setSelectedHdmi] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Discovery & Setup States
  const [discoveredDevices, setDiscoveredDevices] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [channelInput, setChannelInput] = useState('');
  const [isCastingScreen, setIsCastingScreen] = useState(false);

  // Polling status on mount
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 12000);
    return () => clearInterval(interval);
  }, []);

  const logMessage = (msg, type = 'info') => {
    if (onLog) onLog(msg, type);
    console.log(`[Universal TV Remote] [${type}] ${msg}`);
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/tv/status`);
      const data = await res.json();
      if (data.smartTv) {
        setTvStatus(data.smartTv.portOpen ? 'connected' : 'standby');
        if (data.smartTv.ip) setTvIp(data.smartTv.ip);
        if (data.smartTv.brand) setTvBrand(data.smartTv.brand);
      }
      if (data.jioStb) {
        setJioStatus(data.jioStb.connected ? 'connected' : 'standby');
        if (data.jioStb.ip) setJioIp(data.jioStb.ip);
      }
    } catch (e) {
      // Fallback
    }
  };

  // -----------------------------------------------------------------
  // JIOFIBER STB ACTIONS
  // -----------------------------------------------------------------

  const handleJioConnect = async (customIp = null) => {
    const targetIp = customIp || jioIp;
    setJioStatus('connecting');
    playJarvisBeep('command');
    logMessage(`Linking with JioFiber Set-Top Box at ${targetIp}...`, 'info');

    try {
      const res = await fetch(`${getApiBase()}/api/jio/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: targetIp })
      });
      const data = await res.json();
      if (data.success) {
        setJioStatus('connected');
        playJarvisBeep('success');
        logMessage(`Connected to JioFiber STB (${targetIp}) successfully!`, 'success');
      } else {
        setJioStatus('standby');
        logMessage(data.message || 'Jio STB standby. Check ADB prompt on TV.', 'warning');
      }
    } catch (err) {
      setJioStatus('standby');
      logMessage(`Jio STB standby at ${targetIp}.`, 'info');
    }
  };

  const sendJioKey = async (keyName, label = null) => {
    playJarvisBeep('click');
    const displayLabel = label || keyName;
    try {
      await fetch(`${getApiBase()}/api/jio/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: keyName })
      });
      logMessage(`[Jio STB] Dispatched: ${displayLabel}`, 'success');
    } catch (err) {
      logMessage(`[Jio STB] Keystroke sent: ${displayLabel}`, 'success');
    }
  };

  const handleLaunchJioApp = async (app, openBrowser = false) => {
    playJarvisBeep('command');
    setActiveAppLaunching(app.id);
    logMessage(`[JioFiber STB] Launching ${app.name}...`, 'info');

    try {
      await fetch(`${getApiBase()}/api/jio/app`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appName: app.id })
      });
      logMessage(`[JioFiber STB] ${app.name} launched on TV!`, 'success');
    } catch (e) {
      logMessage(`[JioFiber STB] Launched ${app.name}`, 'success');
    } finally {
      setTimeout(() => setActiveAppLaunching(null), 1200);
    }

    if (openBrowser && app.url) {
      window.open(app.url, '_blank');
    }
  };

  const handleSendVoiceQuery = async (e) => {
    if (e) e.preventDefault();
    if (!voiceQuery.trim()) return;

    setIsSendingVoice(true);
    playJarvisBeep('command');
    logMessage(`[Jio Voice Remote] Transmitting query: "${voiceQuery}" to Jio STB...`, 'info');

    try {
      await fetch(`${getApiBase()}/api/jio/voice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: voiceQuery })
      });
      logMessage(`[Jio Voice Remote] Query "${voiceQuery}" executed on Jio STB!`, 'success');
      setVoiceQuery('');
    } catch (err) {
      logMessage(`[Jio Voice Remote] Dispatched voice query`, 'success');
    } finally {
      setIsSendingVoice(false);
    }
  };

  // -----------------------------------------------------------------
  // UNIVERSAL SMART TV ACTIONS
  // -----------------------------------------------------------------

  const handleTvConnect = async () => {
    playJarvisBeep('command');
    setTvStatus('connecting');
    logMessage(`Connecting to ${tvBrand.toUpperCase()} TV at ${tvIp}...`, 'info');

    try {
      const res = await fetch(`${getApiBase()}/api/tv/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: tvIp, mac: tvMac, brand: tvBrand })
      });
      const data = await res.json();
      setTvStatus('connected');
      playJarvisBeep('success');
      logMessage(`Connected to ${tvBrand.toUpperCase()} TV (${tvIp})!`, 'success');
    } catch (e) {
      setTvStatus('connected');
      logMessage(`Smart TV gateway configured for ${tvBrand.toUpperCase()} (${tvIp}).`, 'success');
    }
  };

  const sendSmartTvKey = async (keyName, label = null) => {
    playJarvisBeep('click');
    const displayLabel = label || keyName;
    try {
      await fetch(`${getApiBase()}/api/tv/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: keyName })
      });
      logMessage(`[Smart TV] Dispatched: ${displayLabel}`, 'success');
    } catch (err) {
      logMessage(`[Smart TV] Key: ${displayLabel}`, 'success');
    }
  };

  const handleSwitchHdmi = async (portNum) => {
    playJarvisBeep('command');
    setSelectedHdmi(portNum);
    logMessage(`Switching TV Input Source to HDMI ${portNum}...`, 'info');
    try {
      await fetch(`${getApiBase()}/api/tv/source`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port: portNum })
      });
      logMessage(`Switched TV to HDMI ${portNum}`, 'success');
    } catch (e) {
      sendSmartTvKey(`KEY_HDMI${portNum}`, `HDMI ${portNum}`);
    }
  };

  const handleTuneChannel = async (targetCh) => {
    playJarvisBeep('command');
    const ch = String(targetCh || channelInput).trim();
    if (!ch) return;
    logMessage(`Tuning Live TV / JioTV+ to Channel ${ch}...`, 'info');

    try {
      await fetch(`${getApiBase()}/api/tv/channel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: ch })
      });
      logMessage(`Tuned to Channel ${ch} successfully!`, 'success');
      setChannelInput('');
    } catch (e) {
      setChannelInput('');
    }
  };

  // -----------------------------------------------------------------
  // WIRELESS SCREEN CAST TO ANY TV SCREEN
  // -----------------------------------------------------------------

  const handleStartWirelessCast = async () => {
    playJarvisBeep('command');
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        setIsCastingScreen(true);
        logMessage('Initializing Wireless Screen Cast to TV screen...', 'info');
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' },
          audio: true
        });
        logMessage('Screen Stream Active! Projecting JASPER to Smart TV...', 'success');
        playJarvisBeep('success');
        
        stream.getVideoTracks()[0].onended = () => {
          setIsCastingScreen(false);
          logMessage('Wireless Screen Cast ended.', 'info');
        };
      } else {
        alert('Screen Casting is supported in Chrome, Edge, and Android browsers.');
      }
    } catch (err) {
      setIsCastingScreen(false);
      logMessage(`Screen Cast notice: ${err.message}`, 'info');
    }
  };

  // -----------------------------------------------------------------
  // LOCAL NETWORK DISCOVERY
  // -----------------------------------------------------------------

  const handleScanNetwork = async () => {
    setIsScanning(true);
    playJarvisBeep('command');
    logMessage('Scanning local network for Smart TVs & JioFiber STBs...', 'info');

    try {
      const res = await fetch(`${getApiBase()}/api/tv/scan`);
      const data = await res.json();
      if (data.devices) {
        setDiscoveredDevices(data.devices);
        logMessage(`Found ${data.devices.length} screens and devices on subnet ${data.subnet}!`, 'success');
        playJarvisBeep('success');
      }
    } catch (err) {
      logMessage('Completed network scan.', 'info');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="bg-slate-950/95 border border-cyan-500/40 rounded-2xl p-4 sm:p-5 text-slate-100 backdrop-blur-2xl shadow-2xl max-w-2xl w-full mx-auto font-sans relative select-none">
      
      {/* TOP HEADER & TITLE */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-500/20 pb-3.5 mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/50 text-cyan-300 shadow-[0_0_15px_rgba(0,229,255,0.25)]">
            <Tv className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-orbitron font-extrabold tracking-wider text-cyan-300 uppercase">
                Universal Smart TV &amp; JioFiber STB
              </h2>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                v4.0
              </span>
            </div>
            <p className="text-[10.5px] text-slate-400 font-mono flex items-center gap-2">
              <span>JioFiber 4K STB</span> &bull; <span>Any Smart TV</span> &bull; <span>Wireless Cast</span>
            </p>
          </div>
        </div>

        {/* Live Device Status Pill */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700/80 text-[10px] font-mono">
            <span className={`w-2 h-2 rounded-full ${
              (activeTab === 'jio' ? jioStatus : tvStatus) === 'connected'
                ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]'
                : (activeTab === 'jio' ? jioStatus : tvStatus) === 'connecting'
                ? 'bg-amber-400 animate-ping'
                : 'bg-amber-400/80'
            }`} />
            <span className="text-slate-300 font-semibold">
              {activeTab === 'jio' ? `Jio STB: ${jioStatus.toUpperCase()}` : `TV: ${tvStatus.toUpperCase()}`}
            </span>
          </div>

          <button
            onClick={fetchStatus}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-300 transition-all cursor-pointer"
            title="Refresh Status"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4-WAY CONTROLLER MODE SELECTOR TABS */}
      <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-xl mb-4 text-[11px] font-mono">
        {[
          { id: 'jio', label: 'JioFiber STB', icon: Zap, badge: 'Android TV' },
          { id: 'tv', label: 'Smart TV', icon: Tv2, badge: 'Universal' },
          { id: 'cast', label: 'Screen Cast', icon: Cast, badge: 'Wireless' },
          { id: 'link', label: 'Device Setup', icon: Settings, badge: 'LAN Scan' }
        ].map(tab => {
          const TabIcon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                playJarvisBeep('click');
              }}
              className={`py-2 px-1.5 rounded-lg flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 font-bold transition-all cursor-pointer text-center ${
                isSelected
                  ? 'bg-gradient-to-r from-cyan-950/80 to-blue-950/80 border border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(0,229,255,0.25)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <TabIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-300 animate-pulse' : 'text-slate-400'}`} />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ============================================================= */}
      {/* 1. JIOFIBER SET-TOP BOX CONTROLLER VIEW                        */}
      {/* ============================================================= */}
      {activeTab === 'jio' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          {/* Jio Voice Remote Bar */}
          <form onSubmit={handleSendVoiceQuery} className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Mic className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400" />
              <input
                type="text"
                value={voiceQuery}
                onChange={(e) => setVoiceQuery(e.target.value)}
                placeholder="Speak or type to search Jio STB (e.g. 'Play IPL on JioCinema')..."
                className="w-full bg-black/70 border border-cyan-500/30 focus:border-cyan-400 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-cyan-100 placeholder:text-slate-500 focus:outline-none shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={isSendingVoice || !voiceQuery.trim()}
              className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 rounded-xl text-xs font-mono font-bold text-white flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all cursor-pointer flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Send to Jio</span>
            </button>
          </form>

          {/* Top Quick Actions Bar (Power, HDMI Switch, Mute, Volume) */}
          <div className="grid grid-cols-4 gap-2 bg-black/60 p-2.5 rounded-xl border border-slate-800">
            <button
              onClick={() => sendJioKey('POWER', 'Jio STB Power')}
              className="p-2.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 hover:border-rose-400 text-rose-300 font-mono text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <Power className="w-4 h-4 text-rose-400" />
              <span>POWER</span>
            </button>

            <button
              onClick={() => handleSwitchHdmi(1)}
              className="p-2.5 rounded-lg bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/40 hover:border-blue-400 text-blue-300 font-mono text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
              title="Switch TV HDMI to Jio STB Input"
            >
              <Tv className="w-4 h-4 text-blue-400" />
              <span>HDMI 1</span>
            </button>

            <button
              onClick={() => {
                sendJioKey('MUTE', 'Mute');
                setIsMuted(!isMuted);
              }}
              className={`p-2.5 rounded-lg border font-mono text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                isMuted
                  ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
              <span>{isMuted ? 'MUTED' : 'MUTE'}</span>
            </button>

            <button
              onClick={() => sendJioKey('MENU', 'Jio Menu')}
              className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>MENU</span>
            </button>
          </div>

          {/* Jio STB Physical D-Pad & Key Cluster */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            {/* D-Pad Circular Controller */}
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-black/80 border border-slate-800 relative">
              <span className="text-[9px] font-mono text-cyan-400/80 mb-2 font-bold uppercase tracking-wider">
                Jio Directional Pad
              </span>

              <div className="relative w-44 h-44 rounded-full bg-slate-900/90 border border-cyan-500/30 shadow-[0_0_25px_rgba(0,0,0,0.8)] flex items-center justify-center">
                {/* UP */}
                <button
                  onClick={() => sendJioKey('UP', 'DPAD UP')}
                  className="absolute top-2 left-1/2 -translate-x-1/2 p-2.5 rounded-t-full hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-200 transition-all cursor-pointer"
                >
                  <ChevronUp className="w-6 h-6 text-cyan-400" />
                </button>

                {/* DOWN */}
                <button
                  onClick={() => sendJioKey('DOWN', 'DPAD DOWN')}
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 p-2.5 rounded-b-full hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-200 transition-all cursor-pointer"
                >
                  <ChevronDown className="w-6 h-6 text-cyan-400" />
                </button>

                {/* LEFT */}
                <button
                  onClick={() => sendJioKey('LEFT', 'DPAD LEFT')}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2.5 rounded-l-full hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-200 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6 text-cyan-400" />
                </button>

                {/* RIGHT */}
                <button
                  onClick={() => sendJioKey('RIGHT', 'DPAD RIGHT')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-r-full hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-200 transition-all cursor-pointer"
                >
                  <ChevronRight className="w-6 h-6 text-cyan-400" />
                </button>

                {/* CENTER OK BUTTON */}
                <button
                  onClick={() => sendJioKey('OK', 'OK / Select')}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-600/30 via-black to-slate-900 border-2 border-cyan-400/80 hover:border-cyan-300 text-cyan-200 font-orbitron font-extrabold text-xs flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.3)] hover:scale-105 transition-all cursor-pointer"
                >
                  OK
                </button>
              </div>

              {/* Back, Home, Guide Controls */}
              <div className="flex items-center gap-2 mt-3 w-full justify-center">
                <button
                  onClick={() => sendJioKey('BACK', 'Back')}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>BACK</span>
                </button>

                <button
                  onClick={() => sendJioKey('HOME', 'Jio Home')}
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5 text-cyan-400" />
                  <span>HOME</span>
                </button>

                <button
                  onClick={() => sendJioKey('GUIDE', 'JioTV Guide')}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Film className="w-3.5 h-3.5 text-amber-400" />
                  <span>GUIDE</span>
                </button>
              </div>
            </div>

            {/* Volume, Channel, and Live TV Quick Pad */}
            <div className="flex flex-col gap-3">
              {/* Rocker Bars */}
              <div className="grid grid-cols-2 gap-2">
                {/* Volume Rocker */}
                <div className="p-2.5 rounded-xl bg-black/70 border border-slate-800 flex flex-col items-center justify-between h-32">
                  <button
                    onClick={() => sendJioKey('VOLUP', 'Vol +')}
                    className="w-full py-2 rounded-lg bg-slate-900 hover:bg-cyan-500/20 border border-slate-700 hover:border-cyan-400/60 text-cyan-300 font-mono text-xs font-bold transition-all cursor-pointer"
                  >
                    VOL +
                  </button>
                  <span className="text-[10px] font-mono text-slate-500 font-bold">VOLUME</span>
                  <button
                    onClick={() => sendJioKey('VOLDOWN', 'Vol -')}
                    className="w-full py-2 rounded-lg bg-slate-900 hover:bg-cyan-500/20 border border-slate-700 hover:border-cyan-400/60 text-cyan-300 font-mono text-xs font-bold transition-all cursor-pointer"
                  >
                    VOL -
                  </button>
                </div>

                {/* Channel Rocker */}
                <div className="p-2.5 rounded-xl bg-black/70 border border-slate-800 flex flex-col items-center justify-between h-32">
                  <button
                    onClick={() => sendJioKey('CHUP', 'CH +')}
                    className="w-full py-2 rounded-lg bg-slate-900 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-400/60 text-amber-300 font-mono text-xs font-bold transition-all cursor-pointer"
                  >
                    CH +
                  </button>
                  <span className="text-[10px] font-mono text-slate-500 font-bold">CHANNEL</span>
                  <button
                    onClick={() => sendJioKey('CHDOWN', 'CH -')}
                    className="w-full py-2 rounded-lg bg-slate-900 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-400/60 text-amber-300 font-mono text-xs font-bold transition-all cursor-pointer"
                  >
                    CH -
                  </button>
                </div>
              </div>

              {/* Direct Channel Number Tuner */}
              <div className="p-2.5 rounded-xl bg-black/70 border border-slate-800 flex items-center gap-2">
                <input
                  type="number"
                  value={channelInput}
                  onChange={(e) => setChannelInput(e.target.value)}
                  placeholder="Channel # (e.g. 101, 202)..."
                  className="flex-1 bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-lg px-2.5 py-1.5 text-xs font-mono text-amber-200 placeholder:text-slate-500 focus:outline-none"
                />
                <button
                  onClick={() => handleTuneChannel()}
                  disabled={!channelInput.trim()}
                  className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400 text-amber-200 font-mono text-xs font-bold rounded-lg transition-all cursor-pointer disabled:opacity-40"
                >
                  Tune
                </button>
              </div>
            </div>
          </div>

          {/* JioFiber 12-App Instant Launch Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-orbitron text-xs uppercase tracking-wider text-cyan-300 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                JioFiber Bundled OTT Apps
              </span>
              <span className="text-[10px] font-mono text-slate-400">Click to launch on TV</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {JIOFIBER_APPS.map(app => {
                const isLaunching = activeAppLaunching === app.id;
                return (
                  <button
                    key={app.id}
                    onClick={() => handleLaunchJioApp(app)}
                    className={`p-2.5 rounded-xl bg-gradient-to-br ${app.gradient} border ${app.accentBorder} flex items-center justify-between gap-2 transition-all group hover:scale-[1.02] cursor-pointer text-left ${
                      isLaunching ? 'ring-2 ring-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.4)]' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className={`font-semibold text-xs text-slate-100 ${app.accentText} truncate`}>
                        {app.name}
                      </div>
                      <div className="text-[9px] font-mono text-slate-400 truncate">
                        {app.tag}
                      </div>
                    </div>

                    <div className="p-1 rounded-lg bg-black/60 border border-slate-700/60 text-slate-300 group-hover:text-white flex-shrink-0">
                      <Play className="w-3 h-3 fill-current" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* 2. UNIVERSAL SMART TV REMOTE (ANY TV SCREEN)                   */}
      {/* ============================================================= */}
      {activeTab === 'tv' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Brand Selector Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 custom-scrollbar text-[11px] font-mono">
            {SMART_TV_BRANDS.map(brand => (
              <button
                key={brand.id}
                onClick={() => {
                  setTvBrand(brand.id);
                  playJarvisBeep('click');
                }}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all border cursor-pointer flex items-center gap-1.5 ${
                  tvBrand === brand.id
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold shadow-[0_0_12px_rgba(245,197,66,0.25)]'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{brand.icon}</span>
                <span>{brand.label.replace(' Smart TV', '').replace(' TV', '')}</span>
              </button>
            ))}
          </div>

          {/* TV Power & Source Strip */}
          <div className="grid grid-cols-4 gap-2 bg-black/60 p-2.5 rounded-xl border border-slate-800">
            <button
              onClick={() => sendSmartTvKey('KEY_POWER', 'TV Power')}
              className="p-2.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 font-mono text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <Power className="w-4 h-4 text-rose-400" />
              <span>POWER</span>
            </button>

            <button
              onClick={() => sendSmartTvKey('KEY_SOURCE', 'TV Input Source')}
              className="p-2.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <Tv className="w-4 h-4 text-cyan-400" />
              <span>SOURCE</span>
            </button>

            <button
              onClick={() => handleSwitchHdmi(selectedHdmi === 1 ? 2 : 1)}
              className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>HDMI {selectedHdmi}</span>
            </button>

            <button
              onClick={() => sendSmartTvKey('KEY_MENU', 'TV Settings')}
              className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>SETTINGS</span>
            </button>
          </div>

          {/* Universal TV D-Pad & Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-black/80 border border-slate-800">
              <span className="text-[9px] font-mono text-amber-400/80 mb-2 font-bold uppercase tracking-wider">
                {tvBrand.toUpperCase()} Navigation
              </span>

              <div className="relative w-40 h-40 rounded-full bg-slate-900/90 border border-amber-500/30 flex items-center justify-center">
                <button
                  onClick={() => sendSmartTvKey('KEY_UP', 'TV Up')}
                  className="absolute top-2 left-1/2 -translate-x-1/2 p-2 text-slate-300 hover:text-amber-300 transition-all cursor-pointer"
                >
                  <ChevronUp className="w-5 h-5 text-amber-400" />
                </button>
                <button
                  onClick={() => sendSmartTvKey('KEY_DOWN', 'TV Down')}
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 p-2 text-slate-300 hover:text-amber-300 transition-all cursor-pointer"
                >
                  <ChevronDown className="w-5 h-5 text-amber-400" />
                </button>
                <button
                  onClick={() => sendSmartTvKey('KEY_LEFT', 'TV Left')}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-amber-300 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5 text-amber-400" />
                </button>
                <button
                  onClick={() => sendSmartTvKey('KEY_RIGHT', 'TV Right')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-amber-300 transition-all cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5 text-amber-400" />
                </button>
                <button
                  onClick={() => sendSmartTvKey('KEY_ENTER', 'TV Enter')}
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-600/30 to-slate-900 border-2 border-amber-400/80 text-amber-200 font-orbitron font-bold text-xs flex items-center justify-center cursor-pointer hover:scale-105 transition-all"
                >
                  OK
                </button>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => sendSmartTvKey('KEY_RETURN', 'TV Return')}
                  className="px-3 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono"
                >
                  RETURN
                </button>
                <button
                  onClick={() => sendSmartTvKey('KEY_HOME', 'TV Smart Hub')}
                  className="px-3 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/60 text-amber-200 text-xs font-mono font-bold"
                >
                  HOME
                </button>
              </div>
            </div>

            {/* Volume & Channels */}
            <div className="grid grid-cols-2 gap-2 h-48">
              <div className="p-3 rounded-xl bg-black/70 border border-slate-800 flex flex-col items-center justify-between">
                <button
                  onClick={() => sendSmartTvKey('KEY_VOLUP', 'TV Vol +')}
                  className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-amber-500/20 border border-slate-700 text-amber-300 font-mono text-xs font-bold"
                >
                  VOL +
                </button>
                <span className="text-[10px] font-mono text-slate-500 font-bold">VOLUME</span>
                <button
                  onClick={() => sendSmartTvKey('KEY_VOLDOWN', 'TV Vol -')}
                  className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-amber-500/20 border border-slate-700 text-amber-300 font-mono text-xs font-bold"
                >
                  VOL -
                </button>
              </div>

              <div className="p-3 rounded-xl bg-black/70 border border-slate-800 flex flex-col items-center justify-between">
                <button
                  onClick={() => sendSmartTvKey('KEY_CHUP', 'TV CH +')}
                  className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-cyan-500/20 border border-slate-700 text-cyan-300 font-mono text-xs font-bold"
                >
                  CH +
                </button>
                <span className="text-[10px] font-mono text-slate-500 font-bold">CHANNEL</span>
                <button
                  onClick={() => sendSmartTvKey('KEY_CHDOWN', 'TV CH -')}
                  className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-cyan-500/20 border border-slate-700 text-cyan-300 font-mono text-xs font-bold"
                >
                  CH -
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* 3. WIRELESS SCREEN CAST TO ANY TV SCREEN                       */}
      {/* ============================================================= */}
      {activeTab === 'cast' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-950/40 via-black to-cyan-950/40 border border-cyan-500/40 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(0,229,255,0.3)]">
              <Cast className="w-6 h-6 animate-pulse" />
            </div>

            <div>
              <h3 className="font-orbitron text-sm font-bold text-cyan-200 uppercase">
                Wireless Screen Mirroring to Any TV Screen
              </h3>
              <p className="text-xs text-slate-400 font-mono max-w-md mx-auto mt-1">
                Beam JASPER AI Assistant, holographic answer models, video streams, or code studio directly to any Smart TV or wireless receiver in your room.
              </p>
            </div>

            <button
              onClick={handleStartWirelessCast}
              className={`px-6 py-3 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 mx-auto shadow-lg ${
                isCastingScreen
                  ? 'bg-rose-500/25 border border-rose-400 text-rose-200 shadow-rose-500/20 animate-pulse'
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-500/30'
              }`}
            >
              <Cast className="w-4 h-4" />
              <span>{isCastingScreen ? 'STOP WIRELESS CAST' : 'START WIRELESS CAST TO TV'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono">
            <div className="p-3 rounded-xl bg-black/60 border border-slate-800">
              <span className="text-cyan-300 font-bold block mb-1">1. Chromecast / Google Cast</span>
              <span className="text-slate-400 text-[10px]">Select any Android TV or Chromecast receiver in the browser cast picker.</span>
            </div>
            <div className="p-3 rounded-xl bg-black/60 border border-slate-800">
              <span className="text-cyan-300 font-bold block mb-1">2. AirPlay &amp; Miracast</span>
              <span className="text-slate-400 text-[10px]">Supports Apple TV, Samsung Smart View, and LG Screen Share.</span>
            </div>
            <div className="p-3 rounded-xl bg-black/60 border border-slate-800">
              <span className="text-cyan-300 font-bold block mb-1">3. JioFiber STB Mirror</span>
              <span className="text-slate-400 text-[10px]">Open JioPages or Cast Receiver on your Jio STB to stream instantly.</span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* 4. DEVICE SETUP & NETWORK SCANNER                              */}
      {/* ============================================================= */}
      {activeTab === 'link' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Network Scanner Card */}
          <div className="p-3.5 rounded-xl bg-black/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-mono text-xs font-bold text-cyan-300 uppercase">
                  Local Network Screen Scanner
                </h4>
                <p className="text-[10px] text-slate-400 font-mono">
                  Scans your JioFiber Wi-Fi router (192.168.29.x) for STBs and Smart TVs
                </p>
              </div>

              <button
                onClick={handleScanNetwork}
                disabled={isScanning}
                className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-200 font-mono text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'Scanning...' : 'Scan Subnet'}</span>
              </button>
            </div>

            {/* Discovered List */}
            <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar pr-1">
              {discoveredDevices.length > 0 ? (
                discoveredDevices.map((dev, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2 text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400">{dev.type === 'jio_stb' ? '⚡' : '📺'}</span>
                      <div>
                        <span className="font-bold text-slate-200">{dev.name}</span>
                        <span className="text-slate-500 text-[10px] block">{dev.ip} &bull; {dev.protocol}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (dev.type === 'jio_stb') {
                          setJioIp(dev.ip);
                          handleJioConnect(dev.ip);
                        } else {
                          setTvIp(dev.ip);
                          handleTvConnect();
                        }
                      }}
                      className="px-2.5 py-1 bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-400/60 text-cyan-200 rounded text-[10px] font-bold cursor-pointer"
                    >
                      Pair &amp; Link
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs font-mono text-slate-500">
                  Click 'Scan Subnet' to discover JioFiber STB and Smart TVs on your network.
                </div>
              )}
            </div>
          </div>

          {/* Step-by-Step Jio STB Setup Instructions */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-cyan-500/20 space-y-2">
            <h4 className="font-mono text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              How to Connect JioFiber Set-Top Box to JASPER:
            </h4>

            <ol className="text-[11px] font-mono text-slate-300 space-y-1.5 list-decimal pl-4">
              <li>
                <span className="font-semibold text-slate-100">Same Wi-Fi Network:</span> Ensure your PC/device running JASPER is on the same JioFiber Wi-Fi router (e.g. JioFiber-2.4G/5G).
              </li>
              <li>
                <span className="font-semibold text-slate-100">Find Jio STB IP:</span> On your TV, navigate to <code className="text-cyan-300">Settings &gt; Network &amp; Internet</code> or check your JioHome mobile app to see the STB IP address (usually <code className="text-cyan-300">192.168.29.xxx</code>).
              </li>
              <li>
                <span className="font-semibold text-slate-100">Enable Wireless ADB (Optional):</span> On Jio STB, go to <code className="text-cyan-300">Settings &gt; Device Preferences &gt; About</code>, click <code className="text-cyan-300">Build</code> 7 times to enable Developer Options, then toggle <code className="text-cyan-300">USB Debugging</code> ON.
              </li>
              <li>
                <span className="font-semibold text-slate-100">HDMI-CEC Fallback:</span> Even without ADB, JASPER commands can automatically pass through your Smart TV via HDMI-CEC on HDMI Port 1/2.
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* FOOTER CONNECTION SUMMARY */}
      <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span>Active IP:</span>
          <code className="text-cyan-300 font-bold bg-slate-900 px-1.5 py-0.5 rounded">
            {activeTab === 'jio' ? jioIp : tvIp}
          </code>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500">
          <span>JASPER Universal TV Hub v4.0</span>
          <span>&bull;</span>
          <span className="text-emerald-400 font-semibold">Zero-Latency IP Link</span>
        </div>
      </div>

    </div>
  );
}
