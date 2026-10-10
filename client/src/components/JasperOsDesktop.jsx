import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Box, Terminal, Tv, Cpu, Shield, Sparkles, Smartphone, Monitor, Globe, 
  Activity, X, Minus, Square, Maximize2, RefreshCw, Layout, Layers, Volume2, 
  Zap, Radio, Settings, HelpCircle, HardDrive, Wifi, BatteryCharging, Search,
  Bot, Palette, Music, Workflow, BarChart3, Brain, Store, Trophy, MapPin, Heart, Languages, BookOpen, Laptop, Grid, AppWindow, Lock,
  Hand, Camera, CameraOff, Move, ThumbsUp, ThumbsDown, Crosshair, ChevronDown, ChevronUp, MoveVertical, Eye, EyeOff, Power, Check,
  Database, Download, Upload
} from 'lucide-react';
import { AirGestureTracker } from '../utils/gestureTracker';
import { playJarvisBeep, playJarvisScan, playJarvisPowerUp, playMysticSnap } from '../utils/jarvisAudioSynth';

// Lightweight Core Widgets
import DiagnosticWidget from './DiagnosticWidget';
import PaymentBalanceWidget from './PaymentBalanceWidget';
import JasperCommandCenter from './JasperCommandCenter';

// Code-Split Dynamic Heavy Modules (Loads on demand when window opens)
const UniversalTvRemoteWidget = React.lazy(() => import('./UniversalTvRemoteWidget'));
const PcMasterHubWidget = React.lazy(() => import('./PcMasterHubWidget'));
const PhoneControlWidget = React.lazy(() => import('./PhoneControlWidget'));
const SecurityCenterWidget = React.lazy(() => import('./SecurityCenterWidget'));
const AgenticActionsWidget = React.lazy(() => import('./AgenticActionsWidget'));
const BrowserAgentWidget = React.lazy(() => import('./BrowserAgentWidget'));
const AiMasterHubWidget = React.lazy(() => import('./AiMasterHubWidget'));
const ImageGeneratorWidget = React.lazy(() => import('./ImageGeneratorWidget'));
const MusicMasterHubWidget = React.lazy(() => import('./MusicMasterHubWidget'));
const DevicesMasterHubWidget = React.lazy(() => import('./DevicesMasterHubWidget'));
const PersonalAssistantWidget = React.lazy(() => import('./PersonalAssistantWidget'));
const MemoryDashboardWidget = React.lazy(() => import('./MemoryDashboardWidget'));
const SkillsStoreWidget = React.lazy(() => import('./SkillsStoreWidget'));
const AnalyticsWidget = React.lazy(() => import('./AnalyticsWidget'));
const AutomationBuilderWidget = React.lazy(() => import('./AutomationBuilderWidget'));
const MissionControlWidget = React.lazy(() => import('./MissionControlWidget'));
const SportsHubWidget = React.lazy(() => import('./SportsHubWidget'));
const MapsWidget = React.lazy(() => import('./MapsWidget'));
const HealthFitbandWidget = React.lazy(() => import('./HealthFitbandWidget'));
const LiveTranslationWidget = React.lazy(() => import('./LiveTranslationWidget'));
const UserManualWidget = React.lazy(() => import('./UserManualWidget'));
const SocialAutoReplyWidget = React.lazy(() => import('./SocialAutoReplyWidget'));
const JasperSearchApp = React.lazy(() => import('./JasperSearchApp'));
const JasperBrowserApp = React.lazy(() => import('./JasperBrowserApp'));
const JasperFileManagerApp = React.lazy(() => import('./JasperFileManagerApp'));
const JasperCodeStudioApp = React.lazy(() => import('./JasperCodeStudioApp'));
const JasperNotesPlannerApp = React.lazy(() => import('./JasperNotesPlannerApp'));
const JasperCalculatorApp = React.lazy(() => import('./JasperCalculatorApp'));
const JasperAgentHubWidget = React.lazy(() => import('./JasperAgentHubWidget'));
const BlenderStudioModal = React.lazy(() => import('./BlenderStudioModal'));
const HolographicAnswerModal = React.lazy(() => import('./HolographicAnswerModal'));
const PhoneSentinelWidget = React.lazy(() => import('./PhoneSentinelWidget'));
const JasperVideoStudioApp = React.lazy(() => import('./JasperVideoStudioApp'));
const TelephonyReceptionistWidget = React.lazy(() => import('./TelephonyReceptionistWidget'));

import { Calculator, FileCode, Compass, MessageSquare, ShieldAlert, Video, Wallet, PhoneForwarded } from 'lucide-react';

/**
 * ALL NATIVE JASPER OS APPLICATIONS REGISTRY
 */
const JASPER_OS_APPS_REGISTRY = [
  { id: 'telephonyHub', title: 'Telephony Hub', category: 'Hardware Control', icon: PhoneForwarded, component: TelephonyReceptionistWidget, defaultSize: { w: 960, h: 640 } },
  { id: 'payVault', title: 'Pay Vault & Guardian Budget', category: 'Finance & Security', icon: Wallet, component: PaymentBalanceWidget, defaultSize: { w: 940, h: 640 } },
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
 * RECOGNIZED SPATIAL HAND GESTURES & COMMANDS REGISTRY
 */
export const ALL_HAND_GESTURES = [
  {
    id: 'snap',
    icon: '🫰',
    title: 'Finger Snap',
    category: 'Actions',
    pose: 'Touch thumb to middle finger & flick apart violently',
    action: 'Dissolves / minimizes all active application windows smoothly to the dock',
    command: 'Close All Apps'
  },
  {
    id: 'palm',
    icon: '🖐️',
    title: 'Open Palm (Repulsor)',
    category: 'Window',
    pose: 'Hold 5 fingers wide open facing the camera',
    action: 'Desktop Quick Peek: Toggles minimize / restore all open windows',
    command: 'Show Desktop'
  },
  {
    id: 'pointer',
    icon: '☝️',
    title: 'Air Pointer',
    category: 'Navigation',
    pose: 'Index finger extended forward, other fingers curled',
    action: 'Projects virtual air cursor reticle for hands-free tracking and pointing',
    command: 'Air Cursor'
  },
  {
    id: 'peace',
    icon: '✌️',
    title: 'Victory / Peace (V)',
    category: 'Window',
    pose: 'Extend index and middle fingers in a V-shape',
    action: 'Toggles Maximize / Restore on the currently active application window',
    command: 'Toggle Maximize'
  },
  {
    id: 'fist',
    icon: '✊',
    title: 'Closed Fist',
    category: 'Window',
    pose: 'Curl all fingers tightly into a closed fist',
    action: 'Minimizes the currently active foreground window',
    command: 'Minimize Window'
  },
  {
    id: 'scroll_down',
    icon: '👇',
    title: 'Air Scroll Down',
    category: 'Navigation',
    pose: 'Open hand waving downwards across the camera frame',
    action: 'Smooth scrolls content down inside active app window or desktop',
    command: 'Scroll Down'
  },
  {
    id: 'scroll_up',
    icon: '👆',
    title: 'Air Scroll Up',
    category: 'Navigation',
    pose: 'Open hand waving upwards across the camera frame',
    action: 'Smooth scrolls content up inside active app window or desktop',
    command: 'Scroll Up'
  },
  {
    id: 'thumbs_up',
    icon: '👍',
    title: 'Thumbs Up',
    category: 'Actions',
    pose: 'Thumb extended up, fingers curled inward',
    action: 'Confirms primary actions, approves modals, or unmutes audio',
    command: 'Confirm / Approve'
  },
  {
    id: 'thumbs_down',
    icon: '👎',
    title: 'Thumbs Down',
    category: 'Actions',
    pose: 'Thumb pointed down, fingers curled inward',
    action: 'Cancels actions, rejects dialogs, dismisses alerts, or mutes audio',
    command: 'Cancel / Reject'
  },
  {
    id: 'ok_sign',
    icon: '👌',
    title: 'OK Sign',
    category: 'Actions',
    pose: 'Touch index to thumb forming a ring, other 3 extended',
    action: 'Activates speech recognition and Voice Commander microphone',
    command: 'Voice Commander'
  },
  {
    id: 'pinch_drag',
    icon: '🤏',
    title: 'Spatial Pinch-Drag',
    category: 'Actions',
    pose: 'Pinch thumb and index together and drag in air',
    action: 'Interactively rotates 3D holographic objects and spatial models',
    command: '3D Orbit Rotate'
  },
  {
    id: 'pinch_tap',
    icon: '✨',
    title: 'Pinch-Tap Click',
    category: 'Navigation',
    pose: 'Quick tap of thumb and index tips together (<300ms)',
    action: 'Executes a hands-free click on whichever UI element is pointed at',
    command: 'Air Click'
  },
  {
    id: 'swipe_cycle',
    icon: '🖖',
    title: '3-Finger App Swipe',
    category: 'Navigation',
    pose: '3 fingers extended, horizontal swipe left or right',
    action: 'Cycles to next / previous open window in the application switcher',
    command: 'Switch Window'
  },
  {
    id: 'two_hand_zoom',
    icon: '👐',
    title: 'Two-Hand Zoom',
    category: 'Navigation',
    pose: 'Move both hands closer together or spread them apart',
    action: 'Zooms in or out on maps, blueprints, diagrams, and 3D scenes',
    command: 'Mirror Zoom'
  },
  {
    id: 'double_fist',
    icon: '👊👊',
    title: 'Double Fist Lock',
    category: 'Window',
    pose: 'Hold both hands in closed fists simultaneously',
    action: 'Force closes the currently active application window completely',
    command: 'Close Window'
  }
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
      className={`absolute flex flex-col rounded-2xl bg-slate-950/95 border border-white/[0.1] backdrop-blur-3xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] overflow-hidden transition-shadow duration-200 ${
        isDragging ? 'ring-2 ring-indigo-400/80 shadow-[0_0_50px_rgba(99,102,241,0.35)] select-none' : 'ring-1 ring-white/[0.05]'
      }`}
    >
      {/* Window Header Bar */}
      <div
        onMouseDown={handleHeaderMouseDown}
        onTouchStart={handleHeaderTouchStart}
        className="px-3.5 py-2.5 bg-slate-900/85 border-b border-white/[0.08] flex items-center justify-between cursor-grab active:cursor-grabbing select-none backdrop-blur-2xl shrink-0"
      >
        <div className="flex items-center gap-2 text-slate-100 font-sans text-xs font-semibold tracking-wide truncate max-w-[60%]">
          {Icon && <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400 shrink-0" />}
          <span className="truncate">{title}</span>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {isGestureActive && (
            <div 
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-500/15 border border-sky-400/30 text-[9px] font-mono text-sky-300 mr-1 animate-pulse"
              title="Air Gestures Connected: Wave hand to scroll, Peace sign to maximize, Fist to minimize"
            >
              <Hand className="w-3 h-3 text-sky-400" />
              <span className="hidden sm:inline">AIR GESTURE</span>
            </div>
          )}
          <button
            onClick={() => onMinimize(id)}
            className="window-control-btn p-1 sm:p-1.5 rounded-lg text-slate-400 hover:bg-white/[0.08] hover:text-slate-100 transition-colors"
            title="Minimize App"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleMaximize}
            className="window-control-btn p-1 sm:p-1.5 rounded-lg text-slate-400 hover:bg-white/[0.08] hover:text-slate-100 transition-colors"
            title={isMaximized ? "Restore Window" : "Maximize Window"}
          >
            {isMaximized ? <Square className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => onClose(id)}
            className="window-control-btn p-1 sm:p-1.5 rounded-lg text-slate-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors"
            title="Close App"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* App Window Body */}
      <div ref={bodyRef} className="flex-1 overflow-y-auto p-2 sm:p-3 text-slate-100 font-sans custom-scrollbar bg-slate-950/80">
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
  // Clean Desktop Startup: No apps opened by default
  const [openWindows, setOpenWindows] = useState({});
  const [minimizedWindows, setMinimizedWindows] = useState({});
  const [activeZIndex, setActiveZIndex] = useState({});
  const [topZ, setTopZ] = useState(20);
  const [showStartMenu, setShowStartMenu] = useState(false);
  const [dockTwoRows, setDockTwoRows] = useState(false);
  const [desktopLayoutMode, setDesktopLayoutMode] = useState('commandCenter'); // 'commandCenter' (JARVIS HUD) | 'matrix' (All On Screen) | 'shelf' (2-Row Shelf)
  const [currentTime, setCurrentTime] = useState(new Date());

  // Satellite Hardware Bridge & DB Persistence
  const [satelliteOnline, setSatelliteOnline] = useState(false);
  const [showSatelliteModal, setShowSatelliteModal] = useState(false);
  const [dbBackupStatus, setDbBackupStatus] = useState('');
  const dbFileInputRef = useRef(null);

  useEffect(() => {
    const checkSatellite = async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      try {
        const res = await fetch('/api/satellite/status');
        if (res.ok) {
          const data = await res.json();
          setSatelliteOnline(Boolean(data.connected));
        }
      } catch (_) {}
    };
    checkSatellite();
    const interval = setInterval(checkSatellite, 25000);
    return () => clearInterval(interval);
  }, []);

  const handleExportDb = async () => {
    try {
      setDbBackupStatus('Saving...');
      const res = await fetch('/api/db/export');
      if (!res.ok) throw new Error('Export failed');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jasper-db-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDbBackupStatus('Saved!');
      setTimeout(() => setDbBackupStatus(''), 2500);
    } catch (err) {
      setDbBackupStatus('Err: ' + err.message);
      setTimeout(() => setDbBackupStatus(''), 3000);
    }
  };

  const handleImportDb = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setDbBackupStatus('Restoring...');
        const parsed = JSON.parse(e.target.result);
        const res = await fetch('/api/db/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed)
        });
        if (!res.ok) throw new Error('Restore failed');
        setDbBackupStatus('Done!');
        setTimeout(() => {
          setDbBackupStatus('');
          window.location.reload();
        }, 1200);
      } catch (err) {
        setDbBackupStatus('Err: ' + err.message);
        setTimeout(() => setDbBackupStatus(''), 3000);
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleProjectToHologram = () => {
      launchApp('hologramStudio');
    };
    const handleOpenAppEvent = (e) => {
      const appId = e.detail?.appId || e.detail?.app;
      if (appId) launchApp(appId);
    };
    window.addEventListener('jasper:project-to-hologram', handleProjectToHologram);
    window.addEventListener('jasper:open-app', handleOpenAppEvent);
    return () => {
      window.removeEventListener('jasper:project-to-hologram', handleProjectToHologram);
      window.removeEventListener('jasper:open-app', handleOpenAppEvent);
    };
  }, []);

  // Air Gesture System State - Doctor Strange Eldritch Spell Engine
  const [isAirGesturesOn, setIsAirGesturesOn] = useState(false);
  const [gestureStatus, setGestureStatus] = useState('IDLE');
  const [activeGesture, setActiveGesture] = useState('NONE');
  const [gestureFeedback, setGestureFeedback] = useState('Doctor Strange Spells Ready: Snap Fingers to Close All Apps // Palm for Tao Shield // Point to Click');
  const [showGestureHud, setShowGestureHud] = useState(true);
  const [isHudCollapsed, setIsHudCollapsed] = useState(false);
  const [showGestureGuide, setShowGestureGuide] = useState(false);
  const [showHudGesturesList, setShowHudGesturesList] = useState(false);
  const [hudGestureCategory, setHudGestureCategory] = useState('All');
  const [airCursorPos, setAirCursorPos] = useState(null);
  const [activeFocusedWinId, setActiveFocusedWinId] = useState('videoStudio');
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

  const closeWindow = useCallback((winId) => {
    setOpenWindows(prev => ({ ...prev, [winId]: false }));
  }, []);

  const minimizeWindow = useCallback((winId) => {
    setMinimizedWindows(prev => ({ ...prev, [winId]: true }));
  }, []);

  const closeAllApps = useCallback(() => {
    setOpenWindows({});
    setMinimizedWindows({});
    setMaximizedWindows({});
    setSnapShockwaveActive(true);
    setGestureFeedback('✦ ELDRITCH SNAP: ALL OS APPS DISSOLVED ✦');
    playMysticSnap();
    window.dispatchEvent(new CustomEvent('jasper:os-gesture', { detail: { gesture: 'ELDRITCH_SNAP', action: 'CLOSE_ALL_APPS' } }));
    setTimeout(() => setSnapShockwaveActive(false), 1600);
  }, []);

  const triggerGestureAction = useCallback((gestureId) => {
    switch (gestureId) {
      case 'snap':
        closeAllApps();
        break;
      case 'palm': {
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
        break;
      }
      case 'peace': {
        const cur = activeFocusedWinIdRef.current;
        if (cur) {
          setMaximizedWindows(prev => ({ ...prev, [cur]: !prev[cur] }));
          setGestureFeedback('PEACE SIGN (V): TOGGLE MAXIMIZE');
          playJarvisBeep('command');
        }
        break;
      }
      case 'fist': {
        const cur = activeFocusedWinIdRef.current;
        if (cur) {
          minimizeWindow(cur);
          setGestureFeedback('FIST: MINIMIZE WINDOW');
          playJarvisBeep('select');
        }
        break;
      }
      case 'scroll_down': {
        const cur = activeFocusedWinIdRef.current;
        const bodyEl = windowBodyRefs.current[cur];
        if (bodyEl) {
          bodyEl.scrollBy({ top: 140, behavior: 'smooth' });
        } else if (desktopScrollRef.current) {
          desktopScrollRef.current.scrollBy({ top: 140, behavior: 'smooth' });
        }
        setGestureFeedback('AIR SCROLL: DOWN');
        playJarvisBeep('click');
        break;
      }
      case 'scroll_up': {
        const cur = activeFocusedWinIdRef.current;
        const bodyEl = windowBodyRefs.current[cur];
        if (bodyEl) {
          bodyEl.scrollBy({ top: -140, behavior: 'smooth' });
        } else if (desktopScrollRef.current) {
          desktopScrollRef.current.scrollBy({ top: -140, behavior: 'smooth' });
        }
        setGestureFeedback('AIR SCROLL: UP');
        playJarvisBeep('click');
        break;
      }
      case 'thumbs_up':
        setGestureFeedback('THUMBS UP: CONFIRMED');
        playJarvisBeep('success');
        break;
      case 'thumbs_down':
        setGestureFeedback('THUMBS DOWN: CANCEL / MUTE');
        playJarvisBeep('error');
        break;
      case 'ok_sign':
        setGestureFeedback('OK SIGN: JARVIS VOICE ACTIVATED');
        playJarvisBeep('command');
        if (onMicClick) onMicClick();
        break;
      case 'swipe_cycle': {
        const curOpen = openWindowsRef.current;
        const openIds = Object.keys(curOpen).filter(id => curOpen[id]);
        if (openIds.length > 1) {
          const currIdx = Math.max(0, openIds.indexOf(activeFocusedWinIdRef.current));
          const nextIdx = (currIdx + 1) % openIds.length;
          bringToTop(openIds[nextIdx]);
          setGestureFeedback(`SWITCH WINDOW: ${openIds[nextIdx]}`);
          playJarvisBeep('click');
        }
        break;
      }
      case 'double_fist': {
        const cur = activeFocusedWinIdRef.current;
        if (cur) {
          closeWindow(cur);
          setGestureFeedback('DOUBLE FIST: CLOSED APP');
          playJarvisBeep('select');
        }
        break;
      }
      default:
        setGestureFeedback(`GESTURE TRIGGERED: ${gestureId.toUpperCase()}`);
        playJarvisBeep('click');
    }
  }, [closeAllApps, minimizeWindow, closeWindow, bringToTop, onMicClick]);

  const filteredHudGestures = useMemo(() => {
    if (hudGestureCategory === 'All') return ALL_HAND_GESTURES;
    return ALL_HAND_GESTURES.filter(g => g.category === hudGestureCategory);
  }, [hudGestureCategory]);

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
            closeAllApps();
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
    if (rawAppId === 'video' || rawAppId === 'youtube' || rawAppId === 'videoCreator' || rawAppId === 'videoStudioApp') appId = 'videoStudio';
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
    if (rawWinId === 'video' || rawWinId === 'youtube' || rawWinId === 'videoCreator' || rawWinId === 'videoStudioApp') winId = 'videoStudio';
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

  const filteredApps = JASPER_OS_APPS_REGISTRY.filter(app => {
    const matchesSearch = app.title.toLowerCase().includes(appSearchQuery.toLowerCase()) || 
                          app.category.toLowerCase().includes(appSearchQuery.toLowerCase());
    const matchesCategory = activeWorkspace === 'all' || 
                            (activeWorkspace === 'ai' && (app.category.includes('AI') || app.category.includes('Intelligence'))) ||
                            (activeWorkspace === 'control' && app.category.includes('Control')) ||
                            (activeWorkspace === 'system' && app.category.includes('System')) ||
                            (activeWorkspace === 'tools' && app.category.includes('Tools')) ||
                            app.category.toLowerCase().includes(activeWorkspace.toLowerCase()) ||
                            activeWorkspace.toLowerCase().includes(app.category.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#07090e] text-slate-100 font-sans selection:bg-indigo-500/30">
      {/* Modern Obsidian Ambient Canvas */}
      <div className="absolute inset-0 bg-[#07090e] pointer-events-none" />
      <div className="absolute -top-32 left-1/4 w-[650px] h-[450px] bg-gradient-to-br from-indigo-600/12 via-violet-600/8 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 right-1/4 w-[550px] h-[400px] bg-gradient-to-tl from-sky-600/10 via-teal-600/6 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* TOP GLASS SYSTEM TASKBAR */}
      <div 
        ref={topBarScrollRef}
        onPointerDown={handleTopBarPointerDown}
        onPointerMove={handleTopBarPointerMove}
        onPointerUp={handleTopBarPointerUp}
        onPointerLeave={handleTopBarPointerUp}
        className="absolute top-0 left-0 right-0 h-12 bg-slate-950/80 border-b border-white/[0.08] backdrop-blur-2xl z-50 overflow-x-auto touch-pan-x overscroll-x-contain scroll-smooth no-scrollbar select-none cursor-grab active:cursor-grabbing shadow-sm"
      >
        {/* Visual Edge Swipe Glow Hints for Mobile */}
        {canSwipeLeft && (
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent z-20 flex items-center pl-1">
            <span className="text-xs text-sky-400 animate-pulse font-mono font-bold">‹</span>
          </div>
        )}
        {canSwipeRight && (
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-950 via-slate-950/80 to-transparent z-20 flex items-center justify-end pr-1">
            <span className="text-xs text-sky-400 animate-pulse font-mono font-bold">›</span>
          </div>
        )}

        <div className="flex items-center justify-between min-w-max md:min-w-full gap-2 px-3 h-full">
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setShowStartMenu(!showStartMenu)}
            className="h-8.5 px-3 rounded-xl bg-gradient-to-r from-indigo-500/20 via-violet-500/15 to-sky-500/20 hover:from-indigo-500/30 hover:to-sky-500/30 border border-indigo-400/40 text-slate-100 flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)] cursor-pointer shrink-0"
            title="JASPER OS App Center & Start Launcher"
          >
            <div className="w-4 h-4 rounded-full border border-indigo-300 flex items-center justify-center animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_#38bdf8]" />
            </div>
            <span className="font-sans font-bold text-xs tracking-wide text-slate-100">JASPER OS</span>
          </button>

          {/* Quick Dedicated AI Video Studio Launcher Button */}
          <button
            onClick={() => launchApp('videoStudio')}
            className={`h-8.5 px-3 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer shrink-0 font-sans text-xs font-medium ${
              openWindows['videoStudio'] && !minimizedWindows['videoStudio']
                ? 'bg-rose-500/25 border-rose-400/50 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                : 'bg-slate-900/60 hover:bg-slate-850 border-white/[0.08] text-slate-300 hover:text-white'
            }`}
            title="Launch AI Video Creator & YouTube Studio"
          >
            <Video className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="hidden md:inline">AI Video Studio</span>
            <span className="md:hidden">Studio</span>
          </button>

          <div className="h-4 w-px bg-white/[0.1] mx-0.5 hidden sm:block" />

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
                className={`h-8 px-2.5 rounded-xl text-xs font-sans whitespace-nowrap transition-all cursor-pointer ${
                  activeWorkspace === ws.id
                    ? 'bg-white/[0.1] border border-white/[0.15] text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                {ws.label}
              </button>
            ))}
          </div>
        </div>

        {/* Center/Right: AI Avatar Voice Listener HUD, Telemetry, Gemini Cloud, Gestures, Classic, Lock, Clock */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* 1. AI Voice Avatar HUD */}
          <button
            onClick={onMicClick}
            className={`h-8.5 px-3 rounded-xl border flex items-center gap-2 whitespace-nowrap shrink-0 transition-all shadow-md cursor-pointer ${
              jasperState === 'listening'
                ? 'bg-rose-500/25 border-rose-400/60 text-rose-100 shadow-[0_0_18px_rgba(244,63,94,0.35)] animate-pulse'
                : jasperState === 'processing'
                ? 'bg-indigo-500/25 border-indigo-400/60 text-indigo-100 shadow-[0_0_18px_rgba(99,102,241,0.35)]'
                : jasperState === 'speaking'
                ? 'bg-sky-500/25 border-sky-400/60 text-sky-100 shadow-[0_0_18px_rgba(56,189,248,0.35)]'
                : 'bg-slate-900/80 border-white/[0.08] text-slate-300 hover:border-slate-600 hover:bg-slate-850'
            }`}
            title="AI Voice Avatar: Click to speak | Wake word: 'Hey Jasper'"
          >
            <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
              <div className={`absolute inset-0 rounded-full border ${
                jasperState === 'listening' ? 'border-rose-400 animate-ping opacity-75' :
                jasperState === 'processing' ? 'border-indigo-400 animate-pulse' :
                jasperState === 'speaking' ? 'border-sky-400 animate-ping' :
                'border-indigo-400/40'
              }`} />
              <div className={`w-2.5 h-2.5 rounded-full ${
                jasperState === 'listening' ? 'bg-rose-400 shadow-[0_0_8px_#f43f5e]' :
                jasperState === 'processing' ? 'bg-indigo-400 shadow-[0_0_8px_#6366f1]' :
                jasperState === 'speaking' ? 'bg-sky-400 shadow-[0_0_8px_#38bdf8]' :
                'bg-indigo-400 shadow-[0_0_6px_#818cf8]'
              }`} />
            </div>

            <span className="font-sans font-semibold text-xs tracking-wide text-slate-200">AI AVATAR</span>

            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
              jasperState === 'listening' ? 'bg-rose-500 text-white animate-pulse' :
              jasperState === 'processing' ? 'bg-indigo-500/30 text-indigo-200 animate-pulse' :
              jasperState === 'speaking' ? 'bg-sky-500/30 text-sky-200 animate-pulse' :
              'bg-slate-800 text-slate-400 border border-white/[0.05]'
            }`}>
              {jasperState === 'listening' ? 'REC' :
               jasperState === 'processing' ? 'THINKING' :
               jasperState === 'speaking' ? 'SPEAKING' :
               'READY'}
            </span>
          </button>

          {/* Live System Telemetry */}
          <div className="hidden 2xl:flex items-center gap-2 text-slate-400 bg-slate-900/80 border border-white/[0.08] px-2.5 h-8.5 rounded-xl backdrop-blur-md font-mono text-[11px] whitespace-nowrap shrink-0">
            <span className="flex items-center gap-1 text-sky-400"><Cpu className="w-3 h-3" /> 12%</span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1 text-indigo-400"><HardDrive className="w-3 h-3 text-indigo-400" /> 3.8GB</span>
          </div>

          {/* 2. Gemini Cloud / AI Status Tab */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className={`h-8.5 px-3 rounded-xl font-mono text-xs flex items-center gap-1.5 transition-all border whitespace-nowrap shrink-0 cursor-pointer ${
                isAiOnline
                  ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/40 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                  : 'bg-indigo-500/15 hover:bg-indigo-500/25 border-indigo-500/40 text-indigo-300 animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.15)]'
              }`}
              title="Click to configure AI Neural Core & API Keys"
            >
              <Settings className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="font-semibold">{aiStatusLabel}</span>
            </button>
          )}

          {/* Satellite Bridge Hardware Status */}
          <button
            onClick={() => setShowSatelliteModal(true)}
            className={`h-8.5 px-3 rounded-xl font-mono text-xs flex items-center gap-1.5 transition-all border whitespace-nowrap shrink-0 cursor-pointer ${
              satelliteOnline
                ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                : 'bg-neutral-900/80 hover:bg-neutral-850 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
            title="Satellite Hardware Bridge: Connects home PC, TV & ADB to Cloud"
          >
            <Radio className={`w-3.5 h-3.5 shrink-0 ${satelliteOnline ? 'text-emerald-400 animate-pulse' : 'text-neutral-500'}`} />
            <span>Satellite: {satelliteOnline ? 'PC Linked' : 'Offline'}</span>
          </button>

          {/* Database Backup & Cloud Persistence */}
          <div className="flex items-center gap-1 bg-black/80 border border-neutral-800 rounded-xl p-0.5 h-8.5 shrink-0">
            <button
              onClick={handleExportDb}
              className="h-7 px-2.5 hover:bg-neutral-800 text-neutral-300 hover:text-amber-300 rounded-lg font-mono text-[11px] flex items-center gap-1.5 transition-all cursor-pointer"
              title="Download full JSON backup of memories, finances, notes and settings"
            >
              <Download className="w-3 h-3 text-amber-400 shrink-0" />
              <span>{dbBackupStatus || 'Backup DB'}</span>
            </button>
            <input
              type="file"
              ref={dbFileInputRef}
              onChange={handleImportDb}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => dbFileInputRef.current?.click()}
              className="h-7 px-2 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg font-mono text-[11px] flex items-center gap-1 transition-all cursor-pointer"
              title="Restore database from a saved JSON backup"
            >
              <Upload className="w-3 h-3 shrink-0" />
              <span>Restore</span>
            </button>
          </div>

          {/* 3. Special Gestures & Spells Tab */}
          <button
            onClick={() => {
              setIsAirGesturesOn(prev => !prev);
              if (!isAirGesturesOn) playJarvisPowerUp();
            }}
            className={`h-8.5 px-3 rounded-xl font-sans text-xs flex items-center gap-2 transition-all border cursor-pointer whitespace-nowrap shrink-0 ${
              isAirGesturesOn
                ? 'bg-violet-500/20 hover:bg-violet-500/30 border-violet-400/50 text-violet-200 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                : 'bg-slate-900/80 hover:bg-slate-850 border-white/[0.08] text-slate-300 hover:text-white'
            }`}
            title="Toggle Air Gestures & Spatial Camera Controls"
          >
            <Sparkles className={`w-3.5 h-3.5 shrink-0 ${isAirGesturesOn ? 'text-violet-400 animate-spin' : 'text-slate-400'}`} style={{ animationDuration: '8s' }} />
            <span>Air Gestures</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              isAirGesturesOn ? 'bg-violet-400 text-slate-950 shadow-[0_0_8px_#c084fc]' : 'bg-slate-800 text-slate-400'
            }`}>
              {isAirGesturesOn ? 'ACTIVE' : 'OFF'}
            </span>
          </button>

          {/* Classic Mode Switch */}
          <button
            onClick={onToggleClassicMode}
            className="h-8.5 px-2.5 bg-slate-900/80 hover:bg-slate-850 border border-white/[0.08] text-slate-300 hover:text-white rounded-xl font-medium flex items-center gap-1.5 transition-all text-xs font-sans cursor-pointer whitespace-nowrap shrink-0"
            title="Switch to Classic Layout View"
          >
            <Grid className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Classic</span>
          </button>

          {/* Lock OS Button */}
          {onLockSystem && (
            <button
              onClick={onLockSystem}
              className="h-8.5 px-2.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 hover:border-rose-400 text-rose-300 hover:text-rose-100 rounded-xl font-sans text-xs font-medium flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(244,63,94,0.15)] cursor-pointer whitespace-nowrap shrink-0"
              title="Lock JASPER OS with Biometrics"
            >
              <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>Lock</span>
            </button>
          )}

          {/* Digital Clock Badge */}
          <div className="h-8.5 px-2.5 text-slate-200 font-mono font-medium text-xs bg-slate-900/90 border border-white/[0.08] rounded-xl flex items-center whitespace-nowrap shrink-0 shadow-inner">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        </div>
      </div>

      {/* SATELLITE BRIDGE HARDWARE CONNECTOR MODAL */}
      {showSatelliteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-2xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${satelliteOnline ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'}`}>
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-neutral-100 font-orbitron">Hardware Satellite Bridge</h3>
                  <p className="text-xs text-neutral-400 font-mono">Cloud-to-Local Physical Device Relay</p>
                </div>
              </div>
              <button
                onClick={() => setShowSatelliteModal(false)}
                className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                satelliteOnline ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' : 'bg-neutral-900 border-neutral-800 text-neutral-400'
              }`}>
                <span>Bridge Status:</span>
                <span className="font-bold">{satelliteOnline ? '🟢 ONLINE & LINKED' : '⚪ OFFLINE'}</span>
              </div>

              <p className="text-neutral-300 leading-relaxed font-sans text-xs">
                When JASPER is hosted in the cloud on Render, cloud servers cannot directly adjust your physical laptop speakers, launch desktop apps, or send ADB taps to your phone.
              </p>

              <div className="bg-black/70 border border-neutral-800 p-3 rounded-xl space-y-2">
                <span className="text-[11px] font-bold text-amber-400 block font-mono">HOW TO LINK YOUR LAPTOP:</span>
                <ol className="list-decimal list-inside space-y-1.5 text-neutral-300 text-[11px]">
                  <li>Navigate to your JASPER folder on this PC.</li>
                  <li>Double-click <code className="text-sky-300 bg-neutral-900 px-1 py-0.5 rounded">start-satellite.bat</code></li>
                  <li>Your PC will securely link to Render via WebSocket and execute hardware directives seamlessly!</li>
                </ol>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowSatelliteModal(false)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold font-sans text-xs cursor-pointer transition-all"
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OS APP CENTER & START LAUNCHER DRAWER (FULL MULTI-ROW MATRIX) */}
      {showStartMenu && (
        <div className="absolute top-14 left-2 right-2 sm:left-4 sm:right-auto w-auto sm:w-[860px] lg:w-[940px] max-w-[calc(100vw-24px)] bg-slate-950/95 border border-white/[0.12] rounded-2xl p-3 sm:p-4 shadow-[0_24px_70px_rgba(0,0,0,0.95)] backdrop-blur-3xl z-50 animate-in fade-in slide-in-from-top-2 max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 border border-indigo-400/40 rounded-xl text-indigo-300">
                <Zap className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-sans font-bold text-sm text-slate-100 uppercase tracking-wider">JASPER App Center</h3>
                <p className="text-[10px] text-slate-400 font-mono">{filteredApps.length} Applications &bull; All-in-One Bento Workspace</p>
              </div>
            </div>
            <button
              onClick={() => setShowStartMenu(false)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search bar inside drawer */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search apps, modules or tools..."
              value={appSearchQuery}
              onChange={(e) => setAppSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 border border-white/[0.08] focus:border-indigo-400/60 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 font-sans focus:outline-none placeholder:text-slate-500"
            />
          </div>

          {/* App Category Filters */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 custom-scrollbar text-[10px]">
            {['all', 'Creative & AI', 'AI & Intelligence', 'Productivity & Tools', 'System & Hardware', 'Hardware Control', 'Media & Life'].map((category) => (
              <button
                key={category}
                onClick={() => setActiveWorkspace(category)}
                className={`px-2.5 py-1 rounded-lg font-sans whitespace-nowrap transition-all cursor-pointer ${
                  activeWorkspace === category
                    ? 'bg-indigo-500/20 border border-indigo-400/50 text-indigo-200 font-semibold shadow-sm'
                    : 'bg-slate-900/70 border border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-slate-850'
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
                      ? 'bg-indigo-500/15 border-indigo-400/50 text-indigo-200 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                      : 'bg-slate-900/50 border-white/[0.06] hover:border-indigo-400/40 hover:bg-slate-850/80 text-slate-200 hover:text-white'
                  }`}
                  title={`${app.title} (${app.category})`}
                >
                  <div className="p-1.5 rounded-lg bg-slate-800/80 border border-white/[0.08] text-indigo-300 group-hover:text-white group-hover:border-indigo-400/60 transition-all relative mb-1">
                    <AppIcon className="w-4 h-4" />
                    {isRunning && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-400 border border-slate-950 shadow-[0_0_6px_#818cf8]" />
                    )}
                  </div>
                  <div className="font-medium text-[10px] text-slate-200 group-hover:text-white truncate w-full px-0.5 leading-tight font-sans">
                    {app.title.replace(' App', '').replace('JASPER ', '')}
                  </div>
                  <div className="text-[8px] text-slate-500 group-hover:text-slate-400 font-mono truncate w-full px-0.5 leading-none">
                    {app.category.replace(' & Intelligence', '').replace(' & Tools', '').replace(' & Hardware', '').replace('Hardware ', '')}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Start Menu Footer with Lock OS and System Settings */}
          <div className="mt-3 pt-3 border-t border-white/[0.08] flex items-center justify-between gap-2">
            {onLockSystem && (
              <button
                onClick={() => {
                  setShowStartMenu(false);
                  onLockSystem();
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 hover:border-rose-400 text-rose-300 hover:text-rose-100 flex items-center justify-center gap-2 font-sans text-xs font-semibold transition-all shadow-[0_0_15px_rgba(244,63,94,0.15)] cursor-pointer"
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
                className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-white/[0.08] text-slate-300 hover:text-white flex items-center gap-1.5 font-sans text-xs transition-all cursor-pointer"
                title="System Settings"
              >
                <Settings className="w-4 h-4 text-slate-400" />
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
        {/* Native Desktop Canvas: Command Center HUD or App Matrix/Shelf */}
        <div className="relative z-0 pointer-events-auto max-w-[calc(100vw-32px)] mx-auto pt-3 px-4 pb-36">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              <span className="font-sans text-xs uppercase tracking-wider text-slate-100 font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                {desktopLayoutMode === 'commandCenter' ? 'JARVIS AI Command Center' : 'JASPER Applications'}
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-900/90 px-2.5 py-0.5 rounded-full border border-white/[0.08]">
                {desktopLayoutMode === 'commandCenter' 
                  ? 'Central AI Core & HUD' 
                  : desktopLayoutMode === 'matrix' 
                  ? 'All 35 Apps Matrix' 
                  : '2 Rows Shelf'} &bull; Bento Workspace
              </span>
            </div>

            {/* Layout View Switcher */}
            <div className="flex items-center gap-1 bg-slate-900/80 border border-white/[0.08] p-1 rounded-xl shadow-lg">
              <button
                onClick={() => setDesktopLayoutMode('commandCenter')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-sans font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  desktopLayoutMode === 'commandCenter'
                    ? 'bg-indigo-500/25 text-white border border-indigo-400/40 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="JARVIS Central AI Core & Command Center HUD"
              >
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>Command Center</span>
              </button>

              <button
                onClick={() => setDesktopLayoutMode('matrix')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-sans font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  desktopLayoutMode === 'matrix'
                    ? 'bg-white/[0.1] text-white border border-white/[0.15] shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Spread apps across columns so every app is shown at once"
              >
                <Grid className="w-3.5 h-3.5 text-indigo-400" />
                <span>All 35 Apps</span>
              </button>

              <button
                onClick={() => setDesktopLayoutMode('shelf')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-sans font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  desktopLayoutMode === 'shelf'
                    ? 'bg-white/[0.1] text-white border border-white/[0.15] shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Compact 2 Rows horizontal scrolling shelf"
              >
                <Layout className="w-3.5 h-3.5 text-sky-400" />
                <span>2 Rows Shelf</span>
              </button>
            </div>
          </div>

          {desktopLayoutMode === 'commandCenter' ? (
            /* CENTRAL JARVIS COMMAND CENTER HUD & AI CORE */
            <JasperCommandCenter
              onLaunchApp={launchApp}
              onMicClick={onMicClick}
              onLockSystem={onLockSystem}
              onOpenSettings={onOpenSettings}
              onViewAllApps={() => setDesktopLayoutMode('matrix')}
              jasperState={jasperState}
              aiStatusLabel={aiStatusLabel}
              isAiOnline={isAiOnline}
            />
          ) : desktopLayoutMode === 'matrix' ? (
            /* ALL-ON-SCREEN MATRIX */
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-7 xl:grid-cols-9 gap-2 sm:gap-2.5 p-3 rounded-2xl bg-slate-950/40 border border-white/[0.06] backdrop-blur-2xl shadow-2xl">
              {/* Quick Lock System Shortcut Icon */}
              {onLockSystem && (
                <button
                  onClick={onLockSystem}
                  className="p-2 rounded-xl bg-slate-900/50 hover:bg-rose-950/30 border border-rose-500/30 hover:border-rose-400 flex flex-col items-center justify-center gap-1 transition-all group hover:scale-105 hover:shadow-[0_0_18px_rgba(244,63,94,0.25)] cursor-pointer text-center h-[76px]"
                  title="Lock JASPER OS (Biometric Security Shield)"
                >
                  <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 group-hover:text-rose-200 group-hover:border-rose-400 transition-all shadow-sm">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-sans font-medium text-rose-300 group-hover:text-rose-100 truncate w-full px-0.5 leading-tight">
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
                    className={`p-2 rounded-xl bg-slate-900/40 hover:bg-slate-850/80 border border-white/[0.06] hover:border-indigo-400/50 flex flex-col items-center justify-center gap-1 transition-all group hover:scale-105 hover:shadow-[0_8px_20px_rgba(0,0,0,0.5)] cursor-pointer text-center relative h-[76px] ${
                      isRunning ? 'border-indigo-400/60 bg-indigo-500/15 shadow-[0_0_12px_rgba(99,102,241,0.2)]' : ''
                    }`}
                    title={`${app.title} (${app.category})`}
                  >
                    <div className="p-1.5 rounded-lg bg-slate-800/80 border border-white/[0.08] text-indigo-300 group-hover:text-white group-hover:border-indigo-400/60 transition-all relative flex items-center justify-center flex-shrink-0">
                      <AppIcon className="w-4 h-4" />
                      {isRunning && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-400 border border-slate-950 shadow-[0_0_6px_#818cf8] animate-pulse" />
                      )}
                    </div>
                    <div className="text-[10px] sm:text-[11px] font-sans font-medium text-slate-200 group-hover:text-white truncate w-full px-0.5 leading-tight">
                      {app.title.replace(' App', '').replace('JASPER ', '')}
                    </div>
                    <div className="text-[8px] font-mono text-slate-500 truncate w-full group-hover:text-slate-400 leading-none">
                      {app.category.replace(' & Intelligence', '').replace(' & Tools', '').replace(' & Hardware', '').replace('Hardware ', '')}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* 2 ROWS HORIZONTAL SHELF */
            <div className="grid grid-rows-2 grid-flow-col auto-cols-[140px] sm:auto-cols-[152px] gap-2 p-2.5 rounded-2xl bg-slate-950/60 border border-white/[0.06] backdrop-blur-xl overflow-x-auto custom-scrollbar shadow-xl">
              {onLockSystem && (
                <button
                  onClick={onLockSystem}
                  className="p-2 rounded-xl bg-slate-900/60 hover:bg-rose-950/30 border border-rose-500/30 hover:border-rose-400 flex items-center gap-2.5 transition-all group hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(244,63,94,0.2)] cursor-pointer text-left h-[52px] flex-shrink-0"
                  title="Lock JASPER OS (Biometric Security Shield)"
                >
                  <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 group-hover:text-rose-200 group-hover:border-rose-400 transition-all flex-shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10.5px] font-sans font-medium text-rose-300 group-hover:text-rose-100 truncate">
                      Lock System
                    </div>
                    <div className="text-[8.5px] font-mono text-rose-400/60 truncate">
                      Biometrics
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
                    className={`p-2 rounded-xl bg-slate-900/50 hover:bg-slate-850/80 border border-white/[0.06] hover:border-indigo-400/50 flex items-center gap-2.5 transition-all group hover:scale-[1.02] hover:shadow-lg text-left h-[52px] flex-shrink-0 cursor-pointer ${
                      isRunning ? 'border-indigo-400/60 bg-indigo-500/15 shadow-[0_0_12px_rgba(99,102,241,0.2)]' : ''
                    }`}
                    title={app.title}
                  >
                    <div className="p-2 rounded-lg bg-slate-800/80 border border-white/[0.08] text-indigo-300 group-hover:text-white group-hover:border-indigo-400/60 transition-all relative flex-shrink-0">
                      <AppIcon className="w-4 h-4" />
                      {isRunning && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-400 border border-slate-950 shadow-[0_0_6px_#818cf8]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10.5px] font-sans font-medium text-slate-200 group-hover:text-white truncate">
                        {app.title.replace(' App', '').replace('JASPER ', '')}
                      </div>
                      <div className="text-[8.5px] font-mono text-slate-500 truncate group-hover:text-slate-400">
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
        <div className="absolute bottom-[72px] sm:bottom-[76px] left-1/2 -translate-x-1/2 z-40 pointer-events-auto flex items-center gap-2 bg-slate-900/90 border border-white/[0.1] hover:border-indigo-400/50 rounded-full px-3.5 py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-all duration-300 group">
          <button
            onClick={() => handleScrollToEdge(canScrollDown ? 'bottom' : 'top')}
            className="flex items-center gap-2 text-[11px] font-sans font-medium text-slate-200 group-hover:text-white transition-all cursor-pointer"
            title={canScrollDown ? "Scroll down to reveal all applications" : "Scroll back to top"}
          >
            {canScrollDown ? (
              <>
                <ChevronDown className="w-4 h-4 text-indigo-400 animate-bounce" />
                <span>SCROLL DOWN TO VIEW ALL APPS</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-4 h-4 text-indigo-400" />
                <span>SCROLL BACK TO TOP</span>
              </>
            )}
          </button>

          <div className="h-3 w-px bg-white/[0.1]" />

          <div className="flex items-center gap-1">
            <button
              onClick={handleScrollUp}
              disabled={!canScrollUp}
              className={`p-1 rounded-full transition-all ${
                canScrollUp ? 'text-slate-300 hover:bg-white/[0.08] cursor-pointer' : 'text-slate-600 opacity-40 cursor-not-allowed'
              }`}
              title="Scroll Up"
            >
              <ChevronUp className="w-3 h-3" />
            </button>
            <button
              onClick={handleScrollDown}
              disabled={!canScrollDown}
              className={`p-1 rounded-full transition-all ${
                canScrollDown ? 'text-slate-300 hover:bg-white/[0.08] cursor-pointer' : 'text-slate-600 opacity-40 cursor-not-allowed'
              }`}
              title="Scroll Down"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          <span className="text-[9px] font-mono text-slate-400 font-medium pl-0.5">
            {Math.round(scrollProgress)}%
          </span>
        </div>
      )}

      {/* FLOATING RIGHT-SIDE SCROLL RAIL */}
      {hasOverflow && (
        <div className="absolute right-1 top-16 bottom-24 w-3.5 z-40 hidden md:flex flex-col items-center justify-between pointer-events-auto py-1">
          <button
            onClick={() => handleScrollToEdge('top')}
            className="w-5 h-5 rounded-lg bg-slate-900/90 border border-white/[0.08] text-slate-400 hover:text-white flex items-center justify-center text-[10px] shadow transition-all cursor-pointer hover:border-indigo-400/50"
            title="Scroll to Top"
          >
            <ChevronUp className="w-3 h-3" />
          </button>
          
          {/* Visual Track & Draggable Indicator */}
          <div 
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickRatio = (e.clientY - rect.top) / rect.height;
              if (desktopScrollRef.current) {
                const target = clickRatio * (desktopScrollRef.current.scrollHeight - desktopScrollRef.current.clientHeight);
                desktopScrollRef.current.scrollTo({ top: target, behavior: 'smooth' });
              }
            }}
            className="flex-1 w-1.5 my-1.5 rounded-full bg-slate-900/80 border border-white/[0.06] relative cursor-pointer group shadow-inner"
            title="Click to jump scroll position"
          >
            <div 
              style={{ top: `${scrollProgress}%` }}
              className="absolute -left-1 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-gradient-to-b from-indigo-400 to-sky-400 border border-indigo-200 shadow-[0_0_10px_rgba(99,102,241,0.5)] group-hover:scale-125 transition-transform"
            />
          </div>

          <button
            onClick={() => handleScrollToEdge('bottom')}
            className="w-5 h-5 rounded-lg bg-slate-900/90 border border-white/[0.08] text-slate-400 hover:text-white flex items-center justify-center text-[10px] shadow transition-all cursor-pointer hover:border-indigo-400/50"
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
                <React.Suspense fallback={
                  <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-mono">Loading module...</span>
                  </div>
                }>
                  <AppComponent onLockSystem={onLockSystem} />
                </React.Suspense>
              </OsWindow>
            </div>
          );
        })}
      </div>

      {/* BOTTOM OS NATIVE APP DOCK (FROSTED GLASS DOCK) */}
      <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 ${dockTwoRows ? 'h-[108px]' : 'h-14'} bg-slate-950/80 border border-white/[0.1] rounded-2xl px-3 py-1.5 flex items-center gap-2 backdrop-blur-3xl shadow-[0_16px_45px_rgba(0,0,0,0.85)] z-50 max-w-[95vw] transition-all duration-200`}>
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
                    ? 'bg-indigo-500/20 border border-indigo-400/50 text-indigo-200 shadow-[0_0_18px_rgba(99,102,241,0.25)] scale-105'
                    : isRunning && isMinimized
                    ? 'bg-slate-900 border border-white/[0.1] text-slate-400 opacity-80'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.08] border border-transparent'
                }`}
                title={app.title}
              >
                <AppIcon className="w-4 h-4" />
                {isRunning && (
                  <span className={`absolute -bottom-0.5 w-1.5 h-1.5 rounded-full ${isMinimized ? 'bg-slate-500' : 'bg-indigo-400 shadow-[0_0_6px_#818cf8]'}`} />
                )}
              </button>
            );
          })}
        </div>

        <div className="h-6 w-px bg-white/[0.1] mx-1 flex-shrink-0" />

        <button
          onClick={() => setDockTwoRows(!dockTwoRows)}
          className="p-1.5 px-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-white/[0.08] text-slate-300 hover:text-white flex items-center gap-1 text-[10px] font-sans whitespace-nowrap cursor-pointer transition-all flex-shrink-0"
          title={dockTwoRows ? 'Collapse dock to 1 Row' : 'Expand dock to 2 Rows'}
        >
          <Layout className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-medium">{dockTwoRows ? '1 Row' : '2 Rows'}</span>
        </button>

        <button
          onClick={() => setShowStartMenu(true)}
          className="p-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-400/30 text-indigo-200 flex items-center gap-1.5 text-xs font-sans font-medium cursor-pointer flex-shrink-0 transition-all"
          title="Open JASPER OS App Center"
        >
          <Layers className="w-4 h-4 text-indigo-400" />
          <span className="hidden sm:inline">App Center</span>
        </button>

        {onLockSystem && (
          <button
            onClick={onLockSystem}
            className="p-2 rounded-xl text-rose-400 hover:text-rose-100 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 flex items-center gap-1.5 text-xs font-sans font-medium transition-all shadow-[0_0_12px_rgba(244,63,94,0.15)] cursor-pointer flex-shrink-0"
            title="Lock JASPER OS (Biometric Security Shield)"
          >
            <Lock className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Lock</span>
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

      {/* FLOATING SPATIAL GESTURE & VISION HUD (TOP RIGHT) */}
      {isAirGesturesOn && (
        <div className="spatial-gesture-hud fixed top-16 right-4 z-[990] flex flex-col items-end gap-2 pointer-events-auto select-none font-sans">
          {/* Main HUD Card */}
          <div className={`bg-slate-950/90 border border-white/[0.1] rounded-2xl p-3.5 shadow-2xl backdrop-blur-2xl flex flex-col gap-2.5 transition-all duration-300 ${
            showHudGesturesList ? 'w-[310px] max-w-[340px]' : 'w-[275px] max-w-[290px]'
          } animate-in fade-in slide-in-from-top-4 duration-300`}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
                </span>
                <span className="text-xs font-semibold text-slate-200 tracking-wide flex items-center gap-1.5">
                  <span>Spatial Vision Engine</span>
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowGestureGuide(true)}
                  className="p-1 rounded text-slate-400 hover:text-indigo-300 hover:bg-white/[0.06] transition-colors cursor-pointer"
                  title="Open Gesture Controls Cheatsheet"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsHudCollapsed(!isHudCollapsed)}
                  className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors cursor-pointer"
                  title={isHudCollapsed ? "Expand Camera" : "Collapse Camera"}
                >
                  {isHudCollapsed ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setIsAirGesturesOn(false)}
                  className="p-1 rounded text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                  title="Disable Gestures"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Skeletal Joints Canvas Thumbnail (Camera Feed) */}
            <div className={`relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-slate-900 border border-white/[0.08] flex items-center justify-center shadow-inner ${isHudCollapsed ? 'hidden' : ''}`}>
              <canvas
                ref={canvasRef}
                width={240}
                height={180}
                className="w-full h-full object-cover scale-x-[-1]"
              />
              <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-slate-950/80 border border-white/[0.1] text-[9px] text-indigo-300 font-sans flex items-center gap-1 backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                Live Pose Tracker
              </div>
            </div>

            {/* HAND SIGNS LIST BUTTON (BELOW CAMERA FEED) */}
            <button
              onClick={() => setShowHudGesturesList(prev => !prev)}
              className={`w-full py-2 px-2.5 rounded-xl border text-[11px] font-sans font-medium flex items-center justify-between transition-all duration-200 cursor-pointer shadow-sm ${
                showHudGesturesList
                  ? 'bg-indigo-600/30 border-indigo-400 text-indigo-100 shadow-[0_0_15px_rgba(99,102,241,0.25)] ring-1 ring-indigo-400/50'
                  : 'bg-slate-900/90 hover:bg-slate-850 border-white/[0.1] hover:border-indigo-400/40 text-slate-200 hover:text-white'
              }`}
              title="Click to view all recognized hand signs and gestures"
            >
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs ${showHudGesturesList ? 'bg-indigo-500 text-white shadow-sm' : 'bg-slate-800 text-indigo-300'}`}>
                  🖐️
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-semibold text-xs leading-none">All Hand Signs</span>
                  <span className="text-[9px] text-slate-400 leading-tight mt-0.5">
                    {showHudGesturesList ? 'Click to hide signs list' : 'Click to learn all hand signs'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold border border-indigo-400/30">
                  {ALL_HAND_GESTURES.length} Signs
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showHudGesturesList ? 'rotate-180 text-indigo-300' : ''}`} />
              </div>
            </button>

            {/* EXPANDABLE HAND SIGNS LIST DRAWER BELOW CAMERA FEED */}
            {showHudGesturesList && (
              <div className="w-full rounded-2xl bg-slate-900/95 border border-indigo-500/30 p-2.5 flex flex-col gap-2 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Category Filters & Full View Link */}
                <div className="flex items-center justify-between gap-1 border-b border-white/[0.08] pb-1.5">
                  <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                    {['All', 'Window', 'Navigation', 'Actions'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setHudGestureCategory(cat)}
                        className={`px-2 py-0.5 rounded-lg text-[9px] font-sans font-semibold transition-all whitespace-nowrap cursor-pointer ${
                          hudGestureCategory === cat
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowGestureGuide(true)}
                    className="text-[9px] text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-0.5 whitespace-nowrap shrink-0 pl-1 font-medium cursor-pointer"
                    title="Open Fullscreen Detailed Cheatsheet"
                  >
                    <span>Full View</span>
                    <Maximize2 className="w-2.5 h-2.5" />
                  </button>
                </div>

                {/* Scrollable list of Hand Signs */}
                <div className="max-h-[230px] overflow-y-auto custom-scrollbar flex flex-col gap-1.5 pr-0.5">
                  {filteredHudGestures.map((g) => (
                    <div
                      key={g.id}
                      className="p-2 rounded-xl bg-slate-950/80 border border-white/[0.06] hover:border-indigo-400/40 flex flex-col gap-1 transition-all group shadow-sm hover:bg-slate-950"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base w-7 h-7 rounded-lg bg-slate-850 border border-white/[0.08] flex items-center justify-center shrink-0 shadow-inner">
                            {g.icon}
                          </span>
                          <div className="min-w-0">
                            <div className="text-[11px] font-bold text-slate-100 flex items-center gap-1.5 truncate">
                              <span className="truncate">{g.title}</span>
                              <span className="text-[8px] px-1 py-0.2 rounded bg-indigo-500/15 text-indigo-300 font-mono border border-indigo-400/20 shrink-0">
                                {g.category}
                              </span>
                            </div>
                            <div className="text-[9px] text-indigo-300/90 font-sans truncate font-medium">
                              {g.pose}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => triggerGestureAction(g.id)}
                          className="text-[9px] px-2 py-0.5 rounded-md bg-indigo-500/20 hover:bg-indigo-500/35 border border-indigo-400/30 text-indigo-200 font-semibold transition-all shrink-0 active:scale-95 cursor-pointer shadow-sm"
                          title={`Test ${g.title} action immediately`}
                        >
                          Test
                        </button>
                      </div>
                      <div className="text-[9px] text-slate-400 pl-9 leading-tight">
                        {g.action}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer status notice */}
                <div className="pt-1.5 border-t border-white/[0.06] flex items-center justify-between text-[9px] text-slate-400 font-sans">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                    <span>Perform sign in camera frame</span>
                  </span>
                  <span className="text-indigo-400 font-medium">AI Active</span>
                </div>
              </div>
            )}

            {/* Live Detected Gesture Pill */}
            <div className="p-2.5 rounded-xl bg-slate-900/70 border border-white/[0.08] flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-200">
                <span className="flex items-center gap-1.5 truncate">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 animate-spin" style={{ animationDuration: '6s' }} />
                  <span className="truncate">{activeGesture || 'Ready For Gestures'}</span>
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium shrink-0 border border-indigo-400/30">
                  {gestureStatus}
                </span>
              </div>
              
              {/* Quick Snap Action Button */}
              <div className="pt-1.5 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[9px] text-slate-400 truncate">Snap fingers to minimize apps</span>
                <button
                  onClick={closeAllApps}
                  className="text-[9px] px-2 py-0.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 font-medium transition-all shadow-sm cursor-pointer"
                  title="Trigger Finger Snap: Closes all open apps"
                >
                  🫰 Snap Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN DISPERSION OVERLAY */}
      {snapShockwaveActive && (
        <div className="fixed inset-0 z-[99999] pointer-events-none flex flex-col items-center justify-center overflow-hidden animate-in fade-in duration-150">
          <div className="absolute w-[160vw] h-[160vw] rounded-full border-2 border-indigo-400/40 animate-ping opacity-75 shadow-[0_0_80px_rgba(99,102,241,0.5)]" />
          <div className="absolute w-[110vw] h-[110vw] rounded-full border border-dashed border-sky-400/50 animate-spin" style={{ animationDuration: '4s' }} />
          <div className="absolute w-[60vw] h-[60vw] rounded-full bg-radial from-indigo-500/20 via-violet-600/10 to-transparent animate-pulse" />

          <div className="relative flex flex-col items-center justify-center p-8 bg-slate-950/90 border border-white/[0.12] rounded-3xl shadow-2xl backdrop-blur-2xl">
            <span className="text-5xl mb-2 animate-bounce">🫰✨</span>
            <div className="font-sans font-bold text-xl text-slate-100 tracking-wide flex items-center gap-2">
              All Applications Minimized
            </div>
            <p className="font-sans text-xs text-slate-400 mt-1">
              Spatial Hand Gesture Executed
            </p>
          </div>
        </div>
      )}

      {/* AIR CURSOR RETICLE */}
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
            <div className={`w-10 h-10 rounded-full border-2 border-dashed ${airCursorPos.isClicking ? 'border-sky-300 animate-ping' : 'border-indigo-400/70'} animate-spin`} style={{ animationDuration: '6s' }} />
            <div className={`w-3 h-3 rounded-full ${airCursorPos.isClicking ? 'bg-sky-200 shadow-[0_0_15px_#38bdf8]' : 'bg-indigo-400 shadow-[0_0_12px_#818cf8]'}`} />
            <div className="absolute w-6 h-0.5 bg-indigo-400/60 -left-1" />
            <div className="absolute w-6 h-0.5 bg-indigo-400/60 -right-1" />
            <div className="absolute h-6 w-0.5 bg-indigo-400/60 -top-1" />
            <div className="absolute h-6 w-0.5 bg-indigo-400/60 -bottom-1" />
            <div className="absolute top-6 left-6 font-sans text-[9px] text-slate-200 bg-slate-950/90 px-2 py-0.5 rounded-full border border-white/[0.1] whitespace-nowrap shadow-xl">
              Air Cursor {airCursorPos.isClicking ? '• Click' : ''}
            </div>
          </div>
        </div>
      )}

      {/* SPATIAL GESTURES GUIDE MODAL */}
      {showGestureGuide && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-slate-950 border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 bg-slate-900/60 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-sans font-bold text-sm text-slate-100 tracking-wide">Spatial Air Gesture Controls</h3>
                  <p className="text-[11px] text-slate-400">MediaPipe real-time camera tracking for hands-free OS interaction</p>
                </div>
              </div>
              <button onClick={() => setShowGestureGuide(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto custom-scrollbar grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ALL_HAND_GESTURES.map((g, idx) => (
                <div key={idx} className="p-3.5 bg-slate-900/60 border border-white/[0.06] hover:border-indigo-400/40 rounded-xl flex flex-col justify-between gap-2.5 transition-all hover:bg-slate-900/90 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl p-1.5 rounded-lg bg-slate-800/80 border border-white/[0.06]">{g.icon}</span>
                      <div>
                        <h4 className="font-sans text-xs font-semibold text-slate-200">{g.title}</h4>
                        <p className="text-[10px] text-indigo-300">{g.pose}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => triggerGestureAction(g.id)}
                      className="px-2 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/35 border border-indigo-400/30 text-indigo-200 text-[10px] font-medium transition-all cursor-pointer"
                    >
                      Test
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans leading-relaxed border-t border-white/[0.06] pt-2">
                    {g.action}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-3.5 border-t border-white/[0.08] bg-slate-900/40 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">Tip: Snap thumb and middle finger to dismiss all open windows instantly.</span>
              <button
                onClick={() => setShowGestureGuide(false)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-all shadow-md"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
