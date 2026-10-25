import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Sparkles, Settings, X, Move, Volume2 } from 'lucide-react';
import { 
  getSiriWidgetSettings, 
  saveSiriWidgetSettings, 
  THEME_OPTIONS 
} from '../utils/siriWidgetSettings';
import MobileAssistantOverlay from './MobileAssistantOverlay';
import SiriWidgetSettingsModal from './SiriWidgetSettingsModal';
import { playChime } from './VoiceController';

export default function SiriAssistantWidget() {
  const [settings, setSettings] = useState(getSiriWidgetSettings());
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Widget Coordinates & Dragging
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

  // Key-Hold Detection & Radial Progress
  const [holdProgress, setHoldProgress] = useState(0); // 0 to 100
  const [isKeyHolding, setIsKeyHolding] = useState(false);

  const dragStartRef = useRef({ pointerX: 0, pointerY: 0, startPosX: 0, startPosY: 0 });
  const holdRafRef = useRef(null);
  const holdStartTimeRef = useRef(null);
  const isKeyHoldingRef = useRef(false);

  // Initialize Position & Listen to Settings Changes
  useEffect(() => {
    const initSettings = getSiriWidgetSettings();
    setSettings(initSettings);

    const defaultX = typeof window !== 'undefined' ? window.innerWidth - 84 : 100;
    const defaultY = typeof window !== 'undefined' ? window.innerHeight - 120 : 100;

    const initialX = typeof initSettings.posX === 'number' ? initSettings.posX : defaultX;
    const initialY = typeof initSettings.posY === 'number' ? initSettings.posY : defaultY;
    setPos({ x: initialX, y: initialY });

    const handleSettingsChanged = (e) => {
      if (e.detail) {
        setSettings(e.detail);
        if (typeof e.detail.posX === 'number' && typeof e.detail.posY === 'number') {
          setPos({ x: e.detail.posX, y: e.detail.posY });
        }
      }
    };

    const handleTriggerAssistant = () => {
      setIsAssistantOpen(true);
    };

    const handleOpenSettings = () => {
      setIsSettingsOpen(true);
    };

    window.addEventListener('jasper:siri-settings-changed', handleSettingsChanged);
    window.addEventListener('jasper:trigger-siri-assistant', handleTriggerAssistant);
    window.addEventListener('jasper:open-siri-settings', handleOpenSettings);

    return () => {
      window.removeEventListener('jasper:siri-settings-changed', handleSettingsChanged);
      window.removeEventListener('jasper:trigger-siri-assistant', handleTriggerAssistant);
      window.removeEventListener('jasper:open-siri-settings', handleOpenSettings);
    };
  }, []);

  // Keyboard Hold-To-Activate Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing into text fields or content editable
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }

      // Check if pressed key matches configured trigger key
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

      // Prevent default page scroll on Spacebar hold
      if (targetKey === 'Space') {
        e.preventDefault();
      }

      // If already holding or assistant already open, ignore repeat events
      if (isKeyHoldingRef.current || isAssistantOpen) return;

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
          // Completed hold! Wake assistant!
          isKeyHoldingRef.current = false;
          setIsKeyHolding(false);
          setHoldProgress(0);
          if (settings.soundChime) playChime('wake');
          setIsAssistantOpen(true);
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
  }, [settings.triggerKey, settings.holdSeconds, settings.soundChime, isAssistantOpen]);

  // Pointer Dragging Handlers: Move by holding anywhere from the cursor
  const handlePointerDown = (e) => {
    // Only drag on primary left click
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setHasMoved(false);
    setShowContextMenu(false);

    const startX = e.clientX;
    const startY = e.clientY;
    const startPosX = pos.x;
    const startPosY = pos.y;
    let didMove = false;

    const onPointerMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      if (Math.hypot(dx, dy) > 3) {
        didMove = true;
        setHasMoved(true);
      }

      const widgetSizePx = settings.widgetSize === 'compact' ? 44 : settings.widgetSize === 'large' ? 68 : 56;
      const maxX = Math.max(0, window.innerWidth - widgetSizePx);
      const maxY = Math.max(0, window.innerHeight - widgetSizePx);

      const nextX = Math.max(0, Math.min(maxX, startPosX + dx));
      const nextY = Math.max(0, Math.min(maxY, startPosY + dy));

      setPos({ x: nextX, y: nextY });
    };

    const onPointerUp = (upEvent) => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      setIsDragging(false);

      if (didMove) {
        const dx = upEvent.clientX - startX;
        const dy = upEvent.clientY - startY;
        const widgetSizePx = settings.widgetSize === 'compact' ? 44 : settings.widgetSize === 'large' ? 68 : 56;
        const maxX = Math.max(0, window.innerWidth - widgetSizePx);
        const maxY = Math.max(0, window.innerHeight - widgetSizePx);
        const finalX = Math.max(0, Math.min(maxX, startPosX + dx));
        const finalY = Math.max(0, Math.min(maxY, startPosY + dy));
        saveSiriWidgetSettings({ posX: finalX, posY: finalY });
      } else {
        // Normal click: open assistant
        setIsAssistantOpen(true);
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  // Right-click context menu
  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const activeTheme = THEME_OPTIONS.find(t => t.id === settings.theme) || THEME_OPTIONS[0];
  const widgetDimension = settings.widgetSize === 'compact' ? 'w-11 h-11' : settings.widgetSize === 'large' ? 'w-16 h-16' : 'w-14 h-14';

  return (
    <>
      {/* ── 1. CENTER SCREEN CHARGING HUD (When holding key) ────────────────── */}
      {isKeyHolding && holdProgress > 0 && (
        <div className="fixed inset-0 pointer-events-none z-[99990] flex flex-col items-center justify-center font-sans">
          <div className="bg-black/85 backdrop-blur-xl border border-cyan-500/40 rounded-3xl p-6 flex flex-col items-center gap-3 shadow-[0_0_50px_rgba(0,229,255,0.35)] animate-in zoom-in-95 duration-100">
            <div className="relative w-20 h-20 flex items-center justify-center">
              {/* Radial Progress Ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="42%"
                  className="stroke-cyan-900/60"
                  strokeWidth="4"
                  fill="transparent"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="42%"
                  className="stroke-cyan-400"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * holdProgress) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className={`w-12 h-12 rounded-full ${activeTheme.core} flex items-center justify-center shadow-[0_0_25px_#00e5ff] animate-pulse`}>
                <Mic className="w-6 h-6 text-black" />
              </div>
            </div>

            <div className="text-center">
              <div className="text-sm font-bold text-white tracking-wide uppercase font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                Charging J.A.S.P.E.R. Widget
              </div>
              <div className="text-xs text-cyan-300 font-mono mt-0.5">
                Keep holding {settings.triggerKey}... ({Math.round(holdProgress)}%)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. FLOATING DRAGGABLE HOVERING SIRI WIDGET (CIRCLE ICON ONLY) ────── */}
      {settings.enabled && (
        <div
          style={{
            position: 'fixed',
            left: `${pos.x}px`,
            top: `${pos.y}px`,
            zIndex: 9998,
            touchAction: 'none'
          }}
          onPointerDown={handlePointerDown}
          onContextMenu={handleContextMenu}
          className={`group select-none cursor-grab active:cursor-grabbing rounded-full transition-transform ${
            isDragging ? 'scale-105' : 'hover:scale-105'
          }`}
          title={`JASPER Widget\n• Hold cursor to Move\n• Click to Open\n• Hold ${settings.triggerKey} for ${settings.holdSeconds}s\n• Right-click for Settings`}
        >
          <div 
            className={`relative flex items-center justify-center rounded-full ${widgetDimension}`}
            style={{ 
              boxShadow: `0 0 25px ${activeTheme.glow}` 
            }}
          >
            {/* Concentric Charging Ring SVG (Visible while holding) */}
            {holdProgress > 0 && (
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none scale-110">
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  className="stroke-cyan-400"
                  strokeWidth="3.5"
                  fill="transparent"
                  strokeDasharray="283"
                  strokeDashoffset={283 - (283 * holdProgress) / 100}
                  strokeLinecap="round"
                />
              </svg>
            )}

            {/* Outer Iridescent Spinning Ring */}
            <div className={`absolute inset-0 rounded-full p-[2px] bg-gradient-to-tr ${activeTheme.gradient} animate-spin-slow pointer-events-none`}>
              <div className="w-full h-full bg-[#0a0d14]/90 backdrop-blur-md rounded-full" />
            </div>

            {/* Inner Glowing Orb Core */}
            <div className={`relative z-10 w-3/5 h-3/5 rounded-full ${activeTheme.core} flex items-center justify-center shadow-[0_0_15px_#00e5ff] transition-all pointer-events-none`}>
              <Mic className="w-4 h-4 text-black group-hover:scale-110 transition-transform" />
            </div>

            {/* Subtle Pulse Aura */}
            <div className="absolute inset-0 rounded-full border border-cyan-400/40 animate-ping pointer-events-none opacity-20" />
          </div>
        </div>
      )}

      {/* ── 3. WIDGET CONTEXT MENU (Right-Click) ───────────────────────────── */}
      {showContextMenu && (
        <div
          style={{
            position: 'fixed',
            left: `${Math.min(window.innerWidth - 180, contextMenuPos.x)}px`,
            top: `${Math.min(window.innerHeight - 180, contextMenuPos.y)}px`,
            zIndex: 99999
          }}
          className="w-44 bg-[#141824] border border-cyan-500/30 rounded-xl shadow-2xl p-1.5 text-xs text-gray-200 font-sans animate-in fade-in zoom-in-95"
          onClick={() => setShowContextMenu(false)}
        >
          <button
            onClick={() => setIsAssistantOpen(true)}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-cyan-500/20 text-cyan-300 font-medium text-left"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Open JASPER Widget</span>
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-gray-300 text-left"
          >
            <Settings className="w-3.5 h-3.5 text-indigo-400" />
            <span>Widget Settings</span>
          </button>
          <button
            onClick={() => {
              const defaultX = window.innerWidth - 84;
              const defaultY = window.innerHeight - 120;
              setPos({ x: defaultX, y: defaultY });
              saveSiriWidgetSettings({ posX: defaultX, posY: defaultY });
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-gray-300 text-left"
          >
            <Move className="w-3.5 h-3.5 text-amber-400" />
            <span>Snap to Corner</span>
          </button>
          <div className="my-1 border-t border-white/10" />
          <button
            onClick={() => saveSiriWidgetSettings({ enabled: false })}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-rose-500/20 text-rose-300 text-left"
          >
            <X className="w-3.5 h-3.5" />
            <span>Hide Widget</span>
          </button>
        </div>
      )}

      {/* ── 4. SIRI ASSISTANT OVERLAY BOTTOM SHEET ────────────────────────── */}
      {isAssistantOpen && (
        <MobileAssistantOverlay
          onClose={() => setIsAssistantOpen(false)}
          autoWake={settings.autoWake}
          embedded={true}
        />
      )}

      {/* ── 5. SETTINGS MODAL IN OS MODE ─────────────────────────────────── */}
      <SiriWidgetSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}
