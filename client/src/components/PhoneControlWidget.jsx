import React, { useState, useEffect } from 'react';
import { Smartphone, Wifi, Bluetooth, Sun, Camera, PhoneCall, MessageSquare, Lock, Settings, ChevronRight, Play, Pause, SkipForward, SkipBack, ChevronDown, ChevronUp, Bell, Search } from 'lucide-react';
import { API_BASE } from '../utils/apiConfig.js';

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
      <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 text-cyan-300 select-none">
        {firstChar}
      </div>
    );
  }

  return (
    <img
      src={iconUrl}
      alt={cleanName}
      className="w-6 h-6 rounded object-cover border border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.2)]"
      onError={() => setFailed(true)}
    />
  );
}

export default function PhoneControlWidget() {
  const [status, setStatus] = useState({ connected: false });
  const [ip, setIp] = useState('192.168.1.');
  const [loading, setLoading] = useState(false);
  const [brightness, setBrightness] = useState(50);
  const [notifications, setNotifications] = useState([]);
  const [apps, setApps] = useState([]);
  const [appsDropdownOpen, setAppsDropdownOpen] = useState(false);
  const [notificationsDropdownOpen, setNotificationsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredApps = apps.filter(app => {
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

  const connectPhone = async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE}/api/phone/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip })
      });
      await checkStatus();
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
    } catch (e) {
      console.error(e);
    }
  };

  const takeScreenshot = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/phone/screenshot`);
      const data = await res.json();
      if (data.result) {
        // Open screenshot in a new tab
        const win = window.open();
        win.document.write(`<img src="${data.result}" style="max-width: 100%;" />`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!status.connected) {
    return (
      <div className="phone-panel">
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-cyan-400 font-orbitron font-bold">
            <Smartphone size={16} />
            PHONE UPLINK
          </div>
          <div className="text-xs font-mono text-cyan-100/60">
            Connect to Android device via ADB Wi-Fi. Ensure USB Debugging is on and device is authorized.
          </div>
          <input 
            type="text" 
            value={ip} 
            onChange={(e) => setIp(e.target.value)}
            className="remote-input p-2 w-full rounded"
            placeholder="IP Address (e.g. 192.168.1.100)"
          />
          <button 
            onClick={connectPhone}
            disabled={loading}
            className="btn-control p-2 text-xs font-bold text-cyan-400 border-cyan-500/40 bg-cyan-950/20"
          >
            {loading ? 'CONNECTING...' : 'CONNECT'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="phone-panel p-4 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
      {/* Header / Status */}
      <div className="flex justify-between items-start border-b border-cyan-500/20 pb-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-cyan-400 font-orbitron font-bold text-sm">
            <Smartphone size={16} />
            {status.model || 'ANDROID DEVICE'}
          </div>
          <div className="text-[9px] font-mono text-sky-500 tracking-wider">
            BATT: {status.batteryLevel}% | OS: {status.androidVersion}
          </div>
        </div>
        <div className="flex gap-1.5">
          <button 
            onClick={checkStatus}
            className="text-[9px] text-cyan-400 hover:text-cyan-300 font-mono border border-cyan-500/30 px-2 py-1 rounded"
          >
            REFRESH
          </button>
          <button 
            onClick={disconnectPhone}
            className="text-[9px] text-red-400 hover:text-red-300 font-mono border border-red-500/30 px-2 py-1 rounded"
          >
            DISCONNECT
          </button>
        </div>
      </div>

      {/* Quick Toggles */}
      <div className="grid grid-cols-5 gap-2">
        <button onClick={() => sendCommand('wifi', { enabled: true })} className="phone-btn" title="Toggle Wi-Fi">
          <Wifi size={14} />
        </button>
        <button onClick={() => sendCommand('bluetooth', { enabled: true })} className="phone-btn" title="Toggle Bluetooth">
          <Bluetooth size={14} />
        </button>
        <button onClick={takeScreenshot} className="phone-btn" title="Take Screenshot / Screen Mirror">
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
          min="0" max="100" 
          value={brightness}
          onChange={(e) => {
            setBrightness(e.target.value);
            sendCommand('brightness', { level: parseInt(e.target.value) });
          }}
          className="w-full accent-cyan-400 h-1 bg-cyan-950 rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-[10px] font-mono text-cyan-300 w-8 text-right">{brightness}%</span>
      </div>

      {/* Communication */}
      <div className="grid grid-cols-3 gap-2">
        <button 
          onClick={() => {
            const num = prompt("Enter number:");
            if (num) sendCommand('call', { number: num });
          }}
          className="phone-btn-wide bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20"
        >
          <PhoneCall size={14} /> Call
        </button>
        <button 
          onClick={() => {
            const num = prompt("Enter number:");
            const msg = prompt("Enter message:");
            if (num && msg) sendCommand('sms', { number: num, message: msg });
          }}
          className="phone-btn-wide bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20"
        >
          <MessageSquare size={14} /> SMS
        </button>
        <button 
          onClick={async () => {
            const num = prompt("Enter WhatsApp number (with country code):");
            const msg = prompt("Enter WhatsApp reply message:");
            if (num && msg) {
              await fetch(`${API_BASE}/api/phone/whatsapp/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ number: num, message: msg })
              });
            }
          }}
          className="phone-btn-wide bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
        >
          💬 WhatsApp
        </button>
      </div>

      {/* Media Controls */}
      <div className="flex justify-between items-center bg-cyan-950/20 p-2 rounded border border-cyan-500/10">
        <button onClick={() => sendCommand('media', { action: 'prev' })} className="text-cyan-400 hover:text-cyan-200">
          <SkipBack size={16} />
        </button>
        <button onClick={() => sendCommand('media', { action: 'playpause' })} className="text-cyan-400 hover:text-cyan-200 p-2 bg-cyan-500/20 rounded-full">
          <Play size={16} className="hidden" /> {/* Optional logic to swap icon */}
          <Pause size={16} />
        </button>
        <button onClick={() => sendCommand('media', { action: 'next' })} className="text-cyan-400 hover:text-cyan-200">
          <SkipForward size={16} />
        </button>
      </div>

      {/* Notifications Dropdown */}
      <div className="flex flex-col gap-1.5 mt-2 border-t border-cyan-500/10 pt-3 relative">
        <div className="flex justify-between items-center text-[10px] font-orbitron text-cyan-400 font-bold mb-1">
          <span>SYSTEM NOTIFICATIONS</span>
          <button onClick={fetchNotifications} className="text-sky-500 hover:text-cyan-300 font-mono text-[9px]">REFRESH</button>
        </div>

        <div className="relative">
          <button 
            type="button"
            onClick={() => setNotificationsDropdownOpen(!notificationsDropdownOpen)}
            className="w-full bg-cyan-950/20 border border-cyan-500/20 hover:border-cyan-500/40 rounded px-3 py-2 text-left flex justify-between items-center text-xs font-mono text-cyan-200 transition-all cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Bell size={12} className={notifications.length > 0 ? "text-yellow-400 animate-pulse" : "text-cyan-400"} />
              {notifications.length === 0 ? "NO ACTIVE NOTIFICATIONS" : `${notifications.length} ACTIVE NOTIFICATIONS`}
            </span>
            {notificationsDropdownOpen ? <ChevronUp size={14} className="text-cyan-400" /> : <ChevronDown size={14} className="text-cyan-400" />}
          </button>

          {notificationsDropdownOpen && (
            <div className="absolute left-0 right-0 mt-1.5 bg-slate-950 border border-cyan-500/30 rounded shadow-[0_4px_25px_rgba(0,0,0,0.9)] z-50 max-h-60 overflow-y-auto pr-1 phone-scroll p-1 flex flex-col gap-1 animate-in fade-in slide-in-from-top-1 duration-150">
              {notifications.length === 0 ? (
                <div className="text-[10px] font-mono text-cyan-100/40 text-center py-6">
                  No active notifications
                </div>
              ) : (
                notifications.map((n, i) => {
                  const pkgName = n.package.split('.').pop();
                  const cleanAppName = pkgName ? (pkgName.charAt(0).toUpperCase() + pkgName.slice(1)) : 'App';
                  return (
                    <div key={i} className="bg-cyan-950/30 border border-cyan-500/10 p-2 rounded flex items-start gap-2.5 hover:border-cyan-500/25 transition-all group">
                      <div className="shrink-0 mt-0.5">
                        <AppIcon packageName={n.package} cleanName={cleanAppName} />
                      </div>
                      <div className="flex flex-col gap-0.5 overflow-hidden flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-mono text-sky-500 uppercase tracking-wider font-bold">
                            {cleanAppName}
                          </span>
                          <span className="text-[7px] font-mono text-sky-600/60 truncate max-w-[120px]">
                            {n.package}
                          </span>
                        </div>
                        <span className="text-[11px] font-sans font-bold text-cyan-100 group-hover:text-cyan-300 transition-colors">{n.title}</span>
                        <span className="text-[10px] font-sans text-cyan-100/70 truncate">{n.text}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Installed Apps Dropdown */}
      <div className="flex flex-col gap-1.5 mt-2 border-t border-cyan-500/10 pt-3 relative">
        <div className="flex justify-between items-center text-[10px] font-orbitron text-cyan-400 font-bold mb-1">
          <span>APPLICATIONS ({apps.length})</span>
          <button onClick={fetchApps} className="text-sky-500 hover:text-cyan-300 font-mono text-[9px]">REFRESH</button>
        </div>

        <div className="relative">
          <button 
            type="button"
            onClick={() => setAppsDropdownOpen(!appsDropdownOpen)}
            className="w-full bg-cyan-950/20 border border-cyan-500/20 hover:border-cyan-500/40 rounded px-3 py-2 text-left flex justify-between items-center text-xs font-mono text-cyan-200 transition-all cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Settings size={12} className="text-cyan-400" />
              SELECT APPLICATION...
            </span>
            {appsDropdownOpen ? <ChevronUp size={14} className="text-cyan-400" /> : <ChevronDown size={14} className="text-cyan-400" />}
          </button>

          {appsDropdownOpen && (
            <div className="absolute left-0 right-0 mt-1.5 bg-slate-950 border border-cyan-500/30 rounded shadow-[0_4px_25px_rgba(0,0,0,0.9)] z-50 max-h-60 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-1 duration-150">
              {/* Search Bar */}
              <div className="p-2 border-b border-cyan-500/15 bg-black/40 flex items-center gap-1.5">
                <Search size={11} className="text-cyan-500" />
                <input 
                  type="text"
                  placeholder="Search app..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-[11px] font-mono text-cyan-200 outline-none w-full placeholder-cyan-800"
                />
              </div>

              {/* Apps List */}
              <div className="flex-1 overflow-y-auto pr-1 phone-scroll p-1 flex flex-col gap-0.5 max-h-48">
                {filteredApps.length === 0 ? (
                  <div className="text-[10px] font-mono text-cyan-100/40 text-center py-4">
                    No matching applications
                  </div>
                ) : (
                  filteredApps.map((app, i) => {
                    const parts = app.split('.');
                    let cleanName = parts[parts.length - 1];
                    if (cleanName.toLowerCase() === 'android') {
                      cleanName = parts[parts.length - 2] || cleanName;
                    }
                    cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
                    
                    return (
                      <button 
                        key={i} 
                        onClick={() => {
                          sendCommand('app/open', { packageName: app });
                          setAppsDropdownOpen(false);
                          setSearchQuery('');
                        }}
                        className="w-full hover:bg-cyan-500/10 active:bg-cyan-500/20 rounded p-1.5 text-left flex items-center gap-3 transition-all cursor-pointer border border-transparent hover:border-cyan-500/20 group"
                        title={`Launch ${app} on Phone`}
                      >
                        <AppIcon packageName={app} cleanName={cleanName} />
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-[11px] font-sans font-bold text-cyan-100 group-hover:text-cyan-400 transition-colors truncate">
                            {cleanName}
                          </span>
                          <span className="text-[8px] font-mono text-sky-600/70 truncate">
                            {app}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
