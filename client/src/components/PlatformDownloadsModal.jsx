import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Smartphone, 
  Monitor, 
  Terminal, 
  CheckCircle2, 
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
        title: 'Android Client',
        platform: 'Android 9.0+ (Phone / Tablet)',
        filename: 'JASPER_Assistant.apk',
        sizeFormatted: '7.17 MB',
        available: true,
        downloadUrl: `${apiBase}/api/apk/download`,
        description: 'Native Android app with wireless ADB continuity, background speech recognition, and secure remote control.'
      },
      exe: {
        id: 'exe',
        title: 'Windows Workstation',
        platform: 'Windows 10 / 11 (64-bit)',
        filename: 'JASPER_Assistant_Setup.exe',
        sizeFormatted: '121.16 MB',
        available: true,
        downloadUrl: `${apiBase}/api/exe/download`,
        description: 'Full desktop daemon with global hotkeys, system tray coordinator, and low-latency hardware bridges.'
      },
      os: {
        id: 'os',
        title: 'Standalone OS Kit',
        platform: 'Linux / Dual-Boot / Kiosk',
        filename: 'JASPER_OS_Kit.zip',
        sizeFormatted: '54.27 KB',
        available: true,
        downloadUrl: `${apiBase}/api/os/download`,
        description: 'Standalone boot environment, kiosk mode launcher, dual-boot EFI selector, and Debian Live configuration.'
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
      setTestResult({ ok: false, error: 'Connection failed' });
    } finally {
      setTestingPing(false);
    }
  };

  const binaries = manifest?.binaries || getDefaultManifest().binaries;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0b0d13] border border-white/[0.08] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-[#0e111a]/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-slate-300">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-100 tracking-tight">
                  Platform Binaries & Client Downloads
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  Cloud Live
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Official client binaries, desktop workstation setup, and standalone boot kits
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cloud Hub Status Bar */}
        <div className="px-6 py-3 bg-[#0d0f17]/70 border-b border-white/[0.05] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Cloud className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Cloud Endpoint:</span>
            <span className="font-mono text-slate-200 font-medium text-[11px]">{RENDER_CLOUD_URL}</span>
            <button
              onClick={handleCopyCloudUrl}
              className="p-1 rounded hover:bg-white/[0.06] text-slate-400 hover:text-slate-200 transition-colors"
              title="Copy Cloud URL"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Active Host:</span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${isCloudMode() ? 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-300' : 'bg-white/[0.06] border border-white/[0.1] text-slate-300'}`}>
              {isCloudMode() ? 'Render Cloud' : 'Localhost'}
            </span>
            <button
              onClick={handleTestPing}
              disabled={testingPing}
              className="px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/[0.08] text-slate-300 hover:bg-white/[0.09] transition-all text-[11px] flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3 h-3 ${testingPing ? 'animate-spin' : ''}`} />
              {testingPing ? 'Pinging...' : 'Test Latency'}
            </button>
            {testResult && (
              <span className={`text-[11px] font-medium ${testResult.ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                {testResult.ok ? `${testResult.latency}ms` : testResult.error}
              </span>
            )}
          </div>
        </div>

        {/* Binary Cards Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* 1. Android APK Card */}
            <div className="bg-[#10131d]/60 border border-white/[0.07] rounded-xl p-5 flex flex-col justify-between hover:border-white/[0.14] hover:bg-[#121622]/80 transition-all shadow-sm group">
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-white/[0.04] text-slate-300 border border-white/[0.08]">
                    {binaries.apk?.sizeFormatted || '7.17 MB'}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-slate-100">
                  Android APK
                </h3>
                <span className="text-[11px] text-slate-400">
                  {binaries.apk?.platform || 'Android 9.0+'}
                </span>
                <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                  {binaries.apk?.description}
                </p>
                <div className="mt-4 py-2.5 px-3 rounded-lg bg-black/25 border border-white/[0.05] text-[11px] text-slate-400 font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Package:</span>
                    <span className="text-slate-300">com.antigravity.jasper</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sync:</span>
                    <span className="text-emerald-400 font-medium">Automatic Cloud 4G/5G</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-white/[0.06]">
                <a
                  href={`${apiBase}/api/apk/download`}
                  download="JASPER_Assistant.apk"
                  className="w-full py-2 px-3 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.12] text-slate-100 text-xs font-medium flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-slate-300" />
                  Download Android APK
                </a>
              </div>
            </div>

            {/* 2. Windows Desktop EXE Card */}
            <div className="bg-[#10131d]/60 border border-white/[0.07] rounded-xl p-5 flex flex-col justify-between hover:border-white/[0.14] hover:bg-[#121622]/80 transition-all shadow-sm group">
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Monitor className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-white/[0.04] text-slate-300 border border-white/[0.08]">
                    {binaries.exe?.sizeFormatted || '121 MB'}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-slate-100">
                  Windows Desktop
                </h3>
                <span className="text-[11px] text-slate-400">
                  {binaries.exe?.platform || 'Windows 10 / 11'}
                </span>
                <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                  {binaries.exe?.description}
                </p>
                <div className="mt-4 py-2.5 px-3 rounded-lg bg-black/25 border border-white/[0.05] text-[11px] text-slate-400 font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Installer:</span>
                    <span className="text-slate-300">NSIS 64-bit EXE</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Global Shortcut:</span>
                    <span className="text-indigo-300 font-medium">Ctrl + Alt + J</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-white/[0.06]">
                <a
                  href={`${apiBase}/api/exe/download`}
                  download="JASPER_Assistant_Setup.exe"
                  className="w-full py-2 px-3 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.12] text-slate-100 text-xs font-medium flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-slate-300" />
                  Download Windows Setup
                </a>
              </div>
            </div>

            {/* 3. Jasper OS Kit Card */}
            <div className="bg-[#10131d]/60 border border-white/[0.07] rounded-xl p-5 flex flex-col justify-between hover:border-white/[0.14] hover:bg-[#121622]/80 transition-all shadow-sm group">
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-white/[0.04] text-slate-300 border border-white/[0.08]">
                    {binaries.os?.sizeFormatted || '54 KB'}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-slate-100">
                  Standalone OS Kit
                </h3>
                <span className="text-[11px] text-slate-400">
                  {binaries.os?.platform || 'Linux / Kiosk / Dual-Boot'}
                </span>
                <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                  {binaries.os?.description}
                </p>
                <div className="mt-4 py-2.5 px-3 rounded-lg bg-black/25 border border-white/[0.05] text-[11px] text-slate-400 font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Distribution:</span>
                    <span className="text-slate-300">ZIP Deployment Suite</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Selector:</span>
                    <span className="text-purple-300 font-medium">EFI 5-sec Switcher</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-white/[0.06]">
                <a
                  href={`${apiBase}/api/os/download`}
                  download="JASPER_OS_Kit.zip"
                  className="w-full py-2 px-3 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.12] text-slate-100 text-xs font-medium flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-slate-300" />
                  Download OS Kit
                </a>
              </div>
            </div>

          </div>

          {/* Cloud Switcher & Instructions Callout */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                Connecting Mobile and Remote Clients
              </h4>
              <p className="text-[11px] text-slate-400">
                To connect your smartphone or remote laptop to your cloud environment, visit <span className="text-slate-200 font-mono font-medium">{RENDER_CLOUD_URL}</span> in Chrome or Safari and select "Add to Home Screen".
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleSwitchToCloud}
                className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/25 text-indigo-200 hover:bg-indigo-500/20 text-xs font-medium transition-all"
              >
                Connect to Cloud
              </button>
              <button
                onClick={handleSwitchToLocal}
                className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-slate-300 hover:bg-white/[0.08] text-xs font-medium transition-all"
              >
                Connect to Localhost
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/[0.06] bg-[#0e111a]/50 flex items-center justify-between text-xs text-slate-400">
          <span>Jasper Core v{manifest?.server?.version || '1.0.2'}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.1] text-slate-200 text-xs font-medium transition-all"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
