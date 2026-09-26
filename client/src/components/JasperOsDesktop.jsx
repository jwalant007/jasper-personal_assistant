import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Box, Terminal, Tv, Cpu, Shield, Sparkles, Smartphone, Monitor, Globe, 
  Activity, X, Minus, Square, Maximize2, RefreshCw, Layout, Layers, Volume2, 
  Zap, Radio, Settings, HelpCircle, HardDrive, Wifi, BatteryCharging, Search,
  Bot, Palette, Music, Workflow, BarChart3, Brain, Store, Trophy, MapPin, Heart, Languages, BookOpen, Laptop, Grid, AppWindow, Lock,
  Hand, Camera, CameraOff, Move, ThumbsUp, ThumbsDown, Crosshair, ChevronDown, ChevronUp, MoveVertical, Eye, EyeOff, Power, Check
} from 'lucide-react';
import { AirGestureTracker } from '../utils/gestureTracker';
import { playJarvisBeep, playJarvisScan, playJarvisPowerUp, playMysticSnap } from '../utils/jarvisAudioSynth';

import UniversalTvRemoteWidget from './UniversalTvRemoteWidget';
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
import SocialAutoReplyWidget from './SocialAutoReplyWidget';
import JasperSearchApp from './JasperSearchApp';
import JasperBrowserApp from './JasperBrowserApp';
import JasperFileManagerApp from './JasperFileManagerApp';
import JasperCodeStudioApp from './JasperCodeStudioApp';
import JasperNotesPlannerApp from './JasperNotesPlannerApp';
import JasperCalculatorApp from './JasperCalculatorApp';
import JasperAgentHubWidget from './JasperAgentHubWidget';
import BlenderStudioModal from './BlenderStudioModal';
import HolographicAnswerModal from './HolographicAnswerModal';
import PhoneSentinelWidget from './PhoneSentinelWidget';
import JasperVideoStudioApp from './JasperVideoStudioApp';
import { Calculator, FileCode, Compass, MessageSquare, ShieldAlert, Video } from 'lucide-react';

/**
 * ALL NATIVE JASPER OS APPLICATIONS REGISTRY (31 NATIVE APPS)
 */
const JASPER_OS_APPS_REGISTRY = [
  { id: 'videoStudio', title: 'AI Video Creator & YouTube Studio', category: 'Creative & AI', icon: Video, component: JasperVideoStudioApp, defaultSize: { w: 980, h: 660 } },
  { id: 'phoneSentinel', title: 'Phone Sentinel & Offline Alerts', category: 'Hardware Control', icon: ShieldAlert, component: PhoneSentinelWidget, defaultSize: { w: 760, h: 580 } },
  { id: 'agentHub', title: 'JASPER AI Agent Hub', category: 'AI & Intelligence', icon: Brain, component: JasperAgentHubWidget, defaultSize: { w: 920, h: 640 } },
  { id: 'socialAutoReply', title: 'WhatsApp & IG Auto-Reply App', category: 'Hardware Control', icon: MessageSquare, component: SocialAutoReplyWidget, defaultSize: { w: 720, h: 540 } },
  { id: 'jasperBrowser', title: 'JASPER Browser App', category: 'Productivity & Tools', icon: Compass, component: JasperBrowserApp, defaultSize: { w: 820, h: 580 } },
  { id: 'searchEngine', title: 'JASPER AI Search Engine App', category: 'Productivity & Tools', icon: Search, component: JasperSearchApp, defaultSize: { w: 760, h: 560 } },
  { id: 'fileManager', title: 'JASPER OS File Explorer & Disk App', category: 'System & Hardware', icon: HardDrive, component: JasperFileManagerApp, defaultSize: { w: 680, h: 500 } },
  { id: 'codeStudio', title: 'JASPER Code Studio & Terminal App', category: 'Productivity & Tools', icon: FileCode, component: JasperCodeStudioApp, defaultSize: { w: 780, h: 540 } },
  { id: 'notesPlanner', title: 'JASPER AI Notes & Task Planner App', category: 'Productivity & Tools', icon: BookOpen, component: JasperNotesPlannerApp, defaultSize: { w: 720, h: 520 } },
  { id: 'calculator', title: 'JASPER Scientific Calculator App', category: 'Productivity & Tools', icon: Calculator, component: JasperCalculatorApp, defaultSize: { w: 640, h: 500 } },
  { id: 'hologramStudio', title: '3D Hologram & Blender Studio', category: 'Creative & AI', icon: Box, component: (props) => <HolographicAnswerModal {...props} />, defaultSize: { w: 1040, h: 680 } },
  { id: 'diagnostics', title: 'System Diagnostics & Telemetry App', category: 'System & Hardware', icon: Activity, component: DiagnosticWidget, defaultSize: { w: 450, h: 500 } },
  { id: 'tvRemote', title: 'Universal Smart TV & JioFiber STB App', category: 'Hardware Control', icon: Tv, component: UniversalTvRemoteWidget, defaultSize: { w: 460, h: 620 } },
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
  { id: 'spatialGps', title: 'Spatial GPS & Satellite Intelligence', category: 'Productivity & Tools', icon: Globe, component: (props) => <MapsWidget {...props} initialTab="satellite" />, defaultSize: { w: 760, h: 560 } },
  { id: 'healthHub', title: 'Health & Fitband Tracker App', category: 'Media & Life', icon: Heart, component: HealthFitbandWidget, defaultSize: { w: 580, h: 500 } },
  { id: 'liveTranslation', title: 'Universal Live Translator App', category: 'Productivity & Tools', icon: Languages, component: LiveTranslationWidget, defaultSize: { w: 600, h: 500 } },
  { id: 'userManual', title: 'JASPER OS Master Guide App', category: 'Productivity & Tools', icon: BookOpen, component: UserManualWidget, defaultSize: { w: 640, h: 520 } }
];

/**
 * DRAGGABLE & RESIZABLE GLASS OS APPLICATION WINDOW
 */
function OsWindow({ 
  id, 
  title, 
  icon: Icon, 
  defaultPos, 
  defaultSize, 
  zIndex, 
  onFocus, 
  onClose, 
  onMinimize, 
  isMinimized, 
  isMaximizedExternal,
  onToggleMaximize,
  isGestureActive,
  bodyRef,
  children 
}) {
  const [pos, setPos] = useState(defaultPos || { x: 50, y: 70 });
  const [size, setSize] = useState(defaultSize || { w: 640, h: 480 });
  const [internalMaximized, setInternalMaximized] = useState(false);
  const isMaximized = isMaximizedExternal !== undefined ? isMaximizedExternal : internalMaximized;

  const toggleMaximize = () => {
    if (onToggleMaximize) {
      onToggleMaximize(id);
    } else {
      setInternalMaximized(prev => !prev);
    }
  };
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

  const handleHeaderTouchStart = (e) => {
    if (e.target.closest('.window-control-btn') || isMaximized) return;
    onFocus(id);
    setIsDragging(true);
    const touch = e.touches[0];
    dragStartRef.current = { x: touch.clientX, y: touch.clientY, posX: pos.x, posY: pos.y };
  };

  const handleResizeMouseDown = (e) => {
    e.stopPropagation();
    onFocus(id);
    setIsResizing(true);
    resizeStartRef.current = { x: e.clientX, y: e.clientY, w: size.w, h: size.h };
  };

  const handleResizeTouchStart = (e) => {
    e.stopPropagation();
    onFocus(id);
    setIsResizing(true);
    const touch = e.touches[0];
    resizeStartRef.current = { x: touch.clientX, y: touch.clientY, w: size.w, h: size.h };
  };

  useEffect(() => {
    let animFrame = null;

    const handleMove = (clientX, clientY) => {
      if (!isDragging && !isResizing) return;
      if (animFrame) cancelAnimationFrame(animFrame);

      animFrame = requestAnimationFrame(() => {
        if (isDragging) {
          const dx = clientX - dragStartRef.current.x;
          const dy = clientY - dragStartRef.current.y;
          const maxY = (typeof window !== 'undefined' ? window.innerHeight - 80 : 600);
          setPos({
            x: Math.max(-size.w + 100, Math.min(dragStartRef.current.posX + dx, (typeof window !== 'undefined' ? window.innerWidth - 60 : 1200))),
            y: Math.max(0, Math.min(dragStartRef.current.posY + dy, maxY))
          });
        } else if (isResizing) {
          const dw = clientX - resizeStartRef.current.x;
          const dh = clientY - resizeStartRef.current.y;
          setSize({
            w: Math.max(280, resizeStartRef.current.w + dw),
            h: Math.max(200, resizeStartRef.current.h + dh)
          });
        }
      });
    };

    const handleMouseMove = (e) => handleMove(e.clientX, e.clientY);
    const handleTouchMove = (e) => {
      if (e.touches && e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleEnd = () => {
      if (animFrame) cancelAnimationFrame(animFrame);
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove, { passive: true });
      window.addEventListener('touchend', handleEnd);
    }
    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, isResizing]);

  if (isMinimized) return null;

  const windowStyle = isMaximized ? {
    top: '0px',
    left: '0px',
    width: '100%',
    height: '100%',
    maxWidth: '100%',
    maxHeight: '100%',
    zIndex: zIndex + 10
  } : {
    top: `${Math.max(0, pos.y)}px`,
    left: `${pos.x}px`,
    width: `${Math.min(size.w, (typeof window !== 'undefined' ? window.innerWidth - 16 : 800))}px`,
    height: `${Math.min(size.h, (typeof window !== 'undefined' ? Math.max(200, window.innerHeight - pos.y - 110) : 600))}px`,
    maxWidth: 'calc(100vw - 16px)',
    maxHeight: `calc(100vh - ${Math.max(0, pos.y)}px - 110px)`,
    zIndex
  };

  return (
    <div
      onMouseDown={() => onFocus(id)}
      onTouchStart={() => onFocus(id)}
      style={windowStyle}
      className={`absolute flex flex-col rounded-xl bg-black border border-neutral-800 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,1)] overflow-hidden transition-shadow duration-200 ${
        isDragging ? 'ring-2 ring-amber-400 shadow-[0_0_50px_rgba(245,197,66,0.4)] select-none' : ''
      }`}
    >
      {/* Window Header Bar */}
      <div
        onMouseDown={handleHeaderMouseDown}
        onTouchStart={handleHeaderTouchStart}
        className="px-3 py-2 sm:px-3.5 sm:py-2 bg-black border-b border-neutral-800 flex items-center justify-between cursor-grab active:cursor-grabbing select-none backdrop-blur-xl shrink-0"
      >
        <div className="flex items-center gap-1.5 sm:gap-2 text-amber-300 font-mono text-[11px] sm:text-xs font-bold uppercase tracking-wider truncate max-w-[60%]">
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
          <span className="truncate">{title}</span>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {isGestureActive && (
            <div 
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/40 text-[9px] font-mono text-cyan-300 mr-1 animate-pulse"
              title="Air Gestures Connected: Wave hand to scroll, Peace sign to maximize, Fist to minimize"
            >
              <Hand className="w-3 h-3 text-cyan-400" />
              <span className="hidden sm:inline">AIR GESTURE</span>
            </div>
          )}
          <button
            onClick={() => onMinimize(id)}
            className="window-control-btn p-1 sm:p-1.5 rounded-md text-amber-400 hover:bg-amber-500/20 hover:text-amber-200 transition-colors"
            title="Minimize App (Fist ✊)"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleMaximize}
            className="window-control-btn p-1 sm:p-1.5 rounded-md text-amber-400 hover:bg-amber-500/20 hover:text-amber-200 transition-colors"
            title={isMaximized ? "Restore Window (Peace Sign ✌️)" : "Maximize Window (Peace Sign ✌️)"}
          >
            {isMaximized ? <Square className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => onClose(id)}
            className="window-control-btn p-1 sm:p-1.5 rounded-md text-rose-400 hover:bg-rose-500/20 hover:text-rose-200 transition-colors"
            title="Close App"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* App Window Body */}
      <div ref={bodyRef} className="flex-1 overflow-y-auto p-2 sm:p-3 text-slate-100 font-sans custom-scrollbar bg-black">
        {children}
      </div>

      {/* Resize Handle */}
      {!isMaximized && (
        <div
          onMouseDown={handleResizeMouseDown}
          onTouchStart={handleResizeTouchStart}
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
export default function JasperOsDesktop({ onToggleClassicMode, jasperState = 'idle', onMicClick, onLockSystem, onOpenSettings, aiStatusLabel = 'Core Offline', isAiOnline = false }) {
  const [activeWorkspace, setActiveWorkspace] = useState('all');
  const [appSearchQuery, setAppSearchQuery] = useState('');
  const [openWindows, setOpenWindows] = useState({
    searchEngine: true,
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
  const [dockTwoRows, setDockTwoRows] = useState(false);
  const [desktopLayoutMode, setDesktopLayoutMode] = useState('matrix'); // 'matrix' (All On Screen) | 'shelf' (2-Row Shelf)
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleProjectToHologram = () => {
      launchApp('hologramStudio');
    };
    window.addEventListener('jasper:project-to-hologram', handleProjectToHologram);
    return () => window.removeEventListener('jasper:project-to-hologram', handleProjectToHologram);
  }, []);

  // Air Gesture System State - Doctor Strange Eldritch Spell Engine
  const [isAirGesturesOn, setIsAirGesturesOn] = useState(false);
  const [gestureStatus, setGestureStatus] = useState('IDLE');
  const [activeGesture, setActiveGesture] = useState('NONE');
  const [gestureFeedback, setGestureFeedback] = useState('Doctor Strange Spells Ready: Snap Fingers to Close All Apps // Palm for Tao Shield // Point to Click');
  const [showGestureHud, setShowGestureHud] = useState(true);
  const [isHudCollapsed, setIsHudCollapsed] = useState(false);
  const [showGestureGuide, setShowGestureGuide] = useState(false);
  const [airCursorPos, setAirCursorPos] = useState(null);
  const [activeFocusedWinId, setActiveFocusedWinId] = useState('searchEngine');
  const [maximizedWindows, setMaximizedWindows] = useState({});
  const [snapShockwaveActive, setSnapShockwaveActive] = useState(false);

  // DOM Refs for Camera and Gesture Engine
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const gestureTrackerRef = useRef(null);
  const windowBodyRefs = useRef({});

  // OS Desktop Screen Scroll State & Controls
  const desktopScrollRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  const checkScroll = useCallback(() => {
    const el = desktopScrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const maxScroll = scrollHeight - clientHeight;
    setHasOverflow(maxScroll > 15);
    setCanScrollUp(scrollTop > 15);
    setCanScrollDown(scrollTop < maxScroll - 15);
    setScrollProgress(maxScroll > 0 ? Math.min(100, Math.max(0, (scrollTop / maxScroll) * 100)) : 0);
  }, []);

  useEffect(() => {
    checkScroll();
    const handleResize = () => checkScroll();
    window.addEventListener('resize', handleResize);
    const t = setTimeout(checkScroll, 150);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(t);
    };
  }, [checkScroll, desktopLayoutMode, openWindows]);

  const handleDesktopScroll = () => {
    checkScroll();
  };

  const handleScrollDown = () => {
    const el = desktopScrollRef.current;
    if (!el) return;
    el.scrollBy({ top: 280, behavior: 'smooth' });
  };

  const handleScrollUp = () => {
    const el = desktopScrollRef.current;
    if (!el) return;
    el.scrollBy({ top: -280, behavior: 'smooth' });
  };

  const handleScrollToEdge = (direction) => {
    const el = desktopScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: direction === 'bottom' ? el.scrollHeight : 0, behavior: 'smooth' });
  };

  const bringToTop = (winId) => {
    const nextZ = topZ + 1;
    setTopZ(nextZ);
    setActiveZIndex(prev => ({ ...prev, [winId]: nextZ }));
    setMinimizedWindows(prev => ({ ...prev, [winId]: false }));
    setActiveFocusedWinId(winId);
  };

  // Top Bar Touch Swipe & Drag State for Mobile & Touch Devices
  const topBarScrollRef = useRef(null);
  const [canSwipeLeft, setCanSwipeLeft] = useState(false);
  const [canSwipeRight, setCanSwipeRight] = useState(false);
  const isPointerDownRef = useRef(false);
  const pointerStartXRef = useRef(0);
  const pointerScrollStartRef = useRef(0);

  const checkTopBarSwipe = useCallback(() => {
    const el = topBarScrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanSwipeLeft(el.scrollLeft > 10);
    setCanSwipeRight(el.scrollLeft < maxScroll - 10);
  }, []);

  useEffect(() => {
    checkTopBarSwipe();
    const el = topBarScrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkTopBarSwipe, { passive: true });
    window.addEventListener('resize', checkTopBarSwipe);
    return () => {
      el.removeEventListener('scroll', checkTopBarSwipe);
      window.removeEventListener('resize', checkTopBarSwipe);
    };
  }, [checkTopBarSwipe]);

  const handleTopBarPointerDown = (e) => {
    if (e.target.closest('button') || e.target.closest('input')) return;
    const el = topBarScrollRef.current;
    if (!el) return;
    isPointerDownRef.current = true;
    pointerStartXRef.current = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
    pointerScrollStartRef.current = el.scrollLeft;
  };

  const handleTopBarPointerMove = (e) => {
    if (!isPointerDownRef.current) return;
    const el = topBarScrollRef.current;
    if (!el) return;
    const currentX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
    const diff = (currentX - pointerStartXRef.current) * 1.5;
    el.scrollLeft = pointerScrollStartRef.current - diff;
    checkTopBarSwipe();
  };

  const handleTopBarPointerUp = () => {
    isPointerDownRef.current = false;
  };

  // Window State Tracking Refs (prevents re-mounting camera on window state changes)
  const activeFocusedWinIdRef = useRef(activeFocusedWinId);
  const openWindowsRef = useRef(openWindows);
  const minimizedWindowsRef = useRef(minimizedWindows);

  useEffect(() => {
    activeFocusedWinIdRef.current = activeFocusedWinId;
    openWindowsRef.current = openWindows;
    minimizedWindowsRef.current = minimizedWindows;
  });

  // AIR GESTURE ENGINE INITIALIZATION & SYSTEM-WIDE APP CONTROLS
  useEffect(() => {
    if (isAirGesturesOn) {
      if (!gestureTrackerRef.current && videoRef.current && canvasRef.current) {
        playJarvisPowerUp();
        gestureTrackerRef.current = new AirGestureTracker(videoRef.current, canvasRef.current, {
          onScroll: (dir, amount) => {
            const currentWinId = activeFocusedWinIdRef.current;
            const bodyEl = windowBodyRefs.current[currentWinId];
            if (bodyEl) {
              bodyEl.scrollBy({ top: dir === 'DOWN' ? amount : -amount, behavior: 'smooth' });
            } else if (desktopScrollRef.current) {
              desktopScrollRef.current.scrollBy({ top: dir === 'DOWN' ? amount : -amount, behavior: 'smooth' });
            }
            setGestureFeedback(`AIR SCROLL: ${dir}`);
            playJarvisBeep('click');
            window.dispatchEvent(new CustomEvent('jasper:os-gesture', { detail: { gesture: 'SCROLL', dir, amount, activeWin: currentWinId } }));
          },
          onPeaceSign: () => {
            const currentWinId = activeFocusedWinIdRef.current;
            if (currentWinId) {
              setMaximizedWindows(prev => ({ ...prev, [currentWinId]: !prev[currentWinId] }));
              setGestureFeedback('PEACE SIGN (V): TOGGLE MAXIMIZE');
              playJarvisBeep('command');
              window.dispatchEvent(new CustomEvent('jasper:os-gesture', { detail: { gesture: 'PEACE_SIGN', activeWin: currentWinId } }));
            }
          },
          onFist: () => {
            const currentWinId = activeFocusedWinIdRef.current;
            if (currentWinId) {
              minimizeWindow(currentWinId);
              setGestureFeedback('FIST: MINIMIZE WINDOW');
              playJarvisBeep('select');
              window.dispatchEvent(new CustomEvent('jasper:os-gesture', { detail: { gesture: 'FIST_MINIMIZE', activeWin: currentWinId } }));
            }
          },
          onPalmStop: () => {
            const curOpen = openWindowsRef.current;
            const curMin = minimizedWindowsRef.current;
            const openIds = Object.keys(curOpen).filter(id => curOpen[id] && !curMin[id]);
            if (openIds.length > 0) {
              setMinimizedWindows(prev => {
                const updated = { ...prev };
                openIds.forEach(id => updated[id] = true);
                return updated;
              });
              setGestureFeedback('REPULSOR PALM: SHOW DESKTOP');
            } else {
              setMinimizedWindows({});
              setGestureFeedback('REPULSOR PALM: RESTORE ALL');
            }
            playJarvisBeep('select');
            window.dispatchEvent(new CustomEvent('jasper:os-gesture', { detail: { gesture: 'PALM_STOP' } }));
          },
          onThumbsUp: () => {
            setGestureFeedback('THUMBS UP: CONFIRMED');
            playJarvisBeep('success');
            window.dispatchEvent(new CustomEvent('jasper:os-gesture', { detail: { gesture: 'THUMBS_UP', activeWin: activeFocusedWinIdRef.current } }));
          },
          onThumbsDown: () => {
            setGestureFeedback('THUMBS DOWN: CANCEL / MUTE');
            playJarvisBeep('error');
            window.dispatchEvent(new CustomEvent('jasper:os-gesture', { detail: { gesture: 'THUMBS_DOWN', activeWin: activeFocusedWinIdRef.current } }));
          },
          onWindowCycle: (dir) => {
            const curOpen = openWindowsRef.current;
            const openIds = Object.keys(curOpen).filter(id => curOpen[id]);
            if (openIds.length > 1) {
              const currIdx = Math.max(0, openIds.indexOf(activeFocusedWinIdRef.current));
              const nextIdx = (currIdx + (dir === 'NEXT' ? 1 : -1) + openIds.length) % openIds.length;
              bringToTop(openIds[nextIdx]);
              setGestureFeedback(`SWITCH WINDOW: ${openIds[nextIdx]}`);
              playJarvisBeep('click');
            }
            window.dispatchEvent(new CustomEvent('jasper:os-gesture', { detail: { gesture: 'WINDOW_CYCLE', dir } }));
          },
          onAirCursor: ({ x, y, isClicking }) => {
            setAirCursorPos({ x, y, isClicking });
            if (isClicking) {
              const screenX = x * window.innerWidth;
              const screenY = y * window.innerHeight;
              const el = document.elementFromPoint(screenX, screenY);
              if (el && !el.closest('.spatial-gesture-hud')) {
                el.click();
                playJarvisBeep('click');
              }
            }
            window.dispatchEvent(new CustomEvent('jasper:os-gesture', { detail: { gesture: 'AIR_CURSOR', cursor: { x, y }, isClicking } }));
          },
          onOkSign: () => {
            setGestureFeedback('OK SIGN: JARVIS VOICE ACTIVATED');
            playJarvisBeep('command');
            if (onMicClick) onMicClick();
            window.dispatchEvent(new CustomEvent('jasper:os-gesture', { detail: { gesture: 'OK_SIGN' } }));
          },
          onCloseApp: () => {
            const currentWinId = activeFocusedWinIdRef.current;
            if (currentWinId) {
              closeWindow(currentWinId);
              setGestureFeedback('CLOSE WINDOW: GESTURE TRIGGERED');
              playJarvisBeep('select');
            }
          },
          onFingerSnap: () => {
            // DOCTOR STRANGE / THANOS SNAP: CLOSE ALL OPEN APPS INSTANTLY!
            setOpenWindows({});
            setMinimizedWindows({});
            setMaximizedWindows({});
            setSnapShockwaveActive(true);
            setGestureFeedback('✦ ELDRITCH SNAP: ALL OS APPS DISSOLVED ✦');
            playMysticSnap();
            window.dispatchEvent(new CustomEvent('jasper:os-gesture', { detail: { gesture: 'ELDRITCH_SNAP', action: 'CLOSE_ALL_APPS' } }));
            setTimeout(() => setSnapShockwaveActive(false), 1600);
          },
          onStateChange: (st) => {
            setGestureStatus(st.status);
            if (st.gesture && st.gesture !== 'NONE') {
              setActiveGesture(st.gesture);
            }
          }
        });

        gestureTrackerRef.current.start();
      }
    } else {
      if (gestureTrackerRef.current) {
        gestureTrackerRef.current.stop();
        gestureTrackerRef.current = null;
      }
      setAirCursorPos(null);
      setActiveGesture('NONE');
    }

    return () => {
      if (gestureTrackerRef.current) {
        gestureTrackerRef.current.stop();
        gestureTrackerRef.current = null;
      }
    };
  }, [isAirGesturesOn]);

  const launchApp = (rawAppId) => {
    let appId = rawAppId;
    if (rawAppId === 'maps' || rawAppId === 'satelliteIntel') appId = 'spatialGps';
    if (rawAppId === 'blenderStudio') appId = 'hologramStudio';
    if (!openWindows[appId]) {
      setOpenWindows(prev => ({ ...prev, [appId]: true }));
    }
    bringToTop(appId);
    setShowStartMenu(false);
  };

  const toggleWindow = (rawWinId) => {
    let winId = rawWinId;
    if (rawWinId === 'maps' || rawWinId === 'satelliteIntel') winId = 'spatialGps';
    if (rawWinId === 'blenderStudio') winId = 'hologramStudio';
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

  const closeAllApps = () => {
    setOpenWindows({});
    setMinimizedWindows({});
    setMaximizedWindows({});
    setSnapShockwaveActive(true);
    playMysticSnap();
    setTimeout(() => setSnapShockwaveActive(false), 1600);
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
    <div className="relative w-full h-full overflow-hidden bg-black text-slate-100 font-sans selection:bg-cyan-500/30">
      {/* Dynamic Ambient Background Grid */}
      <div className="absolute inset-0 bg-black pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f0ff05_1px,transparent_1px),linear-gradient(to_bottom,#00f0ff05_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none opacity-40" />

      {/* TOP GLASS SYSTEM TASKBAR - SWIPEABLE FOR MOBILE & TOUCH */}
      <div 
        ref={topBarScrollRef}
        onPointerDown={handleTopBarPointerDown}
        onPointerMove={handleTopBarPointerMove}
        onPointerUp={handleTopBarPointerUp}
        onPointerLeave={handleTopBarPointerUp}
        className="absolute top-0 left-0 right-0 h-12 bg-black/95 border-b border-neutral-800/90 backdrop-blur-2xl z-50 overflow-x-auto touch-pan-x overscroll-x-contain scroll-smooth no-scrollbar select-none cursor-grab active:cursor-grabbing"
      >
        {/* Visual Edge Swipe Glow Hints for Mobile */}
        {canSwipeLeft && (
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black via-black/80 to-transparent z-20 flex items-center pl-1">
            <span className="text-xs text-amber-400 animate-pulse font-mono font-bold">‹</span>
          </div>
        )}
        {canSwipeRight && (
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black via-black/80 to-transparent z-20 flex items-center justify-end pr-1">
            <span className="text-xs text-amber-400 animate-pulse font-mono font-bold">›</span>
          </div>
        )}

        <div className="flex items-center justify-between min-w-max md:min-w-full gap-2 px-3 h-full">
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setShowStartMenu(!showStartMenu)}
            className="h-8.5 px-2.5 rounded-xl bg-gradient-to-r from-amber-500/25 to-amber-600/15 hover:from-amber-500/35 hover:to-amber-600/25 border border-amber-400/60 text-amber-300 flex items-center gap-2 transition-all shadow-[0_0_12px_rgba(245,197,66,0.2)] cursor-pointer shrink-0"
            title="JASPER OS App Center & Start Launcher"
          >
            <div className="w-4 h-4 rounded-full border border-amber-300 flex items-center justify-center animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#ffd700]" />
            </div>
            <span className="font-orbitron font-extrabold text-xs tracking-wider uppercase text-amber-200">JASPER OS</span>
          </button>

          <div className="h-4 w-px bg-amber-500/30 mx-0.5 hidden sm:block" />

          {/* Quick App Categories */}
          <div className="hidden lg:flex items-center gap-1">
            {[
              { id: 'all', label: 'All Apps' },
              { id: 'ai', label: 'AI Swarm' },
              { id: 'control', label: 'Devices' },
              { id: 'system', label: 'Security' },
              { id: 'tools', label: 'Tools' }
            ].map((ws) => (
              <button
                key={ws.id}
                onClick={() => {
                  setActiveWorkspace(ws.id);
                  setShowStartMenu(true);
                }}
                className={`h-8 px-2.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all cursor-pointer ${
                  activeWorkspace === ws.id
                    ? 'bg-amber-500/25 border border-amber-400/60 text-amber-200 shadow-[0_0_8px_rgba(245,197,66,0.2)] font-bold'
                    : 'text-neutral-400 hover:text-amber-300 hover:bg-neutral-900 border border-transparent'
                }`}
              >
                {ws.label}
              </button>
            ))}
          </div>
        </div>

        {/* Center/Right: Glowing AI Avatar Voice Listener HUD, Telemetry, Gemini Cloud, Gestures, Classic, Lock, Clock */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* 1. AI Voice Avatar HUD (Sleek Single-Line Pill) */}
          <button
            onClick={onMicClick}
            className={`h-8.5 px-3 rounded-xl border flex items-center gap-2 whitespace-nowrap shrink-0 transition-all shadow-md cursor-pointer ${
              jasperState === 'listening'
                ? 'bg-amber-500/30 border-amber-300 text-amber-100 shadow-[0_0_18px_rgba(245,197,66,0.4)] animate-pulse'
                : jasperState === 'processing'
                ? 'bg-yellow-500/30 border-yellow-300 text-yellow-100 shadow-[0_0_18px_rgba(255,215,0,0.4)]'
                : jasperState === 'speaking'
                ? 'bg-amber-500/30 border-amber-300 text-amber-100 shadow-[0_0_18px_rgba(212,175,55,0.4)]'
                : 'bg-neutral-900/90 border-amber-500/40 text-amber-300 hover:border-amber-400 hover:bg-neutral-850'
            }`}
            title="AI Voice Avatar: Click to speak | Wake word: 'Hey Jasper'"
          >
            <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
              <div className={`absolute inset-0 rounded-full border border-amber-400 ${jasperState === 'listening' ? 'animate-ping opacity-75' : ''}`} />
              <div className={`w-2.5 h-2.5 rounded-full ${
                jasperState === 'listening' ? 'bg-amber-400 shadow-[0_0_8px_#ff9900]' :
                jasperState === 'processing' ? 'bg-yellow-300 shadow-[0_0_8px_#ffd700]' :
                jasperState === 'speaking' ? 'bg-amber-300 shadow-[0_0_8px_#f5c542]' :
                'bg-amber-400 shadow-[0_0_6px_#ffd700]'
              }`} />
            </div>

            <span className="font-orbitron font-bold text-xs tracking-wider text-amber-200">AI AVATAR</span>

            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
              jasperState === 'listening' ? 'bg-amber-400 text-black animate-pulse' :
              jasperState === 'processing' ? 'bg-yellow-400/25 text-yellow-200 animate-pulse' :
              jasperState === 'speaking' ? 'bg-amber-400/25 text-amber-200 animate-pulse' :
              'bg-black/60 text-amber-400/80 border border-amber-500/20'
            }`}>
              {jasperState === 'listening' ? 'REC' :
               jasperState === 'processing' ? 'THINKING' :
               jasperState === 'speaking' ? 'SPEAKING' :
               'READY'}
            </span>
          </button>

          {/* Live System Telemetry (Visible on ultra-wide screens) */}
          <div className="hidden 2xl:flex items-center gap-2 text-neutral-300 bg-black/80 border border-neutral-800 px-2.5 h-8.5 rounded-xl backdrop-blur-md font-mono text-[11px] whitespace-nowrap shrink-0">
            <span className="flex items-center gap-1 text-amber-400"><Cpu className="w-3 h-3" /> 12%</span>
            <span className="text-neutral-700">|</span>
            <span className="flex items-center gap-1 text-amber-400"><HardDrive className="w-3 h-3 text-amber-400" /> 3.8GB</span>
          </div>

          {/* 2. Gemini Cloud / AI Status Tab */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className={`h-8.5 px-3 rounded-xl font-mono text-xs flex items-center gap-1.5 transition-all border whitespace-nowrap shrink-0 cursor-pointer ${
                isAiOnline
                  ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                  : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 text-amber-300 animate-pulse shadow-[0_0_10px_rgba(245,197,66,0.15)]'
              }`}
              title="Click to configure AI Neural Core & API Keys"
            >
              <Settings className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-semibold">{aiStatusLabel}</span>
            </button>
          )}

          {/* 3. Special Gestures & Spells Tab */}
          <button
            onClick={() => {
              setIsAirGesturesOn(prev => !prev);
              if (!isAirGesturesOn) playJarvisPowerUp();
            }}
            className={`h-8.5 px-3 rounded-xl font-mono text-xs flex items-center gap-2 transition-all border cursor-pointer whitespace-nowrap shrink-0 ${
              isAirGesturesOn
                ? 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(255,140,0,0.3)] animate-pulse'
                : 'bg-neutral-900/80 hover:bg-neutral-850 border-neutral-800 text-neutral-300 hover:text-white'
            }`}
            title="Toggle Doctor Strange Eldritch Spells & Air Gestures (Finger Snap, Tao Shields, etc.)"
          >
            <Sparkles className={`w-3.5 h-3.5 shrink-0 ${isAirGesturesOn ? 'text-amber-400 animate-spin' : 'text-neutral-400'}`} style={{ animationDuration: '8s' }} />
            <span>Gestures & Spells</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              isAirGesturesOn ? 'bg-amber-400 text-black shadow-[0_0_8px_#ffd700]' : 'bg-neutral-800 text-neutral-400'
            }`}>
              {isAirGesturesOn ? 'ACTIVE' : 'OFF'}
            </span>
          </button>

          {/* Classic Mode Switch */}
          <button
            onClick={onToggleClassicMode}
            className="h-8.5 px-2.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/50 text-amber-300 rounded-xl font-semibold flex items-center gap-1.5 transition-all text-xs font-mono cursor-pointer whitespace-nowrap shrink-0"
            title="Switch to Classic Layout View"
          >
            <Grid className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Classic</span>
          </button>

          {/* Lock OS Button */}
          {onLockSystem && (
            <button
              onClick={onLockSystem}
              className="h-8.5 px-2.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/50 hover:border-rose-400 text-rose-300 hover:text-rose-100 rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(244,63,94,0.15)] cursor-pointer whitespace-nowrap shrink-0"
              title="Lock JASPER OS with Biometrics"
            >
              <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>Lock</span>
            </button>
          )}

          {/* Digital Clock Badge */}
          <div className="h-8.5 px-2.5 text-amber-300 font-mono font-bold text-xs bg-black/90 border border-neutral-800 rounded-xl flex items-center whitespace-nowrap shrink-0 shadow-inner">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        </div>
      </div>

      {/* OS APP CENTER & START LAUNCHER DRAWER (FULL MULTI-ROW MATRIX) */}
      {showStartMenu && (
        <div className="absolute top-14 left-2 right-2 sm:left-4 sm:right-auto w-auto sm:w-[860px] lg:w-[940px] max-w-[calc(100vw-24px)] bg-black border border-neutral-800 rounded-2xl p-3 sm:p-4 shadow-[0_0_50px_rgba(0,0,0,1)] backdrop-blur-3xl z-50 animate-in fade-in slide-in-from-top-2 max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-amber-500/30 pb-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 border border-amber-400 rounded-xl text-amber-300">
                <Zap className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-orbitron font-extrabold text-sm text-amber-200 uppercase tracking-wider">JASPER OS App Center</h3>
                <p className="text-[10px] text-neutral-400 font-mono">{filteredApps.length} Applications &bull; All Spread On Screen Matrix</p>
              </div>
            </div>
            <button
              onClick={() => setShowStartMenu(false)}
              className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search bar inside drawer */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search apps or tools..."
              value={appSearchQuery}
              onChange={(e) => setAppSearchQuery(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-neutral-800 focus:border-amber-400/60 rounded-xl pl-9 pr-3 py-1.5 text-xs text-neutral-200 font-mono focus:outline-none"
            />
          </div>

          {/* App Category Filters */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 custom-scrollbar text-[10px]">
            {['all', 'AI & Intelligence', 'Productivity & Tools', 'System & Hardware', 'Hardware Control', 'Creative & AI', 'Media & Life'].map((category) => (
              <button
                key={category}
                onClick={() => setActiveWorkspace(category)}
                className={`px-2.5 py-1 rounded-lg font-mono whitespace-nowrap transition-all cursor-pointer ${
                  activeWorkspace === category
                    ? 'bg-amber-400/20 border border-amber-400 text-amber-300'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {category === 'all' ? 'All Apps' : category}
              </button>
            ))}
          </div>

          {/* App Matrix: Multi-Column & Multi-Row Spread */}
          <div className="overflow-y-auto max-h-[52vh] grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2 custom-scrollbar pr-1">
            {filteredApps.map((app) => {
              const AppIcon = app.icon;
              const isRunning = openWindows[app.id];
              return (
                <button
                  key={app.id}
                  onClick={() => launchApp(app.id)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer text-center group h-[74px] ${
                    isRunning
                      ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-[0_0_10px_rgba(245,197,66,0.15)]'
                      : 'bg-neutral-950/70 border-neutral-800/80 hover:border-amber-500/40 hover:bg-neutral-900 text-neutral-200'
                  }`}
                  title={`${app.title} (${app.category})`}
                >
                  <div className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-amber-300 group-hover:text-amber-100 group-hover:border-amber-400 transition-all relative mb-1">
                    <AppIcon className="w-4 h-4" />
                    {isRunning && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 border border-black shadow-[0_0_6px_#ffd700]" />
                    )}
                  </div>
                  <div className="font-semibold text-[10px] text-neutral-100 group-hover:text-amber-200 truncate w-full px-0.5 leading-tight">
                    {app.title.replace(' App', '').replace('JASPER ', '')}
                  </div>
                  <div className="text-[8px] text-neutral-500 group-hover:text-amber-400/60 font-mono truncate w-full px-0.5 leading-none">
                    {app.category.replace(' & Intelligence', '').replace(' & Tools', '').replace(' & Hardware', '').replace('Hardware ', '')}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Start Menu Footer with Lock OS and System Settings */}
          <div className="mt-3 pt-3 border-t border-neutral-800 flex items-center justify-between gap-2">
            {onLockSystem && (
              <button
                onClick={() => {
                  setShowStartMenu(false);
                  onLockSystem();
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 hover:border-rose-400 text-rose-300 hover:text-rose-100 flex items-center justify-center gap-2 font-mono text-xs font-bold transition-all shadow-[0_0_15px_rgba(244,63,94,0.2)] cursor-pointer"
                title="Lock JASPER OS with Biometrics"
              >
                <Lock className="w-4 h-4 text-rose-400" />
                <span>Lock System</span>
              </button>
            )}
            {onOpenSettings && (
              <button
                onClick={() => {
                  setShowStartMenu(false);
                  onOpenSettings();
                }}
                className="py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-amber-200 flex items-center gap-1.5 font-mono text-xs transition-all cursor-pointer"
                title="System Settings"
              >
                <Settings className="w-4 h-4 text-neutral-400" />
                <span>Settings</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* DESKTOP WORKSPACE SCROLLABLE AREA (WITH OS SCREEN SCROLLBAR & CONTROLS) */}
      <div 
        ref={desktopScrollRef}
        onScroll={handleDesktopScroll}
        className="relative w-full h-[calc(100vh-105px)] top-12 overflow-y-auto overflow-x-hidden os-screen-scrollbar scroll-smooth"
      >
        {/* Native Desktop App Shortcuts: MULTIPLE ROWS & COLUMNS SPREAD MATRIX */}
        <div className="relative z-0 pointer-events-auto max-w-[calc(100vw-32px)] mx-auto pt-3 px-4 pb-36">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              <span className="font-orbitron text-xs uppercase tracking-wider text-amber-300 font-bold flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_#ffd700]" />
                JASPER OS Applications
              </span>
              <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900/90 px-2.5 py-0.5 rounded-full border border-neutral-800">
                {desktopLayoutMode === 'matrix' ? 'All 35 Apps Matrix' : '2 Rows Shelf'} • Scrollable Desktop
              </span>
            </div>

            {/* Layout View Switcher */}
            <div className="flex items-center gap-1 bg-black/80 border border-neutral-800 p-1 rounded-xl shadow-lg">
              <button
                onClick={() => setDesktopLayoutMode('matrix')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  desktopLayoutMode === 'matrix'
                    ? 'bg-amber-400/25 text-amber-300 border border-amber-400/60 shadow-[0_0_10px_rgba(245,197,66,0.2)]'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
                title="Spread across 7 columns and 5 rows so every app is shown on the screen at once without scrolling"
              >
                <Grid className="w-3.5 h-3.5" />
                <span>All On Screen (Matrix)</span>
              </button>

              <button
                onClick={() => setDesktopLayoutMode('shelf')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  desktopLayoutMode === 'shelf'
                    ? 'bg-amber-400/25 text-amber-300 border border-amber-400/60 shadow-[0_0_10px_rgba(245,197,66,0.2)]'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
                title="Compact 2 Rows horizontal scrolling shelf"
              >
                <Layout className="w-3.5 h-3.5" />
                <span>2 Rows Shelf</span>
              </button>
            </div>
          </div>

          {desktopLayoutMode === 'matrix' ? (
            /* ALL-ON-SCREEN MATRIX: 7 to 9 COLUMNS SPREAD PROPERLY (No Scrolling Required) */
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-7 xl:grid-cols-9 gap-2 sm:gap-2.5 p-3 rounded-2xl bg-black/65 border border-neutral-800/80 backdrop-blur-xl shadow-2xl">
              {/* Quick Lock System Shortcut Icon */}
              {onLockSystem && (
                <button
                  onClick={onLockSystem}
                  className="p-2 rounded-xl bg-black/80 hover:bg-rose-950/40 border border-rose-500/40 hover:border-rose-400 flex flex-col items-center justify-center gap-1 transition-all group hover:scale-105 hover:shadow-[0_0_18px_rgba(244,63,94,0.3)] cursor-pointer text-center h-[76px]"
                  title="Lock JASPER OS (Biometric Security Shield)"
                >
                  <div className="p-1.5 rounded-lg bg-[#0a0505] border border-rose-500/40 text-rose-400 group-hover:text-rose-200 group-hover:border-rose-400 transition-all shadow-[0_0_8px_rgba(244,63,94,0.2)]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-mono font-bold text-rose-300 group-hover:text-rose-100 truncate w-full px-0.5 leading-tight">
                    Lock Shield
                  </div>
                  <div className="text-[8px] font-mono text-rose-400/60 truncate w-full leading-none">
                    Biometrics
                  </div>
                </button>
              )}

              {JASPER_OS_APPS_REGISTRY.map((app) => {
                const AppIcon = app.icon;
                const isRunning = openWindows[app.id];
                return (
                  <button
                    key={app.id}
                    onClick={() => launchApp(app.id)}
                    className={`p-2 rounded-xl bg-black/75 hover:bg-neutral-900/90 border border-neutral-800/80 hover:border-amber-400/80 flex flex-col items-center justify-center gap-1 transition-all group hover:scale-105 hover:shadow-[0_0_20px_rgba(245,197,66,0.25)] cursor-pointer text-center relative h-[76px] ${
                      isRunning ? 'border-amber-400/80 bg-amber-500/20 shadow-[0_0_12px_rgba(245,197,66,0.2)]' : ''
                    }`}
                    title={`${app.title} (${app.category})`}
                  >
                    <div className="p-1.5 rounded-lg bg-[#080808] border border-neutral-800 text-amber-300 group-hover:text-amber-100 group-hover:border-amber-400 transition-all relative flex items-center justify-center flex-shrink-0">
                      <AppIcon className="w-4 h-4" />
                      {isRunning && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 border border-black shadow-[0_0_6px_#ffd700] animate-pulse" />
                      )}
                    </div>
                    <div className="text-[10px] sm:text-[11px] font-mono font-semibold text-neutral-200 group-hover:text-amber-200 truncate w-full px-0.5 leading-tight">
                      {app.title.replace(' App', '').replace('JASPER ', '')}
                    </div>
                    <div className="text-[8px] font-mono text-neutral-500 truncate w-full group-hover:text-amber-400/60 leading-none">
                      {app.category.replace(' & Intelligence', '').replace(' & Tools', '').replace(' & Hardware', '').replace('Hardware ', '')}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* 2 ROWS HORIZONTAL SHELF */
            <div className="grid grid-rows-2 grid-flow-col auto-cols-[140px] sm:auto-cols-[152px] gap-2 p-2.5 rounded-2xl bg-black/75 border border-neutral-800/80 backdrop-blur-xl overflow-x-auto custom-scrollbar shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
              {onLockSystem && (
                <button
                  onClick={onLockSystem}
                  className="p-2 rounded-xl bg-black/90 hover:bg-rose-950/40 border border-rose-500/40 hover:border-rose-400 flex items-center gap-2.5 transition-all group hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(244,63,94,0.25)] cursor-pointer text-left h-[52px] flex-shrink-0"
                  title="Lock JASPER OS (Biometric Security Shield)"
                >
                  <div className="p-2 rounded-lg bg-[#0a0505] border border-rose-500/40 text-rose-400 group-hover:text-rose-200 group-hover:border-rose-400 transition-all shadow-[0_0_8px_rgba(244,63,94,0.2)] flex-shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10.5px] font-mono font-bold text-rose-300 group-hover:text-rose-100 truncate">
                      Lock System
                    </div>
                    <div className="text-[8.5px] font-mono text-rose-400/60 truncate">
                      Biometric Shield
                    </div>
                  </div>
                </button>
              )}

              {JASPER_OS_APPS_REGISTRY.map((app) => {
                const AppIcon = app.icon;
                const isRunning = openWindows[app.id];
                return (
                  <button
                    key={app.id}
                    onClick={() => launchApp(app.id)}
                    className={`p-2 rounded-xl bg-black/80 hover:bg-neutral-900/90 border border-neutral-800/80 hover:border-amber-400/70 flex items-center gap-2.5 transition-all group hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(245,197,66,0.25)] text-left h-[52px] flex-shrink-0 cursor-pointer ${
                      isRunning ? 'border-amber-400/80 bg-amber-500/20 shadow-[0_0_12px_rgba(245,197,66,0.2)]' : ''
                    }`}
                    title={app.title}
                  >
                    <div className="p-2 rounded-lg bg-[#080808] border border-neutral-800 text-amber-300 group-hover:text-amber-100 group-hover:border-amber-400 transition-all relative flex-shrink-0">
                      <AppIcon className="w-4 h-4" />
                      {isRunning && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 border border-black shadow-[0_0_6px_#ffd700]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10.5px] font-mono font-semibold text-neutral-200 group-hover:text-amber-200 truncate">
                        {app.title.replace(' App', '').replace('JASPER ', '')}
                      </div>
                      <div className="text-[8.5px] font-mono text-neutral-500 truncate group-hover:text-amber-400/60">
                        {app.category.replace(' & ', '/')}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* FLOATING SCROLL DOWN BAR FOR OS SCREEN */}
      {hasOverflow && (
        <div className="absolute bottom-[72px] sm:bottom-[76px] left-1/2 -translate-x-1/2 z-40 pointer-events-auto flex items-center gap-2 bg-black/90 border border-amber-400/60 hover:border-amber-300 rounded-full px-3.5 py-1.5 shadow-[0_0_25px_rgba(245,197,66,0.35)] backdrop-blur-xl transition-all duration-300 group">
          <button
            onClick={() => handleScrollToEdge(canScrollDown ? 'bottom' : 'top')}
            className="flex items-center gap-2 text-[11px] font-mono font-bold text-amber-200 group-hover:text-white transition-all cursor-pointer"
            title={canScrollDown ? "Scroll down to reveal all applications" : "Scroll back to top"}
          >
            {canScrollDown ? (
              <>
                <ChevronDown className="w-4 h-4 text-amber-400 animate-bounce" />
                <span>SCROLL DOWN TO VIEW ALL APPS</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-4 h-4 text-amber-400" />
                <span>SCROLL BACK TO TOP</span>
              </>
            )}
          </button>

          <div className="h-3 w-px bg-amber-500/40" />

          <div className="flex items-center gap-1">
            <button
              onClick={handleScrollUp}
              disabled={!canScrollUp}
              className={`p-1 rounded-full transition-all ${
                canScrollUp ? 'text-amber-300 hover:bg-amber-500/20 cursor-pointer' : 'text-neutral-600 opacity-40 cursor-not-allowed'
              }`}
              title="Scroll Up"
            >
              <ChevronUp className="w-3 h-3" />
            </button>
            <button
              onClick={handleScrollDown}
              disabled={!canScrollDown}
              className={`p-1 rounded-full transition-all ${
                canScrollDown ? 'text-amber-300 hover:bg-amber-500/20 cursor-pointer' : 'text-neutral-600 opacity-40 cursor-not-allowed'
              }`}
              title="Scroll Down"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          <span className="text-[9px] font-mono text-amber-400/80 font-semibold pl-0.5">
            {Math.round(scrollProgress)}%
          </span>
        </div>
      )}

      {/* FLOATING RIGHT-SIDE CYBERNETIC SCROLL RAIL */}
      {hasOverflow && (
        <div className="absolute right-1 top-16 bottom-24 w-3.5 z-40 hidden md:flex flex-col items-center justify-between pointer-events-auto py-1">
          <button
            onClick={() => handleScrollToEdge('top')}
            className="w-5 h-5 rounded bg-black/90 border border-amber-500/40 text-amber-300 hover:text-white flex items-center justify-center text-[10px] shadow transition-all cursor-pointer hover:border-amber-400"
            title="Scroll to Top"
          >
            <ChevronUp className="w-3 h-3" />
          </button>
          
          {/* Visual Track & Draggable/Clickable Indicator */}
          <div 
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickRatio = (e.clientY - rect.top) / rect.height;
              if (desktopScrollRef.current) {
                const target = clickRatio * (desktopScrollRef.current.scrollHeight - desktopScrollRef.current.clientHeight);
                desktopScrollRef.current.scrollTo({ top: target, behavior: 'smooth' });
              }
            }}
            className="flex-1 w-1.5 my-1.5 rounded-full bg-black/80 border border-amber-500/30 relative cursor-pointer group shadow-[0_0_8px_rgba(0,0,0,0.8)]"
            title="Click to jump scroll position"
          >
            <div 
              style={{ top: `${scrollProgress}%` }}
              className="absolute -left-1 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 border border-amber-300 shadow-[0_0_10px_#ffd700] group-hover:scale-125 transition-transform"
            />
          </div>

          <button
            onClick={() => handleScrollToEdge('bottom')}
            className="w-5 h-5 rounded bg-black/90 border border-amber-500/40 text-amber-300 hover:text-white flex items-center justify-center text-[10px] shadow transition-all cursor-pointer hover:border-amber-400"
            title="Scroll to Bottom"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* WINDOW MANAGER VIEWPORT LAYER */}
      <div className="absolute top-12 left-0 right-0 h-[calc(100vh-105px)] pointer-events-none z-20 overflow-hidden">
        {JASPER_OS_APPS_REGISTRY.map((app) => {
          if (!openWindows[app.id]) return null;
          const AppComponent = app.component;
          const AppIcon = app.icon;
          return (
            <div key={app.id} className="pointer-events-auto">
              <OsWindow
                id={app.id}
                title={app.title}
                icon={AppIcon}
                defaultPos={{ x: Math.max(20, Math.min((typeof window !== 'undefined' ? (window.innerWidth - (app.defaultSize?.w || 640)) / 2 : 60) + (JASPER_OS_APPS_REGISTRY.findIndex(a => a.id === app.id) % 5) * 30, (typeof window !== 'undefined' ? window.innerWidth - 300 : 800))), y: Math.max(10, Math.min((typeof window !== 'undefined' ? (window.innerHeight - (app.defaultSize?.h || 480)) / 2 : 50) + (JASPER_OS_APPS_REGISTRY.findIndex(a => a.id === app.id) % 4) * 25, (typeof window !== 'undefined' ? window.innerHeight - 300 : 400))) }}
                defaultSize={app.defaultSize}
                zIndex={activeZIndex[app.id] || 5}
                onFocus={bringToTop}
                onClose={closeWindow}
                onMinimize={minimizeWindow}
                isMinimized={minimizedWindows[app.id]}
                isMaximizedExternal={maximizedWindows[app.id]}
                onToggleMaximize={(winId) => setMaximizedWindows(prev => ({ ...prev, [winId]: !prev[winId] }))}
                isGestureActive={isAirGesturesOn}
                bodyRef={(el) => { if (el) windowBodyRefs.current[app.id] = el; }}
              >
                <AppComponent onLockSystem={onLockSystem} />
              </OsWindow>
            </div>
          );
        })}
      </div>

      {/* BOTTOM OS NATIVE APP DOCK (WITH 2 ROWS EXPAND TOGGLE) */}
      <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 ${dockTwoRows ? 'h-[108px]' : 'h-14'} bg-black/95 border border-neutral-800 rounded-2xl px-3 py-1.5 flex items-center gap-2 backdrop-blur-2xl shadow-[0_10px_35px_rgba(0,0,0,1)] z-50 max-w-[95vw] transition-all duration-200`}>
        <div className={`overflow-x-auto custom-scrollbar p-0.5 ${dockTwoRows ? 'grid grid-rows-2 grid-flow-col auto-cols-max gap-1.5' : 'flex items-center gap-1.5'}`}>
          {(dockTwoRows ? JASPER_OS_APPS_REGISTRY : JASPER_OS_APPS_REGISTRY.slice(0, 12)).map((app) => {
            const AppIcon = app.icon;
            const isRunning = openWindows[app.id];
            const isMinimized = minimizedWindows[app.id];
            return (
              <button
                key={app.id}
                onClick={() => toggleWindow(app.id)}
                className={`relative p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  isRunning && !isMinimized
                    ? 'bg-amber-500/30 border border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,197,66,0.3)] scale-105'
                    : isRunning && isMinimized
                    ? 'bg-neutral-900 border border-amber-500/40 text-amber-400 opacity-80'
                    : 'text-neutral-400 hover:text-amber-300 hover:bg-neutral-900/60 border border-transparent'
                }`}
                title={app.title}
              >
                <AppIcon className="w-4 h-4" />
                {isRunning && (
                  <span className={`absolute -bottom-0.5 w-1.5 h-1.5 rounded-full ${isMinimized ? 'bg-amber-400' : 'bg-amber-400 shadow-[0_0_8px_#ffd700]'}`} />
                )}
              </button>
            );
          })}
        </div>

        <div className="h-6 w-px bg-amber-500/30 mx-1 flex-shrink-0" />

        <button
          onClick={() => setDockTwoRows(!dockTwoRows)}
          className="p-1.5 px-2 rounded-xl bg-neutral-900 hover:bg-amber-500/20 border border-neutral-700 hover:border-amber-400/60 text-amber-300 flex items-center gap-1 text-[10px] font-mono whitespace-nowrap cursor-pointer transition-all flex-shrink-0"
          title={dockTwoRows ? 'Collapse dock to 1 Row' : 'Expand dock to 2 Rows'}
        >
          <Layout className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-bold">{dockTwoRows ? '1 Row' : '2 Rows'}</span>
        </button>

        <button
          onClick={() => setShowStartMenu(true)}
          className="p-2 rounded-xl text-amber-300 hover:bg-amber-500/20 border border-amber-500/40 flex items-center gap-1 text-xs font-mono cursor-pointer flex-shrink-0"
          title="Open JASPER OS App Center"
        >
          <Layers className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline font-bold">App Center</span>
        </button>

        {onLockSystem && (
          <button
            onClick={onLockSystem}
            className="p-2 rounded-xl text-rose-400 hover:text-rose-100 bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/50 hover:border-rose-400 flex items-center gap-1.5 text-xs font-mono transition-all shadow-[0_0_12px_rgba(244,63,94,0.2)] cursor-pointer flex-shrink-0"
            title="Lock JASPER OS (Biometric Security Shield)"
          >
            <Lock className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline font-bold">Lock</span>
          </button>
        )}
      </div>

      {/* GLOBAL WEBCAM VIDEO (MOUNTED FOR AIR GESTURE ENGINE) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="fixed top-0 left-0 w-2 h-2 pointer-events-none opacity-[0.001] z-[-1]"
      />

      {/* FLOATING DOCTOR STRANGE SPATIAL SPELL HUD (TOP RIGHT) */}
      {isAirGesturesOn && (
        <div className="spatial-gesture-hud fixed top-16 right-4 z-[990] flex flex-col items-end gap-2 pointer-events-auto select-none font-mono">
          {/* Main HUD Card */}
          <div className="bg-black/92 border border-amber-500/50 rounded-2xl p-3 shadow-[0_0_35px_rgba(255,140,0,0.35)] backdrop-blur-2xl flex flex-col gap-2 max-w-[290px] w-[275px] animate-in fade-in slide-in-from-top-4 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-amber-500/25 pb-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                </span>
                <span className="text-xs font-bold text-amber-300 tracking-wider flex items-center gap-1.5">
                  <span>DOCTOR STRANGE SPELL ENGINE</span>
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowGestureGuide(true)}
                  className="p-1 rounded text-amber-400 hover:bg-amber-500/20 transition-colors"
                  title="Open Doctor Strange Spells Cheatsheet"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsHudCollapsed(!isHudCollapsed)}
                  className="p-1 rounded text-slate-400 hover:bg-slate-800 transition-colors"
                  title={isHudCollapsed ? "Expand Camera" : "Collapse Camera"}
                >
                  {isHudCollapsed ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setIsAirGesturesOn(false)}
                  className="p-1 rounded text-rose-400 hover:bg-rose-500/20 transition-colors"
                  title="Disable Spells & Gestures"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Skeletal Joints & Tao Mandala Canvas Thumbnail (collapsible but kept in DOM) */}
            <div className={`relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-black border border-amber-500/40 flex items-center justify-center shadow-inner ${isHudCollapsed ? 'hidden' : ''}`}>
              <canvas
                ref={canvasRef}
                width={240}
                height={180}
                className="w-full h-full object-cover scale-x-[-1]"
              />
              <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 border border-amber-500/40 text-[9px] text-amber-300 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                TAO MANDALA TRACKER
              </div>
            </div>

            {/* Live Detected Spell / Gesture Pill */}
            <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-200">
                <span className="flex items-center gap-1.5 truncate">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-spin" style={{ animationDuration: '6s' }} />
                  <span className="truncate">{activeGesture || 'READY TO CAST'}</span>
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/25 text-amber-300 font-normal shrink-0 border border-amber-500/30">
                  {gestureStatus}
                </span>
              </div>
              
              {/* Quick Snap Action Button */}
              <div className="pt-1.5 border-t border-amber-500/20 flex items-center justify-between">
                <span className="text-[9px] text-amber-400/80 truncate">Snap fingers to close all apps</span>
                <button
                  onClick={closeAllApps}
                  className="text-[9px] px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/40 border border-amber-400/50 text-amber-200 font-bold transition-all shadow-sm"
                  title="Trigger Finger Snap: Closes all open apps"
                >
                  🫰 Snap Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN DOCTOR STRANGE SNAP SHOCKWAVE DISSOLUTION OVERLAY */}
      {snapShockwaveActive && (
        <div className="fixed inset-0 z-[99999] pointer-events-none flex flex-col items-center justify-center overflow-hidden animate-in fade-in duration-150">
          {/* Cosmic Dissolution Radial Shockwaves */}
          <div className="absolute w-[160vw] h-[160vw] rounded-full border-4 border-amber-400/80 animate-ping opacity-90 shadow-[0_0_80px_#ff9900]" />
          <div className="absolute w-[110vw] h-[110vw] rounded-full border-2 border-dashed border-orange-500/90 animate-spin" style={{ animationDuration: '4s' }} />
          <div className="absolute w-[60vw] h-[60vw] rounded-full bg-radial from-amber-500/30 via-orange-600/10 to-transparent animate-pulse" />

          {/* Central Rotating Tao Mandala Shockwave Core */}
          <div className="relative flex flex-col items-center justify-center p-8 bg-black/85 border-2 border-amber-500/90 rounded-3xl shadow-[0_0_70px_rgba(255,150,0,0.7)] backdrop-blur-md">
            <span className="text-5xl mb-2 animate-bounce">🫰✨</span>
            <div className="font-orbitron font-extrabold text-xl text-amber-300 tracking-widest uppercase flex items-center gap-2 drop-shadow-[0_0_15px_#ff9900]">
              ✦ ELDRITCH SNAP: ALL APPS DISSOLVED ✦
            </div>
            <p className="font-mono text-xs text-amber-200/90 mt-1 uppercase tracking-wider">
              Doctor Strange Mystical Dispersion Activated
            </p>
          </div>
        </div>
      )}

      {/* HOLOGRAPHIC DOCTOR STRANGE LASER RETICLE CURSOR */}
      {airCursorPos && isAirGesturesOn && (
        <div 
          className="fixed pointer-events-none z-[9999] transition-all duration-75 ease-out"
          style={{
            left: `${airCursorPos.x * 100}vw`,
            top: `${airCursorPos.y * 100}vh`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className={`relative flex items-center justify-center ${airCursorPos.isClicking ? 'scale-125' : 'scale-100'} transition-transform`}>
            {/* Outer rotating Tao Mandala ring */}
            <div className={`w-12 h-12 rounded-full border-2 border-dashed ${airCursorPos.isClicking ? 'border-yellow-300 animate-ping' : 'border-amber-400'} animate-spin`} style={{ animationDuration: '6s' }} />
            {/* Inner glowing core */}
            <div className={`w-3.5 h-3.5 rounded-full ${airCursorPos.isClicking ? 'bg-yellow-200 shadow-[0_0_20px_#ffd700]' : 'bg-amber-400 shadow-[0_0_15px_#ff9900]'}`} />
            {/* Mystic crosshair rays */}
            <div className="absolute w-7 h-0.5 bg-amber-400/90 -left-1" />
            <div className="absolute w-7 h-0.5 bg-amber-400/90 -right-1" />
            <div className="absolute h-7 w-0.5 bg-amber-400/90 -top-1" />
            <div className="absolute h-7 w-0.5 bg-amber-400/90 -bottom-1" />
            {/* Badge */}
            <div className="absolute top-7 left-7 font-mono text-[9px] text-amber-300 bg-black/90 px-2 py-0.5 rounded border border-amber-500/50 whitespace-nowrap shadow-xl">
              MYSTIC RAY {airCursorPos.isClicking ? '• AIR CLICK' : ''}
            </div>
          </div>
        </div>
      )}

      {/* DOCTOR STRANGE SPELLS CHEATSHEET & GUIDE MODAL */}
      {showGestureGuide && (
        <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-black border border-amber-500/50 rounded-2xl shadow-[0_0_60px_rgba(255,140,0,0.35)] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-3.5 bg-amber-950/40 border-b border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                <div>
                  <h3 className="font-orbitron font-bold text-sm text-amber-200 uppercase tracking-wider">Doctor Strange Mystical Spell Directory</h3>
                  <p className="text-[10px] text-amber-400/80 font-mono">Real-time MediaPipe skeletal tracking with Tao Mandalas & Eldritch Sparks</p>
                </div>
              </div>
              <button onClick={() => setShowGestureGuide(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto custom-scrollbar grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { icon: '🫰', title: 'Finger Snap', pose: 'Touch thumb to middle & snap flick', action: '✦ Mystical Dispersion: Closes ALL open OS applications instantly with cosmic shockwave!' },
                { icon: '🛡️', title: 'Tao Mandala Shield', pose: '5 fingers wide open facing camera', action: 'Casts glowing rotating Doctor Strange Tao Shield; toggles Desktop / Restores' },
                { icon: '⚡', title: 'Mystic Energy Beam', pose: 'Index finger pointing forward', action: 'Projects Doctor Strange energy ray reticle for air cursor navigation & clicks' },
                { icon: '🤏', title: 'Mirror Dimension Pinch', pose: 'Thumb + Index pinch-drag', action: 'Weaves mystical energy strands to rotate 3D holographic models in space' },
                { icon: '✊', title: 'Eldritch Fist', pose: 'All fingers curled into tight fist', action: 'Condenses spell energy to minimize the currently active window to dock' },
                { icon: '✌️', title: 'Sacred V-Sign', pose: 'Index + Middle fingers in V', action: 'Toggles Maximize and Restore on the active application window' },
                { icon: '👇', title: 'Air Scroll Down', pose: 'Wave open palm or index downwards', action: 'Smooth scrolls content down inside the currently focused app window' },
                { icon: '☝️', title: 'Air Scroll Up', pose: 'Wave open palm or index upwards', action: 'Smooth scrolls content up inside the currently focused app window' },
                { icon: '👍', title: 'Thumbs Up', pose: 'Thumb extended up, 4 fingers curled', action: 'Confirms primary actions, approves dialogs, or unmutes audio' },
                { icon: '👎', title: 'Thumbs Down', pose: 'Thumb pointed down, 4 fingers curled', action: 'Cancels actions, dismisses toasts, or mutes audio' },
                { icon: '👌', title: 'OK Sign', pose: 'Thumb + Index ring, 3 fingers up', action: 'Activates Jarvis Voice Commander / wake speech listener' },
                { icon: '👐', title: 'Two-Hand Zoom', pose: 'Both hands spread apart / together', action: 'Expands or shrinks 3D holographic models and spatial maps' },
              ].map((g, idx) => (
                <div key={idx} className="p-3 bg-neutral-950/90 border border-amber-500/20 hover:border-amber-400/60 rounded-xl flex flex-col justify-between gap-2 transition-all hover:shadow-[0_0_15px_rgba(255,140,0,0.2)]">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl p-1.5 rounded-lg bg-amber-950/50 border border-amber-500/30">{g.icon}</span>
                    <div>
                      <h4 className="font-mono text-xs font-bold text-amber-200">{g.title}</h4>
                      <p className="text-[10px] text-amber-400/80 font-mono">{g.pose}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-300 font-sans leading-relaxed border-t border-amber-500/15 pt-2">
                    {g.action}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-amber-500/25 bg-black flex items-center justify-between text-xs font-mono">
              <span className="text-amber-300/80 text-[11px]">Tip: Snap thumb & middle finger to dismiss all open windows instantly!</span>
              <button
                onClick={() => setShowGestureGuide(false)}
                className="px-4 py-1.5 bg-amber-500/25 hover:bg-amber-500/40 border border-amber-400 text-amber-200 rounded-lg font-bold"
              >
                Enter Kamar-Taj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
