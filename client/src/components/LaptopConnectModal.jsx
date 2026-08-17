import React, { useState, useEffect } from 'react';
import { 
  Laptop, 
  Wifi, 
  Radio, 
  Terminal, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Power, 
  Volume2, 
  VolumeX, 
  Lock, 
  Monitor, 
  Cpu, 
  X, 
  Send, 
  Globe, 
  Shield, 
  Smartphone, 
  Sparkles,
  Link,
  Sliders,
  Server
} from 'lucide-react';
import { getServerIp, setServerIp, getApiBase } from '../utils/apiConfig.js';
import { getPhoneBrainMode, setPhoneBrainMode } from '../utils/mobileBrain.js';

export default function LaptopConnectModal({ onClose, onLog }) {
  const [ip, setIpInput] = useState(() => getServerIp());
  const [status, setStatus] = useState('checking'); // 'connected', 'disconnected', 'checking'
  const [pingMs, setPingMs] = useState(null);
  const [logText, setLogText] = useState('');
  const [remoteCommand, setRemoteCommand] = useState('');
  const [pairingIpPort, setPairingIpPort] = useState('192.168.29.159:5555');
  const [pairingCode, setPairingCode] = useState('');
  const [isPairing, setIsPairing] = useState(false);
  const [pcStats, setPcStats] = useState(null);
  const [isPhoneCore, setIsPhoneCore] = useState(() => getPhoneBrainMode());

  const apiBase = getApiBase();

  useEffect(() => {
    testConnection();
  }, [ip]);

  const addLog = (msg) => {
    setLogText(prev => `[${new Date().toLocaleTimeString()}] ${msg}\n` + prev);
    if (onLog) onLog(msg, 'info');
  };

  const testConnection = async () => {
    setStatus('checking');
    const start = Date.now();
    try {
      const res = await fetch(`${apiBase}/api/phone/status`, { signal: AbortSignal.timeout(4000) });
      const elapsed = Date.now() - start;
      if (res.ok) {
        const data = await res.json();
        setStatus('connected');
        setPingMs(elapsed);
        setPcStats(data);
        addLog(`Connected to Laptop Server at ${ip} (${elapsed}ms latency)`);
      } else {
        setStatus('disconnected');
        setPingMs(null);
        addLog(`Laptop server responded with HTTP status ${res.status}`);
      }
    } catch (e) {
      // Fallback try simple server endpoint
      try {
        const res2 = await fetch(`${apiBase}/`, { signal: AbortSignal.timeout(3000) });
        const elapsed2 = Date.now() - start;
        if (res2.ok || res2.status < 500) {
          setStatus('connected');
          setPingMs(elapsed2);
          addLog(`Laptop server accessible at ${ip} (${elapsed2}ms)`);
          return;
        }
      } catch (err2) {
        // Ignored fallback failure
      }
      setStatus('disconnected');
      setPingMs(null);
      addLog(`Failed to connect to Laptop at ${ip}. Ensure server is running (npm run server).`);
    }
  };

  const handleSaveIp = () => {
    setServerIp(ip);
    addLog(`Updated Laptop Server IP to: ${ip}`);
    testConnection();
  };

  const handleToggleCore = (enablePhone) => {
    setPhoneBrainMode(enablePhone);
    setIsPhoneCore(enablePhone);
    addLog(enablePhone ? 'Mobile Core assigned as Master Brain.' : 'Core transferred to Laptop PC Server.');
  };

  const sendLaptopCommand = async (cmdType, extraData = {}) => {
    addLog(`Sending remote command to Laptop: ${cmdType}`);
    try {
      const res = await fetch(`${apiBase}/api/pc/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: cmdType, ...extraData })
      });
      if (res.ok) {
        const data = await res.json();
        addLog(`Laptop executed: ${cmdType} -> ${data.message || 'Success'}`);
      } else {
        // Fallback endpoint
        const res2 = await fetch(`${apiBase}/api/phone/command`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: cmdType, ...extraData })
        });
        if (res2.ok) {
          addLog(`Laptop executed command: ${cmdType}`);
        } else {
          addLog(`Laptop server command failed: HTTP ${res.status}`);
        }
      }
    } catch (e) {
      addLog(`Error contacting laptop backend: ${e.message}`);
    }
  };

  const handlePairAdb = async (e) => {
    e.preventDefault();
    if (!pairingIpPort || !pairingCode) {
      addLog('Please enter Laptop IP:Port and Pairing Code.');
      return;
    }
    setIsPairing(true);
    addLog(`Initiating Wireless ADB Pairing with ${pairingIpPort}...`);
    try {
      const res = await fetch(`${apiBase}/api/phone/pair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: pairingIpPort, code: pairingCode })
      });
      const data = await res.json();
      if (res.ok) {
        addLog(`Pairing success: ${data.message || 'Paired successfully!'}`);
      } else {
        addLog(`Pairing failed: ${data.error || 'Check IP and pairing code'}`);
      }
    } catch (err) {
      addLog(`Pairing error: ${err.message}`);
    } finally {
      setIsPairing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-xl overflow-y-auto animate-in fade-in zoom-in duration-200">
      <div className="bg-slate-950/95 border border-cyan-500/40 rounded-2xl max-w-lg w-full p-4 sm:p-6 text-cyan-100 font-mono shadow-[0_0_50px_rgba(0,240,255,0.2)] relative flex flex-col gap-4 max-h-[92vh] overflow-y-auto my-auto">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Laptop className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="font-orbitron font-extrabold text-sm sm:text-base text-cyan-400 tracking-wider uppercase glow-cyan">
                CONNECT TO LAPTOP MODE
              </h2>
              <p className="text-[10px] text-sky-500 font-mono">Mobile-to-Laptop Wireless Neural Core Sync</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 border border-cyan-500/20 text-slate-400 hover:text-cyan-400 hover:border-cyan-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Indicator Card */}
        <div className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
          status === 'connected' 
            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' 
            : status === 'checking'
            ? 'bg-amber-950/30 border-amber-500/40 text-amber-300 animate-pulse'
            : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              status === 'connected' ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : status === 'checking' ? 'bg-amber-400' : 'bg-rose-500 shadow-[0_0_10px_#f43f5e]'
            }`} />
            <div>
              <div className="text-xs font-orbitron font-bold tracking-wider uppercase">
                {status === 'connected' ? 'LAPTOP ONLINE & SYNCED' : status === 'checking' ? 'PINGING LAPTOP SERVER...' : 'LAPTOP DISCONNECTED'}
              </div>
              <div className="text-[10px] font-mono opacity-80">
                {status === 'connected' ? `IP: ${ip} • Ping: ${pingMs}ms` : `Target Host: ${ip}`}
              </div>
            </div>
          </div>

          <button 
            onClick={testConnection} 
            className="p-2 rounded-lg bg-black/40 border border-current hover:opacity-80 transition-opacity"
            title="Refresh Laptop Connection"
          >
            <RefreshCw className={`w-4 h-4 ${status === 'checking' ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* AI Neural Core Master Selector */}
        <div className="p-3 bg-cyan-950/20 border border-cyan-500/30 rounded-xl flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-orbitron font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" /> MASTER AI CORE ASSIGNMENT
            </span>
            <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold">
              {isPhoneCore ? '📱 MOBILE CORE ACTIVE' : '🧠 LAPTOP PC CORE ACTIVE'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={() => handleToggleCore(true)}
              className={`p-2.5 rounded-lg border text-center transition-all flex flex-col items-center gap-1 text-[10px] font-bold ${
                isPhoneCore 
                  ? 'bg-purple-500/20 border-purple-500/60 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.3)]' 
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-cyan-500/40'
              }`}
            >
              <Smartphone className="w-4 h-4 text-purple-400" />
              <span>📱 MOBILE core</span>
              <span className="text-[8px] font-normal opacity-70">Phone handles Voice & AI</span>
            </button>

            <button
              onClick={() => handleToggleCore(false)}
              className={`p-2.5 rounded-lg border text-center transition-all flex flex-col items-center gap-1 text-[10px] font-bold ${
                !isPhoneCore 
                  ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]' 
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-cyan-500/40'
              }`}
            >
              <Laptop className="w-4 h-4 text-cyan-400" />
              <span>🧠 LAPTOP PC CORE</span>
              <span className="text-[8px] font-normal opacity-70">Laptop handles Heavy AI</span>
            </button>
          </div>
        </div>

        {/* Laptop IP & Server Config */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-sky-400 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5"><Server className="w-3.5 h-3.5 text-cyan-400" /> Laptop Server Address / IP</span>
            <span className="text-[9px] text-slate-400 font-normal">Port 3001 Default</span>
          </label>

          <div className="flex gap-2">
            <input 
              type="text"
              value={ip}
              onChange={(e) => setIpInput(e.target.value)}
              placeholder="e.g. 192.168.29.159 or localhost"
              className="flex-1 bg-black/60 border border-cyan-500/30 rounded-xl px-3 py-2 text-xs text-cyan-200 outline-none focus:border-cyan-400 font-mono transition-all"
            />
            <button 
              onClick={handleSaveIp}
              className="px-4 py-2 bg-cyan-950 border border-cyan-500/40 hover:bg-cyan-900 hover:border-cyan-400 text-cyan-300 text-xs font-bold font-orbitron rounded-xl transition-all shadow-[0_0_10px_rgba(0,240,255,0.15)]"
            >
              SAVE & CONNECT
            </button>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap mt-1">
            <span className="text-[9px] text-slate-400">Quick Presets:</span>
            {['localhost', '192.168.29.159', '192.168.1.100'].map(preset => (
              <button
                key={preset}
                onClick={() => {
                  setIpInput(preset);
                  setServerIp(preset);
                  testConnection();
                }}
                className="text-[9px] px-2 py-0.5 rounded-md bg-slate-900 border border-cyan-500/20 text-sky-400 hover:text-cyan-300 hover:border-cyan-500/50 transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Remote Laptop Actions Grid */}
        <div className="flex flex-col gap-2 pt-1 border-t border-cyan-500/15">
          <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Remote Laptop Controls
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button 
              onClick={() => sendLaptopCommand('lock_pc')}
              className="p-2.5 rounded-xl bg-slate-900/80 border border-cyan-500/20 hover:border-cyan-400/60 hover:bg-cyan-950/40 text-cyan-300 flex flex-col items-center gap-1 text-[10px] font-bold transition-all"
            >
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>Lock Laptop</span>
            </button>

            <button 
              onClick={() => sendLaptopCommand('volume_mute')}
              className="p-2.5 rounded-xl bg-slate-900/80 border border-cyan-500/20 hover:border-cyan-400/60 hover:bg-cyan-950/40 text-cyan-300 flex flex-col items-center gap-1 text-[10px] font-bold transition-all"
            >
              <VolumeX className="w-4 h-4 text-amber-400" />
              <span>Mute Laptop</span>
            </button>

            <button 
              onClick={() => sendLaptopCommand('open_browser')}
              className="p-2.5 rounded-xl bg-slate-900/80 border border-cyan-500/20 hover:border-cyan-400/60 hover:bg-cyan-950/40 text-cyan-300 flex flex-col items-center gap-1 text-[10px] font-bold transition-all"
            >
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>Launch Browser</span>
            </button>

            <button 
              onClick={() => sendLaptopCommand('volume_up')}
              className="p-2.5 rounded-xl bg-slate-900/80 border border-cyan-500/20 hover:border-cyan-400/60 hover:bg-cyan-950/40 text-cyan-300 flex flex-col items-center gap-1 text-[10px] font-bold transition-all"
            >
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span>Volume Up</span>
            </button>

            <button 
              onClick={() => sendLaptopCommand('take_screenshot')}
              className="p-2.5 rounded-xl bg-slate-900/80 border border-cyan-500/20 hover:border-cyan-400/60 hover:bg-cyan-950/40 text-cyan-300 flex flex-col items-center gap-1 text-[10px] font-bold transition-all"
            >
              <Monitor className="w-4 h-4 text-purple-400" />
              <span>Screenshot</span>
            </button>

            <button 
              onClick={() => sendLaptopCommand('system_stats')}
              className="p-2.5 rounded-xl bg-slate-900/80 border border-cyan-500/20 hover:border-cyan-400/60 hover:bg-cyan-950/40 text-cyan-300 flex flex-col items-center gap-1 text-[10px] font-bold transition-all"
            >
              <Activity className="w-4 h-4 text-rose-400" />
              <span>Laptop Stats</span>
            </button>
          </div>
        </div>

        {/* ADB Wireless Pairing Section */}
        <form onSubmit={handlePairAdb} className="p-3 bg-black/40 border border-cyan-500/20 rounded-xl flex flex-col gap-2">
          <div className="flex items-center justify-between text-[10px] font-bold text-sky-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><Radio className="w-3.5 h-3.5 text-cyan-400" /> Wireless ADB Pair with Laptop</span>
            <span className="text-[8px] text-slate-400">Android Developer Sync</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input 
              type="text"
              value={pairingIpPort}
              onChange={(e) => setPairingIpPort(e.target.value)}
              placeholder="IP:PORT (e.g. 192.168.1.5:42931)"
              className="bg-black/60 border border-cyan-500/30 rounded-lg px-2.5 py-1.5 text-xs text-cyan-200 outline-none focus:border-cyan-400 font-mono"
            />
            <input 
              type="text"
              value={pairingCode}
              onChange={(e) => setPairingCode(e.target.value)}
              placeholder="6-digit Pairing Code"
              className="bg-black/60 border border-cyan-500/30 rounded-lg px-2.5 py-1.5 text-xs text-cyan-200 outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          <button 
            type="submit"
            disabled={isPairing}
            className="w-full py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 text-xs font-bold font-orbitron transition-all flex items-center justify-center gap-1.5"
          >
            {isPairing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Link className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{isPairing ? 'PAIRING...' : 'PAIR WIRELESS ADB'}</span>
          </button>
        </form>

        {/* Console Log */}
        {logText && (
          <div className="bg-black/80 border border-cyan-500/20 rounded-xl p-2.5 text-[9px] font-mono text-cyan-400/90 h-24 overflow-y-auto leading-relaxed select-text">
            <pre className="whitespace-pre-wrap">{logText}</pre>
          </div>
        )}

      </div>
    </div>
  );
}
