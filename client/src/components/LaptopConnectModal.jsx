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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xl overflow-y-auto animate-in fade-in duration-200 font-sans">
      <div className="bg-slate-900/95 border border-white/[0.08] rounded-2xl max-w-lg w-full p-5 text-slate-100 shadow-2xl relative flex flex-col gap-4 max-h-[92vh] overflow-y-auto my-auto">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-sm sm:text-base text-slate-100 tracking-wide">
                Laptop Server Link
              </h2>
              <p className="text-[11px] text-slate-400">Local Wi-Fi Host & Device Synchronization</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Indicator Card */}
        <div className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
          status === 'connected' 
            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' 
            : status === 'checking'
            ? 'bg-amber-950/30 border-amber-500/30 text-amber-300 animate-pulse'
            : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${
              status === 'connected' ? 'bg-emerald-400' : status === 'checking' ? 'bg-amber-400' : 'bg-rose-500'
            }`} />
            <div>
              <div className="text-xs font-semibold">
                {status === 'connected' ? 'Laptop Online & Connected' : status === 'checking' ? 'Pinging Laptop Host...' : 'Laptop Disconnected'}
              </div>
              <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                {status === 'connected' ? `Host: ${ip} • Latency: ${pingMs}ms` : `Target: ${ip}`}
              </div>
            </div>
          </div>

          <button 
            onClick={testConnection} 
            className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Refresh Laptop Connection"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${status === 'checking' ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* AI Neural Core Master Selector */}
        <div className="p-3.5 bg-slate-950/60 border border-white/[0.08] rounded-xl flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" /> Primary AI Coordinator
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-white/10 text-slate-300 font-medium">
              {isPhoneCore ? '📱 Mobile Core Active' : '🧠 Laptop Core Active'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={() => handleToggleCore(true)}
              className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 text-xs font-medium cursor-pointer ${
                isPhoneCore 
                  ? 'bg-purple-950/40 border-purple-500/40 text-purple-200 shadow-sm' 
                  : 'bg-slate-900 border-white/[0.06] text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-4 h-4 text-purple-400" />
              <span>Mobile Phone Core</span>
              <span className="text-[10px] text-slate-500">Device handles voice & telemetry</span>
            </button>

            <button
              onClick={() => handleToggleCore(false)}
              className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 text-xs font-medium cursor-pointer ${
                !isPhoneCore 
                  ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200 shadow-sm' 
                  : 'bg-slate-900 border-white/[0.06] text-slate-400 hover:text-slate-200'
              }`}
            >
              <Laptop className="w-4 h-4 text-indigo-400" />
              <span>Laptop PC Core</span>
              <span className="text-[10px] text-slate-500">Laptop handles heavy AI workloads</span>
            </button>
          </div>
        </div>

        {/* Laptop IP & Server Config */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5"><Server className="w-3.5 h-3.5 text-slate-400" /> Laptop Server Host Address</span>
            <span className="text-[10px] text-slate-500">Port 3001</span>
          </label>

          <div className="flex gap-2">
            <input 
              type="text"
              value={ip}
              onChange={(e) => setIpInput(e.target.value)}
              placeholder="192.168.29.159 or localhost"
              className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-indigo-500 font-mono transition-all"
            />
            <button 
              onClick={handleSaveIp}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl transition-all shadow-sm shadow-indigo-500/20 cursor-pointer"
            >
              Save & Link
            </button>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap mt-1">
            <span className="text-[10px] text-slate-500">Presets:</span>
            <button
              onClick={() => {
                const cloudHost = 'jasper-personal-assistant.onrender.com';
                setIpInput(cloudHost);
                setServerIp(cloudHost);
                testConnection();
              }}
              className="text-[10px] px-2.5 py-0.5 rounded-lg bg-slate-950 border border-purple-500/30 text-purple-300 hover:text-white transition-all font-medium cursor-pointer"
            >
              ☁️ Cloud (24/7)
            </button>
            {['localhost', '192.168.29.159'].map(preset => (
              <button
                key={preset}
                onClick={() => {
                  setIpInput(preset);
                  setServerIp(preset);
                  testConnection();
                }}
                className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-950 border border-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {preset === 'localhost' ? '💻 localhost' : `📶 LAN (${preset})`}
              </button>
            ))}
          </div>
        </div>

        {/* Remote Laptop Actions Grid */}
        <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.08]">
          <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-slate-400" /> Remote Actions
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button 
              onClick={() => sendLaptopCommand('lock_pc')}
              className="p-2.5 rounded-xl bg-slate-950/80 border border-white/[0.06] hover:border-white/20 text-slate-300 hover:text-white flex flex-col items-center gap-1 text-xs font-medium transition-all cursor-pointer"
            >
              <Lock className="w-4 h-4 text-slate-400" />
              <span>Lock Laptop</span>
            </button>

            <button 
              onClick={() => sendLaptopCommand('volume_mute')}
              className="p-2.5 rounded-xl bg-slate-950/80 border border-white/[0.06] hover:border-white/20 text-slate-300 hover:text-white flex flex-col items-center gap-1 text-xs font-medium transition-all cursor-pointer"
            >
              <VolumeX className="w-4 h-4 text-amber-400" />
              <span>Mute Volume</span>
            </button>

            <button 
              onClick={() => sendLaptopCommand('open_browser')}
              className="p-2.5 rounded-xl bg-slate-950/80 border border-white/[0.06] hover:border-white/20 text-slate-300 hover:text-white flex flex-col items-center gap-1 text-xs font-medium transition-all cursor-pointer"
            >
              <Globe className="w-4 h-4 text-indigo-400" />
              <span>Launch Web</span>
            </button>

            <button 
              onClick={() => sendLaptopCommand('volume_up')}
              className="p-2.5 rounded-xl bg-slate-950/80 border border-white/[0.06] hover:border-white/20 text-slate-300 hover:text-white flex flex-col items-center gap-1 text-xs font-medium transition-all cursor-pointer"
            >
              <Volume2 className="w-4 h-4 text-slate-400" />
              <span>Volume Up</span>
            </button>

            <button 
              onClick={() => sendLaptopCommand('take_screenshot')}
              className="p-2.5 rounded-xl bg-slate-950/80 border border-white/[0.06] hover:border-white/20 text-slate-300 hover:text-white flex flex-col items-center gap-1 text-xs font-medium transition-all cursor-pointer"
            >
              <Monitor className="w-4 h-4 text-purple-400" />
              <span>Screenshot</span>
            </button>

            <button 
              onClick={() => sendLaptopCommand('system_stats')}
              className="p-2.5 rounded-xl bg-slate-950/80 border border-white/[0.06] hover:border-white/20 text-slate-300 hover:text-white flex flex-col items-center gap-1 text-xs font-medium transition-all cursor-pointer"
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>System Telemetry</span>
            </button>
          </div>
        </div>

        {/* ADB Wireless Pairing Section */}
        <form onSubmit={handlePairAdb} className="p-3.5 bg-slate-950/60 border border-white/[0.08] rounded-xl flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-300">
            <span className="flex items-center gap-1.5"><Radio className="w-3.5 h-3.5 text-indigo-400" /> Wireless ADB Pair with Laptop</span>
            <span className="text-[10px] text-slate-500">Android Developer Sync</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input 
              type="text"
              value={pairingIpPort}
              onChange={(e) => setPairingIpPort(e.target.value)}
              placeholder="192.168.1.5:42931"
              className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 outline-none focus:border-indigo-500 font-mono"
            />
            <input 
              type="text"
              value={pairingCode}
              onChange={(e) => setPairingCode(e.target.value)}
              placeholder="6-digit Pairing Code"
              className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <button 
            type="submit"
            disabled={isPairing}
            className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-750 border border-white/10 text-slate-200 text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isPairing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Link className="w-3.5 h-3.5 text-slate-400" />}
            <span>{isPairing ? 'Pairing...' : 'Pair Wireless ADB'}</span>
          </button>
        </form>

        {/* Console Log */}
        {logText && (
          <div className="bg-slate-950 border border-white/[0.08] rounded-xl p-3 text-[10px] font-mono text-slate-400 h-24 overflow-y-auto leading-relaxed select-text">
            <pre className="whitespace-pre-wrap">{logText}</pre>
          </div>
        )}

      </div>
    </div>
  );
}
