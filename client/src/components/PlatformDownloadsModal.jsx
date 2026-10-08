import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Smartphone, 
  Monitor, 
  Terminal, 
  Globe, 
  CheckCircle2, 
  ExternalLink, 
  HardDrive, 
  ShieldCheck, 
  X, 
  RefreshCw, 
  Cloud, 
  Copy, 
  Check, 
  Laptop
} from 'lucide-react';
import { 
  getApiBase, 
  getServerIp, 
  setServerIp, 
  isCloudMode, 
  RENDER_CLOUD_HOST, 
  RENDER_CLOUD_URL 
} from '../utils/apiConfig.js';

export default function PlatformDownloadsModal({ onClose }) {
  const [manifest, setManifest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [currentIp, setCurrentIp] = useState(() => getServerIp());
  const [testResult, setTestResult] = useState(null);
  const [testingPing, setTestingPing] = useState(false);

  const apiBase = getApiBase();

  useEffect(() => {
    fetchManifest();
  }, [currentIp]);

  const fetchManifest = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/downloads/manifest`);
      if (res.ok) {
        const data = await res.json();
        setManifest(data);
      } else {
        setManifest(getDefaultManifest());
      }
    } catch (e) {
      setManifest(getDefaultManifest());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultManifest = () => ({
    success: true,
    server: {
      isRender: isCloudMode(),
      cloudUrl: RENDER_CLOUD_URL,
      version: '1.0.2'
    },
    binaries: {
      apk: {
        id: 'apk',
        title: 'JASPER Mobile APK',
        platform: 'Android 9.0+ (Phone / Tablet)',
        filename: 'JASPER_Assistant.apk',
        sizeFormatted: '7.17 MB',
        available: true,
        downloadUrl: `${apiBase}/api/apk/download`,
        description: 'Native Android APK with wireless ADB auto-sync, speech recognition HUD, and 4G/5G remote control anywhere in the world'
      },
      exe: {
        id: 'exe',
        title: 'JASPER Desktop Workstation',
        platform: 'Windows 10 / 11 (64-bit)',
        filename: 'JASPER_Assistant_Setup.exe',
        sizeFormatted: '121.16 MB',
        available: true,
        downloadUrl: `${apiBase}/api/exe/download`,
        description: 'Full Windows desktop client with global Ctrl+Alt+J hotkey, system tray background daemon, and hardware integration'
      },
      os: {
        id: 'os',
        title: 'JASPER Standalone OS & Kiosk Kit',
        platform: 'Jasper OS (Linux / Dual-Boot / Kiosk)',
        filename: 'JASPER_OS_Kit.zip',
        sizeFormatted: '54.27 KB',
        available: true,
        downloadUrl: `${apiBase}/api/os/download`,
        description: 'Bootable OS files, standalone kiosk launcher, dual-boot EFI selector, and Debian Live ISO compilation suite'
      }
    }
  });

  const handleCopyCloudUrl = () => {
    navigator.clipboard?.writeText?.(RENDER_CLOUD_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwitchToCloud = () => {
    setServerIp(RENDER_CLOUD_HOST);
    setCurrentIp(RENDER_CLOUD_HOST);
  };

  const handleSwitchToLocal = () => {
    setServerIp('localhost');
    setCurrentIp('localhost');
  };

  const handleTestPing = async () => {
    setTestingPing(true);
    setTestResult(null);
    const start = Date.now();
    try {
      const res = await fetch(`${apiBase}/api/version`);
      const latency = Date.now() - start;
      if (res.ok) {
        setTestResult({ ok: true, latency });
      } else {
        setTestResult({ ok: false, error: `HTTP ${res.status}` });
      }
    } catch (e) {
      setTestResult({ ok: false, error: 'Connection Failed' });
    } finally {
      setTestingPing(false);
    }
  };

  const binaries = manifest?.binaries || getDefaultManifest().binaries;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-950 border border-cyan-500/30 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-[0_0_50px_rgba(0,240,255,0.15)] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-500/20 bg-gradient-to-r from-slate-900 via-cyan-950/30 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-orbitron text-white tracking-wide">
                  J.A.S.P.E.R. CLOUD BINARIES & FILE SYSTEM
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
                  RENDER 24/7 ONLINE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Shifted from localhost to permanent high-speed cloud deployment
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cloud Hub Status Bar */}
        <div className="px-5 py-3 bg-slate-900/60 border-b border-cyan-500/15 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400">Cloud Host:</span>
            <span className="font-mono text-cyan-300 font-semibold">{RENDER_CLOUD_URL}</span>
            <button
              onClick={handleCopyCloudUrl}
              className="p-1 rounded hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 transition-colors"
              title="Copy Cloud URL"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Active Link:</span>
            <span className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold ${isCloudMode() ? 'bg-purple-950/70 border border-purple-500/40 text-purple-300' : 'bg-slate-800 border border-slate-600 text-slate-300'}`}>
              {isCloudMode() ? '☁️ Render Cloud' : '💻 Localhost'}
            </span>
            <button
              onClick={handleTestPing}
              disabled={testingPing}
              className="px-2 py-1 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/60 transition-all font-mono text-[10px] flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${testingPing ? 'animate-spin' : ''}`} />
              {testingPing ? 'Pinging...' : 'Test Ping'}
            </button>
            {testResult && (
              <span className={`text-[10px] font-mono font-semibold ${testResult.ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                {testResult.ok ? `${testResult.latency}ms latency` : testResult.error}
              </span>
            )}
          </div>
        </div>

        {/* Binary Cards Grid */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* 1. Android APK Card */}
            <div className="bg-slate-900/50 border border-emerald-500/30 rounded-xl p-4 flex flex-col justify-between hover:border-emerald-400/60 hover:bg-slate-900/70 transition-all shadow-sm group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                    {binaries.apk?.sizeFormatted || '7.17 MB'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white font-orbitron">
                  Android Native APK
                </h3>
                <span className="text-[11px] text-emerald-400 font-mono">
                  {binaries.apk?.platform || 'Android 9.0+'}
                </span>
                <p className="text-xs text-slate-300 font-sans mt-2 leading-relaxed">
                  {binaries.apk?.description}
                </p>
                <div className="mt-3 py-2 px-2.5 rounded-lg bg-black/40 border border-white/[0.06] text-[10px] text-slate-400 font-mono space-y-1">
                  <div className="flex justify-between">
                    <span>Package:</span>
                    <span className="text-slate-200">com.antigravity.jasper</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cloud Sync:</span>
                    <span className="text-emerald-400">Auto Render 4G/5G</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/[0.08]">
                <a
                  href={`${apiBase}/api/apk/download`}
                  download="JASPER_Assistant.apk"
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold font-orbitron flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  DOWNLOAD APK
                </a>
              </div>
            </div>

            {/* 2. Windows Desktop EXE Card */}
            <div className="bg-slate-900/50 border border-cyan-500/30 rounded-xl p-4 flex flex-col justify-between hover:border-cyan-400/60 hover:bg-slate-900/70 transition-all shadow-sm group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                    {binaries.exe?.sizeFormatted || '121 MB'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white font-orbitron">
                  Windows Desktop Setup
                </h3>
                <span className="text-[11px] text-cyan-400 font-mono">
                  {binaries.exe?.platform || 'Windows 10 / 11'}
                </span>
                <p className="text-xs text-slate-300 font-sans mt-2 leading-relaxed">
                  {binaries.exe?.description}
                </p>
                <div className="mt-3 py-2 px-2.5 rounded-lg bg-black/40 border border-white/[0.06] text-[10px] text-slate-400 font-mono space-y-1">
                  <div className="flex justify-between">
                    <span>Installer:</span>
                    <span className="text-slate-200">NSIS 64-bit EXE</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hotkey:</span>
                    <span className="text-cyan-400">Ctrl + Alt + J</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/[0.08]">
                <a
                  href={`${apiBase}/api/exe/download`}
                  download="JASPER_Assistant_Setup.exe"
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold font-orbitron flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  DOWNLOAD WINDOWS SETUP
                </a>
              </div>
            </div>

            {/* 3. Jasper OS Kit Card */}
            <div className="bg-slate-900/50 border border-purple-500/30 rounded-xl p-4 flex flex-col justify-between hover:border-purple-400/60 hover:bg-slate-900/70 transition-all shadow-sm group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-500/30">
                    {binaries.os?.sizeFormatted || '54 KB'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white font-orbitron">
                  Jasper OS Standalone Kit
                </h3>
                <span className="text-[11px] text-purple-400 font-mono">
                  {binaries.os?.platform || 'Linux / Kiosk / Dual-Boot'}
                </span>
                <p className="text-xs text-slate-300 font-sans mt-2 leading-relaxed">
                  {binaries.os?.description}
                </p>
                <div className="mt-3 py-2 px-2.5 rounded-lg bg-black/40 border border-white/[0.06] text-[10px] text-slate-400 font-mono space-y-1">
                  <div className="flex justify-between">
                    <span>Format:</span>
                    <span className="text-slate-200">ZIP Deployment Suite</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dual-Boot:</span>
                    <span className="text-purple-400">EFI 5-sec Switcher</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/[0.08]">
                <a
                  href={`${apiBase}/api/os/download`}
                  download="JASPER_OS_Kit.zip"
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold font-orbitron flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  DOWNLOAD OS KIT
                </a>
              </div>
            </div>

          </div>

          {/* Cloud Switcher & Instructions Callout */}
          <div className="p-4 rounded-xl bg-slate-900/40 border border-cyan-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-orbitron">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                HOW TO CONNECT ANY DEVICE TO RENDER CLOUD
              </h4>
              <p className="text-[11px] text-slate-300">
                To connect your mobile phone or another PC to this Render instance permanently, simply open <span className="text-cyan-300 font-mono font-bold">{RENDER_CLOUD_URL}</span> in Chrome, Edge, or Safari and tap "Add to Home Screen".
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleSwitchToCloud}
                className="px-3 py-1.5 rounded-lg bg-purple-900/60 border border-purple-500/40 text-purple-200 hover:bg-purple-800 text-xs font-semibold transition-all shadow-sm"
              >
                ☁️ Connect to Render
              </button>
              <button
                onClick={handleSwitchToLocal}
                className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700 text-xs font-semibold transition-all"
              >
                💻 Connect to Localhost
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-cyan-500/20 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
          <span>J.A.S.P.E.R. Core Version {manifest?.server?.version || '1.0.2'}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900 text-xs font-orbitron font-semibold transition-all"
          >
            CLOSE
          </button>
        </div>

      </div>
    </div>
  );
}
