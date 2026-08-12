import React, { useState, useEffect } from 'react';
import { Power, Tv, Wifi, WifiOff, VolumeX, Volume2, ArrowLeft, Home, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { API_BASE } from '../utils/apiConfig.js';

export default function TvRemoteWidget({ onLog }) {
  const [ip, setIp] = useState('');
  const [mac, setMac] = useState('');
  const [tvStatus, setTvStatus] = useState('unconfigured'); // unconfigured, connected, disconnected, connecting
  const [hasToken, setHasToken] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Poll status on load
  useEffect(() => {
    fetchTvStatus();
    // Auto poll every 10 seconds to keep connection sync
    const interval = setInterval(fetchTvStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchTvStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/tv/status`);
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
      onLog('TV IP Address is required to initialize pairing.', 'error');
      return;
    }
    
    setTvStatus('connecting');
    onLog(`Connecting to Samsung TV at ${ip}... Accept pairing request on your TV screen!`, 'info');

    try {
      const res = await fetch(`${API_BASE}/api/tv/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, mac })
      });
      const data = await res.json();
      
      if (res.ok) {
        setTvStatus('connected');
        setHasToken(true);
        onLog(`Successfully paired with TV! Access Token: ${data.token ? 'Saved' : 'Active'}`, 'success');
      } else {
        throw new Error(data.error || 'Connection failed');
      }
    } catch (err) {
      setTvStatus('disconnected');
      onLog(`TV Connection failed: ${err.message}`, 'error');
    }
  };

  const sendKey = async (keyName) => {
    if (tvStatus === 'unconfigured') {
      onLog('Please configure the TV IP and connect first.', 'error');
      return;
    }
    console.log(`Sending TV Key: ${keyName}`);
    try {
      const res = await fetch(`${API_BASE}/api/tv/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: keyName })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send command');
      }
    } catch (err) {
      onLog(`Failed to send key ${keyName}: ${err.message}`, 'error');
    }
  };

  const handleWakeOnLan = async () => {
    if (!mac) {
      onLog('TV MAC address is required for Wake-on-LAN.', 'error');
      return;
    }
    onLog(`Sending Wake-on-LAN magic packet to TV [${mac}]...`, 'info');
    try {
      const res = await fetch(`${API_BASE}/api/tv/wol`, {
        method: 'POST'
      });
      if (res.ok) {
        onLog('Wake-on-LAN signal broadcasted successfully.', 'success');
      } else {
        const data = await res.json();
        throw new Error(data.error || 'WOL failed');
      }
    } catch (err) {
      onLog(`Wake-on-LAN failed: ${err.message}`, 'error');
    }
  };

  const toggleMute = () => {
    sendKey('KEY_MUTE');
    setIsMuted(!isMuted);
  };

  const getStatusText = () => {
    switch (tvStatus) {
      case 'connected': return 'ONLINE';
      case 'connecting': return 'PAIRING / CONNECTING';
      case 'disconnected': return 'OFFLINE / DISCONNECTED';
      default: return 'UNCONFIGURED';
    }
  };

  const getStatusColorClass = () => {
    switch (tvStatus) {
      case 'connected': return 'text-green-400 border-green-500/30';
      case 'connecting': return 'text-yellow-400 border-yellow-500/30 animate-pulse';
      case 'disconnected': return 'text-red-400 border-red-500/30';
      default: return 'text-cyan-400 border-cyan-500/30';
    }
  };

  return (
    <div className="flex flex-col h-full font-mono text-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 mb-3">
        <div className="flex items-center gap-1.5 font-orbitron font-bold text-cyan-400 tracking-wider">
          <Tv size={14} className="text-cyan-400" />
          SAMSUNG REMOTE LINK
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full animate-pulse ${
            tvStatus === 'connected' ? 'bg-green-500 glow-green' : 
            tvStatus === 'connecting' ? 'bg-yellow-500 glow-yellow' : 'bg-red-500 glow-red'
          }`} />
          <div className={`px-2 py-0.5 rounded border text-xs font-bold ${getStatusColorClass()}`}>
            {getStatusText()}
          </div>
        </div>
      </div>

      {/* Tech Diagnostics Grid */}
      <div className="grid grid-cols-3 gap-1 mb-2.5 px-2 py-1 bg-black/40 border border-cyan-500/10 rounded font-mono text-[9px] text-sky-500 select-none">
        <div>NET: <span className="text-cyan-300">SECURE_LINK</span></div>
        <div className="text-center">PORT: <span className="text-cyan-300">8002/SSL</span></div>
        <div className="text-right">PING: <span className={tvStatus === 'connected' ? 'text-green-400' : 'text-red-400'}>{tvStatus === 'connected' ? '12ms' : 'TIMEOUT'}</span></div>
      </div>

      {/* Network Configuration */}
      <div className="grid grid-cols-2 gap-2 mb-3 p-2 rounded remote-config-card">
        <div className="flex flex-col gap-0.5">
          <label className="text-xs text-sky-400 font-semibold uppercase">TV IP Address</label>
          <input
            type="text"
            placeholder="192.168.1.50"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            className="rounded px-1.5 py-0.5 outline-none remote-input"
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-xs text-sky-400 font-semibold uppercase">MAC Address (Optional)</label>
          <input
            type="text"
            placeholder="AA:BB:CC:DD:EE:FF"
            value={mac}
            onChange={(e) => setMac(e.target.value)}
            className="rounded px-1.5 py-0.5 outline-none remote-input"
          />
        </div>
        <div className="col-span-2 grid grid-cols-2 gap-2 mt-1">
          <button 
            onClick={handleWakeOnLan}
            className="btn-control btn-control-orange text-xs font-bold py-1 flex gap-1 items-center"
          >
            <Wifi size={10} />
            WAKE-ON-LAN
          </button>
          <button 
            onClick={handleConnect}
            className="btn-control text-xs font-bold py-1 flex gap-1 items-center"
          >
            <Power size={10} />
            INITIALIZE LINK
          </button>
        </div>
      </div>

      {/* Remote Control Tactile Panel */}
      <div className="flex-1 flex flex-col justify-between gap-3 p-3 rounded relative overflow-y-auto remote-body">
        
        {/* Core Controls: Power, WOL */}
        <div className="flex justify-between items-center px-4">
          <button 
            onClick={() => sendKey('KEY_POWER')} 
            className="w-10 h-10 rounded-full border border-red-500/40 bg-red-950/20 text-red-500 flex items-center justify-center hover:bg-red-500/25 hover:border-red-400 hover:shadow-[0_0_12px_rgba(239,68,68,0.4)] active:scale-95 transition-all"
            title="Toggle Power"
          >
            <Power size={16} />
          </button>
          <div className="text-xs text-sky-500 text-center select-none uppercase font-semibold">
            {hasToken ? 'TOKEN LINK ACTIVE' : 'UNAUTHORIZED'}
          </div>
          <button 
            onClick={() => sendKey('KEY_SOURCE')} 
            className="w-9 h-9 rounded flex items-center justify-center active:scale-95 transition-all remote-btn-secondary"
            title="Change Source"
          >
            <span className="text-[10px] font-bold">SOURCE</span>
          </button>
        </div>

        {/* Volume & Channel Verticals */}
        <div className="flex justify-between items-center px-2">
          {/* Volume Column */}
          <div className="flex flex-col items-center rounded-full py-1 remote-vertical-pill">
            <button 
              onClick={() => sendKey('KEY_VOLUP')} 
              className="w-8 h-8 rounded-full text-cyan-400 flex items-center justify-center active:scale-90 remote-btn-icon"
              title="Vol Up"
            >
              <ChevronUp size={16} />
            </button>
            <span className="text-xs font-bold text-sky-400 my-0.5 select-none font-orbitron">VOL</span>
            <button 
              onClick={() => sendKey('KEY_VOLDOWN')} 
              className="w-8 h-8 rounded-full text-cyan-400 flex items-center justify-center active:scale-90 remote-btn-icon"
              title="Vol Down"
            >
              <ChevronDown size={16} />
            </button>
          </div>

          {/* Mute, Home, Return Buttons */}
          <div className="flex flex-col gap-2">
            <button 
              onClick={toggleMute}
              className="w-8 h-8 rounded-full text-cyan-400 flex items-center justify-center active:scale-95 remote-btn-circle"
              title="Mute"
            >
              {isMuted ? <VolumeX size={14} className="text-red-400" /> : <Volume2 size={14} />}
            </button>
            <button 
              onClick={() => sendKey('KEY_HOME')} 
              className="w-8 h-8 rounded-full text-cyan-400 flex items-center justify-center active:scale-95 remote-btn-circle"
              title="Home Menu"
            >
              <Home size={14} />
            </button>
            <button 
              onClick={() => sendKey('KEY_RETURN')} 
              className="w-8 h-8 rounded-full text-cyan-400 flex items-center justify-center active:scale-95 remote-btn-circle"
              title="Back"
            >
              <ArrowLeft size={14} />
            </button>
          </div>

          {/* Channel Column */}
          <div className="flex flex-col items-center rounded-full py-1 remote-vertical-pill">
            <button 
              onClick={() => sendKey('KEY_CHUP')} 
              className="w-8 h-8 rounded-full text-cyan-400 flex items-center justify-center active:scale-90 remote-btn-icon"
              title="Channel Up"
            >
              <ChevronUp size={16} />
            </button>
            <span className="text-xs font-bold text-sky-400 my-0.5 select-none font-orbitron">CH</span>
            <button 
              onClick={() => sendKey('KEY_CHDOWN')} 
              className="w-8 h-8 rounded-full text-cyan-400 flex items-center justify-center active:scale-90 remote-btn-icon"
              title="Channel Down"
            >
              <ChevronDown size={16} />
            </button>
          </div>
        </div>

        {/* D-Pad Navigator */}
        <div className="flex justify-center items-center my-1 select-none">
          <div className="w-28 h-28 rounded-full dpad-ring relative flex items-center justify-center">
            {/* Center Enter button */}
            <button 
              onClick={() => sendKey('KEY_ENTER')} 
              className="w-10 h-10 rounded-full text-cyan-300 flex items-center justify-center font-bold text-xs active:scale-90 transition-all z-10 remote-btn-enter"
              title="Select / Enter"
            >
              ENTER
            </button>
            
            {/* Navigation buttons absolute placements */}
            <button 
              onClick={() => sendKey('KEY_UP')} 
              className="absolute top-1 text-cyan-400 hover:text-cyan-200 active:scale-75"
              title="Up"
            >
              <ChevronUp size={18} />
            </button>
            
            <button 
              onClick={() => sendKey('KEY_DOWN')} 
              className="absolute bottom-1 text-cyan-400 hover:text-cyan-200 active:scale-75"
              title="Down"
            >
              <ChevronDown size={18} />
            </button>

            <button 
              onClick={() => sendKey('KEY_LEFT')} 
              className="absolute left-1 text-cyan-400 hover:text-cyan-200 active:scale-75"
              title="Left"
            >
              <ChevronLeft size={18} />
            </button>

            <button 
              onClick={() => sendKey('KEY_RIGHT')} 
              className="absolute right-1 text-cyan-400 hover:text-cyan-200 active:scale-75"
              title="Right"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Quick App Launches */}
        <div className="grid grid-cols-3 gap-1 px-1 mt-1">
          <button 
            onClick={() => sendKey('KEY_NETFLIX')} 
            className="btn-control py-1 px-0 text-[10px] font-bold text-red-400 flex items-center justify-center gap-0.5 remote-app-btn remote-netflix"
          >
            <Play size={8} /> NETFLIX
          </button>
          <button 
            onClick={() => sendKey('KEY_YOUTUBE')} 
            className="btn-control py-1 px-0 text-[10px] font-bold text-red-300 flex items-center justify-center gap-0.5 remote-app-btn remote-youtube"
          >
            <Play size={8} /> YOUTUBE
          </button>
          <button 
            onClick={() => sendKey('KEY_AMAZON')} 
            className="btn-control py-1 px-0 text-[10px] font-bold text-blue-300 flex items-center justify-center gap-0.5 remote-app-btn remote-prime"
          >
            <Play size={8} /> PRIME
          </button>
        </div>

      </div>
    </div>
  );
}
