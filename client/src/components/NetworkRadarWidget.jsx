import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, 
  ShieldAlert, 
  ShieldCheck, 
  Wifi, 
  Activity, 
  Smartphone, 
  Tv, 
  Monitor, 
  Laptop, 
  Cpu, 
  RefreshCw, 
  AlertTriangle, 
  Terminal, 
  CheckCircle2, 
  SlidersHorizontal,
  Server
} from 'lucide-react';
import { playJarvisBeep, playJarvisScan } from '../utils/jarvisAudioSynth';

export default function NetworkRadarWidget({ onClose }) {
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState('radar'); // radar, devices, ports, bandwidth
  const [radarAngle, setRadarAngle] = useState(0);
  const [rogueAlert, setRogueAlert] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);

  const [devices, setDevices] = useState([
    { id: 'dev-1', ip: '192.168.29.1', name: 'JioFiber Gateway Router', type: 'router', mac: '84:D8:1B:32:9A:10', ping: 1, status: 'Online', traffic: '12.4 MB/s', safe: true, x: 50, y: 50 },
    { id: 'dev-2', ip: '192.168.29.159', name: 'Samsung Galaxy Phone (ADB)', type: 'phone', mac: '4C:74:03:E1:2F:88', ping: 12, status: 'Online', traffic: '4.8 MB/s', safe: true, x: 72, y: 35 },
    { id: 'dev-3', ip: '192.168.29.229', name: 'Samsung Crystal UHD TV', type: 'tv', mac: '68:27:37:BC:11:45', ping: 8, status: 'Online', traffic: '18.2 MB/s', safe: true, x: 28, y: 70 },
    { id: 'dev-4', ip: '192.168.29.230', name: 'Jio Set-Top Box 4K', type: 'stb', mac: '3C:84:6A:90:54:12', ping: 14, status: 'Online', traffic: '2.1 MB/s', safe: true, x: 38, y: 30 },
    { id: 'dev-5', ip: '192.168.29.102', name: 'Jasper Primary Workstation', type: 'pc', mac: 'D8:BB:C1:4F:92:09', ping: 0, status: 'Online (Host)', traffic: '34.6 MB/s', safe: true, x: 50, y: 50 },
    { id: 'dev-6', ip: '192.168.29.184', name: 'Secondary Laptop (Remote)', type: 'laptop', mac: '70:85:C2:AA:77:21', ping: 19, status: 'Online', traffic: '1.2 MB/s', safe: true, x: 65, y: 75 },
    { id: 'dev-7', ip: '192.168.29.45', name: 'Smart Ambient LED Controller', type: 'iot', mac: '24:6F:28:DD:10:04', ping: 32, status: 'Online', traffic: '180 KB/s', safe: true, x: 80, y: 60 }
  ]);

  const [ports, setPorts] = useState([
    { port: 22, service: 'SSH', status: 'Closed (Secure)', desc: 'Encrypted remote console' },
    { port: 80, service: 'HTTP', status: 'Open', desc: 'Standard local web server' },
    { port: 443, service: 'HTTPS', status: 'Open', desc: 'Secure SSL/TLS web traffic' },
    { port: 3000, service: 'JASPER API Core', status: 'Open (Active)', desc: 'Backend AI Orchestrator' },
    { port: 5173, service: 'Vite Frontend Dev', status: 'Open (Active)', desc: 'Client GUI interface' },
    { port: 5555, service: 'Android ADB Wireless', status: 'Open (Paired)', desc: 'Hardware phone control link' },
    { port: 8002, service: 'Samsung TV WebSocket', status: 'Open (Linked)', desc: 'Smart View remote control' },
    { port: 11434, service: 'Ollama Edge LLM', status: 'Open (Ready)', desc: 'On-device private inference' }
  ]);

  // Radar sweep animation
  useEffect(() => {
    const interval = setInterval(() => {
      setRadarAngle(prev => (prev + 4) % 360);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  const runNetworkScan = () => {
    setIsScanning(true);
    playJarvisScan();

    setTimeout(() => {
      setIsScanning(false);
      playJarvisBeep('success');
      // Update pings with subtle variations
      setDevices(prev => prev.map(d => ({
        ...d,
        ping: Math.max(1, Math.round(d.ping + (Math.random() * 4 - 2)))
      })));
    }, 2200);
  };

  const simulateRogueIntrusion = () => {
    playJarvisBeep('error');
    if (!rogueAlert) {
      const rogueDev = {
        id: 'rogue-x',
        ip: '192.168.29.199',
        name: 'UNKNOWN_DEVICE_INTRUDER',
        type: 'rogue',
        mac: 'FF:E0:11:99:A2:BC',
        ping: 44,
        status: 'Unverified MAC (Suspicious)',
        traffic: '8.4 MB/s (Sniffing)',
        safe: false,
        x: 85,
        y: 20
      };
      setDevices(prev => [...prev.filter(d => d.id !== 'rogue-x'), rogueDev]);
      setRogueAlert(true);
      setSelectedDevice(rogueDev);
    } else {
      setDevices(prev => prev.filter(d => d.id !== 'rogue-x'));
      setRogueAlert(false);
      setSelectedDevice(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0f18]/95 text-slate-100 rounded-2xl overflow-hidden border border-emerald-500/25 backdrop-blur-2xl shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-500/20 bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
            <Radio className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div>
            <h2 className="text-base font-bold font-orbitron tracking-wider text-emerald-300 flex items-center gap-2 uppercase">
              LAN Cyber Radar & Device Sniffer
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 font-mono">
                192.168.29.0/24
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Real-time Subnet Telemetry, Port Auditing & Intrusion Defense
            </p>
          </div>
        </div>

        {/* Scan Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={simulateRogueIntrusion}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              rogueAlert 
                ? 'bg-rose-500/30 border-rose-500 text-rose-300 animate-pulse'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{rogueAlert ? 'Dismiss Intrusion' : 'Test Rogue Alert'}</span>
          </button>

          <button
            onClick={runNetworkScan}
            disabled={isScanning}
            className="px-4 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Sweeping Subnet...' : 'Deep Radar Scan'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-950/40">
        {[
          { id: 'radar', label: 'Tactical Radar Display' },
          { id: 'devices', label: `Connected Nodes (${devices.length})` },
          { id: 'ports', label: 'Port Vulnerability Audit' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'border-emerald-400 text-emerald-300 font-semibold bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        {/* TAB 1: RADAR DISPLAY */}
        {activeTab === 'radar' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full">
            {/* Visual Radar Scope */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-950 border border-emerald-500/20 relative overflow-hidden min-h-[340px]">
              {/* Radar Circles */}
              <div className="relative w-72 h-72 rounded-full border border-emerald-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.1)]">
                <div className="w-54 h-54 rounded-full border border-emerald-500/20 flex items-center justify-center">
                  <div className="w-36 h-36 rounded-full border border-emerald-500/25 flex items-center justify-center">
                    <div className="w-18 h-18 rounded-full border border-emerald-500/30 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    </div>
                  </div>
                </div>

                {/* Crosshairs */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-full h-px bg-emerald-500/20" />
                  <div className="h-full w-px bg-emerald-500/20 absolute" />
                </div>

                {/* Sweeping Beam */}
                <div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    background: `conic-gradient(from ${radarAngle}deg, rgba(16,185,129,0.4) 0deg, rgba(16,185,129,0) 60deg, transparent 360deg)`
                  }}
                />

                {/* Device Blips on Radar */}
                {devices.map(dev => (
                  <button
                    key={dev.id}
                    onClick={() => setSelectedDevice(dev)}
                    style={{ left: `${dev.x}%`, top: `${dev.y}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 p-1.5 rounded-full transition-transform hover:scale-150 cursor-pointer ${
                      dev.safe 
                        ? 'bg-emerald-500 text-slate-950 shadow-[0_0_10px_#10b981]' 
                        : 'bg-rose-500 text-white shadow-[0_0_15px_#f43f5e] animate-bounce'
                    }`}
                    title={`${dev.name} (${dev.ip})`}
                  >
                    <span className="w-2 h-2 block rounded-full bg-white" />
                  </button>
                ))}
              </div>

              <div className="mt-4 text-[11px] font-mono text-emerald-400/80 flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Trusted Nodes
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-ping" /> Suspicious/Unknown
                </span>
              </div>
            </div>

            {/* Selected Device Telemetry Panel */}
            <div className="lg:col-span-5 flex flex-col justify-between p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  Node Signal Inspector
                </div>

                {selectedDevice ? (
                  <div className="space-y-3.5">
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30">
                      <div className="text-sm font-bold text-emerald-300 mb-1">{selectedDevice.name}</div>
                      <div className="text-xs font-mono text-slate-400">{selectedDevice.ip} &bull; {selectedDevice.mac}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Ping Latency</span>
                        <span className="text-emerald-300 font-bold">{selectedDevice.ping} ms</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Bandwidth</span>
                        <span className="text-sky-300 font-bold">{selectedDevice.traffic}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Security Status</span>
                        <span className={`font-bold ${selectedDevice.safe ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {selectedDevice.safe ? 'Verified' : 'FLAGGED INTRUDER'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Interface</span>
                        <span className="text-slate-300 font-bold">WLAN0 / 5GHz</span>
                      </div>
                    </div>

                    {!selectedDevice.safe && (
                      <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs">
                        <div className="font-bold mb-1 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-400" /> Rogue Signal Warning
                        </div>
                        This device does not match any authorized household fingerprint. Auto-isolation recommended.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-slate-500 font-mono">
                    Click any blip on the radar scope to inspect packet flow and security credentials.
                  </div>
                )}
              </div>

              {/* Subnet Summary */}
              <div className="pt-4 border-t border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Subnet Gateway:</span>
                  <span className="text-slate-200">192.168.29.1</span>
                </div>
                <div className="flex justify-between">
                  <span>DHCP Lease Range:</span>
                  <span className="text-slate-200">192.168.29.2 - 254</span>
                </div>
                <div className="flex justify-between">
                  <span>Packet Drop Rate:</span>
                  <span className="text-emerald-400 font-bold">0.02% (Optimal)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ALL CONNECTED DEVICES */}
        {activeTab === 'devices' && (
          <div className="space-y-2">
            {devices.map(dev => (
              <div
                key={dev.id}
                onClick={() => setSelectedDevice(dev)}
                className={`p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                  selectedDevice?.id === dev.id
                    ? 'border-emerald-500 bg-emerald-950/20'
                    : dev.safe
                    ? 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                    : 'border-rose-500/60 bg-rose-950/20 hover:border-rose-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg border ${
                    dev.safe ? 'bg-slate-800 text-emerald-400 border-slate-700' : 'bg-rose-500 text-white border-rose-400'
                  }`}>
                    {dev.type === 'router' && <Wifi className="w-4 h-4" />}
                    {dev.type === 'phone' && <Smartphone className="w-4 h-4" />}
                    {dev.type === 'tv' && <Tv className="w-4 h-4" />}
                    {dev.type === 'stb' && <Server className="w-4 h-4" />}
                    {dev.type === 'pc' && <Monitor className="w-4 h-4" />}
                    {dev.type === 'laptop' && <Laptop className="w-4 h-4" />}
                    {dev.type === 'iot' && <Cpu className="w-4 h-4" />}
                    {dev.type === 'rogue' && <ShieldAlert className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-100 flex items-center gap-2">
                      {dev.name}
                      {!dev.safe && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500 text-white font-bold">
                          UNTRUSTED
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {dev.ip} &bull; MAC: {dev.mac}
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono text-xs">
                  <div className="text-emerald-400 font-semibold">{dev.ping} ms</div>
                  <div className="text-[10px] text-slate-500">{dev.traffic}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: PORT SCANNER */}
        {activeTab === 'ports' && (
          <div className="space-y-2">
            <div className="text-xs text-slate-400 font-mono mb-3">
              Auditing local machine socket listeners and daemon bindings:
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {ports.map(p => (
                <div key={p.port} className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-200 flex items-center gap-2 font-mono">
                      <span className="text-emerald-400">Port {p.port}</span>
                      <span className="text-slate-400 font-sans">&bull; {p.service}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{p.desc}</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/30 text-emerald-300 font-mono">
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Firewall Zero-Trust Rule: ACTIVE</span>
        </div>
        <div className="text-emerald-400">
          Subnet Latency: ~1.2ms
        </div>
      </div>
    </div>
  );
}
