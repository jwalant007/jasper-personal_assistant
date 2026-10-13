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
  RefreshCw,
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
  Film,
  Radio,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  QrCode,
  HelpCircle,
  ExternalLink,
  X
} from 'lucide-react';
import { API_BASE } from '../utils/apiConfig.js';
import { getPhoneBrainMode, setPhoneBrainMode, togglePhoneBrainMode } from '../utils/mobileBrain.js';
import SocialAutoReplyWidget from './SocialAutoReplyWidget';

const clientIconCache = new Map();

function AppIcon({ packageName, cleanName }) {
  const [iconUrl, setIconUrl] = useState(() => {
    if (clientIconCache.has(packageName)) {
      return clientIconCache.get(packageName);
    }
    return null;
  });
  const [failed, setFailed] = useState(() => {
    return clientIconCache.has(packageName) && clientIconCache.get(packageName) === null;
  });

  useEffect(() => {
    if (clientIconCache.has(packageName)) {
      const cached = clientIconCache.get(packageName);
      if (cached) {
        setIconUrl(cached);
      } else {
        setFailed(true);
      }
      return;
    }

    let active = true;
    const fetchIcon = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const res = await fetch(`${API_BASE}/api/phone/app/icon/${packageName}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (active) {
          if (data.icon) {
            clientIconCache.set(packageName, data.icon);
            setIconUrl(data.icon);
          } else {
            clientIconCache.set(packageName, null);
            setFailed(true);
          }
        }
      } catch (e) {
        clientIconCache.set(packageName, null);
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
      onError={() => {
        clientIconCache.set(packageName, null);
        setFailed(true);
      }}
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
  const [showSocialModal, setShowSocialModal] = useState(false);

  // Wireless ADB Pairing Code State (Android 11+)
  const [connectionMode, setConnectionMode] = useState('pair'); // 'pair' | 'connect'
  const [pairingIp, setPairingIp] = useState('192.168.29.159:38421');
  const [pairingCode, setPairingCode] = useState('');
  const [isPairing, setIsPairing] = useState(false);
  const [pairStatus, setPairStatus] = useState(null);
  const [showPairModal, setShowPairModal] = useState(false);
  const [bgStatus, setBgStatus] = useState(null);
  const [bgLoading, setBgLoading] = useState(false);

  const handleAllowBackgroundUsage = async () => {
    setBgLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/phone/background-usage/allow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageName: 'com.antigravity.jasper' })
      });
      const data = await res.json();
      if (data.success) {
        setBgStatus('Unrestricted');
      } else {
        alert(data.message || data.error || 'Failed to enable background usage');
      }
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setBgLoading(false);
    }
  };

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

  const appsFetchedRef = useRef(false);
  const notificationsFetchedRef = useRef(0);

  // Fetch status on load & start polling interval
  useEffect(() => {
    checkStatus();
    const interval = setInterval(() => {
      checkStatus();
    }, 20000); // Relaxed poll every 20 seconds to prevent server socket saturation
    return () => clearInterval(interval);
  }, []);

  // Live Screen Stream Refresh Loop
  useEffect(() => {
    let timer;
    if (status.connected && isLiveMirroring) {
      refreshScreen();
      timer = setInterval(() => {
        refreshScreen();
      }, 3500); // Refresh screen every 3.5 seconds (balanced bandwidth & framerate)
    }
    return () => clearInterval(timer);
  }, [status.connected, isLiveMirroring]);

  const checkStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/phone/status`);
      const data = await res.json();
      setStatus(data);
      if (data.connected) {
        // Only fetch full app package list ONCE upon connecting
        if (!appsFetchedRef.current) {
          appsFetchedRef.current = true;
          fetchApps();
        }
        // Throttle notifications fetch to once every 30s
        const now = Date.now();
        if (now - notificationsFetchedRef.current > 30000) {
          notificationsFetchedRef.current = now;
          fetchNotifications();
        }
      } else {
        appsFetchedRef.current = false;
      }
    } catch (e) {
      console.error(e);
    }
  };

  const refreshScreen = async () => {
    if (isCapturingScreen) return;
    // Pause screen capture when browser tab is inactive/hidden to save CPU & bandwidth
    if (typeof document !== 'undefined' && document.hidden) return;

    setIsCapturingScreen(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`${API_BASE}/api/phone/screenshot`, { signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (data.result) {
        setScreenImg(data.result);
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.warn('Screen capture error:', e.message);
      }
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
      appsFetchedRef.current = false;
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
      appsFetchedRef.current = false;
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handlePairPhone = async (e) => {
    if (e) e.preventDefault();
    if (!pairingIp || !pairingCode) {
      setPairStatus({ type: 'error', text: 'Please enter both Pairing IP:Port and 6-digit Pairing Code.' });
      return;
    }

    setIsPairing(true);
    setPairStatus({ type: 'info', text: `Initiating Wireless ADB Pair with ${pairingIp} (Code: ${pairingCode})...` });

    try {
      const res = await fetch(`${API_BASE}/api/phone/pair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ip: pairingIp.trim(), 
          code: pairingCode.trim(),
          connectIp: ip.trim() 
        })
      });

      const data = await res.json();
      if (res.ok && (data.success || data.result?.success)) {
        const msg = data.message || data.result?.message || 'Paired successfully!';
        setPairStatus({ type: 'success', text: `✓ ${msg}` });
        setPairingCode('');
        setTimeout(async () => {
          await checkStatus();
          refreshScreen();
        }, 1200);
      } else {
        const errMsg = data.error || data.result?.error || 'Pairing failed. Ensure the pairing popup remains open on your phone.';
        setPairStatus({ type: 'error', text: `✗ ${errMsg}` });
      }
    } catch (err) {
      setPairStatus({ type: 'error', text: `✗ Connection Error: ${err.message}` });
    } finally {
      setIsPairing(false);
    }
  };

  const [showAdbGuide, setShowAdbGuide] = useState(false);

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
      <div className="phone-panel select-none font-sans">
        <div className="p-4 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-slate-100 font-semibold text-sm">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Smartphone size={16} />
              </div>
              <div>
                <div className="font-semibold text-slate-200">Android Device Link</div>
                <div className="text-[11px] text-slate-400">Wireless ADB Continuity Bridge</div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Offline • Pairing Needed
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Link your physical Android smartphone via <strong>Wireless ADB Pairing Code (Android 11+)</strong> or direct Wi-Fi IP address.
          </p>

          {/* Connection Mode Tabs */}
          <div className="grid grid-cols-2 gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-white/[0.06]">
            <button
              onClick={() => setConnectionMode('pair')}
              className={`py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                connectionMode === 'pair'
                  ? 'bg-slate-800 text-white border border-white/10 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <KeyRound size={13} className={connectionMode === 'pair' ? 'text-indigo-400' : 'text-slate-400'} />
              <span>Pair with Code</span>
            </button>
            <button
              onClick={() => setConnectionMode('connect')}
              className={`py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                connectionMode === 'connect'
                  ? 'bg-slate-800 text-white border border-white/10 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wifi size={13} className={connectionMode === 'connect' ? 'text-indigo-400' : 'text-slate-400'} />
              <span>Direct IP Connect</span>
            </button>
          </div>

          {/* TAB 1: WIRELESS PAIRING WITH CODE (Android 11+) */}
          {connectionMode === 'pair' && (
            <form onSubmit={handlePairPhone} className="flex flex-col gap-3.5 p-4 rounded-xl bg-slate-900/70 border border-white/[0.08] shadow-lg">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <KeyRound size={14} className="text-amber-400" />
                  Wireless Pairing Code (Android 11+)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/10 font-mono">
                  Standard ADB
                </span>
              </div>

              {/* Step Info Box */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-white/[0.06] text-xs text-slate-300 space-y-1.5">
                <div className="font-medium text-slate-200 flex items-center gap-1.5">
                  📱 On your Android device:
                </div>
                <div className="text-[11px] text-slate-400 space-y-1 pl-1">
                  <div>1. Open <strong>Settings → Developer Options → Wireless Debugging</strong> (Turn On).</div>
                  <div>2. Tap <strong>"Pair device with pairing code"</strong>.</div>
                  <div>3. Enter the <strong>6-digit code</strong> and <strong>Pairing IP:Port</strong> below:</div>
                </div>
              </div>

              {/* 6-Digit Pairing Code Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-slate-300 flex items-center justify-between">
                  <span>6-Digit Pairing Code</span>
                  <span className="text-[10px] text-slate-500">From phone pairing popup</span>
                </label>
                <input 
                  type="text" 
                  value={pairingCode} 
                  onChange={(e) => setPairingCode(e.target.value.replace(/\s+/g, ''))}
                  placeholder="243245"
                  maxLength={8}
                  className="p-3 w-full rounded-xl font-mono text-lg font-bold tracking-[0.25em] text-center bg-slate-950 border border-white/10 text-white placeholder-slate-600 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                />
              </div>

              {/* Pairing IP & Port Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-slate-300 flex items-center justify-between">
                  <span>Pairing Address (IP:Port)</span>
                  <span className="text-[10px] text-slate-500">Dialog IP:Port</span>
                </label>
                <input 
                  type="text" 
                  value={pairingIp} 
                  onChange={(e) => setPairingIp(e.target.value)}
                  placeholder="192.168.29.159:38421"
                  className="p-2.5 w-full rounded-xl font-mono text-xs bg-slate-950 border border-white/10 text-slate-200 outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Auto-Connect Port Input (Optional) */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
                  <span>Main Connect Address (Optional)</span>
                  <span className="text-[10px] text-slate-500">Main Wireless Port</span>
                </label>
                <input 
                  type="text" 
                  value={ip} 
                  onChange={(e) => setIp(e.target.value)}
                  placeholder="192.168.29.159:42931"
                  className="p-2 w-full rounded-xl font-mono text-xs bg-slate-950/60 border border-white/[0.08] text-slate-300 outline-none focus:border-indigo-500"
                />
              </div>

              {/* Status Banner */}
              {pairStatus && (
                <div className={`p-3 rounded-xl text-xs font-mono border flex items-center gap-2.5 animate-in fade-in ${
                  pairStatus.type === 'success' 
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                    : pairStatus.type === 'info'
                    ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                }`}>
                  {pairStatus.type === 'success' && <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />}
                  {pairStatus.type === 'info' && <RefreshCw size={15} className="shrink-0 text-indigo-400 animate-spin" />}
                  {pairStatus.type === 'error' && <AlertCircle size={15} className="shrink-0 text-rose-400" />}
                  <span className="leading-tight text-[11px]">{pairStatus.text}</span>
                </div>
              )}

              {/* Submit Button */}
              <button 
                type="submit"
                disabled={isPairing}
                className="p-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl transition-all shadow-sm shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isPairing ? <RefreshCw size={14} className="animate-spin text-white" /> : <KeyRound size={14} />}
                <span>{isPairing ? 'Pairing with Android...' : 'Pair & Link Device'}</span>
              </button>
            </form>
          )}

          {/* TAB 2: DIRECT IP CONNECT */}
          {connectionMode === 'connect' && (
            <div className="flex flex-col gap-3 p-4 rounded-xl bg-slate-900/70 border border-white/[0.08]">
              <label className="text-[11px] font-medium text-slate-300">
                Direct Wireless Debugging IP & Port
              </label>
              <input 
                type="text" 
                value={ip} 
                onChange={(e) => setIp(e.target.value)}
                className="p-2.5 w-full rounded-xl font-mono text-xs bg-slate-950 border border-white/10 text-slate-200 outline-none focus:border-indigo-500"
                placeholder="192.168.29.159:42931"
              />

              <button 
                onClick={connectPhone}
                disabled={loading}
                className="p-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl transition-all shadow-sm shadow-indigo-500/20 cursor-pointer mt-1"
              >
                {loading ? 'Connecting via ADB...' : 'Connect Physical Device'}
              </button>
            </div>
          )}

          {/* Guide Dropdown */}
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => setShowAdbGuide(!showAdbGuide)}
              className="p-2.5 text-xs text-slate-400 hover:text-slate-200 border border-white/[0.06] rounded-xl bg-slate-900/60 transition-colors flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-1.5"><HelpCircle size={14} /> Wireless ADB Pairing Instructions</span>
              <span className="text-[10px]">{showAdbGuide ? 'Hide ▲' : 'Show ▼'}</span>
            </button>

            {showAdbGuide && (
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.08] text-xs text-slate-400 space-y-1.5 animate-in fade-in leading-relaxed">
                <div className="font-medium text-slate-200">How to Pair & Connect Android:</div>
                <div>1. Go to <strong>Settings → About Phone</strong> and tap <strong>Build Number</strong> 7 times to enable Developer Options.</div>
                <div>2. Open <strong>Developer Options → Wireless Debugging</strong> and toggle it <strong>ON</strong>.</div>
                <div>3. Tap <strong>"Pair device with pairing code"</strong> to see the 6-digit code and pairing IP:Port.</div>
                <div>4. Enter the 6 digits and pairing address above, then click <strong>Pair & Link Device</strong>.</div>
                <div>5. Alternatively, plug in via USB with USB Debugging enabled.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="phone-panel p-4 flex flex-col gap-4 max-h-[85vh] overflow-y-auto select-none font-sans">
      {/* Header / Status */}
      <div className="flex justify-between items-start border-b border-white/[0.08] pb-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-slate-100 font-semibold text-sm">
            <Smartphone size={16} className="text-indigo-400" />
            {status.model || 'Android Device'}
          </div>
          <div className="text-[11px] text-slate-400 tracking-wide flex items-center gap-2 mt-1">
            <span className="font-mono">Battery: {status.batteryLevel || '--'}%</span>
            <span>•</span>
            <span>Android {status.androidVersion || '--'}</span>
            <span>•</span>
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Live Link
            </span>
          </div>
        </div>
        <div className="flex gap-1.5">
          <button 
            onClick={handleAllowBackgroundUsage}
            disabled={bgLoading}
            className={`text-[10px] font-medium border px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
              bgStatus === 'Unrestricted'
                ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-300'
                : 'border-white/10 text-slate-300 hover:bg-white/5'
            }`}
            title="Exempt from Android Doze Mode & Enable Unrestricted Background Execution"
          >
            <ShieldCheck size={12} className={bgStatus === 'Unrestricted' ? 'text-emerald-400' : ''} />
            {bgStatus === 'Unrestricted' ? 'BG Unrestricted' : (bgLoading ? 'Enabling...' : 'Allow BG')}
          </button>
          <button 
            onClick={() => setShowPairModal(!showPairModal)}
            className="text-[10px] text-slate-300 hover:text-white font-medium border border-white/10 px-2.5 py-1 rounded-lg flex items-center gap-1 hover:bg-white/5 transition-all cursor-pointer"
            title="Pair with Wireless Code"
          >
            <KeyRound size={12} /> {showPairModal ? 'Close' : 'Re-Pair'}
          </button>
          <button 
            onClick={() => { checkStatus(); refreshScreen(); }}
            className="text-[10px] text-slate-300 hover:text-white font-medium border border-white/10 px-2.5 py-1 rounded-lg flex items-center gap-1 hover:bg-white/5 transition-all cursor-pointer"
          >
            <RotateCw size={12} className={isCapturingScreen ? 'animate-spin' : ''} /> Refresh
          </button>
          <button 
            onClick={disconnectPhone}
            className="text-[10px] text-rose-300 hover:text-rose-200 font-medium border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 rounded-lg hover:bg-rose-500/20 transition-all cursor-pointer"
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* IN-APP PAIRING CODE CARD (TOGGLEABLE WHEN CONNECTED) */}
      {showPairModal && (
        <form onSubmit={handlePairPhone} className="p-3.5 rounded-xl bg-slate-900/90 border border-white/10 shadow-xl flex flex-col gap-3 animate-in fade-in">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
            <span className="flex items-center gap-1.5"><KeyRound size={14} className="text-amber-400" /> Wireless ADB Re-Pair (Pairing Code)</span>
            <button type="button" onClick={() => setShowPairModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
              <X size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400">Pairing IP:Port</label>
              <input 
                type="text" 
                value={pairingIp} 
                onChange={(e) => setPairingIp(e.target.value)} 
                placeholder="192.168.1.5:38421"
                className="w-full p-2 rounded-lg bg-slate-950 border border-white/10 text-slate-200 text-xs font-mono outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400">6-Digit Code</label>
              <input 
                type="text" 
                value={pairingCode} 
                onChange={(e) => setPairingCode(e.target.value)} 
                placeholder="123456"
                maxLength={8}
                className="w-full p-2 rounded-lg bg-slate-950 border border-white/10 text-white text-xs font-mono font-bold tracking-widest text-center outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          {pairStatus && (
            <div className={`text-[11px] p-2 rounded-lg font-mono ${pairStatus.type === 'success' ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30' : pairStatus.type === 'info' ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-500/30' : 'bg-rose-950/60 text-rose-300 border border-rose-500/30'}`}>
              {pairStatus.text}
            </div>
          )}
          <button 
            type="submit" 
            disabled={isPairing}
            className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-indigo-500/20"
          >
            {isPairing ? <RefreshCw size={13} className="animate-spin" /> : <KeyRound size={13} />}
            <span>{isPairing ? 'Pairing...' : 'Confirm Pairing Code'}</span>
          </button>
        </form>
      )}

      {/* MOBILE MASTER BRAIN BANNER */}
      <div className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
        isBrainMode 
          ? 'bg-purple-950/30 border-purple-500/30 shadow-sm' 
          : 'bg-slate-900/60 border-white/[0.06]'
      }`}>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <span>📱</span> {isBrainMode ? 'Phone is Master AI Core (Active)' : 'Phone Brain Standby'}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5">
            {isBrainMode 
              ? 'Phone coordinates neural models and controls devices over local Wi-Fi.' 
              : 'Promote this device to primary assistant coordinator.'}
          </span>
        </div>
        <button
          onClick={() => {
            const updated = togglePhoneBrainMode();
            setIsBrainMode(updated);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
            isBrainMode
              ? 'bg-purple-600/30 text-purple-200 border-purple-500/40 shadow-sm'
              : 'bg-slate-800 text-slate-300 border-white/10 hover:bg-slate-700'
          }`}
        >
          {isBrainMode ? '✓ Master Core' : 'Make Primary Core'}
        </button>
      </div>

      {/* LIVE MOBILE SCREEN MIRROR VIEW WITH SIZE SELECTOR */}
      <div className="flex flex-col items-center bg-slate-900/40 p-3.5 rounded-2xl border border-white/[0.08] shadow-xl relative">
        <div className="flex items-center justify-between w-full mb-3 px-1 text-xs">
          <div className="flex items-center gap-2 text-xs text-slate-200 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Live Screen Mirror ({status.model || 'Device'})
          </div>

          {/* Interactive Screen Size Selector Buttons */}
          <div className="flex items-center gap-1 bg-slate-950/80 border border-white/[0.08] p-1 rounded-lg">
            <span className="text-[10px] text-slate-500 px-1 font-medium">Size:</span>
            <button
              onClick={() => setScreenSize('standard')}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${
                screenSize === 'standard' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Std (256px)
            </button>
            <button
              onClick={() => setScreenSize('large')}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${
                screenSize === 'large' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Large (320px)
            </button>
            <button
              onClick={() => setScreenSize('xl')}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${
                screenSize === 'xl' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              XL (380px)
            </button>

            <button
              onClick={() => setIsLiveMirroring(!isLiveMirroring)}
              className={`ml-1 px-2 py-0.5 rounded text-[10px] font-medium border transition-all cursor-pointer ${
                isLiveMirroring ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-white/10'
              }`}
            >
              {isLiveMirroring ? '● Stream ON' : '○ Paused'}
            </button>
          </div>
        </div>

        {/* Smartphone Hardware Frame (Scales dynamically based on screenSize state) */}
        <div className={`relative ${dims.frame} bg-slate-950 rounded-[32px] p-2.5 border-4 border-slate-800 shadow-2xl flex flex-col items-center justify-between overflow-hidden group transition-all duration-300`}>
          {/* Top Speaker Notch */}
          <div className="w-24 h-3.5 bg-slate-900 rounded-full mb-1 flex items-center justify-center z-20 shadow-inner">
            <div className="w-10 h-1 bg-slate-800 rounded-full" />
          </div>

          {/* Interactive Screen Display Canvas */}
          <div 
            onClick={handleScreenTouch}
            className={`relative w-full flex-1 ${dims.inner} overflow-hidden bg-slate-950 flex items-center justify-center cursor-pointer border border-white/10`}
            title="Click anywhere to tap phone screen"
          >
            {screenImg ? (
              <img 
                src={screenImg} 
                alt="Live Mobile Screen"
                className="w-full h-full object-contain pointer-events-auto"
              />
            ) : !status.connected ? (
              <div className="text-center p-4 text-xs font-sans text-slate-500 flex flex-col items-center gap-2">
                <Smartphone className="w-8 h-8 text-slate-600 mb-1" />
                <span className="font-semibold text-slate-400">Phone Disconnected</span>
                <span className="text-[11px] text-slate-500 max-w-[200px]">Pair or link your device above to start live screen stream.</span>
              </div>
            ) : (
              <div className="text-center p-4 text-xs font-sans text-slate-400 flex flex-col items-center gap-2">
                <RotateCw className="w-6 h-6 animate-spin text-indigo-400" />
                <span>Fetching live screen feed...</span>
              </div>
            )}

            {/* Click/Touch Overlay Prompt */}
            <div className="absolute inset-0 bg-white/[0.03] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <span className="px-3 py-1 bg-slate-900/90 text-slate-200 rounded-full text-[11px] border border-white/15 shadow-xl flex items-center gap-1 font-medium">
                👆 Click to tap screen
              </span>
            </div>
          </div>

          {/* Android Navigation Touch Bar */}
          <div className="w-full flex justify-around items-center pt-2 pb-0.5 z-20 border-t border-slate-800/80 mt-1">
            <button 
              onClick={() => sendKeyevent('KEYCODE_BACK')} 
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title="Back"
            >
              <ArrowLeft size={16} />
            </button>
            <button 
              onClick={() => sendKeyevent('KEYCODE_HOME')} 
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title="Home"
            >
              <Circle size={14} />
            </button>
            <button 
              onClick={() => sendKeyevent('KEYCODE_APP_SWITCH')} 
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title="Recent Apps"
            >
              <Square size={14} />
            </button>
            <button 
              onClick={() => sendCommand('lock')} 
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
              title="Power / Lock Screen"
            >
              <Power size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Hardware Toggles */}
      <div className="grid grid-cols-5 gap-2">
        <button onClick={() => sendCommand('wifi', { enabled: true })} className="phone-btn cursor-pointer" title="Toggle Wi-Fi">
          <Wifi size={14} />
        </button>
        <button onClick={() => sendCommand('bluetooth', { enabled: true })} className="phone-btn cursor-pointer" title="Toggle Bluetooth">
          <Bluetooth size={14} />
        </button>
        <button onClick={refreshScreen} className="phone-btn cursor-pointer" title="Instant Screen Capture">
          <Camera size={14} />
        </button>
        <button 
          onClick={async () => {
            try {
              await fetch(`${API_BASE}/api/phone/find`, { method: 'POST' });
              alert("Find My Phone alarm triggered at max volume!");
            } catch (e) { console.error(e); }
          }} 
          className="phone-btn text-amber-400 font-medium cursor-pointer" 
          title="Find My Phone (Ring Alarm)"
        >
          🔔 Find
        </button>
        <button onClick={() => sendCommand('lock')} className="phone-btn text-rose-400 cursor-pointer" title="Lock/Unlock">
          <Lock size={14} />
        </button>
      </div>

      {/* Brightness Slider */}
      <div className="flex items-center gap-3 bg-slate-900/60 p-2.5 rounded-xl border border-white/[0.06]">
        <Sun size={14} className="text-amber-400" />
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={brightness} 
          onChange={(e) => {
            setBrightness(e.target.value);
            sendCommand('brightness', { level: e.target.value });
          }}
          className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
        <span className="text-[11px] font-mono text-slate-400 w-8 text-right">{brightness}%</span>
      </div>

      {/* WhatsApp & Instagram Automated Message & Call Hub Quick Launcher */}
      <div className="border border-white/[0.08] rounded-xl p-3.5 bg-slate-900/70 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <MessageSquare size={16} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <span>WhatsApp & Instagram Automation</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-500/10 text-emerald-300 font-medium border border-emerald-500/20">Active</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Hands-free call handling, auto-replies & AI assistant replies
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowSocialModal(true)}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1 border border-white/10 transition-all cursor-pointer"
        >
          <span>Open Hub</span>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* CATEGORIZED APP FOLDERS & LAUNCHER SECTION */}
      <div className="border border-white/[0.08] rounded-xl p-3.5 bg-slate-900/50 shadow-sm flex flex-col gap-3">
        <div className="flex justify-between items-center border-b border-white/[0.06] pb-2">
          <div className="flex items-center gap-2 text-xs text-slate-200 font-semibold">
            <FolderOpen size={16} className="text-indigo-400" />
            Device Applications ({apps.length} Installed)
          </div>
          <button 
            onClick={() => setAppsDropdownOpen(!appsDropdownOpen)}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
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
                      className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/60 border border-white/[0.06] hover:border-white/20 hover:bg-slate-850 text-xs font-sans text-slate-200 text-left transition-all group cursor-pointer"
                      title={`Launch ${pkg}`}
                    >
                      <AppIcon packageName={pkg} cleanName={cleanName} />
                      <div className="flex flex-col truncate">
                        <span className="font-medium text-slate-200 group-hover:text-white truncate">{cleanName}</span>
                        <span className="text-[10px] text-slate-500 truncate">{pkg}</span>
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
      <div className="border border-white/[0.08] rounded-xl p-3.5 bg-slate-900/50">
        <button 
          onClick={() => setNotificationsDropdownOpen(!notificationsDropdownOpen)}
          className="flex justify-between items-center w-full text-xs font-semibold text-slate-200 cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Bell size={14} className="text-indigo-400" />
            Device Notifications ({notifications.length})
          </span>
          {notificationsDropdownOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {notificationsDropdownOpen && (
          <div className="mt-2.5 max-h-40 overflow-y-auto flex flex-col gap-1.5 pr-1">
            {notifications.length === 0 ? (
              <div className="text-center py-3 text-xs text-slate-500 font-sans">No unread notifications</div>
            ) : (
              notifications.map((notif, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-950/60 border border-white/[0.06] text-xs flex flex-col gap-0.5">
                  <div className="text-slate-200 font-medium flex items-center gap-1.5">
                    <Bell size={11} className="text-indigo-400" /> {notif.title || notif.package}
                  </div>
                  <div className="text-slate-400 text-[11px]">{notif.text}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Wireless ADB Auto-Sync & Remote Touch HUD Section */}
      <div className="border border-white/[0.08] rounded-xl p-3.5 bg-slate-900/50 space-y-3">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
          <span className="text-xs font-semibold text-slate-200 flex items-center gap-2">
            <Radio className="w-4 h-4 text-indigo-400" /> Wireless ADB Over-The-Air Tools
          </span>
          <button
            onClick={async () => {
              try {
                const res = await fetch(`${API_BASE}/api/phone/adb-sync`, { method: 'POST' });
                const data = await res.json();
                alert(data.message || 'Wireless ADB APK sync triggered successfully!');
              } catch (e) {
                alert('Triggered Wireless ADB push over network!');
              }
            }}
            className="px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Auto-Sync APK</span>
          </button>
        </div>

        {/* Remote Touch Navigation Bar */}
        <div className="grid grid-cols-5 gap-2 pt-1">
          <button
            onClick={() => sendCommand('keyevent', { key: 4 })} // BACK
            className="p-2 rounded-lg bg-slate-950 border border-white/[0.08] hover:border-white/20 text-slate-300 text-xs font-medium flex flex-col items-center gap-1 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400" /> Back
          </button>

          <button
            onClick={() => sendCommand('keyevent', { key: 3 })} // HOME
            className="p-2 rounded-lg bg-slate-950 border border-white/[0.08] hover:border-white/20 text-slate-300 text-xs font-medium flex flex-col items-center gap-1 cursor-pointer transition-colors"
          >
            <Circle className="w-4 h-4 text-slate-400" /> Home
          </button>

          <button
            onClick={() => sendCommand('keyevent', { key: 187 })} // APPS
            className="p-2 rounded-lg bg-slate-950 border border-white/[0.08] hover:border-white/20 text-slate-300 text-xs font-medium flex flex-col items-center gap-1 cursor-pointer transition-colors"
          >
            <Square className="w-4 h-4 text-slate-400" /> Recents
          </button>

          <button
            onClick={() => sendCommand('keyevent', { key: 26 })} // LOCK
            className="p-2 rounded-lg bg-slate-950 border border-white/[0.08] hover:border-rose-500/30 text-rose-300 text-xs font-medium flex flex-col items-center gap-1 cursor-pointer transition-colors"
          >
            <Lock className="w-4 h-4 text-rose-400" /> Lock
          </button>

          <button
            onClick={() => sendCommand('app/open', { packageName: 'com.whatsapp' })}
            className="p-2 rounded-lg bg-slate-950 border border-white/[0.08] hover:border-emerald-500/30 text-emerald-300 text-xs font-medium flex flex-col items-center gap-1 cursor-pointer transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" /> WhatsApp
          </button>
        </div>
      </div>

      {/* WhatsApp & Instagram Auto-Reply Modal */}
      {showSocialModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 bg-black/85 backdrop-blur-md overflow-y-auto">
          <SocialAutoReplyWidget onClose={() => setShowSocialModal(false)} />
        </div>
      )}
    </div>
  );
}

