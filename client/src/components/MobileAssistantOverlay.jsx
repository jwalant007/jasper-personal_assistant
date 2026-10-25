import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Mic, MicOff, Square, Sparkles, Send, Volume2, X, Maximize2, 
  Clock, CloudSun, Calculator, FileText, Calendar, Search, 
  Music, Flashlight, Battery, Wifi, Bluetooth, Settings, 
  AlertCircle, CheckCircle2, ChevronUp, ChevronDown, RotateCcw,
  ArrowLeft, Home, Radio, Sun, TrendingUp, Cpu, Camera, Headphones,
  Newspaper, Zap, Trophy, Shield, Tv, Monitor, Smartphone, ShieldAlert,
  PhoneForwarded, Activity, Brain, Terminal, Globe, Palette, Laptop,
  Bot, HardDrive, Store, BarChart3, Workflow, Layout, Heart, Languages,
  BookOpen, Wallet, MessageSquare, Video, FileCode, Sliders, Play, Grid
} from 'lucide-react';
import { getApiBase } from '../utils/apiConfig.js';
import { speakDeviceAudio } from '../utils/speakDeviceAudio.js';
import { playChime } from './VoiceController.jsx';
import { playJarvisBeep } from '../utils/jarvisAudioSynth.js';

// ── LAZY-LOADED WIDGETS & APPLICATIONS (Code-split for maximum performance) ──
const SmartHomeMatrixWidget = React.lazy(() => import('./SmartHomeMatrixWidget.jsx'));
const NetworkRadarWidget = React.lazy(() => import('./NetworkRadarWidget.jsx'));
const MorningBriefingWidget = React.lazy(() => import('./MorningBriefingWidget.jsx'));
const MarketIntelWidget = React.lazy(() => import('./MarketIntelWidget.jsx'));
const HardwareHudWidget = React.lazy(() => import('./HardwareHudWidget.jsx'));
const VisionSentinelWidget = React.lazy(() => import('./VisionSentinelWidget.jsx'));
const FocusMatrixWidget = React.lazy(() => import('./FocusMatrixWidget.jsx'));
const AiNewsDigestWidget = React.lazy(() => import('./AiNewsDigestWidget.jsx'));
const AiCostSentinelWidget = React.lazy(() => import('./AiCostSentinelWidget.jsx'));
const HabitMatrixWidget = React.lazy(() => import('./HabitMatrixWidget.jsx'));
const WeatherWidget = React.lazy(() => import('./WeatherWidget.jsx'));
const MediaControllerWidget = React.lazy(() => import('./MediaControllerWidget.jsx'));
const UniversalTvRemoteWidget = React.lazy(() => import('./UniversalTvRemoteWidget.jsx'));
const PcMasterHubWidget = React.lazy(() => import('./PcMasterHubWidget.jsx'));
const PhoneControlWidget = React.lazy(() => import('./PhoneControlWidget.jsx'));
const PhoneSentinelWidget = React.lazy(() => import('./PhoneSentinelWidget.jsx'));
const TelephonyReceptionistWidget = React.lazy(() => import('./TelephonyReceptionistWidget.jsx'));
const SecurityCenterWidget = React.lazy(() => import('./SecurityCenterWidget.jsx'));
const DiagnosticWidget = React.lazy(() => import('./DiagnosticWidget.jsx'));
const JasperAgentHubWidget = React.lazy(() => import('./JasperAgentHubWidget.jsx'));
const AgenticActionsWidget = React.lazy(() => import('./AgenticActionsWidget.jsx'));
const BrowserAgentWidget = React.lazy(() => import('./BrowserAgentWidget.jsx'));
const AiMasterHubWidget = React.lazy(() => import('./AiMasterHubWidget.jsx'));
const ImageGeneratorWidget = React.lazy(() => import('./ImageGeneratorWidget.jsx'));
const MusicMasterHubWidget = React.lazy(() => import('./MusicMasterHubWidget.jsx'));
const DevicesMasterHubWidget = React.lazy(() => import('./DevicesMasterHubWidget.jsx'));
const PersonalAssistantWidget = React.lazy(() => import('./PersonalAssistantWidget.jsx'));
const MemoryDashboardWidget = React.lazy(() => import('./MemoryDashboardWidget.jsx'));
const SkillsStoreWidget = React.lazy(() => import('./SkillsStoreWidget.jsx'));
const AnalyticsWidget = React.lazy(() => import('./AnalyticsWidget.jsx'));
const AutomationBuilderWidget = React.lazy(() => import('./AutomationBuilderWidget.jsx'));
const MissionControlWidget = React.lazy(() => import('./MissionControlWidget.jsx'));
const SportsHubWidget = React.lazy(() => import('./SportsHubWidget.jsx'));
const MapsWidget = React.lazy(() => import('./MapsWidget.jsx'));
const HealthFitbandWidget = React.lazy(() => import('./HealthFitbandWidget.jsx'));
const LiveTranslationWidget = React.lazy(() => import('./LiveTranslationWidget.jsx'));
const UserManualWidget = React.lazy(() => import('./UserManualWidget.jsx'));
const PaymentBalanceWidget = React.lazy(() => import('./PaymentBalanceWidget.jsx'));
const SocialAutoReplyWidget = React.lazy(() => import('./SocialAutoReplyWidget.jsx'));
const JasperVideoStudioApp = React.lazy(() => import('./JasperVideoStudioApp.jsx'));
const JasperNotesPlannerApp = React.lazy(() => import('./JasperNotesPlannerApp.jsx'));
const JasperCalculatorApp = React.lazy(() => import('./JasperCalculatorApp.jsx'));
const JasperSearchApp = React.lazy(() => import('./JasperSearchApp.jsx'));
const JasperBrowserApp = React.lazy(() => import('./JasperBrowserApp.jsx'));
const JasperFileManagerApp = React.lazy(() => import('./JasperFileManagerApp.jsx'));
const JasperCodeStudioApp = React.lazy(() => import('./JasperCodeStudioApp.jsx'));
const SiriWidgetSettingsModal = React.lazy(() => import('./SiriWidgetSettingsModal.jsx'));

// ── COMPREHENSIVE REGISTRY OF ALL JASPER WIDGETS & APPS ───────────────────────
export const ALL_JASPER_WIDGETS = [
  // 1. IoT & Hardware Control
  { id: 'smartHome', name: 'Smart Home Matrix', desc: 'IoT Lighting, Thermostats & Appliance Deck', category: 'IoT & Control', icon: Home, color: 'text-cyan-400', keywords: ['smart home', 'lights', 'iot', 'lighting', 'air conditioner', 'fan', 'ac toggle', 'smart plug'] },
  { id: 'hardwareHud', name: 'Hardware Telemetry HUD', desc: 'Real-time CPU Thermals, Clocks & Peripheral Batteries', category: 'IoT & Control', icon: Cpu, color: 'text-sky-400', keywords: ['hardware', 'cpu temp', 'thermals', 'hardware hud', 'clock speed', 'gpu load', 'sensors'] },
  { id: 'tvRemote', name: 'Universal Smart TV Remote', desc: 'JioFiber STB, Android TV CEC & Channel Controls', category: 'IoT & Control', icon: Tv, color: 'text-indigo-400', keywords: ['tv', 'television', 'tv remote', 'jiofiber', 'stb', 'volume tv', 'hdmi'] },
  { id: 'pcHub', name: 'PC Command Center', desc: 'Remote Desktop Execution, Power States & Task Deck', category: 'IoT & Control', icon: Monitor, color: 'text-blue-400', keywords: ['pc hub', 'computer', 'desktop', 'pc command', 'lock pc', 'shutdown pc', 'windows task'] },
  { id: 'phoneControl', name: 'Android Device Link', desc: 'Screen Mirror, SMS Relay & Phone Integration', category: 'IoT & Control', icon: Smartphone, color: 'text-emerald-400', keywords: ['phone', 'android', 'phone control', 'device link', 'mobile link', 'mirror phone'] },
  { id: 'phoneSentinel', name: 'Phone Sentinel Sentry', desc: 'Offline Anti-Theft, Battery Alarms & Proximity Deck', category: 'IoT & Control', icon: ShieldAlert, color: 'text-rose-400', keywords: ['phone sentinel', 'anti theft', 'phone alarm', 'battery alert', 'offline alarm'] },
  { id: 'telephonyHub', name: 'Telephony Hub', desc: 'Autonomous AI Receptionist & Call Handler', category: 'IoT & Control', icon: PhoneForwarded, color: 'text-amber-400', keywords: ['telephony', 'receptionist', 'call handler', 'answering machine', 'phone call'] },
  { id: 'devicesHub', name: 'Smart Devices Hub', desc: 'Bluetooth & LAN Connected Peripherals Deck', category: 'IoT & Control', icon: Laptop, color: 'text-teal-400', keywords: ['devices', 'connected devices', 'peripherals', 'bluetooth devices', 'smart devices'] },

  // 2. AI & Intelligence
  { id: 'aiNewsDigest', name: 'AI News & Arxiv Digest', desc: 'Executive 3-Bullet AI Research Summaries', category: 'AI & Intelligence', icon: Newspaper, color: 'text-sky-300', keywords: ['ai news', 'news digest', 'arxiv', 'ai digest', 'papers', 'ai updates'] },
  { id: 'aiCostSentinel', name: 'Token Spend Sentinel', desc: 'Real-time LLM Quotas, Cloud Spend & Ollama Fallback', category: 'AI & Intelligence', icon: Zap, color: 'text-emerald-400', keywords: ['cost', 'token', 'token spend', 'api burn', 'quotas', 'ollama', 'llm cost', 'openai spend'] },
  { id: 'agentHub', name: 'JASPER AI Agent Hub', desc: 'Multi-Agent Autonomous Orchestration Matrix', category: 'AI & Intelligence', icon: Brain, color: 'text-purple-400', keywords: ['agent hub', 'ai agent', 'autonomous agents', 'agent matrix', 'subagents'] },
  { id: 'aiMasterHub', name: 'AI Swarm & Router Hub', desc: 'Multi-LLM Dispatcher, Gemini, Claude & Local Models', category: 'AI & Intelligence', icon: Brain, color: 'text-pink-400', keywords: ['ai swarm', 'ai master', 'llm router', 'multi model', 'claude router'] },
  { id: 'browserAgent', name: 'Autonomous Web Browser', desc: 'AI-Guided Web Scraper & Task Navigator', category: 'AI & Intelligence', icon: Globe, color: 'text-cyan-300', keywords: ['browser agent', 'web agent', 'browse web', 'autonomous browser', 'web automation'] },
  { id: 'agentic', name: 'Agentic Shell Actions', desc: 'Safe Local Terminal Commands & Agentic Scripts', category: 'AI & Intelligence', icon: Terminal, color: 'text-amber-400', keywords: ['agentic', 'shell actions', 'terminal script', 'cli agent', 'bash runner'] },
  { id: 'personalAssistant', name: 'Personal AI Assistant', desc: 'High-Context Memory & Adaptive Personal Companion', category: 'AI & Intelligence', icon: Bot, color: 'text-indigo-400', keywords: ['assistant', 'personal assistant', 'companion', 'jasper assistant'] },
  { id: 'vectorMemory', name: 'Semantic Vector Memory', desc: 'Long-term Semantic Knowledge & Neural Facts Graph', category: 'AI & Intelligence', icon: HardDrive, color: 'text-violet-400', keywords: ['memory', 'vector memory', 'knowledge graph', 'saved facts', 'neural memory'] },

  // 3. Productivity & Tools
  { id: 'morningBriefing', name: 'Morning Executive Brief', desc: 'Synthesized Daily Agenda, Weather & Spoken Debrief', category: 'Productivity & Tools', icon: Sun, color: 'text-amber-400', keywords: ['morning', 'briefing', 'morning brief', 'debrief', 'today schedule', 'daily agenda'] },
  { id: 'focusMatrix', name: 'Deep Work Flow Matrix', desc: '40Hz Gamma Binaural Beats, Ambient Sound & Pomodoro', category: 'Productivity & Tools', icon: Headphones, color: 'text-purple-400', keywords: ['focus', 'deep work', 'binaural', 'pomodoro', 'flow state', 'ambient noise'] },
  { id: 'habitMatrix', name: '90-Day Habit & Quest Matrix', desc: 'Gamified Consistency Streaks, Leveling & XP', category: 'Productivity & Tools', icon: Trophy, color: 'text-yellow-400', keywords: ['habit', 'habits', 'quest', 'streak', 'leveling', 'xp matrix', 'habit tracker'] },
  { id: 'missionControl', name: 'Mission Control Hub', desc: 'Cross-Project Tasks, Kanban & Operational Deck', category: 'Productivity & Tools', icon: Layout, color: 'text-cyan-400', keywords: ['mission control', 'kanban', 'project tasks', 'operations', 'mission hub'] },
  { id: 'notesPlanner', name: 'AI Notes & Planner App', desc: 'Markdown Sticky Notes, Checklist & Day Planner', category: 'Productivity & Tools', icon: BookOpen, color: 'text-emerald-400', keywords: ['notes', 'planner', 'todo', 'checklist', 'notepad', 'scratchpad'] },
  { id: 'calculator', name: 'Scientific & Matrix Calc', desc: 'Matrix Calculator, Trigonometry & Cyber Units', category: 'Productivity & Tools', icon: Calculator, color: 'text-amber-300', keywords: ['calc', 'calculator', 'math', 'scientific calculator', 'equations'] },
  { id: 'automation', name: 'Automation Studio', desc: 'Trigger-Action Workflows, Webhooks & IFTTT Rules', category: 'Productivity & Tools', icon: Workflow, color: 'text-blue-400', keywords: ['automation', 'workflow', 'ifttt', 'trigger rule', 'auto flow'] },
  { id: 'codeStudio', name: 'Code Studio & Console', desc: 'In-browser IDE, Code Runner & Git Inspector', category: 'Productivity & Tools', icon: FileCode, color: 'text-teal-300', keywords: ['code', 'code studio', 'ide', 'editor', 'code runner', 'javascript console'] },
  { id: 'fileManager', name: 'File Explorer & Vault', desc: 'Local Storage, Cloud Sync & Disk Space Telemetry', category: 'Productivity & Tools', icon: HardDrive, color: 'text-slate-300', keywords: ['files', 'file manager', 'explorer', 'disk storage', 'file vault'] },
  { id: 'searchEngine', name: 'AI Search Engine', desc: 'Perplexity-Style Citations, Web Answers & Deep Search', category: 'Productivity & Tools', icon: Search, color: 'text-sky-400', keywords: ['search', 'search engine', 'web search', 'ask web', 'deep search'] },
  { id: 'jasperBrowser', name: 'JASPER Web Browser', desc: 'Full-Featured Ad-Free Web Browser Sandbox', category: 'Productivity & Tools', icon: Globe, color: 'text-indigo-300', keywords: ['browser', 'open website', 'surf web', 'surf internet'] },
  { id: 'liveTranslation', name: 'Universal Live Translator', desc: 'Multi-Language Speech & Real-Time Subtitle Translation', category: 'Productivity & Tools', icon: Languages, color: 'text-emerald-400', keywords: ['translate', 'translation', 'translator', 'foreign language', 'multilingual'] },
  { id: 'userManual', name: 'JASPER OS Master Guide', desc: 'Comprehensive Cyber-Architecture Docs & Keybinds', category: 'Productivity & Tools', icon: BookOpen, color: 'text-slate-400', keywords: ['manual', 'guide', 'help', 'instructions', 'documentation', 'user guide'] },

  // 4. Cybersecurity & Sentry
  { id: 'networkRadar', name: 'LAN Cyber Radar', desc: 'Real-time Subnet Sniffer, IP Discovery & Port Scanner', category: 'Cybersecurity', icon: Radio, color: 'text-emerald-400', keywords: ['radar', 'network radar', 'subnet', 'sniffer', 'ip scan', 'lan scanner', 'open ports'] },
  { id: 'visionSentinel', name: 'Vision Sentinel CCTV', desc: 'Computer Vision Live Sentry & Motion Detection Feed', category: 'Cybersecurity', icon: Camera, color: 'text-rose-400', keywords: ['vision', 'cctv', 'sentry', 'camera sentry', 'motion detector', 'surveillance'] },
  { id: 'security', name: 'Biometric Security & Firewall', desc: 'Intrusion Detection, Lockout Matrix & Access Logs', category: 'Cybersecurity', icon: Shield, color: 'text-red-400', keywords: ['security', 'firewall', 'intrusion', 'biometrics', 'access logs', 'lockdown'] },
  { id: 'diagnostics', name: 'System Diagnostics & Telemetry', desc: 'Kernel Health, Memory Leaks & Latency Graphs', category: 'Cybersecurity', icon: Activity, color: 'text-yellow-400', keywords: ['diagnostics', 'system health', 'latency', 'ping test', 'kernel telemetry'] },
  { id: 'analytics', name: 'System Performance Analytics', desc: 'Telemetry Trends, Command Frequency & Efficiency Index', category: 'Cybersecurity', icon: BarChart3, color: 'text-blue-400', keywords: ['analytics', 'metrics', 'performance index', 'stats', 'system analytics'] },

  // 5. Media & Lifestyle
  { id: 'weather', name: 'Live Environmental Radar', desc: 'Hyperlocal Weather, Storm Alerts & Atmospheric Telemetry', category: 'Media & Life', icon: CloudSun, color: 'text-amber-400', keywords: ['weather', 'forecast', 'rain', 'temperature', 'humidity', 'storm'] },
  { id: 'mediaPlayer', name: 'System Media Player', desc: 'SMTC Media Controls, Visualizer & Track Player', category: 'Media & Life', icon: Play, color: 'text-pink-400', keywords: ['media', 'media player', 'now playing', 'music player', 'play song', 'pause music'] },
  { id: 'musicHub', name: 'Music & Audio Master', desc: 'Lo-Fi Chill, Cyberpunk Radio & Soundscape Library', category: 'Media & Life', icon: Music, color: 'text-indigo-400', keywords: ['music', 'radio', 'lofi', 'cyberpunk music', 'audio player'] },
  { id: 'marketIntel', name: 'Market Intelligence Ticker', desc: 'Live Crypto Sparklines, S&P 500 & Fear/Greed Index', category: 'Media & Life', icon: TrendingUp, color: 'text-emerald-400', keywords: ['crypto', 'market', 'bitcoin', 'stock', 'ticker', 'ethereum', 'market intel'] },
  { id: 'imageStudio', name: 'AI Image Generator Studio', desc: 'Prompt-to-Image Synthesis & Cyber Art Canvas', category: 'Media & Life', icon: Palette, color: 'text-purple-400', keywords: ['image', 'generate image', 'ai image', 'art studio', 'picture generator'] },
  { id: 'videoStudio', name: 'AI Video & YouTube Studio', desc: 'Autonomous Video Generation, Scripting & Montage Deck', category: 'Media & Life', icon: Video, color: 'text-rose-400', keywords: ['video studio', 'youtube studio', 'create video', 'video generator'] },
  { id: 'healthHub', name: 'Health & Fitband Tracker', desc: 'Heart Rate, Daily Steps & Vital Signs Telemetry', category: 'Media & Life', icon: Heart, color: 'text-red-400', keywords: ['health', 'fitness', 'steps', 'heart rate', 'fitband', 'calories'] },
  { id: 'sportsHub', name: 'Sports & Live Score Hub', desc: 'Live Match Trackers, Cricket, Football & F1 Standings', category: 'Media & Life', icon: Trophy, color: 'text-yellow-400', keywords: ['sports', 'scores', 'cricket score', 'football score', 'f1', 'match score'] },
  { id: 'spatialGps', name: 'Spatial GPS & Satellite Intel', desc: 'High-Res Satellite Imagery & Location Coordinates', category: 'Media & Life', icon: Globe, color: 'text-sky-400', keywords: ['maps', 'gps', 'satellite', 'location', 'navigation', 'coordinates'] },
  { id: 'payVault', name: 'Pay Vault & Guardian Budget', desc: 'Expense Tracker, UPI Balances & Spend Analytics', category: 'Media & Life', icon: Wallet, color: 'text-emerald-400', keywords: ['wallet', 'pay vault', 'budget', 'expenses', 'upi balance', 'spend tracker'] },
  { id: 'socialAutoReply', name: 'WhatsApp & Social Assistant', desc: 'Automated AI Response Engine for Social Chats', category: 'Media & Life', icon: MessageSquare, color: 'text-green-400', keywords: ['social', 'whatsapp', 'auto reply', 'instagram reply', 'message auto'] },
  { id: 'skillsStore', name: 'JASPER App & Skills Store', desc: 'Modular Plugin Marketplace & Voice Customizations', category: 'Media & Life', icon: Store, color: 'text-indigo-400', keywords: ['skills', 'store', 'plugin', 'app store', 'skills store'] },
  { id: 'siriSettings', name: 'JASPER Widget & Voice Settings', desc: 'Hotkey Triggers, Orb Themes & Voice Configuration', category: 'System & Settings', icon: Sliders, color: 'text-cyan-400', keywords: ['settings', 'widget settings', 'voice settings', 'configure widget', 'hotkey'] }
];

export default function MobileAssistantOverlay({ onClose, autoWake = true, embedded = false }) {
  const [state, setState] = useState(autoWake ? 'listening' : 'idle'); // 'listening' | 'thinking' | 'speaking' | 'idle'
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [textInput, setTextInput] = useState('');
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [activeTimer, setActiveTimer] = useState(null);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(0);

  // Widget State
  const [activeWidget, setActiveWidget] = useState(null); // widget ID
  const [showAllWidgetsCatalog, setShowAllWidgetsCatalog] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Dynamic window resizing for Electron floating bar
  useEffect(() => {
    if (window.jasperElectron?.resizeFloatingBar) {
      if (activeWidget) {
        window.jasperElectron.resizeFloatingBar({ width: 560, height: 760 });
      } else if (showAllWidgetsCatalog) {
        window.jasperElectron.resizeFloatingBar({ width: 520, height: 720 });
      } else {
        window.jasperElectron.resizeFloatingBar({ width: 440, height: 620 });
      }
    }
  }, [activeWidget, showAllWidgetsCatalog]);

  // Read Battery API
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      navigator.getBattery().then((battery) => {
        setBatteryLevel({
          level: Math.round(battery.level * 100),
          charging: battery.charging
        });
        battery.addEventListener('levelchange', () => {
          setBatteryLevel({
            level: Math.round(battery.level * 100),
            charging: battery.charging
          });
        });
      }).catch(() => {});
    }
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    try {
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognitionClass) {
        console.warn('[MobileAssistant] Web Speech recognition not supported.');
        return;
      }

      const rec = new SpeechRecognitionClass();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setState('listening');
      };

      rec.onresult = (event) => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const heard = (final || interim).trim();
        if (heard) setTranscript(heard);

        if (final.trim()) {
          rec.stop();
          processCommand(final.trim());
        } else {
          silenceTimerRef.current = setTimeout(() => {
            try { rec.stop(); } catch (_) {}
            if (interim.trim()) {
              processCommand(interim.trim());
            }
          }, 2000);
        }
      };

      rec.onerror = () => {
        setState('idle');
      };

      rec.onend = () => {
        if (state === 'listening' && !transcript) {
          setState('idle');
        }
      };

      recognitionRef.current = rec;
      if (autoWake) {
        playChime('wake');
        setTimeout(() => {
          try { rec.start(); } catch (_) {}
        }, 200);
      } else {
        setState('idle');
      }

    } catch (e) {
      console.warn('[MobileAssistant] Speech Recognition init caught:', e);
    }

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
      }
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const startVoiceCapture = () => {
    playChime('wake');
    setTranscript('');
    setResponse('');
    setState('listening');
    try {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
        setTimeout(() => {
          try { recognitionRef.current.start(); } catch (_) {}
        }, 150);
      }
    } catch (_) {}
  };

  const processCommand = async (queryText) => {
    const clean = String(queryText || textInput).trim();
    if (!clean) return;

    setTranscript(clean);
    setTextInput('');
    const lower = clean.toLowerCase();

    // ── AUTOMATED SPEECH DISPATCH TO ALL 47 WIDGETS ─────────────────────────
    const matchedWidget = ALL_JASPER_WIDGETS.find(w => 
      w.keywords && w.keywords.some(k => lower.includes(k.toLowerCase()))
    );

    if (matchedWidget) {
      setActiveWidget(matchedWidget.id);
      setShowAllWidgetsCatalog(false);
      playJarvisBeep('success');
      const speakText = `Launching ${matchedWidget.name}, Sir.`;
      setResponse(speakText);
      speakDeviceAudio(speakText);
      setState('idle');
      return;
    }

    setState('thinking');

    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/agent/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: clean })
      });

      const data = await res.json();
      const answer = data.response || data.text || 'Directive processed, Sir.';
      setResponse(answer);

      // Handle custom mobile timer action
      if (data.action === 'start_timer' && data.timer?.totalSeconds) {
        startMobileTimer(data.timer.totalSeconds, `${data.timer.value} ${data.timer.unit}`);
      }

      setState('speaking');
      speakDeviceAudio(answer, {
        onEnd: () => setState('idle'),
        onError: () => setState('idle')
      });
    } catch (e) {
      console.error('[MobileAssistant] Execution error:', e);
      setResponse('Connection failure with JASPER server core.');
      setState('idle');
    }
  };

  const stopAll = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch (_) {}
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
    }
    setState('idle');
  };

  const toggleFlashlight = async () => {
    const next = !isFlashlightOn;
    setIsFlashlightOn(next);
    try {
      if (next) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        mediaStreamRef.current = stream;
        const track = stream.getVideoTracks()[0];
        await track.applyConstraints({
          advanced: [{ torch: true }]
        });
      } else {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(t => t.stop());
          mediaStreamRef.current = null;
        }
      }
    } catch (e) {
      console.warn('Torch error:', e);
    }
  };

  const startMobileTimer = (seconds, label = 'Timer') => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setActiveTimer(label);
    setTimerSecondsLeft(seconds);

    timerIntervalRef.current = setInterval(() => {
      setTimerSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          setActiveTimer(null);
          playChime('success');
          speakDeviceAudio(`Sir, your ${label} has finished.`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (activeWidget) {
          setActiveWidget(null);
        } else if (showAllWidgetsCatalog) {
          setShowAllWidgetsCatalog(false);
        } else {
          closeAssistant();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeWidget, showAllWidgetsCatalog, onClose]);

  const openFullApp = () => {
    if (embedded && onClose) {
      onClose();
    } else {
      window.location.href = '/';
    }
  };

  const closeAssistant = () => {
    stopAll();
    if (onClose) {
      onClose();
      return;
    }
    if (window.AndroidAssistant?.finish) {
      window.AndroidAssistant.finish();
    } else {
      window.close();
      window.location.href = '/';
    }
  };

  // Categories list
  const categoriesList = ['All', 'IoT & Control', 'AI & Intelligence', 'Productivity & Tools', 'Cybersecurity', 'Media & Life', 'System & Settings'];

  // Filtered widgets for catalog view
  const filteredWidgets = useMemo(() => {
    return ALL_JASPER_WIDGETS.filter(w => {
      const matchCat = selectedCategory === 'All' || w.category === selectedCategory;
      const q = catalogSearch.toLowerCase().trim();
      const matchSearch = !q || 
        w.name.toLowerCase().includes(q) || 
        w.desc.toLowerCase().includes(q) ||
        (w.keywords && w.keywords.some(k => k.includes(q)));
      return matchCat && matchSearch;
    });
  }, [selectedCategory, catalogSearch]);

  // Featured top 12 quick widgets for the horizontal voice dock
  const featuredQuickWidgets = useMemo(() => {
    const featuredIds = [
      'smartHome', 'networkRadar', 'morningBriefing', 'marketIntel',
      'weather', 'hardwareHud', 'focusMatrix', 'visionSentinel',
      'mediaPlayer', 'tvRemote', 'pcHub', 'aiNewsDigest',
      'aiCostSentinel', 'habitMatrix', 'healthHub', 'sportsHub'
    ];
    return ALL_JASPER_WIDGETS.filter(w => featuredIds.includes(w.id));
  }, []);

  // ── RENDER ACTIVE EMBEDDED WIDGET MODULE ──────────────────────────────────
  const renderActiveWidgetComponent = () => {
    switch (activeWidget) {
      case 'smartHome': return <SmartHomeMatrixWidget onClose={() => setActiveWidget(null)} />;
      case 'networkRadar': return <NetworkRadarWidget onClose={() => setActiveWidget(null)} />;
      case 'morningBriefing': return <MorningBriefingWidget onClose={() => setActiveWidget(null)} />;
      case 'marketIntel': return <MarketIntelWidget onClose={() => setActiveWidget(null)} />;
      case 'hardwareHud': return <HardwareHudWidget onClose={() => setActiveWidget(null)} />;
      case 'visionSentinel': return <VisionSentinelWidget onClose={() => setActiveWidget(null)} />;
      case 'focusMatrix': return <FocusMatrixWidget onClose={() => setActiveWidget(null)} />;
      case 'aiNewsDigest': return <AiNewsDigestWidget onClose={() => setActiveWidget(null)} />;
      case 'aiCostSentinel': return <AiCostSentinelWidget onClose={() => setActiveWidget(null)} />;
      case 'habitMatrix': return <HabitMatrixWidget onClose={() => setActiveWidget(null)} />;
      case 'weather': return <WeatherWidget onClose={() => setActiveWidget(null)} />;
      case 'mediaPlayer': return <MediaControllerWidget onClose={() => setActiveWidget(null)} />;
      case 'tvRemote': return <UniversalTvRemoteWidget onClose={() => setActiveWidget(null)} />;
      case 'pcHub': return <PcMasterHubWidget onClose={() => setActiveWidget(null)} />;
      case 'phoneControl': return <PhoneControlWidget onClose={() => setActiveWidget(null)} />;
      case 'phoneSentinel': return <PhoneSentinelWidget onClose={() => setActiveWidget(null)} />;
      case 'telephonyHub': return <TelephonyReceptionistWidget onClose={() => setActiveWidget(null)} />;
      case 'security': return <SecurityCenterWidget onClose={() => setActiveWidget(null)} />;
      case 'diagnostics': return <DiagnosticWidget onClose={() => setActiveWidget(null)} />;
      case 'agentHub': return <JasperAgentHubWidget onClose={() => setActiveWidget(null)} />;
      case 'agentic': return <AgenticActionsWidget onClose={() => setActiveWidget(null)} />;
      case 'browserAgent': return <BrowserAgentWidget onClose={() => setActiveWidget(null)} />;
      case 'aiMasterHub': return <AiMasterHubWidget onClose={() => setActiveWidget(null)} />;
      case 'imageStudio': return <ImageGeneratorWidget onClose={() => setActiveWidget(null)} />;
      case 'musicHub': return <MusicMasterHubWidget onClose={() => setActiveWidget(null)} />;
      case 'devicesHub': return <DevicesMasterHubWidget onClose={() => setActiveWidget(null)} />;
      case 'personalAssistant': return <PersonalAssistantWidget onClose={() => setActiveWidget(null)} />;
      case 'vectorMemory': return <MemoryDashboardWidget onClose={() => setActiveWidget(null)} />;
      case 'skillsStore': return <SkillsStoreWidget onClose={() => setActiveWidget(null)} />;
      case 'analytics': return <AnalyticsWidget onClose={() => setActiveWidget(null)} />;
      case 'automation': return <AutomationBuilderWidget onClose={() => setActiveWidget(null)} />;
      case 'missionControl': return <MissionControlWidget onClose={() => setActiveWidget(null)} />;
      case 'sportsHub': return <SportsHubWidget onClose={() => setActiveWidget(null)} />;
      case 'spatialGps': return <MapsWidget onClose={() => setActiveWidget(null)} initialTab="satellite" />;
      case 'healthHub': return <HealthFitbandWidget onClose={() => setActiveWidget(null)} />;
      case 'liveTranslation': return <LiveTranslationWidget onClose={() => setActiveWidget(null)} />;
      case 'userManual': return <UserManualWidget onClose={() => setActiveWidget(null)} />;
      case 'payVault': return <PaymentBalanceWidget onClose={() => setActiveWidget(null)} />;
      case 'socialAutoReply': return <SocialAutoReplyWidget onClose={() => setActiveWidget(null)} />;
      case 'videoStudio': return <JasperVideoStudioApp onClose={() => setActiveWidget(null)} />;
      case 'notesPlanner': return <JasperNotesPlannerApp onClose={() => setActiveWidget(null)} />;
      case 'calculator': return <JasperCalculatorApp onClose={() => setActiveWidget(null)} />;
      case 'searchEngine': return <JasperSearchApp onClose={() => setActiveWidget(null)} />;
      case 'jasperBrowser': return <JasperBrowserApp onClose={() => setActiveWidget(null)} />;
      case 'fileManager': return <JasperFileManagerApp onClose={() => setActiveWidget(null)} />;
      case 'codeStudio': return <JasperCodeStudioApp onClose={() => setActiveWidget(null)} />;
      case 'siriSettings': return <SiriWidgetSettingsModal inWindow={true} isOpen={true} onClose={() => setActiveWidget(null)} />;
      default: return null;
    }
  };

  const activeWidgetMeta = ALL_JASPER_WIDGETS.find(w => w.id === activeWidget);

  return (
    <div 
      className="fixed inset-0 z-[99999] flex flex-col justify-end bg-black/60 backdrop-blur-md font-sans text-white animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeAssistant();
        }
      }}
    >
      {/* ── JASPER WIDGET CARD CONTAINER ──────────────────────────────── */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${activeWidget ? 'max-w-2xl max-h-[92vh]' : showAllWidgetsCatalog ? 'max-w-xl max-h-[90vh]' : 'max-w-lg'} mx-auto bg-gradient-to-b from-[#0c0f17] via-[#080b12] to-[#05070a] border-t border-cyan-500/30 rounded-t-3xl shadow-[0_-15px_40px_rgba(0,229,255,0.18)] p-5 flex flex-col gap-3.5 transition-all duration-300`}
      >
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-1 relative">
          <div className="w-10 h-1 bg-gray-600/60 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 -top-2" />
          
          {activeWidget ? (
            <button 
              onClick={() => {
                playJarvisBeep('click');
                setActiveWidget(null);
              }}
              className="flex items-center gap-1.5 text-xs text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 hover:bg-cyan-900/60 px-3 py-1 rounded-full font-mono transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to JASPER Widget</span>
            </button>
          ) : showAllWidgetsCatalog ? (
            <button 
              onClick={() => {
                playJarvisBeep('click');
                setShowAllWidgetsCatalog(false);
              }}
              className="flex items-center gap-1.5 text-xs text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 hover:bg-cyan-900/60 px-3 py-1 rounded-full font-mono transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Voice</span>
            </button>
          ) : (
            <button 
              onClick={openFullApp}
              className="flex items-center gap-1.5 text-xs text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 hover:bg-cyan-900/40 px-2.5 py-1 rounded-full font-mono transition-all cursor-pointer"
              title="Expand to Full J.A.S.P.E.R. HUD"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Full OS</span>
            </button>
          )}

          <div className="text-center">
            <span className="text-[12px] font-mono tracking-widest text-cyan-300 font-bold uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              {activeWidgetMeta ? activeWidgetMeta.name : 'JASPER WIDGET'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {!activeWidget && !showAllWidgetsCatalog && (
              <button
                onClick={() => {
                  playJarvisBeep('click');
                  setShowAllWidgetsCatalog(true);
                }}
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-mono text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/30 transition-all cursor-pointer"
                title="Browse All 47 Integrated Widgets"
              >
                <Grid className="w-3 h-3" />
                <span>All ({ALL_JASPER_WIDGETS.length})</span>
              </button>
            )}

            <button 
              onClick={closeAssistant}
              className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
              title="Close Widget"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── 1. ACTIVE WIDGET INLINE RUNNER ────────────────────────────── */}
        {activeWidget ? (
          <div className="flex-1 overflow-y-auto max-h-[74vh] rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-2.5 custom-scrollbar">
            <React.Suspense fallback={
              <div className="py-24 text-center text-xs font-mono text-cyan-400 flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                <span>Initializing {activeWidgetMeta?.name || activeWidget}...</span>
                <span className="text-[10px] text-slate-500">Connecting to JASPER neural core</span>
              </div>
            }>
              {renderActiveWidgetComponent()}
            </React.Suspense>
          </div>
        ) : showAllWidgetsCatalog ? (
          /* ── 2. ALL 47 WIDGETS CATALOG & SEARCH GRID ──────────────────── */
          <div className="flex flex-col gap-3 max-h-[72vh] overflow-y-auto custom-scrollbar pr-1">
            {/* Search Input Bar */}
            <div className="flex items-center bg-black/70 border border-cyan-500/30 focus-within:border-cyan-400 rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-cyan-400 mr-2 shrink-0" />
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder={`Search across all ${ALL_JASPER_WIDGETS.length} widgets & apps...`}
                className="w-full bg-transparent text-xs text-white placeholder-slate-500 outline-none"
              />
              {catalogSearch && (
                <button onClick={() => setCatalogSearch('')} className="text-slate-400 hover:text-white text-xs">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] font-mono">
              {categoriesList.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    playJarvisBeep('click');
                    setSelectedCategory(cat);
                  }}
                  className={`px-2.5 py-1 rounded-lg border whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-sm'
                      : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white hover:border-slate-600'
                  }`}
                >
                  {cat} {cat === 'All' ? `(${ALL_JASPER_WIDGETS.length})` : ''}
                </button>
              ))}
            </div>

            {/* Widgets Cards Grid */}
            <div className="grid grid-cols-2 gap-2 pb-2">
              {filteredWidgets.map(w => {
                const IconComp = w.icon;

                return (
                  <button
                    key={w.id}
                    onClick={() => {
                      playJarvisBeep('select');
                      setActiveWidget(w.id);
                    }}
                    className="p-3 rounded-xl bg-white/[0.03] hover:bg-cyan-950/30 border border-white/10 hover:border-cyan-500/50 text-left transition-all group flex flex-col justify-between gap-2 cursor-pointer shadow-sm hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className="p-2 rounded-lg bg-black/60 border border-white/10 group-hover:border-cyan-400/40 transition-colors">
                        <IconComp className={`w-4 h-4 ${w.color}`} />
                      </div>
                      <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-400">
                        {w.category.split(' ')[0]}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors truncate">
                        {w.name}
                      </div>
                      <div className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                        {w.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* ── 3. VOICE ORB & CONVERSATION MODE ──────────────────────────── */
          <>
            {/* Center: Glowing Animated Arc Orb */}
            <div className="flex flex-col items-center justify-center py-1">
              <div 
                onClick={startVoiceCapture}
                className="relative w-22 h-22 flex items-center justify-center cursor-pointer group"
                title="Tap to Speak with JASPER"
              >
                {/* Outer Pulsing Rings */}
                <div className={`absolute inset-0 rounded-full border border-cyan-400/30 transition-all duration-500 ${
                  state === 'listening' ? 'scale-125 border-cyan-400 border-2 shadow-[0_0_25px_#00e5ff] animate-ping' :
                  state === 'thinking' ? 'scale-110 border-purple-400 border-2 shadow-[0_0_20px_#a855f7] animate-spin' :
                  state === 'speaking' ? 'scale-120 border-cyan-300 shadow-[0_0_20px_#00e5ff] animate-pulse' : ''
                }`} />

                <div className={`absolute inset-2 rounded-full border border-dashed transition-all duration-500 ${
                  state === 'thinking' ? 'border-purple-400 animate-spin-reverse' : 'border-cyan-500/40'
                }`} />

                {/* Inner Core */}
                <div className={`w-13 h-13 rounded-full flex items-center justify-center transition-all duration-300 ${
                  state === 'listening' ? 'bg-gradient-to-tr from-cyan-500 to-emerald-400 shadow-[0_0_20px_#00e5ff]' :
                  state === 'thinking' ? 'bg-gradient-to-tr from-purple-500 to-pink-500 shadow-[0_0_20px_#a855f7]' :
                  state === 'speaking' ? 'bg-gradient-to-tr from-cyan-400 to-blue-500 shadow-[0_0_20px_#00e5ff]' :
                  'bg-gradient-to-tr from-cyan-800 to-cyan-600 shadow-[0_0_10px_#00e5ff]'
                }`}>
                  <Mic className="w-5 h-5 text-black" />
                </div>
              </div>

              {/* Status Label */}
              <div className="flex items-center gap-2 mt-2.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[11px] font-mono text-cyan-300 uppercase tracking-wider">
                  {state === 'listening' ? 'Listening for command...' :
                   state === 'thinking' ? 'Synthesizing response...' :
                   state === 'speaking' ? 'J.A.S.P.E.R. Speaking...' : 'Ready for directive'}
                </span>
              </div>
            </div>

            {/* Live Conversation Bubbles */}
            {(transcript || response) && (
              <div className="flex flex-col gap-2 max-h-32 overflow-y-auto px-1 text-xs custom-scrollbar">
                {transcript && (
                  <div className="self-end bg-cyan-950/60 border border-cyan-500/40 rounded-2xl rounded-tr-sm px-3.5 py-1.5 text-cyan-200 max-w-[85%] font-mono">
                    <span className="font-semibold text-cyan-400">You: </span>
                    {transcript}
                  </div>
                )}
                {response && (
                  <div className="self-start bg-black/60 border border-white/10 rounded-2xl rounded-tl-sm px-3.5 py-2 text-gray-100 max-w-[90%] leading-relaxed">
                    <div className="flex items-center justify-between text-[10px] text-cyan-400 font-mono mb-1">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        J.A.S.P.E.R.
                      </span>
                      <button onClick={() => speakDeviceAudio(response)}>
                        <Volume2 className="w-3 h-3" />
                      </button>
                    </div>
                    {response}
                  </div>
                )}
              </div>
            )}

            {/* Active Timer Pill if Running */}
            {activeTimer && (
              <div className="flex items-center justify-between bg-amber-500/15 border border-amber-500/40 rounded-xl px-3 py-1.5 text-xs text-amber-300 font-mono">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                  {activeTimer}: {Math.floor(timerSecondsLeft / 60)}:{(timerSecondsLeft % 60).toString().padStart(2, '0')}
                </span>
                <button 
                  onClick={() => {
                    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
                    setActiveTimer(null);
                  }}
                  className="text-red-400 text-[10px] hover:underline"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* ── QUICK WIDGETS TRAY (Horizontally Scrollable) ────────────── */}
            <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400 px-1">
                <span>Integrated Widgets ({ALL_JASPER_WIDGETS.length})</span>
                <button
                  onClick={() => {
                    playJarvisBeep('click');
                    setShowAllWidgetsCatalog(true);
                  }}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-bold"
                >
                  <span>View All Grid</span>
                  <span>→</span>
                </button>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none text-xs">
                {featuredQuickWidgets.map(w => {
                  const IconComp = w.icon;

                  return (
                    <button
                      key={w.id}
                      onClick={() => {
                        playJarvisBeep('click');
                        setActiveWidget(w.id);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border whitespace-nowrap transition-all cursor-pointer shrink-0 bg-white/[0.04] border-white/10 text-slate-300 hover:text-white hover:border-cyan-500/40 hover:bg-cyan-950/20"
                      title={`${w.name}: ${w.desc}`}
                    >
                      <IconComp className={`w-3.5 h-3.5 ${w.color}`} />
                      <span className="font-medium text-[11px]">{w.name}</span>
                    </button>
                  );
                })}

                {/* Quick Tools: 5-Min Timer */}
                <button
                  onClick={() => processCommand('start a 5 minute timer')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-cyan-500/40 text-slate-300 hover:text-white transition-colors shrink-0 cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[11px]">5m Timer</span>
                </button>

                {/* Quick Tools: Flashlight Toggle */}
                <button
                  onClick={toggleFlashlight}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                    isFlashlightOn 
                      ? 'bg-amber-400/25 border-amber-400 text-amber-300' 
                      : 'bg-white/[0.04] border-white/10 text-slate-300 hover:border-cyan-500/40'
                  }`}
                >
                  <Flashlight className="w-3.5 h-3.5 text-yellow-300" />
                  <span className="text-[11px]">{isFlashlightOn ? 'Torch ON' : 'Torch'}</span>
                </button>

                {/* Quick Tools: Battery */}
                {batteryLevel && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 whitespace-nowrap text-slate-300 shrink-0 font-mono text-[11px]">
                    <Battery className="w-3.5 h-3.5 text-green-400" />
                    <span>{batteryLevel.level}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Input & Action Bar */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={stopAll}
                className="p-2.5 rounded-xl bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-colors shrink-0 cursor-pointer"
                title="Stop Speech / Reset"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>

              <form 
                onSubmit={(e) => { e.preventDefault(); processCommand(); }}
                className="flex-1 flex items-center bg-black/60 border border-white/15 focus-within:border-cyan-400 rounded-xl px-3 py-2 transition-colors"
              >
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Ask anything or speak (e.g. 'open weather', 'radar', 'crypto')..."
                  className="flex-1 bg-transparent text-xs text-white placeholder-gray-500 outline-none"
                />
                <button type="submit" className="text-cyan-400 hover:text-cyan-300 p-0.5 cursor-pointer">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>

              <button
                onClick={startVoiceCapture}
                className={`p-2.5 rounded-xl font-bold flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                  state === 'listening'
                    ? 'bg-cyan-400 text-black shadow-[0_0_15px_#00e5ff]'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
                }`}
                title="Tap to Speak"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
