import React, { useState, useEffect } from 'react';
import { 
  Settings, X, Sparkles, Mic, Volume2, Move, Clock, Keyboard, 
  RotateCcw, Sliders, CheckCircle2, Eye, EyeOff, Palette, Laptop
} from 'lucide-react';
import { 
  getSiriWidgetSettings, 
  saveSiriWidgetSettings, 
  HOTKEY_OPTIONS, 
  THEME_OPTIONS,
  DEFAULT_SIRI_SETTINGS
} from '../utils/siriWidgetSettings';
import { playChime } from './VoiceController';

export default function SiriWidgetSettingsModal({ isOpen, onClose }) {
  const [settings, setSettings] = useState(getSiriWidgetSettings());
  const [testHoldProgress, setTestHoldProgress] = useState(0);
  const [isTestHolding, setIsTestHolding] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(getSiriWidgetSettings());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const updateSetting = (key, value) => {
    const updated = saveSiriWidgetSettings({ [key]: value });
    if (updated) setSettings(updated);
  };

  const handleResetPosition = () => {
    const defaultX = typeof window !== 'undefined' ? window.innerWidth - 84 : 200;
    const defaultY = typeof window !== 'undefined' ? window.innerHeight - 120 : 200;
    updateSetting('posX', defaultX);
    updateSetting('posY', defaultY);
    if (settings.soundChime) playChime('success');
  };

  const handleRestoreDefaults = () => {
    saveSiriWidgetSettings(DEFAULT_SIRI_SETTINGS);
    setSettings(DEFAULT_SIRI_SETTINGS);
    if (DEFAULT_SIRI_SETTINGS.soundChime) playChime('success');
  };

  const activeTheme = THEME_OPTIONS.find(t => t.id === settings.theme) || THEME_OPTIONS[0];

  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 font-sans text-white"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-[#121620] border border-cyan-500/30 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-pink-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(0,229,255,0.25)]">
              <Sparkles className="w-5 h-5 text-cyan-300 animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                Siri Assistant & Hotkey Settings
                <span className="text-[10px] font-mono uppercase bg-cyan-950/60 text-cyan-400 border border-cyan-800/60 px-2 py-0.5 rounded-full">
                  OS Mode
                </span>
              </h3>
              <p className="text-[11px] text-gray-400">
                Configure keyboard hold-to-activate trigger & floating draggable widget
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            title="Close Settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-gray-300">
          
          {/* Section 1: Floating Widget Toggle & Preview */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Live Preview Orb */}
              <div 
                className={`relative flex items-center justify-center shrink-0 cursor-pointer rounded-full transition-all duration-300 ${
                  settings.widgetSize === 'compact' ? 'w-11 h-11' :
                  settings.widgetSize === 'large' ? 'w-16 h-16' : 'w-14 h-14'
                }`}
                style={{ boxShadow: `0 0 25px ${activeTheme.glow}` }}
                onMouseDown={() => {
                  setIsTestHolding(true);
                  let current = 0;
                  const step = 100 / (settings.holdSeconds * 30);
                  const interval = setInterval(() => {
                    current += step;
                    if (current >= 100) {
                      clearInterval(interval);
                      setTestHoldProgress(100);
                      setIsTestHolding(false);
                      if (settings.soundChime) playChime('wake');
                    } else {
                      setTestHoldProgress(current);
                    }
                  }, 33);
                }}
                onMouseUp={() => {
                  setIsTestHolding(false);
                  setTestHoldProgress(0);
                }}
                title="Click & hold to test wake activation"
              >
                {/* Radial progress border when holding */}
                {testHoldProgress > 0 && (
                  <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="45%"
                      className="stroke-cyan-400"
                      strokeWidth="3"
                      fill="transparent"
                      strokeDasharray="283"
                      strokeDashoffset={283 - (283 * testHoldProgress) / 100}
                    />
                  </svg>
                )}
                <div className={`w-full h-full rounded-full p-[2px] bg-gradient-to-tr ${activeTheme.gradient} animate-spin-slow`}>
                  <div className="w-full h-full bg-[#07090e] rounded-full flex items-center justify-center">
                    <div className={`w-3/5 h-3/5 rounded-full ${activeTheme.core} flex items-center justify-center shadow-[0_0_15px_#00e5ff]`}>
                      <Mic className="w-3.5 h-3.5 text-black" />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="font-semibold text-white flex items-center gap-2">
                  <span>Hovering Draggable Siri Widget</span>
                  {settings.enabled ? (
                    <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.5 rounded">Active</span>
                  ) : (
                    <span className="text-[10px] text-gray-500 font-mono bg-gray-900 border border-gray-700 px-1.5 py-0.5 rounded">Hidden</span>
                  )}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                  Always-accessible floating orb. Freely click & drag it to any corner of your screen.
                </div>
              </div>
            </div>

            <button
              onClick={() => updateSetting('enabled', !settings.enabled)}
              className={`px-4 py-2 rounded-xl font-medium text-xs transition-all cursor-pointer whitespace-nowrap ${
                settings.enabled
                  ? 'bg-cyan-500 text-black font-bold shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                  : 'bg-white/10 text-gray-400 hover:text-white'
              }`}
            >
              {settings.enabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Section 2: Keyboard Hold-to-Activate Trigger */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-white flex items-center gap-1.5">
                <Keyboard className="w-4 h-4 text-cyan-400" />
                Keyboard Hold Trigger Key
              </label>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded-full">
                Keep key pressed
              </span>
            </div>
            
            <p className="text-[11px] text-gray-400">
              Select which key triggers the Siri assistant when held down for a few seconds outside of text inputs.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {HOTKEY_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => updateSetting('triggerKey', opt.key)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    settings.triggerKey === opt.key
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(0,229,255,0.2)]'
                      : 'bg-black/40 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  <div className="font-mono font-bold text-xs flex items-center justify-between">
                    <span>{opt.label}</span>
                    {settings.triggerKey === opt.key && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1 truncate">{opt.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Hold Duration Slider */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                Hold Duration Before Activation
              </label>
              <span className="text-xs font-mono font-bold text-amber-400">
                {settings.holdSeconds} seconds
              </span>
            </div>

            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0.8"
                max="3.0"
                step="0.1"
                value={settings.holdSeconds}
                onChange={(e) => updateSetting('holdSeconds', parseFloat(e.target.value))}
                className="flex-1 accent-cyan-400 cursor-pointer h-1.5 bg-black/60 rounded-lg"
              />
            </div>

            <div className="flex justify-between text-[10px] font-mono text-gray-500">
              <span>0.8s (Fastest)</span>
              <span>1.5s (Recommended)</span>
              <span>3.0s (Deliberate)</span>
            </div>
          </div>

          {/* Section 4: Widget Size & Theme */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Widget Size */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
              <label className="font-semibold text-white flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-indigo-400" />
                Orb Widget Size
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'compact', label: 'Compact', desc: '44px' },
                  { id: 'standard', label: 'Standard', desc: '56px' },
                  { id: 'large', label: 'Large', desc: '68px' }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => updateSetting('widgetSize', s.id)}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      settings.widgetSize === s.id
                        ? 'bg-indigo-500/20 border-indigo-400 text-indigo-200'
                        : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="font-semibold text-xs">{s.label}</div>
                    <div className="text-[10px] font-mono text-gray-500">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Orb Theme */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
              <label className="font-semibold text-white flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-pink-400" />
                Glow Aura & Theme
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {THEME_OPTIONS.map((th) => (
                  <button
                    key={th.id}
                    onClick={() => updateSetting('theme', th.id)}
                    className={`p-1.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      settings.theme === th.id
                        ? 'border-cyan-400 bg-white/10 shadow-[0_0_10px_rgba(0,229,255,0.3)]'
                        : 'border-white/10 bg-black/40 hover:border-white/20'
                    }`}
                    title={th.name}
                  >
                    <div className={`w-5 h-5 rounded-full bg-gradient-to-tr ${th.gradient}`} />
                    <span className="text-[9px] text-gray-300 truncate w-full text-center">
                      {th.name.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 5: Audio & Behavior Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Auto Wake Mic */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="font-semibold text-white text-xs">Auto-Wake Mic</div>
                  <div className="text-[10px] text-gray-400">Listen immediately on trigger</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.autoWake}
                onChange={(e) => updateSetting('autoWake', e.target.checked)}
                className="w-4 h-4 accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Sound Chime */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="font-semibold text-white text-xs">Wake Sound Chime</div>
                  <div className="text-[10px] text-gray-400">Play futuristic chime tone</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.soundChime}
                onChange={(e) => updateSetting('soundChime', e.target.checked)}
                className="w-4 h-4 accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Section 6: Native Windows Desktop Mode */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-purple-950/20 to-black/60 border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold text-white text-xs">
                  Native Windows Desktop Overlay (Always-On)
                </span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 border border-cyan-700/60 px-2 py-0.5 rounded-full">
                Windows System-Wide
              </span>
            </div>
            
            <p className="text-[11px] text-gray-300 leading-relaxed">
              Want the Siri Orb floating on your Windows desktop 24/7 above all apps (VS Code, Chrome, Games, Desktop) even when Jasper is closed?
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex flex-col justify-between gap-2">
                <div>
                  <div className="font-bold text-xs text-white">1-Click Desktop Launcher</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Runs transparent widget on Windows desktop</div>
                </div>
                <div className="text-[10px] font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-900/60 p-1.5 rounded-lg">
                  Launch_AlwaysOn_Desktop_Siri.bat
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex flex-col justify-between gap-2">
                <div>
                  <div className="font-bold text-xs text-white">Start With Windows Boot</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Auto-starts floating orb on laptop startup</div>
                </div>
                <div className="text-[10px] font-mono text-amber-300 bg-amber-950/40 border border-amber-900/60 p-1.5 rounded-lg">
                  Setup_Siri_AutoStart_With_Windows.bat
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Toolbar */}
        <div className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetPosition}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs transition-colors cursor-pointer"
              title="Snap floating widget back to bottom-right corner"
            >
              <Move className="w-3.5 h-3.5 text-cyan-400" />
              <span>Reset Position</span>
            </button>
            <button
              onClick={handleRestoreDefaults}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white text-xs transition-colors cursor-pointer"
              title="Restore factory default settings"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Defaults</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
