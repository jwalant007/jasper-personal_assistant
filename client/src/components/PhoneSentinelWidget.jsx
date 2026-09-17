import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Smartphone, 
  Radio, 
  CloudRain, 
  Wind, 
  Zap, 
  Thermometer, 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Copy, 
  QrCode, 
  Volume2, 
  Vibrate, 
  MessageSquare, 
  Plus, 
  Trash2, 
  RefreshCw, 
  XCircle,
  Laptop
} from 'lucide-react';
import { 
  getDefaultSentinelConfig, 
  saveSentinelConfig, 
  sendCloudPushAlert, 
  sendLocalDeviceNotification, 
  playAlertChime, 
  checkWeatherHazard 
} from '../utils/mobileSentinel';
import { getLocation } from '../utils/locationService';
import { speakDeviceAudio } from '../utils/speakDeviceAudio';
import { getApiBase } from '../utils/apiConfig';

export default function PhoneSentinelWidget({ onClose }) {
  const [config, setConfig] = useState(getDefaultSentinelConfig());
  const [weatherStatus, setWeatherStatus] = useState(null);
  const [isCheckingWeather, setIsCheckingWeather] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [customTopicInput, setCustomTopicInput] = useState(config.channelTopic || 'jasper-jwalant-alerts');
  const [showQrCode, setShowQrCode] = useState(true);

  // Load initial weather status
  useEffect(() => {
    handleRefreshWeather();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleRefreshWeather = async () => {
    setIsCheckingWeather(true);
    try {
      const loc = await getLocation();
      const res = await checkWeatherHazard(loc?.lat || 18.922, loc?.lon || 72.834);
      setWeatherStatus(res);
      if (res?.isSevere) {
        showToast(`⚠️ Hazard Detected: ${res.hazardType}`);
      }
    } catch (e) {
      console.warn('[PhoneSentinelWidget] Weather check error:', e);
    } finally {
      setIsCheckingWeather(false);
    }
  };

  const handleSendTestPush = async () => {
    setIsSendingTest(true);
    showToast('⚡ Dispatching urgent test alert to your phone...');
    try {
      // 1. Dispatch Cloud Push (reaches phone anywhere in the world even if laptop is OFF)
      const cloudRes = await sendCloudPushAlert({
        topic: config.channelTopic,
        title: '⚡ JASPER Sentinel Verification',
        message: 'This is a high-priority test alert from JASPER Assistant. Your phone is connected & protected even when laptop servers are OFF!',
        priority: 'urgent',
        tags: ['zap', 'bell', 'shield']
      });

      // 2. Dispatch Local Device Notification
      sendLocalDeviceNotification({
        title: '⚡ JASPER Sentinel Verification',
        body: 'Local phone alert verified. Notifications and vibration are active.',
        vibrate: [300, 100, 300, 100, 500]
      });

      // 3. Play audio chime & voice
      if (config.soundAlertEnabled) playAlertChime();
      if (config.voiceAlertEnabled) speakDeviceAudio('Test alert dispatched to your phone lock screen, sir.');

      if (cloudRes.success) {
        showToast('✓ Dispatched! Check your phone lock screen now.');
      } else {
        showToast('✓ Local alert fired. Check phone cloud channel.');
      }
    } catch (e) {
      showToast(`Error: ${e.message}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSaveTopic = () => {
    const clean = customTopicInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    if (!clean) return;
    const updated = { ...config, channelTopic: clean };
    setConfig(updated);
    saveSentinelConfig(updated);
    showToast(`✓ Phone alert channel updated: ${clean}`);
  };

  const handleToggleOption = (key) => {
    const updated = { ...config, [key]: !config[key] };
    setConfig(updated);
    saveSentinelConfig(updated);
  };

  const handleAddKeyword = (e) => {
    e.preventDefault();
    const word = newKeywordInput.trim().toUpperCase();
    if (word && !config.emergencyKeywords.includes(word)) {
      const updated = {
        ...config,
        emergencyKeywords: [...config.emergencyKeywords, word]
      };
      setConfig(updated);
      saveSentinelConfig(updated);
      setNewKeywordInput('');
      showToast(`✓ Added urgent keyword: "${word}"`);
    }
  };

  const handleRemoveKeyword = (word) => {
    const updated = {
      ...config,
      emergencyKeywords: config.emergencyKeywords.filter(w => w !== word)
    };
    setConfig(updated);
    saveSentinelConfig(updated);
  };

  const handleCopySubscribeLink = () => {
    const link = `https://ntfy.sh/${config.channelTopic}`;
    navigator.clipboard?.writeText(link);
    showToast('✓ Link copied! Open on phone to subscribe.');
  };

  const subscribeUrl = `https://ntfy.sh/${config.channelTopic}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(subscribeUrl)}&color=00f3ff&bgcolor=020617`;

  return (
    <div className="bg-slate-950/95 border border-cyan-500/40 rounded-2xl p-4 sm:p-6 text-slate-100 backdrop-blur-2xl shadow-2xl max-w-4xl w-full mx-auto relative overflow-hidden flex flex-col gap-4 font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs rounded-full shadow-lg shadow-cyan-500/40 animate-bounce flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {toastMessage}
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/40 rounded-xl text-rose-400 shadow-lg shadow-rose-500/20">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-wider text-cyan-300 uppercase font-orbitron">
                Autonomous Phone Sentinel
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-mono text-emerald-300 font-bold">
                LAPTOP-OFF ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Rings your phone for severe weather & urgent messages even when laptop servers are off
            </p>
          </div>
        </div>

        {onClose && (
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl bg-slate-900 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-all border border-slate-800"
          >
            <XCircle className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* LAPTOP-OFF ARCHITECTURE BANNER */}
      <div className="p-3.5 bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-purple-950/40 border border-cyan-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-800 rounded-xl border border-slate-700 text-cyan-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
              <span>Dual-Sentinel Active Protection</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </div>
            <div className="text-[11px] text-slate-300 font-mono mt-0.5">
              Channel: <span className="text-cyan-400 font-bold">{config.channelTopic}</span> • Zero server dependencies
            </div>
          </div>
        </div>

        <button
          onClick={handleSendTestPush}
          disabled={isSendingTest}
          className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-rose-500/30 flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer"
        >
          <Zap className="w-4 h-4" />
          <span>{isSendingTest ? 'Sending Alert...' : '⚡ Send Test Push to Phone'}</span>
        </button>
      </div>

      {/* 2-COLUMN MAIN GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* CARD 1: PHONE PAIRING & QR CODE */}
        <div className="p-4 bg-slate-900/70 border border-cyan-500/30 rounded-2xl flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-cyan-300 font-orbitron uppercase tracking-wider">
                  1-Step Phone Setup
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Zero Signup Required</span>
            </div>

            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Scan this QR code with your phone camera or open the link below. Tap <strong className="text-cyan-300">"Subscribe"</strong> on your phone (in the free <code className="text-cyan-400">ntfy</code> app or Chrome browser) to receive lock-screen alerts.
            </p>

            {/* QR Code Graphic */}
            <div className="flex flex-col items-center justify-center my-3 p-3 bg-slate-950/80 rounded-xl border border-cyan-500/20">
              <img 
                src={qrCodeUrl} 
                alt="Phone Subscription QR Code" 
                className="w-36 h-36 rounded-lg border border-cyan-500/40 p-1 bg-slate-950" 
              />
              <div className="text-[10px] font-mono text-cyan-400 mt-2 flex items-center gap-1">
                <span>https://ntfy.sh/{config.channelTopic}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={handleCopySubscribeLink}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-slate-700"
              >
                <Copy className="w-3.5 h-3.5 text-amber-400" />
                <span>Copy Link for Phone</span>
              </button>
              <a
                href={subscribeUrl}
                target="_blank"
                rel="noreferrer"
                className="py-2 px-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open</span>
              </a>
            </div>
          </div>

          {/* Custom Channel Topic Input */}
          <div className="mt-3 pt-3 border-t border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 mb-1">PRIVATE CHANNEL TOPIC:</div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customTopicInput}
                onChange={(e) => setCustomTopicInput(e.target.value)}
                placeholder="e.g. jasper-jwalant-alerts"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-cyan-300 font-mono outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleSaveTopic}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>

        {/* CARD 2: LIVE SEVERE WEATHER HAZARD RADAR */}
        <div className="p-4 bg-slate-900/70 border border-cyan-500/30 rounded-2xl flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CloudRain className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-cyan-300 font-orbitron uppercase tracking-wider">
                  Live Weather Hazard Radar
                </span>
              </div>
              <button
                onClick={handleRefreshWeather}
                disabled={isCheckingWeather}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                title="Refresh Weather Status"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingWeather ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
            </div>

            {/* Risk Assessment Banner */}
            <div className={`my-3 p-3 rounded-xl border flex items-center justify-between ${
              weatherStatus?.isSevere 
                ? 'bg-rose-950/40 border-rose-500/60 text-rose-200 shadow-lg shadow-rose-500/20' 
                : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
            }`}>
              <div className="flex items-center gap-2.5">
                <AlertTriangle className={`w-5 h-5 ${weatherStatus?.isSevere ? 'text-rose-400 animate-bounce' : 'text-emerald-400'}`} />
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider">
                    {weatherStatus?.isSevere ? `HAZARD DETECTED: ${weatherStatus.hazardType}` : 'ENVIRONMENT STABLE'}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    {weatherStatus?.description || 'Scanning atmospheric radar...'}
                  </div>
                </div>
              </div>
            </div>

            {/* Live Weather Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-amber-400" /> TEMPERATURE
                </div>
                <div className="text-sm font-bold text-slate-100 mt-0.5">
                  {weatherStatus?.temperature !== undefined ? `${weatherStatus.temperature}°C` : '--'}
                </div>
              </div>

              <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-cyan-400" /> SUSTAINED WIND
                </div>
                <div className="text-sm font-bold text-cyan-300 mt-0.5">
                  {weatherStatus?.windSpeed !== undefined ? `${weatherStatus.windSpeed} km/h` : '--'}
                </div>
              </div>

              <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-rose-400" /> PEAK GUSTS
                </div>
                <div className="text-sm font-bold text-rose-300 mt-0.5">
                  {weatherStatus?.windGusts !== undefined ? `${weatherStatus.windGusts} km/h` : '--'}
                </div>
              </div>

              <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <CloudRain className="w-3.5 h-3.5 text-blue-400" /> PRECIPITATION
                </div>
                <div className="text-sm font-bold text-blue-300 mt-0.5">
                  {weatherStatus?.precipitation !== undefined ? `${weatherStatus.precipitation} mm/h` : '--'}
                </div>
              </div>
            </div>
          </div>

          {/* Autonomous Polling Settings */}
          <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
            <span>POLLING INTERVAL:</span>
            <span className="text-cyan-400 font-bold">Every 20m via Open-Meteo GPS</span>
          </div>
        </div>
      </div>

      {/* CARD 3: URGENT MESSAGE KEYWORDS & NOTIFICATION CHANNELS */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-slate-200 font-orbitron tracking-wider">
              Urgent Message Trigger Keywords
            </span>
          </div>
          <span className="text-[10px] font-mono text-purple-400">Triggers Phone Alarm on Match</span>
        </div>

        {/* Keyword Pills */}
        <div className="flex flex-wrap gap-2">
          {config.emergencyKeywords.map(word => (
            <span 
              key={word} 
              className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm"
            >
              <span>{word}</span>
              <button 
                onClick={() => handleRemoveKeyword(word)}
                className="hover:text-white"
                title="Remove keyword"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>

        {/* Add Keyword Form */}
        <form onSubmit={handleAddKeyword} className="flex items-center gap-2">
          <input
            type="text"
            value={newKeywordInput}
            onChange={(e) => setNewKeywordInput(e.target.value)}
            placeholder="Add custom emergency word (e.g. DOCTOR, POLICE, FAMILY)..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            className="px-3.5 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs font-bold rounded-xl flex items-center gap-1 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Word</span>
          </button>
        </form>

        {/* Sentinel Notification Preferences */}
        <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700">
            <input
              type="checkbox"
              checked={config.soundAlertEnabled}
              onChange={() => handleToggleOption('soundAlertEnabled')}
              className="rounded accent-cyan-500"
            />
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-200">Audio Siren Chime</span>
          </label>

          <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700">
            <input
              type="checkbox"
              checked={config.voiceAlertEnabled}
              onChange={() => handleToggleOption('voiceAlertEnabled')}
              className="rounded accent-cyan-500"
            />
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-200">Vocal Voice Warning</span>
          </label>

          <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700">
            <input
              type="checkbox"
              checked={config.vibrationEnabled}
              onChange={() => handleToggleOption('vibrationEnabled')}
              className="rounded accent-cyan-500"
            />
            <Vibrate className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-200">Hardware Vibration</span>
          </label>
        </div>
      </div>

    </div>
  );
}
