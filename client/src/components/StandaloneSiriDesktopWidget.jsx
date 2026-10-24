import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Sparkles, Settings, X, Maximize2, Move, Volume2, Power } from 'lucide-react';
import { 
  getSiriWidgetSettings, 
  saveSiriWidgetSettings, 
  THEME_OPTIONS 
} from '../utils/siriWidgetSettings';
import MobileAssistantOverlay from './MobileAssistantOverlay';
import SiriWidgetSettingsModal from './SiriWidgetSettingsModal';
import { playChime } from './VoiceController';

export default function StandaloneSiriDesktopWidget() {
  const [settings, setSettings] = useState(getSiriWidgetSettings());
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

  // Key Hold Detection & Radial Progress
  const [holdProgress, setHoldProgress] = useState(0);
  const [isKeyHolding, setIsKeyHolding] = useState(false);

  // Position Tracking for Anchored Resizing
  const lastOrbPosRef = useRef({ x: null, y: null });
  const holdRafRef = useRef(null);
  const holdStartTimeRef = useRef(null);
  const isKeyHoldingRef = useRef(false);

  // Sync settings and listen for global events
  useEffect(() => {
    const s = getSiriWidgetSettings();
    setSettings(s);

    const handleSettingsChange = (e) => {
      if (e.detail) setSettings(e.detail);
    };

    window.addEventListener('jasper:siri-settings-changed', handleSettingsChange);
    return () => window.removeEventListener('jasper:siri-settings-changed', handleSettingsChange);
  }, []);

  // Listen for Global Hotkey from Electron (e.g., CommandOrControl+Alt+J or Ctrl+Space)
  useEffect(() => {
    if (window.jasperElectron?.onToggleCommandBar) {
      const unsub = window.jasperElectron.onToggleCommandBar(() => {
        expandWidget();
      });
      return unsub;
    }
  }, []);

  // Listen for Wake Word from Electron
  useEffect(() => {
    if (window.jasperElectron?.onWakeDetected) {
      const unsub = window.jasperElectron.onWakeDetected(() => {
        expandWidget();
      });
      return unsub;
    }
  }, []);

  // Expand Widget into Full Siri Assistant Bottom Sheet
  const expandWidget = useCallback(() => {
    setIsExpanded(true);
    setShowContextMenu(false);

    if (window.jasperElectron?.resizeFloatingBar) {
      const targetW = 440;
      const targetH = 620;
      const screenW = window.screen.availWidth || 1920;
      const screenH = window.screen.availHeight || 1080;

      // Position bottom-right by default or near the orb's anchor
      const targetX = Math.max(20, screenW - targetW - 30);
      const targetY = Math.max(20, screenH - targetH - 30);

      window.jasperElectron.resizeFloatingBar({
        width: targetW,
        height: targetH,
        x: targetX,
        y: targetY
      });
    }
  }, []);

  // Collapse Widget back to Compact Hovering Siri Orb
  const collapseWidget = useCallback(() => {
    setIsExpanded(false);
    setShowSettingsModal(false);

    if (window.jasperElectron?.resizeFloatingBar) {
      const orbSize = 84;
      const screenW = window.screen.availWidth || 1920;
      const screenH = window.screen.availHeight || 1080;

      const targetX = Math.max(20, screenW - orbSize - 40);
      const targetY = Math.max(20, screenH - orbSize - 60);

      window.jasperElectron.resizeFloatingBar({
        width: orbSize,
        height: orbSize,
        x: targetX,
        y: targetY
      });
    }
  }, []);

  // Keyboard Hold-to-Activate Detection (Push-to-Talk)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }

      const targetKey = settings.triggerKey || 'Space';
      let matches = false;

      if (targetKey === 'Space' && (e.code === 'Space' || e.key === ' ')) {
        matches = true;
      } else if (targetKey === 'Alt' && (e.key === 'Alt' || e.code.startsWith('Alt'))) {
        matches = true;
      } else if (targetKey === 'Control' && (e.key === 'Control' || e.code.startsWith('Control'))) {
        matches = true;
      } else if (targetKey === 'Backquote' && (e.code === 'Backquote' || e.key === '`')) {
        matches = true;
      } else if (targetKey === 'F8' && e.key === 'F8') {
        matches = true;
      } else if (targetKey === 'KeyJ' && (e.code === 'KeyJ' || e.key.toLowerCase() === 'j')) {
        matches = true;
      }

      if (!matches) return;

      if (targetKey === 'Space') {
        e.preventDefault();
      }

      if (isKeyHoldingRef.current || isExpanded) return;

      isKeyHoldingRef.current = true;
      setIsKeyHolding(true);
      holdStartTimeRef.current = Date.now();
      const requiredDuration = (settings.holdSeconds || 1.5) * 1000;

      const loop = () => {
        if (!isKeyHoldingRef.current) return;
        const elapsed = Date.now() - holdStartTimeRef.current;
        const pct = Math.min(100, (elapsed / requiredDuration) * 100);
        setHoldProgress(pct);

        if (pct >= 100) {
          isKeyHoldingRef.current = false;
          setIsKeyHolding(false);
          setHoldProgress(0);
          if (settings.soundChime) playChime('wake');
          expandWidget();
        } else {
          holdRafRef.current = requestAnimationFrame(loop);
        }
      };

      holdRafRef.current = requestAnimationFrame(loop);
    };

    const handleKeyUp = (e) => {
      const targetKey = settings.triggerKey || 'Space';
      let matches = false;

      if (targetKey === 'Space' && (e.code === 'Space' || e.key === ' ')) {
        matches = true;
      } else if (targetKey === 'Alt' && (e.key === 'Alt' || e.code.startsWith('Alt'))) {
        matches = true;
      } else if (targetKey === 'Control' && (e.key === 'Control' || e.code.startsWith('Control'))) {
        matches = true;
      } else if (targetKey === 'Backquote' && (e.code === 'Backquote' || e.key === '`')) {
        matches = true;
      } else if (targetKey === 'F8' && e.key === 'F8') {
        matches = true;
      } else if (targetKey === 'KeyJ' && (e.code === 'KeyJ' || e.key.toLowerCase() === 'j')) {
        matches = true;
      }

      if (matches) {
        isKeyHoldingRef.current = false;
        setIsKeyHolding(false);
        setHoldProgress(0);
        if (holdRafRef.current) cancelAnimationFrame(holdRafRef.current);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (holdRafRef.current) cancelAnimationFrame(holdRafRef.current);
    };
  }, [settings.triggerKey, settings.holdSeconds, settings.soundChime, isExpanded, expandWidget]);

  const activeTheme = THEME_OPTIONS.find(t => t.id === settings.theme) || THEME_OPTIONS[0];

  // ── 1. EXPANDED ASSISTANT CARD ─────────────────────────────────────────────
  if (isExpanded) {
    return (
      <div className="w-screen h-screen flex flex-col justify-end bg-transparent font-sans text-white select-none overflow-hidden">
        <MobileAssistantOverlay
          onClose={collapseWidget}
          autoWake={settings.autoWake}
          embedded={true}
        />
        {showSettingsModal && (
          <SiriWidgetSettingsModal
            isOpen={showSettingsModal}
            onClose={() => setShowSettingsModal(false)}
          />
        )}
      </div>
    );
  }

  // ── 2. COMPACT HOVERING SIRI ORB (84x84) ───────────────────────────────────
  return (
    <div 
      className="w-full h-full flex items-center justify-center bg-transparent select-none p-1 overflow-hidden"
      style={{ WebkitAppRegion: 'drag' }}
    >
      <div
        style={{ WebkitAppRegion: 'no-drag' }}
        onClick={expandWidget}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowContextMenu(true);
          setContextMenuPos({ x: e.clientX, y: e.clientY });
        }}
        className="relative w-16 h-16 flex items-center justify-center cursor-pointer group"
        title={`J.A.S.P.E.R. Siri Assistant (Windows Overlay)\n• Click to Open\n• Hold ${settings.triggerKey} for ${settings.holdSeconds}s\n• Right-click for Options`}
      >
        {/* Glow Shadow */}
        <div 
          className="absolute inset-0 rounded-full blur-md transition-all duration-300 group-hover:scale-125"
          style={{ background: activeTheme.glow }}
        />

        {/* Concentric Charging Progress Arc (When Holding Key) */}
        {holdProgress > 0 && (
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none scale-125">
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              className="stroke-cyan-400"
              strokeWidth="4"
              fill="transparent"
              strokeDasharray="283"
              strokeDashoffset={283 - (283 * holdProgress) / 100}
              strokeLinecap="round"
            />
          </svg>
        )}

        {/* Outer Iridescent Spinning Ring */}
        <div className={`absolute inset-0 rounded-full p-[2px] bg-gradient-to-tr ${activeTheme.gradient} animate-spin-slow`}>
          <div className="w-full h-full bg-[#0a0d14]/90 rounded-full" />
        </div>

        {/* Inner Glowing Core */}
        <div className={`relative z-10 w-9 h-9 rounded-full ${activeTheme.core} flex items-center justify-center shadow-[0_0_15px_#00e5ff] group-hover:scale-110 transition-transform`}>
          <Mic className="w-4 h-4 text-black" />
        </div>

        {/* Subtle Idle Pulse */}
        <div className="absolute inset-0 rounded-full border border-cyan-400/40 animate-ping pointer-events-none opacity-25" />
      </div>

      {/* Right-Click Context Menu */}
      {showContextMenu && (
        <div
          style={{
            WebkitAppRegion: 'no-drag',
            position: 'fixed',
            left: '4px',
            bottom: '4px',
            zIndex: 99999
          }}
          className="w-44 bg-[#141824] border border-cyan-500/30 rounded-xl shadow-2xl p-1.5 text-xs text-gray-200 font-sans"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={expandWidget}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-cyan-500/20 text-cyan-300 font-medium text-left"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Open Assistant</span>
          </button>
          
          {window.jasperElectron?.openMainWindow && (
            <button
              onClick={() => {
                setShowContextMenu(false);
                window.jasperElectron.openMainWindow();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-gray-300 text-left"
            >
              <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Full J.A.S.P.E.R. HUD</span>
            </button>
          )}

          <button
            onClick={() => {
              setShowContextMenu(false);
              expandWidget();
              setShowSettingsModal(true);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-gray-300 text-left"
          >
            <Settings className="w-3.5 h-3.5 text-pink-400" />
            <span>Settings</span>
          </button>

          <div className="my-1 border-t border-white/10" />

          <button
            onClick={() => {
              setShowContextMenu(false);
              if (window.jasperElectron?.hideFloatingBar) {
                window.jasperElectron.hideFloatingBar();
              }
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-rose-500/20 text-rose-300 text-left"
          >
            <X className="w-3.5 h-3.5" />
            <span>Hide to Tray</span>
          </button>
        </div>
      )}
    </div>
  );
}
