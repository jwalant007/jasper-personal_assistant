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
        showToast(`Hazard detected: ${res.hazardType}`);
      }
    } catch (e) {
      console.warn('[PhoneSentinelWidget] Weather check error:', e);
    } finally {
      setIsCheckingWeather(false);
    }
  };

  const handleSendTestPush = async () => {
    setIsSendingTest(true);
    showToast('Dispatching test alert to your phone...');
    try {
      const cloudRes = await sendCloudPushAlert({
        topic: config.channelTopic,
        title: 'Jasper Sentinel Verification',
        message: 'High-priority test alert from Jasper Assistant. Your phone is connected & protected even when laptop servers are off.',
        priority: 'urgent',
        tags: ['zap', 'bell', 'shield']
      });

      sendLocalDeviceNotification({
        title: 'Jasper Sentinel Verification',
        body: 'Local phone alert verified. Notifications and vibration are active.',
        vibrate: [300, 100, 300, 100, 500]
      });

      if (config.soundAlertEnabled) playAlertChime();
      if (config.voiceAlertEnabled) speakDeviceAudio('Test alert dispatched to your phone lock screen, sir.');

      if (cloudRes.success) {
        showToast(`Dispatched to ntfy.sh/${config.channelTopic}! Check your phone.`);
      } else {
        showToast(`Cloud dispatch warning: ${cloudRes.error || 'Check network'}`);
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
    fetch('/api/sentinel/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelTopic: clean })
    }).catch(e => console.warn('[Sentinel] Failed to sync config to server:', e));
    showToast(`Phone alert channel updated: ${clean}`);
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
      showToast(`Added urgent keyword: "${word}"`);
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
    showToast('Link copied to clipboard.');
  };

  const subscribeUrl = `https://ntfy.sh/${config.channelTopic}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(subscribeUrl)}&color=ffffff&bgcolor=090a0f`;

  return (
    <div className="bg-[#0b0d13]/95 border border-white/[0.08] rounded-2xl p-4 sm:p-6 text-slate-100 backdrop-blur-2xl shadow-2xl max-w-4xl w-full mx-auto relative overflow-hidden flex flex-col gap-5">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900 border border-white/20 text-slate-100 font-medium text-xs rounded-full shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {toastMessage}
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-100 tracking-tight">
                Phone Sentinel & Emergency Alerts
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-medium">
                Active 24/7
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Rings your mobile device for severe weather hazards and high-priority messages even when PC is off
            </p>
          </div>
        </div>

        {onClose && (
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ARCHITECTURE BANNER */}
      <div className="p-4 bg-[#10131d]/60 border border-white/[0.07] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/[0.04] rounded-lg border border-white/[0.08] text-slate-300">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <span>Cloud Sentinel Push Channel</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Topic: <span className="text-slate-200 font-mono font-medium">{config.channelTopic}</span> • Zero local server dependency
            </div>
          </div>
        </div>

        <button
          onClick={handleSendTestPush}
          disabled={isSendingTest}
          className="w-full sm:w-auto px-3.5 py-1.5 bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.12] text-slate-100 font-medium text-xs rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>{isSendingTest ? 'Sending Alert...' : 'Send Test Alert to Phone'}</span>
        </button>
      </div>

      {/* 2-COLUMN MAIN GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* CARD 1: PHONE PAIRING & QR CODE */}
        <div className="p-5 bg-[#10131d]/50 border border-white/[0.07] rounded-xl flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-200">
                  Quick Device Pairing
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">No Account Required</span>
            </div>

            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Scan this QR code with your camera or tap open below. Click <strong className="text-slate-200">Subscribe</strong> in your browser or ntfy app to receive emergency push alerts on your lock screen.
            </p>

            {/* QR Code Graphic */}
            <div className="flex flex-col items-center justify-center my-4 p-3 bg-black/40 rounded-xl border border-white/[0.06]">
              <img 
                src={qrCodeUrl} 
                alt="Phone Subscription QR Code" 
                className="w-36 h-36 rounded-lg border border-white/[0.1] p-1 bg-[#090a0f]" 
              />
              <div className="text-[11px] font-mono text-slate-400 mt-2">
                ntfy.sh/{config.channelTopic}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySubscribeLink}
                className="flex-1 py-2 bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all border border-white/[0.08]"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Link</span>
              </button>
              <a
                href={subscribeUrl}
                target="_blank"
                rel="noreferrer"
                className="py-2 px-3 bg-white/[0.08] hover:bg-white/[0.12] text-slate-200 border border-white/[0.1] rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Channel</span>
              </a>
            </div>
          </div>

          {/* Custom Channel Topic Input */}
          <div className="mt-4 pt-3.5 border-t border-white/[0.06]">
            <div className="text-[10px] text-slate-400 mb-1.5 uppercase font-medium tracking-wider">Channel Identifier</div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customTopicInput}
                onChange={(e) => setCustomTopicInput(e.target.value)}
                placeholder="e.g. jasper-jwalant-alerts"
                className="flex-1 bg-black/30 border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono outline-none focus:border-white/20"
              />
              <button
                onClick={handleSaveTopic}
                className="px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 text-xs font-medium rounded-lg border border-white/[0.08] transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>

        {/* CARD 2: LIVE SEVERE WEATHER HAZARD RADAR */}
        <div className="p-5 bg-[#10131d]/50 border border-white/[0.07] rounded-xl flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <CloudRain className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-200">
                  Atmospheric Radar & Hazard Monitor
                </span>
              </div>
              <button
                onClick={handleRefreshWeather}
                disabled={isCheckingWeather}
                className="p-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 transition-all border border-white/[0.06]"
                title="Refresh Weather Status"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingWeather ? 'animate-spin text-slate-300' : ''}`} />
              </button>
            </div>

            {/* Risk Assessment Banner */}
            <div className={`my-3 p-3 rounded-lg border flex items-center justify-between ${
              weatherStatus?.isSevere 
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-200' 
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
            }`}>
              <div className="flex items-center gap-2.5">
                <AlertTriangle className={`w-4 h-4 ${weatherStatus?.isSevere ? 'text-rose-400' : 'text-emerald-400'}`} />
                <div>
                  <div className="text-xs font-medium">
                    {weatherStatus?.isSevere ? `Hazard Active: ${weatherStatus.hazardType}` : 'Atmospheric Conditions Normal'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {weatherStatus?.description || 'Scanning radar telemetry...'}
                  </div>
                </div>
              </div>
            </div>

            {/* Live Weather Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-black/25 rounded-lg border border-white/[0.05]">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-amber-400" /> Temperature
                </div>
                <div className="text-sm font-semibold text-slate-100 mt-0.5">
                  {weatherStatus?.temperature !== undefined ? `${weatherStatus.temperature}°C` : '--'}
                </div>
              </div>

              <div className="p-2.5 bg-black/25 rounded-lg border border-white/[0.05]">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-slate-400" /> Sustained Wind
                </div>
                <div className="text-sm font-semibold text-slate-200 mt-0.5">
                  {weatherStatus?.windSpeed !== undefined ? `${weatherStatus.windSpeed} km/h` : '--'}
                </div>
              </div>

              <div className="p-2.5 bg-black/25 rounded-lg border border-white/[0.05]">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-rose-400" /> Peak Gusts
                </div>
                <div className="text-sm font-semibold text-slate-200 mt-0.5">
                  {weatherStatus?.windGusts !== undefined ? `${weatherStatus.windGusts} km/h` : '--'}
                </div>
              </div>

              <div className="p-2.5 bg-black/25 rounded-lg border border-white/[0.05]">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <CloudRain className="w-3.5 h-3.5 text-indigo-400" /> Precipitation
                </div>
                <div className="text-sm font-semibold text-slate-200 mt-0.5">
                  {weatherStatus?.precipitation !== undefined ? `${weatherStatus.precipitation} mm/h` : '--'}
                </div>
              </div>
            </div>
          </div>

          {/* Autonomous Polling Settings */}
          <div className="mt-4 pt-3.5 border-t border-white/[0.06] text-[11px] text-slate-400 flex items-center justify-between">
            <span>Scan Frequency</span>
            <span className="text-slate-300 font-medium">Every 20m via Open-Meteo GPS</span>
          </div>
        </div>
      </div>

      {/* CARD 3: URGENT MESSAGE KEYWORDS & NOTIFICATION CHANNELS */}
      <div className="p-5 bg-[#10131d]/40 border border-white/[0.07] rounded-xl shadow-sm space-y-3.5">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-200">
              Urgent Message Trigger Keywords
            </span>
          </div>
          <span className="text-[10px] text-slate-500">Triggers lock-screen notification on match</span>
        </div>

        {/* Keyword Pills */}
        <div className="flex flex-wrap gap-2">
          {config.emergencyKeywords.map(word => (
            <span 
              key={word} 
              className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-300 text-xs font-mono font-medium flex items-center gap-1.5"
            >
              <span>{word}</span>
              <button 
                onClick={() => handleRemoveKeyword(word)}
                className="text-slate-500 hover:text-rose-400 transition-colors"
                title="Remove keyword"
              >
                <XCircle className="w-3 h-3" />
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
            placeholder="Add emergency trigger keyword (e.g. DOCTOR, POLICE, FAMILY)..."
            className="flex-1 bg-black/30 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-white/20"
          />
          <button
            type="submit"
            className="px-3.5 py-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Word</span>
          </button>
        </form>

        {/* Sentinel Notification Preferences */}
        <div className="pt-2 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <label className="flex items-center gap-2 p-2.5 rounded-lg bg-black/20 border border-white/[0.06] cursor-pointer hover:border-white/[0.12] transition-colors">
            <input
              type="checkbox"
              checked={config.soundAlertEnabled}
              onChange={() => handleToggleOption('soundAlertEnabled')}
              className="rounded accent-slate-400"
            />
            <Volume2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-300">Audible Alert Chime</span>
          </label>

          <label className="flex items-center gap-2 p-2.5 rounded-lg bg-black/20 border border-white/[0.06] cursor-pointer hover:border-white/[0.12] transition-colors">
            <input
              type="checkbox"
              checked={config.voiceAlertEnabled}
              onChange={() => handleToggleOption('voiceAlertEnabled')}
              className="rounded accent-slate-400"
            />
            <Radio className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-300">Voice Synthesis Alert</span>
          </label>

          <label className="flex items-center gap-2 p-2.5 rounded-lg bg-black/20 border border-white/[0.06] cursor-pointer hover:border-white/[0.12] transition-colors">
            <input
              type="checkbox"
              checked={config.vibrationEnabled}
              onChange={() => handleToggleOption('vibrationEnabled')}
              className="rounded accent-slate-400"
            />
            <Vibrate className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-300">Haptic Vibration</span>
          </label>
        </div>
      </div>

    </div>
  );
}
