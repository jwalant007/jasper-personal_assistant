import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Terminal, Tv, Cpu, Shield, Sparkles, Smartphone, Monitor, Globe, 
  Activity, X, Minus, Square, Maximize2, RefreshCw, Layout, Layers, Volume2, 
  Zap, Radio, Settings, HelpCircle, HardDrive, Wifi, BatteryCharging
} from 'lucide-react';
import HolographicAnswerModal from './HolographicAnswerModal';
import TvRemoteWidget from './TvRemoteWidget';
import DiagnosticWidget from './DiagnosticWidget';
import PcMasterHubWidget from './PcMasterHubWidget';
import PhoneControlWidget from './PhoneControlWidget';
import SecurityCenterWidget from './SecurityCenterWidget';
import AgenticActionsWidget from './AgenticActionsWidget';

/**
 * DRAGGABLE & RESIZABLE JWALANT BHATT CREATION GLASS OS WINDOW COMPONENT
 */
function OsWindow({ id, title, icon: Icon, defaultPos, defaultSize, zIndex, onFocus, onClose, onMinimize, isMinimized, children }) {
  const [pos, setPos] = useState(defaultPos || { x: 50, y: 70 });
  const [size, setSize] = useState(defaultSize || { w: 640, h: 480 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, w: 0, h: 0 });

  if (isMinimized) return null;

  const handleHeaderMouseDown = (e) => {
    if (e.target.closest('.window-control-btn') || isMaximized) return;
    onFocus(id);
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY, posX: pos.x, posY: pos.y };
  };

  const handleResizeMouseDown = (e) => {
    e.stopPropagation();
    onFocus(id);
    setIsResizing(true);
    resizeStartRef.current = { x: e.clientX, y: e.clientY, w: size.w, h: size.h };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        setPos({
          x: Math.max(10, Math.min(window.innerWidth - 100, dragStartRef.current.posX + dx)),
          y: Math.max(50, Math.min(window.innerHeight - 80, dragStartRef.current.posY + dy))
        });
      } else if (isResizing) {
        const dw = e.clientX - resizeStartRef.current.x;
        const dh = e.clientY - resizeStartRef.current.y;
        setSize({
          w: Math.max(380, resizeStartRef.current.w + dw),
          h: Math.max(280, resizeStartRef.current.h + dh)
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing]);

  const windowStyle = isMaximized ? {
    top: '48px',
    left: '0px',
    width: '100vw',
    height: 'calc(100vh - 105px)',
    zIndex: zIndex + 10
  } : {
    top: `${pos.y}px`,
    left: `${pos.x}px`,
    width: `${size.w}px`,
    height: `${size.h}px`,
    zIndex
  };

  return (
    <div
      onMouseDown={() => onFocus(id)}
      style={windowStyle}
      className="absolute flex flex-col rounded-xl bg-cyan-950/40 border border-cyan-400/40 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] overflow-hidden transition-shadow duration-200"
    >
      {/* Window Header Bar */}
      <div
        onMouseDown={handleHeaderMouseDown}
        className="px-3.5 py-2.5 bg-cyan-950/70 border-b border-cyan-500/30 flex items-center justify-between cursor-move select-none backdrop-blur-xl"
      >
        <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs font-bold uppercase tracking-wider">
          <Icon className="w-4 h-4 text-cyan-400" />
          <span>{title}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onMinimize(id)}
            className="window-control-btn p-1.5 rounded-md text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-200 transition-colors"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="window-control-btn p-1.5 rounded-md text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-200 transition-colors"
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? <Square className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => onClose(id)}
            className="window-control-btn p-1.5 rounded-md text-rose-400 hover:bg-rose-500/20 hover:text-rose-200 transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Window Content Body */}
      <div className="flex-1 overflow-y-auto p-3 text-slate-100 font-sans custom-scrollbar">
        {children}
      </div>

      {/* Resize Handle Grip */}
      {!isMaximized && (
        <div
          onMouseDown={handleResizeMouseDown}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-center justify-center text-cyan-500/60 hover:text-cyan-300"
        >
          <svg className="w-3 h-3" viewBox="0 0 6 6" fill="currentColor">
            <path d="M6 6H4V4h2v2zM6 2H4v2h2V2zM2 6H0V4h2v2z" />
          </svg>
        </div>
      )}
    </div>
  );
}

/**
 * MAIN JASPER OS SPATIAL DESKTOP MANAGEMENT ENVIRONMENT
 */
export default function JasperOsDesktop({ onToggleClassicMode }) {
  const [activeWorkspace, setActiveWorkspace] = useState('lab'); // lab, mission, media, security
  const [openWindows, setOpenWindows] = useState({
    hologram: true,
    diagnostics: true,
    tvRemote: false,
    pcHub: false,
    phoneControl: false,
    security: false,
    agentic: false
  });
  const [minimizedWindows, setMinimizedWindows] = useState({});
  const [activeZIndex, setActiveZIndex] = useState({
    hologram: 10,
    diagnostics: 5,
    tvRemote: 2,
    pcHub: 2,
    phoneControl: 2,
    security: 2,
    agentic: 2
  });
  const [topZ, setTopZ] = useState(20);
  const [showStartMenu, setShowStartMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const bringToTop = (winId) => {
    const nextZ = topZ + 1;
    setTopZ(nextZ);
    setActiveZIndex(prev => ({ ...prev, [winId]: nextZ }));
    setMinimizedWindows(prev => ({ ...prev, [winId]: false }));
  };

  const toggleWindow = (winId) => {
    if (openWindows[winId]) {
      if (minimizedWindows[winId]) {
        bringToTop(winId);
      } else {
        setMinimizedWindows(prev => ({ ...prev, [winId]: true }));
      }
    } else {
      setOpenWindows(prev => ({ ...prev, [winId]: true }));
      bringToTop(winId);
    }
  };

  const closeWindow = (winId) => {
    setOpenWindows(prev => ({ ...prev, [winId]: false }));
  };

  const minimizeWindow = (winId) => {
    setMinimizedWindows(prev => ({ ...prev, [winId]: true }));
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#020612] text-slate-100 font-sans selection:bg-cyan-500/30">
      {/* Dynamic Ambient Background Grid & Stars */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/20 via-slate-950 to-black pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f0ff08_1px,transparent_1px),linear-gradient(to_bottom,#00f0ff08_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* TOP STARK TASKBAR */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-cyan-950/50 border-b border-cyan-500/30 backdrop-blur-2xl z-50 flex items-center justify-between px-4">
        {/* Left: Start Launcher & Workspace Tabs */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowStartMenu(!showStartMenu)}
            className="p-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)]"
            title="J.A.S.P.E.R. Arc Core Start Menu"
          >
            <div className="w-5 h-5 rounded-full border border-cyan-300 flex items-center justify-center animate-pulse">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
            </div>
            <span className="font-orbitron font-extrabold text-xs tracking-wider uppercase text-cyan-200">JASPER OS</span>
          </button>

          <div className="h-4 w-px bg-cyan-500/30 mx-1 hidden sm:block" />

          {/* Workspace Tabs */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { id: 'lab', label: '🌌 3D Hologram Lab' },
              { id: 'mission', label: '📊 Mission Control' },
              { id: 'media', label: '📺 Media Hub' },
              { id: 'security', label: '🛡️ Security & AI' }
            ].map((ws) => (
              <button
                key={ws.id}
                onClick={() => setActiveWorkspace(ws.id)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                  activeWorkspace === ws.id
                    ? 'bg-cyan-500/25 border border-cyan-400/60 text-cyan-200 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                    : 'text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/40'
                }`}
              >
                {ws.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Live Telemetry Badges & Mode Switcher */}
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <div className="hidden lg:flex items-center gap-3 text-slate-300 bg-cyan-950/40 border border-cyan-500/30 px-3 py-1 rounded-lg backdrop-blur-md">
            <span className="flex items-center gap-1 text-cyan-400"><Cpu className="w-3.5 h-3.5" /> CPU: 14%</span>
            <span className="flex items-center gap-1 text-cyan-400"><HardDrive className="w-3.5 h-3.5" /> RAM: 4.1GB</span>
            <span className="flex items-center gap-1 text-cyan-400"><Wifi className="w-3.5 h-3.5" /> NET: 1.2G</span>
          </div>

          <button
            onClick={onToggleClassicMode}
            className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-300 rounded-lg font-semibold flex items-center gap-1.5 transition-all text-xs"
            title="Switch to Classic Grid Layout"
          >
            <Layout className="w-3.5 h-3.5 text-cyan-400" /> Classic View
          </button>

          <div className="text-cyan-200 font-bold px-2.5 py-1 bg-cyan-950/50 border border-cyan-500/30 rounded-lg">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>
      </div>

      {/* ARC CORE START LAUNCHER MENU DROPDOWN */}
      {showStartMenu && (
        <div className="absolute top-14 left-4 w-72 bg-cyan-950/90 border border-cyan-400/60 rounded-2xl p-4 shadow-[0_0_40px_rgba(0,240,255,0.3)] backdrop-blur-3xl z-50 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3 border-b border-cyan-500/30 pb-3 mb-3">
            <div className="p-2 bg-cyan-500/20 border border-cyan-400 rounded-xl text-cyan-300">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-orbitron font-extrabold text-sm text-cyan-200 uppercase">J.A.S.P.E.R. OS v4.2</h3>
              <p className="text-[10px] text-slate-400 font-mono">JWALANT BHATT CREATION OS Environment</p>
            </div>
          </div>

          <div className="space-y-1">
            {[
              { id: 'hologram', label: '3D/4D Hologram Blueprint Lab', icon: Box },
              { id: 'diagnostics', label: 'System Diagnostics Telemetry', icon: Activity },
              { id: 'tvRemote', label: 'Smart TV Control Hub', icon: Tv },
              { id: 'pcHub', label: 'PC Master Command Center', icon: Monitor },
              { id: 'phoneControl', label: 'Mobile Android Bridge', icon: Smartphone },
              { id: 'security', label: 'Security & Biometrics', icon: Shield },
              { id: 'agentic', label: 'Agentic Shell Actions', icon: Terminal }
            ].map((app) => (
              <button
                key={app.id}
                onClick={() => {
                  toggleWindow(app.id);
                  setShowStartMenu(false);
                }}
                className="w-full px-3 py-2 rounded-xl text-xs font-mono flex items-center justify-between text-slate-200 hover:bg-cyan-500/25 hover:text-cyan-200 transition-all border border-transparent hover:border-cyan-500/40"
              >
                <span className="flex items-center gap-2">
                  <app.icon className="w-4 h-4 text-cyan-400" /> {app.label}
                </span>
                {openWindows[app.id] && !minimizedWindows[app.id] && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#00f0ff]" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* DESKTOP DESK AREA WITH FLOATING WINDOWS */}
      <div className="relative w-full h-[calc(100vh-105px)] top-12">
        {/* 1. Hologram 3D/4D Lab Window */}
        {openWindows.hologram && (
          <OsWindow
            id="hologram"
            title="🌌 3D/4D JWALANT BHATT CREATION Blueprint Suite"
            icon={Box}
            defaultPos={{ x: 340, y: 20 }}
            defaultSize={{ w: 780, h: 560 }}
            zIndex={activeZIndex.hologram}
            onFocus={bringToTop}
            onClose={closeWindow}
            onMinimize={minimizeWindow}
            isMinimized={minimizedWindows.hologram}
          >
            <HolographicAnswerModal initialQuery="Iron Man Arc Reactor core" />
          </OsWindow>
        )}

        {/* 2. System Diagnostics Window */}
        {openWindows.diagnostics && (
          <OsWindow
            id="diagnostics"
            title="📊 PC System Telemetry & Health"
            icon={Activity}
            defaultPos={{ x: 20, y: 20 }}
            defaultSize={{ w: 420, h: 480 }}
            zIndex={activeZIndex.diagnostics}
            onFocus={bringToTop}
            onClose={closeWindow}
            onMinimize={minimizeWindow}
            isMinimized={minimizedWindows.diagnostics}
          >
            <DiagnosticWidget />
          </OsWindow>
        )}

        {/* 3. TV Remote Control Window */}
        {openWindows.tvRemote && (
          <OsWindow
            id="tvRemote"
            title="📺 Smart TV Remote Hub"
            icon={Tv}
            defaultPos={{ x: 40, y: 180 }}
            defaultSize={{ w: 380, h: 460 }}
            zIndex={activeZIndex.tvRemote}
            onFocus={bringToTop}
            onClose={closeWindow}
            onMinimize={minimizeWindow}
            isMinimized={minimizedWindows.tvRemote}
          >
            <TvRemoteWidget />
          </OsWindow>
        )}

        {/* 4. PC Master Command Window */}
        {openWindows.pcHub && (
          <OsWindow
            id="pcHub"
            title="💻 PC Master Command Center"
            icon={Monitor}
            defaultPos={{ x: 440, y: 80 }}
            defaultSize={{ w: 580, h: 460 }}
            zIndex={activeZIndex.pcHub}
            onFocus={bringToTop}
            onClose={closeWindow}
            onMinimize={minimizeWindow}
            isMinimized={minimizedWindows.pcHub}
          >
            <PcMasterHubWidget />
          </OsWindow>
        )}

        {/* 5. Mobile Phone Control Window */}
        {openWindows.phoneControl && (
          <OsWindow
            id="phoneControl"
            title="📱 Android Phone Bridge"
            icon={Smartphone}
            defaultPos={{ x: 120, y: 120 }}
            defaultSize={{ w: 420, h: 440 }}
            zIndex={activeZIndex.phoneControl}
            onFocus={bringToTop}
            onClose={closeWindow}
            onMinimize={minimizeWindow}
            isMinimized={minimizedWindows.phoneControl}
          >
            <PhoneControlWidget />
          </OsWindow>
        )}

        {/* 6. Security Center Window */}
        {openWindows.security && (
          <OsWindow
            id="security"
            title="🛡️ Biometric Security Suite"
            icon={Shield}
            defaultPos={{ x: 220, y: 140 }}
            defaultSize={{ w: 460, h: 480 }}
            zIndex={activeZIndex.security}
            onFocus={bringToTop}
            onClose={closeWindow}
            onMinimize={minimizeWindow}
            isMinimized={minimizedWindows.security}
          >
            <SecurityCenterWidget />
          </OsWindow>
        )}

        {/* 7. Agentic Actions Shell Window */}
        {openWindows.agentic && (
          <OsWindow
            id="agentic"
            title="⚡ Agentic Shell Actions"
            icon={Terminal}
            defaultPos={{ x: 300, y: 160 }}
            defaultSize={{ w: 540, h: 460 }}
            zIndex={activeZIndex.agentic}
            onFocus={bringToTop}
            onClose={closeWindow}
            onMinimize={minimizeWindow}
            isMinimized={minimizedWindows.agentic}
          >
            <AgenticActionsWidget />
          </OsWindow>
        )}
      </div>

      {/* BOTTOM FLOATING DOCK & LAUNCHER BAR */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 h-14 bg-cyan-950/60 border border-cyan-500/40 rounded-2xl px-4 flex items-center gap-2 backdrop-blur-2xl shadow-[0_10px_35px_rgba(0,240,255,0.25)] z-50">
        {[
          { id: 'hologram', label: '3D Hologram', icon: Box },
          { id: 'diagnostics', label: 'Diagnostics', icon: Activity },
          { id: 'tvRemote', label: 'TV Remote', icon: Tv },
          { id: 'pcHub', label: 'PC Hub', icon: Monitor },
          { id: 'phoneControl', label: 'Phone', icon: Smartphone },
          { id: 'security', label: 'Security', icon: Shield },
          { id: 'agentic', label: 'Agentic Shell', icon: Terminal }
        ].map((app) => (
          <button
            key={app.id}
            onClick={() => toggleWindow(app.id)}
            className={`relative p-2.5 rounded-xl flex items-center justify-center transition-all ${
              openWindows[app.id] && !minimizedWindows[app.id]
                ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(0,240,255,0.3)] scale-105'
                : 'text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/50 border border-transparent'
            }`}
            title={app.label}
          >
            <app.icon className="w-5 h-5" />
            {openWindows[app.id] && (
              <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
