import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Box, Terminal, Tv, Cpu, Shield, Sparkles, Smartphone, Monitor, Globe, 
  Activity, X, Minus, Square, Maximize2, RefreshCw, Layout, Layers, Volume2, 
  Zap, Radio, Settings, HelpCircle, HardDrive, Wifi, BatteryCharging, Search,
  Bot, Palette, Music, Workflow, BarChart3, Brain, Store, Trophy, MapPin, Heart, Languages, BookOpen, Laptop, Grid, AppWindow, Lock,
  Hand, Camera, CameraOff, Move, ThumbsUp, ThumbsDown, Crosshair, ChevronDown, ChevronUp, MoveVertical, Eye, EyeOff, Power, Check,
  Database, Download, Upload, Folder, Moon, Sun, Trash2, Calendar, Bell, Sliders, VolumeX
} from 'lucide-react';
import { AirGestureTracker } from '../utils/gestureTracker';
import { playJarvisBeep, playJarvisScan, playJarvisPowerUp, playMysticSnap } from '../utils/jarvisAudioSynth';

// Lightweight Core Widgets
import DiagnosticWidget from './DiagnosticWidget';
import PaymentBalanceWidget from './PaymentBalanceWidget';
import JasperCommandCenter from './JasperCommandCenter';
import UserProfileMenu from './UserProfileMenu';

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
const SmartHomeMatrixWidget = React.lazy(() => import('./SmartHomeMatrixWidget'));
const NetworkRadarWidget = React.lazy(() => import('./NetworkRadarWidget'));
const MorningBriefingWidget = React.lazy(() => import('./MorningBriefingWidget'));
const MarketIntelWidget = React.lazy(() => import('./MarketIntelWidget'));
const HardwareHudWidget = React.lazy(() => import('./HardwareHudWidget'));
const VisionSentinelWidget = React.lazy(() => import('./VisionSentinelWidget'));
const FocusMatrixWidget = React.lazy(() => import('./FocusMatrixWidget'));
const AiNewsDigestWidget = React.lazy(() => import('./AiNewsDigestWidget'));
const AiCostSentinelWidget = React.lazy(() => import('./AiCostSentinelWidget'));
const HabitMatrixWidget = React.lazy(() => import('./HabitMatrixWidget'));

import { Calculator, FileCode, Compass, MessageSquare, ShieldAlert, Video, Wallet, PhoneForwarded, Home, TrendingUp, Headphones, Newspaper } from 'lucide-react';
import { getSiriWidgetSettings, saveSiriWidgetSettings } from '../utils/siriWidgetSettings';
import SiriWidgetSettingsModal from './SiriWidgetSettingsModal';

/**
 * ALL NATIVE JASPER OS APPLICATIONS REGISTRY
 */
const JASPER_OS_APPS_REGISTRY = [
  { id: 'siriSettings', title: 'Siri Voice Assistant & Hotkey Settings', category: 'System & Hardware', icon: Sparkles, component: (props) => <SiriWidgetSettingsModal inWindow={true} isOpen={true} onClose={props.onClose} />, defaultSize: { w: 660, h: 600 } },
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
  { id: 'userManual', title: 'JASPER OS Master Guide App', category: 'Productivity & Tools', icon: BookOpen, component: UserManualWidget, defaultSize: { w: 640, h: 520 } },
  { id: 'smartHome', title: 'Smart Home & IoT Matrix App', category: 'Hardware Control', icon: Home, component: SmartHomeMatrixWidget, defaultSize: { w: 840, h: 600 } },
  { id: 'networkRadar', title: 'LAN Cyber Radar & Device Sniffer', category: 'System & Hardware', icon: Radio, component: NetworkRadarWidget, defaultSize: { w: 820, h: 580 } },
  { id: 'morningBriefing', title: 'Morning Executive Briefing App', category: 'Productivity & Tools', icon: Sun, component: MorningBriefingWidget, defaultSize: { w: 760, h: 560 } },
  { id: 'marketIntel', title: 'Market Intelligence & Crypto Ticker', category: 'Media & Life', icon: TrendingUp, component: MarketIntelWidget, defaultSize: { w: 860, h: 580 } },
  { id: 'hardwareHud', title: 'Hardware Telemetry & Thermal H.U.D.', category: 'System & Hardware', icon: Cpu, component: HardwareHudWidget, defaultSize: { w: 780, h: 540 } },
  { id: 'visionSentinel', title: 'Vision Sentinel & CCTV Sentry', category: 'Hardware Control', icon: Camera, component: VisionSentinelWidget, defaultSize: { w: 840, h: 600 } },
  { id: 'focusMatrix', title: 'Deep Work & Binaural Soundscape', category: 'Productivity & Tools', icon: Headphones, component: FocusMatrixWidget, defaultSize: { w: 720, h: 560 } },
  { id: 'aiNewsDigest', title: 'AI News & Intelligence Digest', category: 'AI & Intelligence', icon: Newspaper, component: AiNewsDigestWidget, defaultSize: { w: 780, h: 580 } },
  { id: 'aiCostSentinel', title: 'LLM Token & Cloud Burn Sentinel', category: 'AI & Intelligence', icon: Zap, component: AiCostSentinelWidget, defaultSize: { w: 740, h: 540 } },
  { id: 'habitMatrix', title: 'Gamified Habit & Quest Matrix', category: 'Productivity & Tools', icon: Trophy, component: HabitMatrixWidget, defaultSize: { w: 780, h: 560 } }
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
      className={`absolute flex flex-col rounded-xl bg-[#1e1e1e] border border-[#383838] shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden transition-shadow duration-200 ${
        isDragging ? 'ring-2 ring-[#E95420]/80 shadow-[0_0_40px_rgba(233,84,32,0.3)] select-none' : 'ring-1 ring-white/[0.04]'
      }`}
    >
      {/* Ubuntu Yaru Window Header Bar */}
      <div
        onMouseDown={handleHeaderMouseDown}
        onTouchStart={handleHeaderTouchStart}
        className="px-3.5 py-2 bg-[#252525] border-b border-[#333333] flex items-center justify-between cursor-grab active:cursor-grabbing select-none shrink-0"
      >
        <div className="flex items-center gap-2 text-[#dfdbd2] font-sans text-xs font-medium tracking-wide truncate max-w-[65%]">
          {Icon && <Icon className="w-4 h-4 text-[#E95420] shrink-0" />}
          <span className="truncate">{title}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isGestureActive && (
            <div 
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#E95420]/15 border border-[#E95420]/30 text-[9px] font-mono text-[#E95420] mr-1 animate-pulse"
              title="Air Gestures Connected"
            >
              <Hand className="w-3 h-3 text-[#E95420]" />
              <span className="hidden sm:inline">GESTURES</span>
            </div>
          )}
          {/* Ubuntu Yaru Window Controls */}
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => onMinimize(id)}
            className="window-control-btn w-6 h-6 rounded-full bg-[#353535] hover:bg-[#454545] text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Minimize"
          >
            <Minus className="w-3 h-3 pointer-events-none" />
          </button>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={toggleMaximize}
            className="window-control-btn w-6 h-6 rounded-full bg-[#353535] hover:bg-[#454545] text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title={isMaximized ? "Restore Window" : "Maximize"}
          >
            {isMaximized ? <Square className="w-2.5 h-2.5 pointer-events-none" /> : <Maximize2 className="w-2.5 h-2.5 pointer-events-none" />}
          </button>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => onClose(id)}
            className="window-control-btn w-6 h-6 rounded-full bg-[#353535] hover:bg-[#E95420] text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer ubuntu-btn-close"
            title="Close"
          >
            <X className="w-3 h-3 pointer-events-none" />
          </button>
        </div>
      </div>

      {/* App Window Body */}
      <div ref={bodyRef} className="flex-1 overflow-y-auto p-2 sm:p-3 text-slate-100 font-sans custom-scrollbar bg-[#181818]">
        {children}
      </div>

      {/* Resize Handle */}
      {!isMaximized && (
        <div
          onMouseDown={handleResizeMouseDown}
          onTouchStart={handleResizeTouchStart}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-center justify-center text-slate-500 hover:text-[#E95420]"
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

  // Ubuntu GNOME Shell & Yaru Desktop State
  const [isActivitiesOpen, setIsActivitiesOpen] = useState(false);
  const [showQuickSettings, setShowQuickSettings] = useState(false);
  const [showCalendarTray, setShowCalendarTray] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(80);
  const [brightnessLevel, setBrightnessLevel] = useState(100);
  const [nightLight, setNightLight] = useState(false);
  const [wifiEnabled, setWifiEnabled] = useState(true);
  const [showSiriSettings, setShowSiriSettings] = useState(false);
  const [siriWidgetEnabled, setSiriWidgetEnabled] = useState(() => getSiriWidgetSettings().enabled);
  const [focusedWinId, setFocusedWinId] = useState(null);
  const [hoveredDockApp, setHoveredDockApp] = useState(null);

  useEffect(() => {
    const handleSiriSettingsChange = (e) => {
      if (e.detail && typeof e.detail.enabled === 'boolean') {
        setSiriWidgetEnabled(e.detail.enabled);
      }
    };
    const handleOpenSiriSettings = () => {
      setShowSiriSettings(true);
    };
    const handleCloseSiriSettings = () => {
      setShowSiriSettings(false);
      setOpenWindows(prev => ({ ...prev, siriSettings: false }));
    };
    window.addEventListener('jasper:siri-settings-changed', handleSiriSettingsChange);
    window.addEventListener('jasper:open-siri-settings', handleOpenSiriSettings);
    window.addEventListener('jasper:close-siri-settings', handleCloseSiriSettings);
    return () => {
      window.removeEventListener('jasper:siri-settings-changed', handleSiriSettingsChange);
      window.removeEventListener('jasper:open-siri-settings', handleOpenSiriSettings);
      window.removeEventListener('jasper:close-siri-settings', handleCloseSiriSettings);
    };
  }, []);

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


  const bringToTop = (winId) => {
    const nextZ = topZ + 1;
    setTopZ(nextZ);
    setActiveZIndex(prev => ({ ...prev, [winId]: nextZ }));
    setMinimizedWindows(prev => ({ ...prev, [winId]: false }));
    setActiveFocusedWinId(winId);
    setFocusedWinId(winId);
  };

  const closeWindow = useCallback((winId) => {
    setOpenWindows(prev => ({ ...prev, [winId]: false }));
    setFocusedWinId(prev => (prev === winId ? null : prev));
  }, []);

  const minimizeWindow = useCallback((winId) => {
    setMinimizedWindows(prev => ({ ...prev, [winId]: true }));
    setFocusedWinId(prev => (prev === winId ? null : prev));
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
        setGestureFeedback('OK Gesture: Voice Activated');
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
            setGestureFeedback('OK Gesture: Voice Activated');
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
    setIsActivitiesOpen(false);
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

  // Ubuntu GNOME Dock Pinned Apps Registry
  const UBUNTU_PINNED_APP_IDS = useMemo(() => [
    'fileManager',
    'jasperBrowser',
    'codeStudio',
    'videoStudio',
    'notesPlanner',
    'calculator',
    'hologramStudio',
    'phoneSentinel',
    'tvRemote',
    'skillsStore',
    'diagnostics'
  ], []);

  // Ubuntu Dock dynamic app list: Pinned + Unpinned running applications
  const dockApps = useMemo(() => {
    const pinned = UBUNTU_PINNED_APP_IDS
      .map(id => JASPER_OS_APPS_REGISTRY.find(a => a.id === id))
      .filter(Boolean);
    
    const unpinnedRunning = Object.keys(openWindows)
      .filter(id => openWindows[id] && !UBUNTU_PINNED_APP_IDS.includes(id))
      .map(id => JASPER_OS_APPS_REGISTRY.find(a => a.id === id))
      .filter(Boolean);

    return [...pinned, ...unpinnedRunning];
  }, [openWindows, UBUNTU_PINNED_APP_IDS]);

  // Active focused app for top panel header
  const focusedApp = useMemo(() => {
    if (!focusedWinId) return null;
    return JASPER_OS_APPS_REGISTRY.find(a => a.id === focusedWinId) || null;
  }, [focusedWinId]);

  // Ubuntu GNOME date formatting (e.g. "Tue Oct 13  22:14")
  const formatUbuntuDate = useCallback((date) => {
    try {
      const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const day = date.getDate();
      const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      return `${weekday} ${month} ${day}  ${time}`;
    } catch (_) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }, []);

  // Calendar info for the Ubuntu GNOME Notification & Calendar Tray
  const calendarInfo = useMemo(() => {
    const year = currentTime.getFullYear();
    const month = currentTime.getMonth();
    const today = currentTime.getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthName = currentTime.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const fullDateStr = currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    const blanks = Array.from({ length: firstDayIndex }, (_, i) => i);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return { year, month, today, monthName, fullDateStr, blanks, days };
  }, [currentTime]);

  return (
    <div 
      className="fixed inset-0 w-full h-full min-h-screen min-h-dvh overflow-hidden text-slate-100 font-sans select-none ubuntu-wallpaper z-30"
      style={{ filter: `brightness(${brightnessLevel}%)` }}
    >
      {/* Night Light Screen Tint Overlay */}
      {nightLight && (
        <div className="pointer-events-none fixed inset-0 bg-amber-500/10 mix-blend-color z-35 transition-opacity" />
      )}

      {/* Hidden File Input for Database Restore */}
      <input
        type="file"
        ref={dbFileInputRef}
        onChange={handleImportDb}
        accept=".json"
        className="hidden"
      />

      {/* 1. UBUNTU GNOME TOP PANEL (28px Canonical Bar) */}
      <header className="fixed top-0 left-0 right-0 h-7 bg-[#111111] border-b border-black/80 flex items-center justify-between px-2.5 z-50 text-[13px] font-sans text-[#dfdbd2] shadow-sm select-none">
        {/* Left: Activities button + Active App Title */}
        <div className="flex items-center gap-1.5 h-full">
          <button
            onClick={() => {
              setIsActivitiesOpen(prev => !prev);
              setShowQuickSettings(false);
              setShowCalendarTray(false);
            }}
            className={`h-5.5 px-3 rounded-full flex items-center text-xs font-semibold tracking-tight transition-all cursor-pointer ${
              isActivitiesOpen ? 'bg-white/20 text-white' : 'text-slate-200 hover:bg-white/10'
            }`}
            title="Ubuntu Activities Overview"
          >
            Activities
          </button>

          {/* Quick Return to Assistant Workspace */}
          <button
            onClick={onToggleClassicMode}
            className="h-5.5 px-2.5 rounded-full bg-[#E95420]/20 hover:bg-[#E95420]/35 border border-[#E95420]/40 text-white flex items-center gap-1.5 text-xs font-semibold tracking-tight transition-all cursor-pointer shadow-sm"
            title="Switch back to J.A.S.P.E.R. Assistant Workspace"
          >
            <Grid className="w-3 h-3 text-[#E95420]" />
            <span>Assistant Workspace</span>
          </button>

          {/* Active Application Name & Icon */}
          {focusedApp && !minimizedWindows[focusedApp.id] && (
            <button
              onClick={() => bringToTop(focusedApp.id)}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full hover:bg-white/10 transition-colors text-xs text-white cursor-pointer"
              title={`Active Window: ${focusedApp.title}`}
            >
              <focusedApp.icon className="w-3.5 h-3.5 text-[#E95420]" />
              <span className="font-medium truncate max-w-[180px]">{focusedApp.title.replace(' App', '').replace('JASPER ', '')}</span>
            </button>
          )}
        </div>

        {/* Center: Ubuntu Date & Clock */}
        <div className="flex items-center justify-center">
          <button
            onClick={() => {
              setShowCalendarTray(prev => !prev);
              setShowQuickSettings(false);
            }}
            className={`h-5.5 px-3 rounded-full flex items-center text-xs font-medium tracking-tight transition-all cursor-pointer ${
              showCalendarTray ? 'bg-white/20 text-white' : 'text-slate-200 hover:bg-white/10'
            }`}
            title="Calendar & Notifications"
          >
            {formatUbuntuDate(currentTime)}
          </button>
        </div>

        {/* Right: AI Voice Avatar + Air Gestures + Satellite + GNOME Quick Settings Pill */}
        <div className="flex items-center gap-1.5 h-full">
          {/* AI Voice Avatar Status Pill */}
          <button
            onClick={onMicClick}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full hover:bg-white/10 transition-colors text-xs text-slate-300 hover:text-white cursor-pointer"
            title="Jasper AI Voice Core (Click to speak)"
          >
            <span className={`w-2 h-2 rounded-full ${
              jasperState === 'listening' ? 'bg-rose-500 animate-ping' :
              jasperState === 'processing' ? 'bg-amber-400 animate-pulse' :
              jasperState === 'speaking' ? 'bg-[#E95420] animate-ping' :
              'bg-emerald-400'
            }`} />
            <span className="text-[11px] font-mono uppercase text-slate-300">
              {jasperState === 'idle' ? 'Jasper AI' : jasperState}
            </span>
          </button>

          {/* Doctor Strange Air Gestures Pill */}
          <button
            onClick={() => {
              setIsAirGesturesOn(prev => !prev);
              if (!isAirGesturesOn) playJarvisPowerUp();
            }}
            className={`p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer ${
              isAirGesturesOn ? 'text-violet-400' : 'text-slate-400'
            }`}
            title="Spatial Air Gestures"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>

          {/* Satellite Bridge Pill */}
          <button
            onClick={() => setShowSatelliteModal(true)}
            className={`p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer ${
              satelliteOnline ? 'text-emerald-400' : 'text-slate-500'
            }`}
            title="Satellite PC Bridge"
          >
            <Radio className="w-3.5 h-3.5" />
          </button>

          {/* GNOME Aggregate Quick Settings Pill */}
          <button
            onClick={() => {
              setShowQuickSettings(prev => !prev);
              setShowCalendarTray(false);
            }}
            className={`h-5.5 px-2.5 rounded-full flex items-center gap-2 transition-all cursor-pointer ${
              showQuickSettings ? 'bg-white/25 text-white' : 'hover:bg-white/10 text-slate-200'
            }`}
            title="Ubuntu Quick Settings"
          >
            <Wifi className={`w-3.5 h-3.5 ${wifiEnabled ? 'text-white' : 'text-slate-500'}`} />
            <Volume2 className="w-3.5 h-3.5" />
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
        </div>
      </header>

      {/* 2. UBUNTU QUICK SETTINGS POPOVER (TOP RIGHT) */}
      {showQuickSettings && (
        <div className="fixed top-8 right-2.5 w-80 bg-[#1e1e1e] border border-[#333333] rounded-2xl p-4 shadow-2xl z-55 text-slate-100 font-sans animate-in fade-in zoom-in-95">
          {/* Volume Slider */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1.5 text-slate-200">
                {volumeLevel === 0 ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-[#E95420]" />}
                Volume
              </span>
              <span className="font-mono">{volumeLevel}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={volumeLevel}
              onChange={(e) => setVolumeLevel(Number(e.target.value))}
              className="w-full accent-[#E95420] cursor-pointer h-1.5 bg-[#333333] rounded-lg"
            />
          </div>

          {/* Brightness Slider */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1.5 text-slate-200">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                Brightness
              </span>
              <span className="font-mono">{brightnessLevel}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              value={brightnessLevel}
              onChange={(e) => setBrightnessLevel(Number(e.target.value))}
              className="w-full accent-[#E95420] cursor-pointer h-1.5 bg-[#333333] rounded-lg"
            />
          </div>

          {/* Quick Toggles Grid (2 columns) */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {/* Wi-Fi Toggle */}
            <button
              onClick={() => setWifiEnabled(prev => !prev)}
              className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                wifiEnabled
                  ? 'bg-[#E95420]/20 border-[#E95420]/60 text-white'
                  : 'bg-[#252525] border-[#333333] text-slate-400 hover:text-white'
              }`}
            >
              <Wifi className={`w-4 h-4 ${wifiEnabled ? 'text-[#E95420]' : 'text-slate-500'}`} />
              <div className="min-w-0">
                <div className="text-xs font-semibold">Wi-Fi</div>
                <div className="text-[10px] text-slate-400 truncate">{wifiEnabled ? 'Connected' : 'Disabled'}</div>
              </div>
            </button>

            {/* Satellite Bridge */}
            <button
              onClick={() => setShowSatelliteModal(true)}
              className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                satelliteOnline
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-white'
                  : 'bg-[#252525] border-[#333333] text-slate-400 hover:text-white'
              }`}
            >
              <Radio className={`w-4 h-4 ${satelliteOnline ? 'text-emerald-400' : 'text-slate-500'}`} />
              <div className="min-w-0">
                <div className="text-xs font-semibold">Satellite</div>
                <div className="text-[10px] text-slate-400 truncate">{satelliteOnline ? 'PC Linked' : 'Offline'}</div>
              </div>
            </button>

            {/* Night Light Toggle */}
            <button
              onClick={() => setNightLight(prev => !prev)}
              className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                nightLight
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                  : 'bg-[#252525] border-[#333333] text-slate-400 hover:text-white'
              }`}
            >
              <Moon className={`w-4 h-4 ${nightLight ? 'text-amber-400' : 'text-slate-500'}`} />
              <div className="min-w-0">
                <div className="text-xs font-semibold">Night Light</div>
                <div className="text-[10px] text-slate-400 truncate">{nightLight ? 'Active' : 'Off'}</div>
              </div>
            </button>

            {/* Air Gestures Toggle */}
            <button
              onClick={() => setIsAirGesturesOn(prev => !prev)}
              className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                isAirGesturesOn
                  ? 'bg-violet-500/20 border-violet-500/50 text-violet-200'
                  : 'bg-[#252525] border-[#333333] text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className={`w-4 h-4 ${isAirGesturesOn ? 'text-violet-400' : 'text-slate-500'}`} />
              <div className="min-w-0">
                <div className="text-xs font-semibold">Air Gestures</div>
                <div className="text-[10px] text-slate-400 truncate">{isAirGesturesOn ? 'Tracking' : 'Off'}</div>
              </div>
            </button>

            {/* Siri Assistant Widget Toggle & Quick Config */}
            <div className="relative group">
              <button
                onClick={() => {
                  const next = !siriWidgetEnabled;
                  setSiriWidgetEnabled(next);
                  saveSiriWidgetSettings({ enabled: next });
                }}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all text-left cursor-pointer ${
                  siriWidgetEnabled
                    ? 'bg-gradient-to-r from-pink-500/20 via-indigo-500/20 to-cyan-500/20 border-cyan-400/50 text-white shadow-sm'
                    : 'bg-[#252525] border-[#333333] text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Sparkles className={`w-4 h-4 shrink-0 ${siriWidgetEnabled ? 'text-cyan-300 animate-pulse' : 'text-slate-500'}`} />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">Siri Assistant</div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {siriWidgetEnabled ? 'Orb Active' : 'Off'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowQuickSettings(false);
                    setShowSiriSettings(true);
                  }}
                  className="p-1 rounded-lg hover:bg-white/20 text-slate-300 hover:text-cyan-300 transition-colors ml-1"
                  title="Configure Siri Assistant & Hotkey"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>
              </button>
            </div>

            {/* Smart TV Remote Shortcut */}
            <button
              onClick={() => launchApp('tvRemote')}
              className="p-2.5 rounded-xl border bg-[#252525] border-[#333333] hover:border-[#E95420]/60 text-slate-300 hover:text-white flex items-center gap-2.5 transition-all text-left cursor-pointer"
            >
              <Tv className="w-4 h-4 text-sky-400" />
              <div className="min-w-0">
                <div className="text-xs font-semibold">TV Remote</div>
                <div className="text-[10px] text-slate-400 truncate">JioFiber CEC</div>
              </div>
            </button>

            {/* Classic Mode Switch */}
            <button
              onClick={onToggleClassicMode}
              className="p-2.5 rounded-xl border bg-[#252525] border-[#333333] hover:border-[#E95420]/60 text-slate-300 hover:text-white flex items-center gap-2.5 transition-all text-left cursor-pointer"
            >
              <Grid className="w-4 h-4 text-indigo-400" />
              <div className="min-w-0">
                <div className="text-xs font-semibold">Classic Mode</div>
                <div className="text-[10px] text-slate-400 truncate">Switch View</div>
              </div>
            </button>
          </div>

          {/* Quick Settings Footer Toolbar */}
          <div className="pt-3 border-t border-[#333333] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {/* User Profile */}
              <UserProfileMenu onLockSystem={onLockSystem} />

              {/* Database Backup */}
              <button
                onClick={handleExportDb}
                className="p-2 rounded-xl bg-[#252525] hover:bg-[#303030] text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Backup Database"
              >
                <Download className="w-4 h-4 text-amber-400" />
              </button>

              {/* Database Restore */}
              <button
                onClick={() => dbFileInputRef.current?.click()}
                className="p-2 rounded-xl bg-[#252525] hover:bg-[#303030] text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Restore Database"
              >
                <Upload className="w-4 h-4 text-sky-400" />
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Siri Assistant Settings */}
              <button
                onClick={() => {
                  setShowQuickSettings(false);
                  setShowSiriSettings(true);
                }}
                className="p-2 rounded-xl bg-[#252525] hover:bg-[#303030] text-cyan-300 hover:text-cyan-200 transition-colors cursor-pointer"
                title="Siri Voice Assistant & Hotkey Settings"
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </button>

              {/* Settings */}
              {onOpenSettings ? (
                <button
                  onClick={() => {
                    setShowQuickSettings(false);
                    onOpenSettings();
                  }}
                  className="p-2 rounded-xl bg-[#252525] hover:bg-[#303030] text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => launchApp('diagnostics')}
                  className="p-2 rounded-xl bg-[#252525] hover:bg-[#303030] text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="System Diagnostics"
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}

              {/* Lock System */}
              {onLockSystem && (
                <button
                  onClick={() => {
                    setShowQuickSettings(false);
                    onLockSystem();
                  }}
                  className="p-2 rounded-xl bg-[#252525] hover:bg-[#303030] text-rose-400 hover:text-rose-200 transition-colors cursor-pointer"
                  title="Lock Screen"
                >
                  <Lock className="w-4 h-4" />
                </button>
              )}

              {/* Power / Switch Layout */}
              <button
                onClick={onToggleClassicMode}
                className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 hover:text-rose-200 transition-colors cursor-pointer"
                title="Log Out / Power Options"
              >
                <Power className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. UBUNTU CALENDAR & NOTIFICATION TRAY (TOP CENTER) */}
      {showCalendarTray && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 w-[440px] max-w-[95vw] bg-[#1e1e1e] border border-[#333333] rounded-2xl p-4 shadow-2xl z-55 text-slate-100 font-sans animate-in fade-in zoom-in-95 flex flex-col sm:flex-row gap-4">
          {/* Left: Notifications Summary */}
          <div className="flex-1 border-b sm:border-b-0 sm:border-r border-[#333333] pb-3 sm:pb-0 sm:pr-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-[#E95420]" />
                Notifications
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Jasper OS</span>
            </div>
            <div className="space-y-2">
              <div className="p-2 rounded-xl bg-[#252525] border border-[#333333] text-xs">
                <div className="font-semibold text-slate-200">Ubuntu Yaru Environment</div>
                <div className="text-[11px] text-slate-400">Desktop theme and GNOME top bar active.</div>
              </div>
              <div className="p-2 rounded-xl bg-[#252525] border border-[#333333] text-xs">
                <div className="font-semibold text-emerald-300">Neural Core Ready</div>
                <div className="text-[11px] text-slate-400">{aiStatusLabel} &bull; Satellite {satelliteOnline ? 'PC Linked' : 'Offline'}.</div>
              </div>
            </div>
          </div>

          {/* Right: Interactive Month Calendar Grid */}
          <div className="w-[190px] shrink-0">
            <div className="text-center mb-2">
              <div className="text-xs font-bold text-white">{calendarInfo.monthName}</div>
              <div className="text-[10px] text-slate-400 font-mono">{calendarInfo.fullDateStr}</div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono text-slate-400 mb-1">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <span key={d} className="font-bold">{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-sans">
              {calendarInfo.blanks.map((b) => (
                <span key={`blank-${b}`} className="w-6 h-6" />
              ))}
              {calendarInfo.days.map((day) => {
                const isToday = day === calendarInfo.today;
                return (
                  <span
                    key={`day-${day}`}
                    className={`w-6 h-6 flex items-center justify-center rounded-full mx-auto ${
                      isToday
                        ? 'bg-[#E95420] text-white font-bold shadow-md shadow-[#E95420]/30'
                        : 'text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {day}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
                  <h3 className="font-semibold text-base text-neutral-100">Hardware Satellite Bridge</h3>
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

      {/* 4. UBUNTU LEFT DOCK (THE DASH - 64px) */}
      <aside className="fixed top-7 left-0 bottom-0 w-16 bg-[#111111]/95 border-r border-[#222222] z-40 flex flex-col items-center py-2 justify-between backdrop-blur-md shadow-xl select-none">
        {/* Pinned & Dynamic Running Apps */}
        <div className="flex-1 w-full flex flex-col items-center gap-1.5 overflow-y-auto custom-scrollbar px-1 py-1">
          {dockApps.map((app) => {
            const AppIcon = app.icon;
            const isRunning = openWindows[app.id];
            const isMinimized = minimizedWindows[app.id];
            const isFocused = focusedWinId === app.id && !isMinimized;

            return (
              <div key={app.id} className="relative group w-full flex items-center justify-center">
                {/* Signature Ubuntu Orange Running Indicator */}
                {isRunning && (
                  <span
                    className={`absolute left-0 w-1 rounded-r bg-[#E95420] transition-all ${
                      isFocused ? 'h-5 shadow-[0_0_8px_#E95420]' : 'h-2 opacity-80'
                    }`}
                  />
                )}

                <button
                  onClick={() => toggleWindow(app.id)}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    isFocused
                      ? 'bg-white/15 text-white scale-105 shadow-md'
                      : isRunning
                      ? 'bg-white/10 text-slate-200'
                      : 'text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                  title={app.title}
                >
                  <AppIcon className="w-6 h-6 transition-transform group-hover:scale-110" />
                </button>

                {/* Ubuntu Hover Tooltip */}
                <div className="absolute left-16 px-2.5 py-1 bg-[#1e1e1e] border border-[#333333] rounded-md text-xs font-medium text-white shadow-xl pointer-events-none whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
                  {app.title.replace(' App', '').replace('JASPER ', '')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom of Dock: Trash + Canonical 9-Dots "Show Applications" */}
        <div className="w-full flex flex-col items-center gap-2 pt-2 border-t border-[#222222]">
          {/* Trash Shortcut */}
          <button
            onClick={() => launchApp('fileManager')}
            className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer group relative"
            title="Trash"
          >
            <Trash2 className="w-5 h-5" />
            <div className="absolute left-16 px-2 py-1 bg-[#1e1e1e] border border-[#333333] rounded text-xs text-white shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
              Trash
            </div>
          </button>

          {/* Ubuntu Canonical 9-Dots "Show Applications" */}
          <button
            onClick={() => {
              setIsActivitiesOpen(prev => !prev);
              setShowQuickSettings(false);
              setShowCalendarTray(false);
            }}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer group ${
              isActivitiesOpen ? 'bg-[#E95420] text-white shadow-lg' : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            title="Show Applications (Activities)"
          >
            <div className="grid grid-cols-3 gap-1 p-1">
              {[...Array(9)].map((_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    isActivitiesOpen ? 'bg-white' : 'bg-slate-300 group-hover:bg-white'
                  }`}
                />
              ))}
            </div>
          </button>
        </div>
      </aside>

      {/* 5. UBUNTU ACTIVITIES OVERVIEW / APP DRAWER (FULL SCREEN MODAL) */}
      {isActivitiesOpen && (
        <div className="fixed inset-0 top-7 bg-black/85 backdrop-blur-2xl z-45 flex flex-col p-6 overflow-y-auto animate-in fade-in duration-200">
          {/* Top Search Pill */}
          <div className="w-full max-w-lg mx-auto relative mb-6">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="Type to search..."
              value={appSearchQuery}
              onChange={(e) => setAppSearchQuery(e.target.value)}
              className="w-full bg-[#252525] border border-[#383838] focus:border-[#E95420] rounded-full py-2.5 pl-11 pr-10 text-sm text-white placeholder-slate-400 focus:outline-none shadow-xl transition-all"
            />
            {appSearchQuery && (
              <button
                onClick={() => setAppSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Workspaces Pill Bar */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <button className="px-4 py-1.5 rounded-full bg-white/15 border border-[#E95420] text-white text-xs font-semibold shadow-md">
              Workspace 1 (Active)
            </button>
            <button className="px-4 py-1.5 rounded-full bg-[#252525] border border-[#383838] text-slate-400 hover:text-white text-xs font-medium">
              Workspace 2
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex justify-center flex-wrap gap-1.5 mb-6 text-xs">
            {['all', 'Creative & AI', 'AI & Intelligence', 'Productivity & Tools', 'System & Hardware', 'Hardware Control', 'Media & Life'].map((category) => (
              <button
                key={category}
                onClick={() => setActiveWorkspace(category)}
                className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                  activeWorkspace === category
                    ? 'bg-[#E95420] text-white shadow-md'
                    : 'bg-[#252525] text-slate-400 hover:text-white hover:bg-[#303030]'
                }`}
              >
                {category === 'all' ? 'All Applications' : category}
              </button>
            ))}
          </div>

          {/* Applications Grid: Canonical Ubuntu Squircle App Tiles */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 max-w-5xl mx-auto py-2">
            {filteredApps.map((app) => {
              const AppIcon = app.icon;
              const isRunning = openWindows[app.id];

              return (
                <button
                  key={app.id}
                  onClick={() => launchApp(app.id)}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.12] hover:scale-105 border border-transparent hover:border-white/10 transition-all cursor-pointer group text-center relative h-24"
                  title={`${app.title} (${app.category})`}
                >
                  <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#333333] to-[#222222] text-[#E95420] group-hover:text-white shadow-md mb-1.5 transition-colors relative">
                    <AppIcon className="w-6 h-6" />
                    {isRunning && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#E95420] shadow-[0_0_6px_#E95420]" />
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-slate-200 group-hover:text-white truncate w-full px-1">
                    {app.title.replace(' App', '').replace('JASPER ', '')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. UBUNTU DESKTOP CANVAS & SHORTCUTS (Top-7 Left-16) */}
      <div className="fixed top-7 left-16 right-0 bottom-0 overflow-hidden pointer-events-auto z-10">
        {/* Ubuntu Desktop Shortcuts (Top Left) */}
        <div className="absolute top-6 left-6 flex flex-col gap-5 z-10 select-none">
          {/* Home / Files */}
          <button
            onDoubleClick={() => launchApp('fileManager')}
            onClick={() => launchApp('fileManager')}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group w-20 text-center"
            title="Home Folder"
          >
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-lg group-hover:scale-105 transition-transform">
              <Folder className="w-7 h-7" />
            </div>
            <span className="text-xs font-medium text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Home</span>
          </button>

          {/* Terminal */}
          <button
            onDoubleClick={() => launchApp('codeStudio')}
            onClick={() => launchApp('codeStudio')}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group w-20 text-center"
            title="Terminal & Code Studio"
          >
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-700 text-[#E95420] shadow-lg group-hover:scale-105 transition-transform">
              <Terminal className="w-7 h-7" />
            </div>
            <span className="text-xs font-medium text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Terminal</span>
          </button>

          {/* Jasper AI Assistant */}
          <button
            onDoubleClick={() => launchApp('agentHub')}
            onClick={() => launchApp('agentHub')}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group w-20 text-center"
            title="Jasper AI Agent Core"
          >
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-lg group-hover:scale-105 transition-transform">
              <Zap className="w-7 h-7 text-amber-300" />
            </div>
            <span className="text-xs font-medium text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Jasper AI</span>
          </button>

          {/* Trash */}
          <button
            onDoubleClick={() => launchApp('fileManager')}
            onClick={() => launchApp('fileManager')}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group w-20 text-center"
            title="Trash"
          >
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 text-slate-300 shadow-lg group-hover:scale-105 transition-transform">
              <Trash2 className="w-7 h-7" />
            </div>
            <span className="text-xs font-medium text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Trash</span>
          </button>
        </div>

        {/* Desktop View Switcher */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#1e1e1e]/80 border border-[#333333] p-1 rounded-xl backdrop-blur-md shadow-lg">
            <button
              onClick={() => setDesktopLayoutMode('commandCenter')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-sans transition-all cursor-pointer flex items-center gap-1.5 ${
                desktopLayoutMode === 'commandCenter'
                  ? 'bg-[#E95420] text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Jasper AI Command Center HUD"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>HUD</span>
            </button>
            <button
              onClick={() => setDesktopLayoutMode('clean')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-sans transition-all cursor-pointer flex items-center gap-1.5 ${
                desktopLayoutMode === 'clean'
                  ? 'bg-[#E95420] text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Clean Ubuntu Linux Desktop"
            >
              <Layout className="w-3.5 h-3.5" />
              <span>Desktop</span>
            </button>
          </div>
        </div>

        {/* Center: Command Center HUD if selected */}
        {desktopLayoutMode === 'commandCenter' && (
          <div className="absolute inset-0 top-12 overflow-y-auto px-4 pb-20 custom-scrollbar">
            <div className="max-w-6xl mx-auto pt-2">
              <JasperCommandCenter
                onLaunchApp={launchApp}
                onMicClick={onMicClick}
                onLockSystem={onLockSystem}
                onOpenSettings={onOpenSettings}
                onViewAllApps={() => setIsActivitiesOpen(true)}
                jasperState={jasperState}
                aiStatusLabel={aiStatusLabel}
                isAiOnline={isAiOnline}
              />
            </div>
          </div>
        )}

        {/* Bottom Right Ubuntu Noble Watermark */}
        <div className="absolute bottom-3 right-4 pointer-events-none text-right z-0">
          <div className="text-[11px] font-medium text-white/40 tracking-wider">Ubuntu 24.04 LTS (Noble Numbat)</div>
          <div className="text-[9px] font-mono text-white/25">Jasper OS Kernel 6.8 &bull; GNOME Shell 46</div>
        </div>
      </div>

      {/* 7. WINDOW MANAGER VIEWPORT LAYER */}
      <div className="fixed top-7 left-16 right-0 bottom-0 pointer-events-none z-20 overflow-hidden">
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
                defaultPos={{ 
                  x: Math.max(20, Math.min((typeof window !== 'undefined' ? (window.innerWidth - 64 - (app.defaultSize?.w || 640)) / 2 : 60) + (JASPER_OS_APPS_REGISTRY.findIndex(a => a.id === app.id) % 5) * 30, (typeof window !== 'undefined' ? window.innerWidth - 300 : 800))), 
                  y: Math.max(10, Math.min((typeof window !== 'undefined' ? (window.innerHeight - 28 - (app.defaultSize?.h || 480)) / 2 : 50) + (JASPER_OS_APPS_REGISTRY.findIndex(a => a.id === app.id) % 4) * 25, (typeof window !== 'undefined' ? window.innerHeight - 300 : 400))) 
                }}
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
                    <div className="w-6 h-6 border-2 border-[#E95420] border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-mono">Loading module...</span>
                  </div>
                }>
                  <AppComponent onLockSystem={onLockSystem} onClose={() => closeWindow(app.id)} />
                </React.Suspense>
              </OsWindow>
            </div>
          );
        })}
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

      {/* Siri Assistant & Hotkey Settings Modal in OS Mode */}
      <SiriWidgetSettingsModal
        isOpen={showSiriSettings}
        onClose={() => setShowSiriSettings(false)}
      />
    </div>
  );
}
