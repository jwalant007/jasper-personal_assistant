import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Terminal, Tv, Cpu, Shield, Sparkles, Smartphone, Monitor, Globe, 
  Activity, X, Minus, Square, Maximize2, RefreshCw, Layout, Layers, Volume2, 
  Zap, Radio, Settings, HelpCircle, HardDrive, Wifi, BatteryCharging, Search,
  Bot, Palette, Music, Workflow, BarChart3, Brain, Store, Trophy, MapPin, Heart, Languages, BookOpen, Laptop, Grid, AppWindow
} from 'lucide-react';

import HolographicAnswerModal from './HolographicAnswerModal';
import TvRemoteWidget from './TvRemoteWidget';
import DiagnosticWidget from './DiagnosticWidget';
import PcMasterHubWidget from './PcMasterHubWidget';
import PhoneControlWidget from './PhoneControlWidget';
import SecurityCenterWidget from './SecurityCenterWidget';
import AgenticActionsWidget from './AgenticActionsWidget';
import BrowserAgentWidget from './BrowserAgentWidget';
import AiMasterHubWidget from './AiMasterHubWidget';
import ImageGeneratorWidget from './ImageGeneratorWidget';
import MusicMasterHubWidget from './MusicMasterHubWidget';
import DevicesMasterHubWidget from './DevicesMasterHubWidget';
import PersonalAssistantWidget from './PersonalAssistantWidget';
import MemoryDashboardWidget from './MemoryDashboardWidget';
import SkillsStoreWidget from './SkillsStoreWidget';
import AnalyticsWidget from './AnalyticsWidget';
import AutomationBuilderWidget from './AutomationBuilderWidget';
import MissionControlWidget from './MissionControlWidget';
import SportsHubWidget from './SportsHubWidget';
import MapsWidget from './MapsWidget';
import HealthFitbandWidget from './HealthFitbandWidget';
import LiveTranslationWidget from './LiveTranslationWidget';
import UserManualWidget from './UserManualWidget';
import JasperSearchApp from './JasperSearchApp';
import JasperBrowserApp from './JasperBrowserApp';
import JasperFileManagerApp from './JasperFileManagerApp';
import JasperCodeStudioApp from './JasperCodeStudioApp';
import JasperNotesPlannerApp from './JasperNotesPlannerApp';
import JasperCalculatorApp from './JasperCalculatorApp';
import { Calculator, FileCode, Compass } from 'lucide-react';

/**
 * ALL NATIVE JASPER OS APPLICATIONS REGISTRY (29 NATIVE APPS)
 */
const JASPER_OS_APPS_REGISTRY = [
  { id: 'jasperBrowser', title: 'JASPER Browser App', category: 'Productivity & Tools', icon: Compass, component: JasperBrowserApp, defaultSize: { w: 820, h: 580 } },
  { id: 'searchEngine', title: 'JASPER AI Search Engine App', category: 'Productivity & Tools', icon: Search, component: JasperSearchApp, defaultSize: { w: 760, h: 560 } },
  { id: 'fileManager', title: 'JASPER OS File Explorer & Disk App', category: 'System & Hardware', icon: HardDrive, component: JasperFileManagerApp, defaultSize: { w: 680, h: 500 } },
  { id: 'codeStudio', title: 'JASPER Code Studio & Terminal App', category: 'Productivity & Tools', icon: FileCode, component: JasperCodeStudioApp, defaultSize: { w: 780, h: 540 } },
  { id: 'notesPlanner', title: 'JASPER AI Notes & Task Planner App', category: 'Productivity & Tools', icon: BookOpen, component: JasperNotesPlannerApp, defaultSize: { w: 720, h: 520 } },
  { id: 'calculator', title: 'JASPER Scientific Calculator App', category: 'Productivity & Tools', icon: Calculator, component: JasperCalculatorApp, defaultSize: { w: 640, h: 500 } },
  { id: 'hologram', title: '3D/4D Blueprint Studio App', category: 'Creative & AI', icon: Box, component: HolographicAnswerModal, defaultSize: { w: 800, h: 560 } },
  { id: 'diagnostics', title: 'System Diagnostics & Telemetry App', category: 'System & Hardware', icon: Activity, component: DiagnosticWidget, defaultSize: { w: 450, h: 500 } },
  { id: 'tvRemote', title: 'Smart TV Controller App', category: 'Hardware Control', icon: Tv, component: TvRemoteWidget, defaultSize: { w: 400, h: 480 } },
  { id: 'pcHub', title: 'PC Command Center App', category: 'Hardware Control', icon: Monitor, component: PcMasterHubWidget, defaultSize: { w: 640, h: 500 } },
  { id: 'phoneControl', title: 'Android Device Link App', category: 'Hardware Control', icon: Smartphone, component: PhoneControlWidget, defaultSize: { w: 440, h: 480 } },
  { id: 'security', title: 'Biometric Security & Firewall App', category: 'System & Hardware', icon: Shield, component: SecurityCenterWidget, defaultSize: { w: 480, h: 500 } },
  { id: 'agentic', title: 'Agentic Shell Actions App', category: 'AI & Intelligence', icon: Terminal, component: AgenticActionsWidget, defaultSize: { w: 580, h: 480 } },
  { id: 'browserAgent', title: 'Autonomous Web Browser App', category: 'AI & Intelligence', icon: Globe, component: BrowserAgentWidget, defaultSize: { w: 720, h: 540 } },
  { id: 'aiMasterHub', title: 'AI Swarm & Intelligence Hub App', category: 'AI & Intelligence', icon: Brain, component: AiMasterHubWidget, defaultSize: { w: 680, h: 520 } },
  { id: 'imageStudio', title: 'AI Image Generator Studio App', category: 'Creative & AI', icon: Palette, component: ImageGeneratorWidget, defaultSize: { w: 620, h: 520 } },
  { id: 'musicHub', title: 'Music & Audio Master App', category: 'Media & Life', icon: Music, component: MusicMasterHubWidget, defaultSize: { w: 540, h: 480 } },
  { id: 'devicesHub', title: 'Smart Devices Hub App', category: 'Hardware Control', icon: Laptop, component: DevicesMasterHubWidget, defaultSize: { w: 580, h: 480 } },
  { id: 'personalAssistant', title: 'Personal AI Assistant App', category: 'AI & Intelligence', icon: Bot, component: PersonalAssistantWidget, defaultSize: { w: 640, h: 520 } },
  { id: 'vectorMemory', title: 'Semantic Vector Memory App', category: 'System & Hardware', icon: HardDrive, component: MemoryDashboardWidget, defaultSize: { w: 560, h: 480 } },
  { id: 'skillsStore', title: 'JASPER App & Skills Store', category: 'System & Hardware', icon: Store, component: SkillsStoreWidget, defaultSize: { w: 600, h: 500 } },
  { id: 'analytics', title: 'System Analytics & Insights App', category: 'System & Hardware', icon: BarChart3, component: AnalyticsWidget, defaultSize: { w: 540, h: 480 } },
  { id: 'automation', title: 'Automation Studio App', category: 'Productivity & Tools', icon: Workflow, component: AutomationBuilderWidget, defaultSize: { w: 640, h: 520 } },
  { id: 'missionControl', title: 'Mission Control OS Hub App', category: 'System & Hardware', icon: Layout, component: MissionControlWidget, defaultSize: { w: 700, h: 540 } },
  { id: 'sportsHub', title: 'Sports & Live Score App', category: 'Media & Life', icon: Trophy, component: SportsHubWidget, defaultSize: { w: 580, h: 480 } },
  { id: 'maps', title: 'Spatial Maps & GPS App', category: 'Productivity & Tools', icon: MapPin, component: MapsWidget, defaultSize: { w: 660, h: 500 } },
  { id: 'healthHub', title: 'Health & Fitband Tracker App', category: 'Media & Life', icon: Heart, component: HealthFitbandWidget, defaultSize: { w: 580, h: 500 } },
  { id: 'liveTranslation', title: 'Universal Live Translator App', category: 'Productivity & Tools', icon: Languages, component: LiveTranslationWidget, defaultSize: { w: 600, h: 500 } },
  { id: 'userManual', title: 'JASPER OS Master Guide App', category: 'Productivity & Tools', icon: BookOpen, component: UserManualWidget, defaultSize: { w: 640, h: 520 } }
];

/**
 * DRAGGABLE & RESIZABLE GLASS OS APPLICATION WINDOW
 */
function OsWindow({ id, title, icon: Icon, defaultPos, defaultSize, zIndex, onFocus, onClose, onMinimize, isMinimized, children }) {
  const [pos, setPos] = useState(defaultPos || { x: 50, y: 70 });
  const [size, setSize] = useState(defaultSize || { w: 640, h: 480 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, w: 0, h: 0 });

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

  if (isMinimized) return null;

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
      className="absolute flex flex-col rounded-xl bg-cyan-950/45 border border-cyan-400/40 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.7)] overflow-hidden transition-shadow duration-200"
    >
      {/* Window Header Bar */}
      <div
        onMouseDown={handleHeaderMouseDown}
        className="px-3.5 py-2.5 bg-cyan-950/80 border-b border-cyan-500/30 flex items-center justify-between cursor-move select-none backdrop-blur-xl"
      >
        <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs font-bold uppercase tracking-wider">
          <Icon className="w-4 h-4 text-cyan-400" />
          <span>{title}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onMinimize(id)}
            className="window-control-btn p-1.5 rounded-md text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-200 transition-colors"
            title="Minimize App"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="window-control-btn p-1.5 rounded-md text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-200 transition-colors"
            title={isMaximized ? "Restore App Window" : "Maximize App Window"}
          >
            {isMaximized ? <Square className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => onClose(id)}
            className="window-control-btn p-1.5 rounded-md text-rose-400 hover:bg-rose-500/20 hover:text-rose-200 transition-colors"
            title="Close App"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* App Window Body */}
      <div className="flex-1 overflow-y-auto p-3 text-slate-100 font-sans custom-scrollbar">
        {children}
      </div>

      {/* Resize Handle */}
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
 * MAIN JASPER OS SPATIAL DESKTOP APPLICATION ENVIRONMENT
 */
export default function JasperOsDesktop({ onToggleClassicMode, jasperState = 'idle', onMicClick, onLockSystem }) {
  const [activeWorkspace, setActiveWorkspace] = useState('all');
  const [appSearchQuery, setAppSearchQuery] = useState('');
  const [openWindows, setOpenWindows] = useState({
    searchEngine: true,
    hologram: false,
    diagnostics: false,
    tvRemote: false,
    pcHub: false,
    phoneControl: false,
    security: false,
    agentic: false
  });
  const [minimizedWindows, setMinimizedWindows] = useState({});
  const [activeZIndex, setActiveZIndex] = useState({});
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

  const launchApp = (appId) => {
    if (!openWindows[appId]) {
      setOpenWindows(prev => ({ ...prev, [appId]: true }));
    }
    bringToTop(appId);
    setShowStartMenu(false);
  };

  const toggleWindow = (winId) => {
    if (openWindows[winId]) {
      if (minimizedWindows[winId]) {
        bringToTop(winId);
      } else {
        setMinimizedWindows(prev => ({ ...prev, [winId]: true }));
      }
    } else {
      launchApp(winId);
    }
  };

  const closeWindow = (winId) => {
    setOpenWindows(prev => ({ ...prev, [winId]: false }));
  };

  const minimizeWindow = (winId) => {
    setMinimizedWindows(prev => ({ ...prev, [winId]: true }));
  };

  const filteredApps = JASPER_OS_APPS_REGISTRY.filter(app => {
    const matchesSearch = app.title.toLowerCase().includes(appSearchQuery.toLowerCase()) || 
                          app.category.toLowerCase().includes(appSearchQuery.toLowerCase());
    const matchesCategory = activeWorkspace === 'all' || 
                            (activeWorkspace === 'ai' && app.category.includes('AI')) ||
                            (activeWorkspace === 'control' && app.category.includes('Control')) ||
                            (activeWorkspace === 'system' && app.category.includes('System')) ||
                            (activeWorkspace === 'tools' && app.category.includes('Tools'));
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#020612] text-slate-100 font-sans selection:bg-cyan-500/30">
      {/* Dynamic Ambient Background Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/20 via-slate-950 to-black pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f0ff08_1px,transparent_1px),linear-gradient(to_bottom,#00f0ff08_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* TOP STARK OS TASKBAR WITH AI AVATAR LISTENER HUD */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-cyan-950/60 border-b border-cyan-500/30 backdrop-blur-2xl z-50 flex items-center justify-between px-4">
        {/* Left: Start Launcher & App Categories */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowStartMenu(!showStartMenu)}
            className="p-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)]"
            title="JASPER OS App Center & Start Launcher"
          >
            <div className="w-5 h-5 rounded-full border border-cyan-300 flex items-center justify-center animate-pulse">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
            </div>
            <span className="font-orbitron font-extrabold text-xs tracking-wider uppercase text-cyan-200">JASPER OS</span>
          </button>

          <div className="h-4 w-px bg-cyan-500/30 mx-1 hidden sm:block" />

          {/* Quick App Categories */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { id: 'all', label: '📱 All Apps' },
              { id: 'ai', label: '🧠 AI & Intelligence' },
              { id: 'control', label: '🔌 Device Link' },
              { id: 'system', label: '🛡️ System & Security' },
              { id: 'tools', label: '🛠️ Productivity Tools' }
            ].map((ws) => (
              <button
                key={ws.id}
                onClick={() => {
                  setActiveWorkspace(ws.id);
                  setShowStartMenu(true);
                }}
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

        {/* Center/Right: Glowing AI Avatar Voice Listener HUD */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMicClick}
            className={`px-3 py-1 rounded-xl border flex items-center gap-2.5 transition-all shadow-lg ${
              jasperState === 'listening'
                ? 'bg-cyan-500/30 border-cyan-300 text-cyan-100 shadow-[0_0_20px_rgba(0,240,255,0.4)] animate-pulse'
                : jasperState === 'processing'
                ? 'bg-purple-500/30 border-purple-300 text-purple-100 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                : jasperState === 'speaking'
                ? 'bg-emerald-500/30 border-emerald-300 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                : 'bg-cyan-950/50 border-cyan-500/30 text-cyan-300 hover:border-cyan-400'
            }`}
            title="Click to speak to JASPER AI Assistant"
          >
            {/* Animated AI Orb Arc Reactor Avatar */}
            <div className="relative w-5 h-5 flex items-center justify-center">
              <div className={`absolute inset-0 rounded-full border border-cyan-400 ${jasperState === 'listening' ? 'animate-ping opacity-75' : ''}`} />
              <div className={`w-3 h-3 rounded-full ${
                jasperState === 'listening' ? 'bg-cyan-400 shadow-[0_0_10px_#00f0ff]' :
                jasperState === 'processing' ? 'bg-purple-400 shadow-[0_0_10px_#a855f7]' :
                jasperState === 'speaking' ? 'bg-emerald-400 shadow-[0_0_10px_#10b981]' :
                'bg-cyan-400/80 shadow-[0_0_5px_#00f0ff]'
              }`} />
            </div>

            <div className="text-left font-mono text-[11px]">
              <div className="font-bold flex items-center gap-1">
                <span>AI VOICE AVATAR</span>
                {jasperState === 'listening' && <span className="text-[9px] text-cyan-300 animate-pulse">● REC</span>}
              </div>
              <div className="text-[9px] text-cyan-400/80">
                {jasperState === 'listening' ? 'LISTENING TO VOICE COMMAND...' :
                 jasperState === 'processing' ? 'PROCESSING INTENT...' :
                 jasperState === 'speaking' ? 'SPEAKING RESPONSE...' :
                 'WAKE WORD: "HEY JASPER" ACTIVE'}
              </div>
            </div>
          </button>

          {/* Live System Telemetry & Clock */}
          <div className="hidden lg:flex items-center gap-3 text-slate-300 bg-cyan-950/40 border border-cyan-500/30 px-3 py-1 rounded-lg backdrop-blur-md font-mono text-[11px]">
            <span className="flex items-center gap-1 text-cyan-400"><Cpu className="w-3.5 h-3.5" /> CPU: 12%</span>
            <span className="flex items-center gap-1 text-cyan-400"><HardDrive className="w-3.5 h-3.5" /> RAM: 3.8GB</span>
          </div>

          <button
            onClick={onToggleClassicMode}
            className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-300 rounded-lg font-semibold flex items-center gap-1.5 transition-all text-xs font-mono"
            title="Switch to Grid Layout View"
          >
            <Grid className="w-3.5 h-3.5 text-cyan-400" /> Classic
          </button>

          {onLockSystem && (
            <button
              onClick={onLockSystem}
              className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/35 border border-rose-400/60 text-rose-300 hover:text-rose-100 rounded-lg font-mono text-xs flex items-center gap-1 transition-all"
              title="Lock JASPER OS with Biometrics"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock</span>
            </button>
          )}

          <div className="text-cyan-200 font-mono font-bold text-[11px] px-2.5 py-1 bg-cyan-950/50 border border-cyan-500/30 rounded-lg">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {/* OS APP CENTER & START LAUNCHER DRAWER */}
      {showStartMenu && (
        <div className="absolute top-14 left-4 w-96 bg-cyan-950/95 border border-cyan-400/60 rounded-2xl p-4 shadow-[0_0_50px_rgba(0,240,255,0.35)] backdrop-blur-3xl z-50 animate-in fade-in slide-in-from-top-2 max-h-[82vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-cyan-500/30 pb-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/20 border border-cyan-400 rounded-xl text-cyan-300">
                <Zap className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-orbitron font-extrabold text-sm text-cyan-200 uppercase tracking-wider">JASPER OS App Center</h3>
                <p className="text-[10px] text-slate-400 font-mono">28 Native System Applications Available</p>
              </div>
            </div>
            <button
              onClick={() => setShowStartMenu(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/20"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* App Search Bar */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-cyan-400/70" />
            <input
              type="text"
              value={appSearchQuery}
              onChange={(e) => setAppSearchQuery(e.target.value)}
              placeholder="Search JASPER OS Native Apps..."
              className="w-full pl-9 pr-3 py-1.5 bg-cyan-950/70 border border-cyan-500/40 rounded-xl text-xs font-mono text-cyan-200 placeholder-cyan-500/50 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* App Registry Grid */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {filteredApps.map((app) => {
              const AppIcon = app.icon;
              const isRunning = openWindows[app.id] && !minimizedWindows[app.id];
              return (
                <button
                  key={app.id}
                  onClick={() => launchApp(app.id)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-mono flex items-center justify-between transition-all border ${
                    isRunning 
                      ? 'bg-cyan-500/25 border-cyan-400/60 text-cyan-100 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                      : 'text-slate-200 hover:bg-cyan-500/20 hover:text-cyan-200 border-transparent hover:border-cyan-500/30'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
                      <AppIcon className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-slate-100">{app.title}</div>
                      <div className="text-[10px] text-cyan-400/70">{app.category}</div>
                    </div>
                  </span>
                  {isRunning && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] bg-cyan-400/20 border border-cyan-400/50 text-cyan-300 font-bold">
                      ACTIVE
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* DESKTOP WORKSPACE AREA WITH APP SHORTCUTS GRID AND WINDOWS */}
      <div className="relative w-full h-[calc(100vh-105px)] top-12 overflow-hidden">
        {/* Native Desktop App Shortcuts Grid (Wallpaper Icons for ALL 29 APPS) */}
        <div className="absolute top-4 left-4 z-0 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 p-2 max-w-6xl max-h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar pointer-events-auto pr-3">
          {JASPER_OS_APPS_REGISTRY.map((app) => {
            const AppIcon = app.icon;
            const isRunning = openWindows[app.id];
            return (
              <button
                key={app.id}
                onClick={() => launchApp(app.id)}
                className={`p-3 rounded-2xl bg-cyan-950/40 hover:bg-cyan-500/25 border border-cyan-500/25 hover:border-cyan-400/70 backdrop-blur-md flex flex-col items-center justify-center gap-2 transition-all group hover:scale-105 hover:shadow-[0_0_20px_rgba(0,240,255,0.25)] ${
                  isRunning ? 'border-cyan-400/80 bg-cyan-500/20 shadow-[0_0_15px_rgba(0,240,255,0.2)]' : ''
                }`}
              >
                <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 group-hover:text-cyan-100 group-hover:border-cyan-300 transition-all shadow-[0_0_10px_rgba(0,240,255,0.15)] relative">
                  <AppIcon className="w-6 h-6" />
                  {isRunning && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 border border-black shadow-[0_0_8px_#00f0ff]" />
                  )}
                </div>
                <span className="text-[11px] font-mono font-semibold text-slate-200 group-hover:text-cyan-200 text-center line-clamp-1">
                  {app.title.replace(' App', '').replace('JASPER ', '')}
                </span>
              </button>
            );
          })}
        </div>

        {/* Render Open App Windows */}
        {JASPER_OS_APPS_REGISTRY.map((app) => {
          if (!openWindows[app.id]) return null;
          const AppComponent = app.component;
          const AppIcon = app.icon;
          return (
            <OsWindow
              key={app.id}
              id={app.id}
              title={app.title}
              icon={AppIcon}
              defaultPos={{ x: 60 + (JASPER_OS_APPS_REGISTRY.findIndex(a => a.id === app.id) % 5) * 40, y: 30 + (JASPER_OS_APPS_REGISTRY.findIndex(a => a.id === app.id) % 4) * 35 }}
              defaultSize={app.defaultSize}
              zIndex={activeZIndex[app.id] || 5}
              onFocus={bringToTop}
              onClose={closeWindow}
              onMinimize={minimizeWindow}
              isMinimized={minimizedWindows[app.id]}
            >
              <AppComponent />
            </OsWindow>
          );
        })}
      </div>

      {/* BOTTOM OS NATIVE APP DOCK */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 h-14 bg-cyan-950/70 border border-cyan-500/40 rounded-2xl px-4 flex items-center gap-2 backdrop-blur-2xl shadow-[0_10px_35px_rgba(0,240,255,0.25)] z-50 max-w-[90vw] overflow-x-auto custom-scrollbar">
        {JASPER_OS_APPS_REGISTRY.slice(0, 10).map((app) => {
          const AppIcon = app.icon;
          const isRunning = openWindows[app.id];
          const isMinimized = minimizedWindows[app.id];
          return (
            <button
              key={app.id}
              onClick={() => toggleWindow(app.id)}
              className={`relative p-2.5 rounded-xl flex items-center justify-center transition-all ${
                isRunning && !isMinimized
                  ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(0,240,255,0.3)] scale-105'
                  : isRunning && isMinimized
                  ? 'bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 opacity-80'
                  : 'text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/50 border border-transparent'
              }`}
              title={app.title}
            >
              <AppIcon className="w-5 h-5" />
              {isRunning && (
                <span className={`absolute -bottom-1 w-1.5 h-1.5 rounded-full ${isMinimized ? 'bg-amber-400' : 'bg-cyan-400 shadow-[0_0_8px_#00f0ff]'}`} />
              )}
            </button>
          );
        })}

        <div className="h-6 w-px bg-cyan-500/30 mx-1" />

        <button
          onClick={() => setShowStartMenu(true)}
          className="p-2.5 rounded-xl text-cyan-300 hover:bg-cyan-500/20 border border-cyan-500/40 flex items-center gap-1 text-xs font-mono"
          title="Open JASPER OS App Center"
        >
          <AppWindow className="w-5 h-5 text-cyan-400" />
          <span className="hidden xl:inline">More Apps ({JASPER_OS_APPS_REGISTRY.length})</span>
        </button>
      </div>
    </div>
  );
}
