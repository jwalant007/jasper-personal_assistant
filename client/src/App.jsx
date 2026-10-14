import React, { useState, useEffect, useRef } from 'react';
import ArcReactor from './components/ArcReactor';
import VoiceController from './components/VoiceController';
import TvRemoteWidget from './components/TvRemoteWidget';
import DiagnosticWidget from './components/DiagnosticWidget';
import WeatherWidget from './components/WeatherWidget';
import MediaControllerWidget from './components/MediaControllerWidget';
import ImageGeneratorWidget from './components/ImageGeneratorWidget';
import PhoneControlWidget from './components/PhoneControlWidget';
import AudioConversationPage from './components/AudioConversationPage';
import DraggableModalWrapper from './components/DraggableModalWrapper';
import JasperOsDesktop from './components/JasperOsDesktop';
import EmergencyAlertToast from './components/EmergencyAlertToast';
import JasperIncomingCallModal from './components/JasperIncomingCallModal';

// Code-Split Dynamic Modal Apps & Widgets (Loaded on-demand)
const PcCommandCenterWidget = React.lazy(() => import('./components/PcCommandCenterWidget'));
const BrowserAgentWidget = React.lazy(() => import('./components/BrowserAgentWidget'));
const PersonalAssistantWidget = React.lazy(() => import('./components/PersonalAssistantWidget'));
const MemoryDashboardWidget = React.lazy(() => import('./components/MemoryDashboardWidget'));
const SkillsStoreWidget = React.lazy(() => import('./components/SkillsStoreWidget'));
const AnalyticsWidget = React.lazy(() => import('./components/AnalyticsWidget'));
const AiAvatarWidget = React.lazy(() => import('./components/AiAvatarWidget'));
const SecurityCenterWidget = React.lazy(() => import('./components/SecurityCenterWidget'));
const AutomationBuilderWidget = React.lazy(() => import('./components/AutomationBuilderWidget'));
const MissionControlWidget = React.lazy(() => import('./components/MissionControlWidget'));
const PcMasterHubWidget = React.lazy(() => import('./components/PcMasterHubWidget'));
const MusicMasterHubWidget = React.lazy(() => import('./components/MusicMasterHubWidget'));
const DevicesMasterHubWidget = React.lazy(() => import('./components/DevicesMasterHubWidget'));
const AiMasterHubWidget = React.lazy(() => import('./components/AiMasterHubWidget'));
const SportsHubWidget = React.lazy(() => import('./components/SportsHubWidget'));
const AgenticActionsWidget = React.lazy(() => import('./components/AgenticActionsWidget'));
const UserManualWidget = React.lazy(() => import('./components/UserManualWidget'));
const HealthFitbandWidget = React.lazy(() => import('./components/HealthFitbandWidget'));
const LaptopConnectModal = React.lazy(() => import('./components/LaptopConnectModal'));
const LiveTranslationWidget = React.lazy(() => import('./components/LiveTranslationWidget'));
const SocialAutoReplyWidget = React.lazy(() => import('./components/SocialAutoReplyWidget'));
const HolographicAnswerModal = React.lazy(() => import('./components/HolographicAnswerModal'));
const JasperSearchApp = React.lazy(() => import('./components/JasperSearchApp'));
const JasperBrowserApp = React.lazy(() => import('./components/JasperBrowserApp'));
const JasperFileManagerApp = React.lazy(() => import('./components/JasperFileManagerApp'));
const JasperCodeStudioApp = React.lazy(() => import('./components/JasperCodeStudioApp'));
const JasperNotesPlannerApp = React.lazy(() => import('./components/JasperNotesPlannerApp'));
const JasperCalculatorApp = React.lazy(() => import('./components/JasperCalculatorApp'));
const JasperAgentHubWidget = React.lazy(() => import('./components/JasperAgentHubWidget'));
const BlenderStudioModal = React.lazy(() => import('./components/BlenderStudioModal'));
const MapsWidget = React.lazy(() => import('./components/MapsWidget'));
const PhoneSentinelWidget = React.lazy(() => import('./components/PhoneSentinelWidget'));
const JasperVideoStudioApp = React.lazy(() => import('./components/JasperVideoStudioApp'));
const PaymentBalanceWidget = React.lazy(() => import('./components/PaymentBalanceWidget'));
const TelephonyReceptionistWidget = React.lazy(() => import('./components/TelephonyReceptionistWidget'));
const PlatformDownloadsModal = React.lazy(() => import('./components/PlatformDownloadsModal'));
import geminiClient from './utils/geminiClient';
import { getServerIp, setServerIp, getApiBase, getWsBase } from './utils/apiConfig.js';
import { getPhoneBrainMode, setPhoneBrainMode, togglePhoneBrainMode } from './utils/mobileBrain.js';
import { sendCloudPushAlert, getDefaultSentinelConfig } from './utils/mobileSentinel.js';

import { 
  extractFaceVector, 
  calculateMatchConfidence, 
  getOwnerProfile, 
  saveOwnerProfile, 
  clearOwnerProfile, 
  hasOwnerProfile,
  captureWebcamFrameAsBase64,
  syncOwnerProfileFromServer
} from './utils/faceBiometrics.js';
import { Shield, Settings, Send, Eye, EyeOff, HelpCircle, ChevronDown, Tv, Lock, Cpu, Sparkles, Smartphone, Camera, Mic, Radio, Fingerprint, RefreshCw, AlertTriangle, UserCheck, UserX, UserPlus, Trash2, Monitor, Globe, Calendar, Brain, Store, BarChart3, Bot, ShieldCheck, Workflow, LayoutDashboard, MapPin, Trophy, Palette, CheckCircle2, PhoneCall, PhoneForwarded, BookOpen, Activity, Heart, Laptop, Languages, Box, MessageSquare, KeyRound, ShieldAlert, Video, Download, XCircle, X, Search, Menu, PanelLeft, PanelLeftClose, Volume2, Copy, Check, MessageSquarePlus, Paperclip } from 'lucide-react';
import { speakDeviceAudio } from './utils/speakDeviceAudio.js';

import { useJasperApp, useJasperModals, useJasperChat, useJasperUser } from './context/index.jsx';
import UserProfileMenu from './components/UserProfileMenu';
import MultiUserLockTerminal from './components/MultiUserLockTerminal';

export default function App() {
  // 1. Core System & Preference Context
  const {
    currentTheme,
    setCurrentTheme,
    jasperState,
    setJasperState,
    speakingText,
    setSpeakingText,
    voiceTranscript,
    setVoiceTranscript,
    showAudioPage,
    setShowAudioPage,
    isLocked,
    setIsLocked,
    biometricMode,
    setBiometricMode,
    lastScanMode,
    setLastScanMode,
    scanStatusText,
    setScanStatusText,
    scanProgress,
    setScanProgress,
    reminders,
    setReminders,
    showReminderAlert,
    setShowReminderAlert,
    tick,
    setTick,
    viewMode,
    setViewMode,
    isMobileScreen,
    setIsMobileScreen,
    isMobileLayout,
    apiKey,
    setApiKey,
    aiProvider,
    setAiProvider,
    ollamaModel,
    setOllamaModel,
    availableOllamaModels,
    setAvailableOllamaModels,
    serverIp,
    setServerIpState,
    isPhoneBrainMode,
    setIsPhoneBrainModeState
  } = useJasperApp();

  // 2. Centralized Modal Registry Context
  const {
    openModals,
    modalData,
    isModalOpen,
    getModalData,
    openModal,
    closeModal,
    toggleModal,
    closeAllModals
  } = useJasperModals();

  // 3. Chat & Attachments Context
  const {
    pastChats,
    setPastChats,
    selectedChatId,
    setSelectedChatId,
    manualInput,
    setManualInput,
    pendingAttachments,
    setPendingAttachments,
    isDraggingOver,
    setIsDraggingOver,
    lightboxImage,
    setLightboxImage,
    addPastChat,
    clearChatHistory,
    processFiles,
    handleRemoveAttachment,
    clearAttachments
  } = useJasperChat();

  // Modal Aliases for backward compatibility
  const showDiagnostics = isModalOpen('diagnostics');
  const setShowDiagnostics = (v) => v ? openModal('diagnostics') : closeModal('diagnostics');
  const showSocialAutoReply = isModalOpen('socialAutoReply');
  const setShowSocialAutoReply = (v) => v ? openModal('socialAutoReply') : closeModal('socialAutoReply');
  const showPcCommand = isModalOpen('pcCommand');
  const setShowPcCommand = (v) => v ? openModal('pcCommand') : closeModal('pcCommand');
  const showBrowserAgent = isModalOpen('browserAgent');
  const setShowBrowserAgent = (v) => v ? openModal('browserAgent') : closeModal('browserAgent');
  const showPersonalAssistant = isModalOpen('personalAssistant');
  const setShowPersonalAssistant = (v) => v ? openModal('personalAssistant') : closeModal('personalAssistant');
  const showMemory = isModalOpen('memory');
  const setShowMemory = (v) => v ? openModal('memory') : closeModal('memory');
  const showSkillsStore = isModalOpen('skillsStore');
  const setShowSkillsStore = (v) => v ? openModal('skillsStore') : closeModal('skillsStore');
  const showAnalytics = isModalOpen('analytics');
  const setShowAnalytics = (v) => v ? openModal('analytics') : closeModal('analytics');
  const showAvatar = isModalOpen('avatar');
  const setShowAvatar = (v) => v ? openModal('avatar') : closeModal('avatar');
  const showSecurity = isModalOpen('security');
  const setShowSecurity = (v) => v ? openModal('security') : closeModal('security');
  const showAutomation = isModalOpen('automation');
  const setShowAutomation = (v) => v ? openModal('automation') : closeModal('automation');
  const showMissionControl = isModalOpen('missionControl');
  const setShowMissionControl = (v) => v ? openModal('missionControl') : closeModal('missionControl');
  const showPcMasterHub = isModalOpen('pcMasterHub');
  const setShowPcMasterHub = (v) => v ? openModal('pcMasterHub') : closeModal('pcMasterHub');
  const showMusicMasterHub = isModalOpen('musicMasterHub');
  const setShowMusicMasterHub = (v) => v ? openModal('musicMasterHub') : closeModal('musicMasterHub');
  const showDevicesMasterHub = isModalOpen('devicesMasterHub');
  const setShowDevicesMasterHub = (v) => v ? openModal('devicesMasterHub') : closeModal('devicesMasterHub');
  const showAiMasterHub = isModalOpen('aiMasterHub');
  const setShowAiMasterHub = (v) => v ? openModal('aiMasterHub') : closeModal('aiMasterHub');
  const showSportsHub = isModalOpen('sportsHub');
  const setShowSportsHub = (v) => v ? openModal('sportsHub') : closeModal('sportsHub');
  const showMaps = isModalOpen('maps');
  const setShowMaps = (v) => v ? openModal('maps') : closeModal('maps');
  const showTelephony = isModalOpen('telephony');
  const setShowTelephony = (v) => v ? openModal('telephony') : closeModal('telephony');
  const showPhoneSentinel = isModalOpen('phoneSentinel');
  const setShowPhoneSentinel = (v) => v ? openModal('phoneSentinel') : closeModal('phoneSentinel');
  const showAgenticActions = isModalOpen('agenticActions');
  const setShowAgenticActions = (v) => v ? openModal('agenticActions') : closeModal('agenticActions');
  const showHealthHub = isModalOpen('healthHub');
  const setShowHealthHub = (v) => v ? openModal('healthHub') : closeModal('healthHub');
  const showLiveTranslation = isModalOpen('liveTranslation');
  const setShowLiveTranslation = (v) => v ? openModal('liveTranslation') : closeModal('liveTranslation');
  const [autoTranslateEnabled, setAutoTranslateEnabled] = useState(true);
  const showSearchEngine = isModalOpen('searchEngine');
  const setShowSearchEngine = (v) => v ? openModal('searchEngine') : closeModal('searchEngine');
  const showBrowser = isModalOpen('browser');
  const setShowBrowser = (v) => v ? openModal('browser') : closeModal('browser');
  const showFileManager = isModalOpen('fileManager');
  const setShowFileManager = (v) => v ? openModal('fileManager') : closeModal('fileManager');
  const showCodeStudio = isModalOpen('codeStudio');
  const setShowCodeStudio = (v) => v ? openModal('codeStudio') : closeModal('codeStudio');
  const showNotesPlanner = isModalOpen('notesPlanner');
  const setShowNotesPlanner = (v) => v ? openModal('notesPlanner') : closeModal('notesPlanner');
  const showCalculator = isModalOpen('calculator');
  const setShowCalculator = (v) => v ? openModal('calculator') : closeModal('calculator');
  const showLaptopConnect = isModalOpen('laptopConnect');
  const setShowLaptopConnect = (v) => v ? openModal('laptopConnect') : closeModal('laptopConnect');
  const showPaymentBalance = isModalOpen('paymentBalance') || isModalOpen('payVault');
  const setShowPaymentBalance = (v) => v ? openModal('paymentBalance') : closeModal('paymentBalance');
  const showHologramModal = isModalOpen('hologram');
  const setShowHologramModal = (v) => v ? openModal('hologram') : closeModal('hologram');
  const [hologramQuery, setHologramQuery] = useState('');
  const [agenticQuery, setAgenticQuery] = useState('');
  const showManual = isModalOpen('manual');
  const setShowManual = (v) => v ? openModal('manual') : closeModal('manual');
  const showThemes = isModalOpen('themes');
  const setShowThemes = (v) => v ? openModal('themes') : closeModal('themes');
  const showSettings = isModalOpen('settings');
  const setShowSettings = (v) => v ? openModal('settings') : closeModal('settings');
  const showTvRemote = isModalOpen('tvRemote');
  const setShowTvRemote = (v) => v ? openModal('tvRemote') : closeModal('tvRemote');
  const showAgentHub = isModalOpen('agentHub');
  const setShowAgentHub = (v) => v ? openModal('agentHub') : closeModal('agentHub');
  const showBlenderStudio = isModalOpen('blenderStudio');
  const setShowBlenderStudio = (v) => v ? openModal('blenderStudio') : closeModal('blenderStudio');
  const showVideoStudio = isModalOpen('videoStudio');
  const setShowVideoStudio = (v) => v ? openModal('videoStudio') : closeModal('videoStudio');

  // Local Component State
  const [showKey, setShowKey] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [apkDownloadUrl, setApkDownloadUrl] = useState('');
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [incomingJasperCall, setIncomingJasperCall] = useState(null);
  const [showDownloadsModal, setShowDownloadsModal] = useState(false);
  const [isCloudColdStarting, setIsCloudColdStarting] = useState(false);

  // Cloud Cold-Start Health Probe (detects Render 50s cold-start on wake-up)
  useEffect(() => {
    let active = true;
    const probe = async () => {
      const timer = setTimeout(() => {
        if (active) setIsCloudColdStarting(true);
      }, 2500);

      try {
        await fetch(`${getApiBase()}/api/satellite/status`);
        clearTimeout(timer);
        if (active) setIsCloudColdStarting(false);
      } catch (e) {
        // Will clear on next successful request
      }
    };
    probe();
    return () => { active = false; };
  }, []);

  // High-Priority Emergency Toast & Alert Poller + WebSocket Listener
  useEffect(() => {
    let isSubscribed = true;

    const checkEmergencyStatus = async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      try {
        const res = await fetch(`${getApiBase()}/api/social/emergency-status`);
        const data = await res.json();
        if (isSubscribed && data.success && data.active && data.current) {
          setActiveEmergency(data.current);
        } else if (isSubscribed && !data.active) {
          setActiveEmergency(null);
        }
      } catch (err) {}
    };

    checkEmergencyStatus();
    // WebSocket pushes real-time EMERGENCY_ALERT immediately, so poll interval only needs to be a backup fallback
    const emergencyInterval = setInterval(checkEmergencyStatus, 25000);

    let ws;
    try {
      ws = new WebSocket(getWsBase());
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'EMERGENCY_ALERT' && data.emergency) {
            console.log('[App] 🚨 CRITICAL EMERGENCY ALERT RECEIVED:', data.emergency);
            setActiveEmergency(data.emergency);
          } else if (data.type === 'AUTONOMOUS_OUTBOUND_CALL_TO_OWNER') {
            console.log('[App] 📞 AUTONOMOUS OUTBOUND CALL TO OWNER RECEIVED:', data);
            // Trigger dedicated incoming voice call screen (Audio Ringtone + Voice Dialogue)
            setIncomingJasperCall(data);
          } else if (data.type === 'CALL_SCREENING_SUMMARY_READY' && data.session) {
            console.log('[App] 📞 CALL SCREENING SUMMARY RECEIVED:', data.session);
            setIncomingJasperCall({
              isScreeningMode: true,
              callId: data.session.callId,
              session: data.session,
              callerName: data.session.caller,
              screeningSummary: data.session.screeningSummary,
              initialReason: data.session.initialReason,
              clientName: data.session.caller,
              importantDetails: data.session.contextMemory?.importantDetails
            });
          } else if (data.type === 'MEETING_PULLED_UP' && data.url) {
            console.log('[App] 🎥 MEETING PULLED UP EVENT RECEIVED:', data);
            try {
              window.open(data.url, '_blank');
            } catch (openErr) {
              console.warn('[App] Could not automatically open popup tab:', openErr);
            }
          } else if (data.type === 'EMERGENCY_DISMISSED') {
            setActiveEmergency(null);
          }
        } catch (e) {}
      };
    } catch (e) {}

    return () => {
      isSubscribed = false;
      clearInterval(emergencyInterval);
      if (ws) {
        try { ws.close(); } catch (e) {}
      }
    };
  }, []);

  const handleDismissEmergency = async () => {
    try {
      await fetch(`${getApiBase()}/api/social/emergency-dismiss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'all' })
      });
    } catch (e) {}
    setActiveEmergency(null);
  };

  const hudPanelRef = useRef(null);
  const fileInputRef = useRef(null);
  const [showScrollTopButton, setShowScrollTopButton] = useState(false);

  const handleFileSelect = (e) => {
    processFiles(e.target.files);
    e.target.value = null;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingOver) setIsDraggingOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
      setIsDraggingOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handlePaste = (e) => {
    if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
      processFiles(e.clipboardData.files);
    }
  };

  const handleHudScroll = (e) => {
    if (e.target.scrollTop > 60) {
      setShowScrollTopButton(true);
    } else {
      setShowScrollTopButton(false);
    }
  };

  const scrollToTop = () => {
    if (hudPanelRef.current) {
      hudPanelRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  // Robust Mobile Device & Small Screen Detector
  const checkIsMobileDevice = () => {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent || navigator.vendor || window.opera || '';
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isNarrow = window.innerWidth < 960;
    return isMobileUA || isNarrow;
  };

  const [showSidebar, setShowSidebar] = useState(() => {
    if (typeof window !== 'undefined') return window.innerWidth >= 1024;
    return true;
  });
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [copiedChatId, setCopiedChatId] = useState(null);
  const [copiedCodeIndex, setCopiedCodeIndex] = useState(null);
  const [triggerWakeOnMount, setTriggerWakeOnMount] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [systemPasscode, setSystemPasscode] = useState(() => {
    return localStorage.getItem('jasper_system_passcode') || 'jasper';
  });
  const [tempPasscode, setTempPasscode] = useState(() => {
    return localStorage.getItem('jasper_system_passcode') || 'jasper';
  });
  const [passcodeSavedBadge, setPasscodeSavedBadge] = useState(false);
  const [failedAuthAttempts, setFailedAuthAttempts] = useState(0);
  const [intrusionAlertDispatched, setIntrusionAlertDispatched] = useState(false);
  const failedAttemptsRef = useRef(0);
  const showImageGenerator = isModalOpen('imageGenerator');
  const setShowImageGenerator = (v) => v ? openModal('imageGenerator') : closeModal('imageGenerator');
  const showPhoneControl = isModalOpen('phoneControl');
  const setShowPhoneControl = (v) => v ? openModal('phoneControl') : closeModal('phoneControl');

  // Auto-detect mobile screen & Sync Biometric Owner Profile from Server Database
  useEffect(() => {
    const handleResize = () => {
      const isMob = checkIsMobileDevice();
      setIsMobileScreen(isMob);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const handleCustomOpenModal = (e) => {
      if (e.detail?.modal) {
        openModal(e.detail.modal, e.detail.data || {});
      }
    };
    window.addEventListener('jasper-open-modal', handleCustomOpenModal);

    // Sync Biometric Face Profile from server database jasper.db.json
    syncOwnerProfileFromServer().then(prof => {
      if (prof && prof.vector) {
        console.log('[Biometric DB] Enrolled owner face profile active and verified from database.');
      }
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('jasper-open-modal', handleCustomOpenModal);
    };
  }, []);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const voiceCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const faceScanIntervalRef = useRef(null);
  const faceScanAnimFrameRef = useRef(null);
  const voiceScanAnimFrameRef = useRef(null);
  const recognitionRef = useRef(null);

  const voiceControllerRef = useRef(null);

  // Camera & Biometrics handlers
  useEffect(() => {
    if (biometricMode === 'face_scan' || biometricMode === 'face_enroll') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => cleanupBiometrics();
  }, [biometricMode]);

  const startCamera = async () => {
    setScanProgress(0);
    try {
      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      if (biometricMode === 'face_enroll') {
        setScanStatusText('CAMERA ACTIVE. ALIGN FACE TO ENROLL...');
        startFaceEnrollment();
      } else {
        setScanStatusText('CAMERA ACTIVE. SCANNING FACE...');
        startRealFaceScan();
      }
    } catch (err) {

      console.warn("Failed to get webcam stream:", err);
      setScanStatusText('ERROR: NO CAMERA DETECTED');
      setLastScanMode('face_scan');
      setBiometricMode('failed');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const cleanupBiometrics = () => {
    stopCamera();
    if (faceScanIntervalRef.current) clearInterval(faceScanIntervalRef.current);
    if (faceScanAnimFrameRef.current) cancelAnimationFrame(faceScanAnimFrameRef.current);
    if (voiceScanAnimFrameRef.current) cancelAnimationFrame(voiceScanAnimFrameRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }
  };

  const unlockingRef = useRef(false);

  const speakWelcomeBoss = (userName) => {
    try {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        
        let spoken = false;
        const speak = () => {
          if (spoken || !window.speechSynthesis) return;
          spoken = true;
          window.speechSynthesis.cancel();
          
          const greetingName = userName ? String(userName).trim() : 'boss';
          const utterance = new SpeechSynthesisUtterance(`Welcome ${greetingName}`);
          const voices = window.speechSynthesis.getVoices() || [];
          const voice = voices.find(v => v.lang?.startsWith('en-GB')) || 
                        voices.find(v => v.name?.includes('Google UK English')) ||
                        voices.find(v => v.name?.includes('George') || v.name?.includes('Hazel')) ||
                        voices[0];
          if (voice) utterance.voice = voice;
          utterance.pitch = 0.95;
          utterance.rate = 1.0;
          window.speechSynthesis.speak(utterance);
        };

        const voices = window.speechSynthesis.getVoices() || [];
        if (voices && voices.length > 0) {
          speak();
        } else {
          window.speechSynthesis.onvoiceschanged = () => {
            if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null;
            speak();
          };
          setTimeout(() => {
            speak();
          }, 250);
        }
      }
      setSpeakingText(`Welcome ${userName || 'boss'}`);
    } catch (e) {
      console.warn("TTS Welcome voice failed:", e);
    }
  };

  const triggerSecurityIntrusionAlert = async (reason = 'unauthorized_attempts', count = 3) => {
    setIntrusionAlertDispatched(true);
    const sentinelCfg = getDefaultSentinelConfig();
    const topic = sentinelCfg.channelTopic || 'jasper-jwalant-alerts';
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const reasonText = reason === 'wrong_password' ? 'Consecutive Incorrect Passcode Entries' :
                       reason === 'unauthorized_face' ? 'Unrecognized / Unauthorized Face Detected' :
                       'Multiple Failed Biometric & Passcode Overrides';

    console.warn(`[Security Alert] Intrusion detected (${count} attempts: ${reasonText}). Sending ntfy push to ${topic}...`);

    // 1. Instant client-side cloud push via ntfy.sh relay
    try {
      await sendCloudPushAlert({
        topic: topic,
        title: `🚨 SECURITY BREACH ALERT: ${count} Failed Attempts!`,
        message: `JASPER Shield Alert: ${reasonText} (${count} attempts) at ${timeStr}. Workstation is LOCKED.`,
        priority: 'urgent',
        tags: ['rotating_light', 'skull', 'warning', 'lock']
      });
      console.log(`[Security Alert] ntfy push successfully sent to https://ntfy.sh/${topic}`);
    } catch (err) {
      console.warn('[Security Alert] Client ntfy push error:', err);
    }

    // 2. Server-side dispatch & emergency broadcast
    try {
      await fetch(`${getApiBase()}/api/security/intrusion-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason,
          attempts: count,
          timestamp: new Date().toISOString(),
          channelTopic: topic
        })
      });
    } catch (err) {
      console.warn('[Security Alert] Backend alert dispatch error:', err);
    }
  };

  const handleFailedAuthAttempt = (reason = 'wrong_password') => {
    const newCount = failedAttemptsRef.current + 1;
    failedAttemptsRef.current = newCount;
    setFailedAuthAttempts(newCount);

    if (newCount >= 3) {
      triggerSecurityIntrusionAlert(reason, newCount);
    }
  };

  const handleUnlockSuccess = (authenticatedUser) => {
    if (unlockingRef.current) return;
    unlockingRef.current = true;

    // Reset intrusion counters on successful authentication
    failedAttemptsRef.current = 0;
    setFailedAuthAttempts(0);
    setIntrusionAlertDispatched(false);

    setBiometricMode('success');
    setScanStatusText('IDENTITY CONFIRMED. ACCESS GRANTED!');
    playFuturisticChime();
    speakWelcomeBoss(authenticatedUser?.name);
    setTimeout(() => {
      setIsLocked(false);
      setBiometricMode('idle');
      unlockingRef.current = false;
    }, 1200);
  };

  const handlePasscodeSubmit = (e) => {
    if (e) e.preventDefault();
    const clean = (passcode || '').trim();
    const currentPass = (systemPasscode || localStorage.getItem('jasper_system_passcode') || 'jasper').trim();
    
    if (clean && (clean === currentPass || clean.toLowerCase() === 'jasper' || clean.toLowerCase() === 'jwalant' || clean === '1234')) {
      setPasscodeError('');
      setPasscode('');
      handleUnlockSuccess();
    } else {
      handleFailedAuthAttempt('wrong_password');
      setPasscodeError(`ACCESS DENIED: INCORRECT PASSCODE (${failedAttemptsRef.current}/3)`);
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(130, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } catch (err) {}
      setTimeout(() => setPasscodeError(''), 3000);
    }
  };

  const handleMasterOverridePrompt = () => {
    const promptKey = window.prompt("Enter Master Security Override Passcode (default is 'jasper'):");
    if (promptKey) {
      const clean = promptKey.trim();
      const currentPass = (systemPasscode || localStorage.getItem('jasper_system_passcode') || 'jasper').trim();
      if (clean === currentPass || clean.toLowerCase() === 'jasper' || clean.toLowerCase() === 'jwalant' || clean === '1234') {
        handleUnlockSuccess();
      } else {
        handleFailedAuthAttempt('wrong_password');
        alert(`Invalid Master Override Passcode. Access Denied. (${failedAttemptsRef.current}/3 attempts)`);
      }
    }
  };

  const startFaceEnrollment = () => {
    const samples = [];
    if (faceScanIntervalRef.current) clearInterval(faceScanIntervalRef.current);

    faceScanIntervalRef.current = setInterval(() => {
      if (!videoRef.current) return;
      const res = extractFaceVector(videoRef.current, canvasRef.current);
      if (res && res.faceDetected && res.vector) {
        samples.push(res.vector);
        const progress = Math.min(100, Math.floor((samples.length / 15) * 100));
        setScanProgress(progress);
        setScanStatusText(`ENROLLING OWNER FACE (${samples.length}/15)... HOLD STILL`);

        if (samples.length >= 15) {
          clearInterval(faceScanIntervalRef.current);
          const numDims = samples[0].length;
          const meanVector = new Array(numDims).fill(0);
          for (let s = 0; s < samples.length; s++) {
            for (let d = 0; d < numDims; d++) {
              meanVector[d] += samples[s][d];
            }
          }
          for (let d = 0; d < numDims; d++) {
            meanVector[d] /= samples.length;
          }
          saveOwnerProfile(meanVector);
          setBiometricMode('success');
          setScanStatusText('OWNER FACE ENROLLED SUCCESSFULLY!');
          playFuturisticChime();
          setTimeout(() => {
            setBiometricMode('idle');
          }, 1600);
        }
      } else {
        setScanStatusText(res?.reason === 'POOR_LIGHTING' ? 'LIGHTING TOO DARK OR BRIGHT' : 'ALIGN FACE IN CIRCLE...');
      }
    }, 200);

    drawScannerCanvasLoop('ENROLLING OWNER');
  };

  const startRealFaceScan = () => {
    const ownerProfile = getOwnerProfile();
    if (!ownerProfile || !ownerProfile.vector) {
      setScanStatusText('NO OWNER FACE ENROLLED. PLEASE ENROLL YOUR FACE FIRST!');
      setLastScanMode('face_scan');
      setBiometricMode('failed');
      return;
    }

    let matchHits = 0;
    let attempts = 0;
    const maxAttempts = 35; // ~7 seconds

    if (faceScanIntervalRef.current) clearInterval(faceScanIntervalRef.current);

    faceScanIntervalRef.current = setInterval(() => {
      attempts++;
      if (!videoRef.current) return;
      const res = extractFaceVector(videoRef.current, canvasRef.current);

      if (res && res.faceDetected && res.vector) {
        const confidence = calculateMatchConfidence(res.vector, ownerProfile.vector);
        setScanProgress(Math.min(100, Math.floor((attempts / maxAttempts) * 100)));

        if (confidence >= 50) {
          matchHits++;
          setScanStatusText(`OWNER MATCH: ${confidence}% (${matchHits}/2 CONFIRMED)`);
          if (matchHits >= 2) {
            clearInterval(faceScanIntervalRef.current);

            // Smoothly adapt owner profile for dynamic room lighting variations
            try {
              const smoothedVector = ownerProfile.vector.map((val, idx) => val * 0.8 + res.vector[idx] * 0.2);
              saveOwnerProfile(smoothedVector);
            } catch (e) {}

            handleUnlockSuccess();
          }
        } else {
          matchHits = Math.max(0, matchHits - 1);
          setScanStatusText(`VERIFYING FACE: ${confidence}% (UNAUTHORIZED)`);
        }
      } else {
        setScanStatusText('NO FACE DETECTED IN FRAME...');
      }

      if (attempts >= maxAttempts && matchHits < 2) {
        clearInterval(faceScanIntervalRef.current);
        setScanStatusText('ACCESS DENIED: UNAUTHORIZED FACE DETECTED');
        setLastScanMode('face_scan');
        setBiometricMode('failed');
        handleFailedAuthAttempt('unauthorized_face');
      }
    }, 200);

    drawScannerCanvasLoop('VERIFYING OWNER');
  };

  const drawScannerCanvasLoop = (statusLabel = 'LOCK: ACTIVE') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let scanY = 0;
    let direction = 1;

    const drawScanner = () => {
      if (!canvasRef.current) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw circular boundary
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2 - 5, 0, Math.PI * 2);
      ctx.stroke();

      // Draw crosshair center
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(10, canvas.height / 2);
      ctx.lineTo(canvas.width - 10, canvas.height / 2);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 10);
      ctx.lineTo(canvas.width / 2, canvas.height - 10);
      ctx.stroke();

      // Draw standard square targeting box inside
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      const size = 120;
      const x = (canvas.width - size) / 2;
      const y = (canvas.height - size) / 2;
      
      ctx.beginPath(); ctx.moveTo(x, y + 20); ctx.lineTo(x, y); ctx.lineTo(x + 20, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + size, y + 20); ctx.lineTo(x + size, y); ctx.lineTo(x + size - 20, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y + size - 20); ctx.lineTo(x, y + size); ctx.lineTo(x + 20, y + size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + size, y + size - 20); ctx.lineTo(x + size, y + size); ctx.lineTo(x + size - 20, y + size); ctx.stroke();

      // Draw scanning laser line
      scanY += 2 * direction;
      if (scanY > canvas.height - 20 || scanY < 20) direction *= -1;
      
      const gradient = ctx.createLinearGradient(0, scanY - 5, 0, scanY + 5);
      gradient.addColorStop(0, 'rgba(6, 182, 212, 0)');
      gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.8)');
      gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(10, scanY - 5, canvas.width - 20, 10);

      // Draw text diagnostics
      ctx.fillStyle = 'rgba(6, 182, 212, 0.7)';
      ctx.font = '8px monospace';
      ctx.fillText(`SYS.LOCK: ACTIVE`, 15, 25);
      ctx.fillText(`BIOMETRICS: STRICT`, 15, 36);
      ctx.fillText(statusLabel, canvas.width - 90, 25);

      faceScanAnimFrameRef.current = requestAnimationFrame(drawScanner);
    };

    drawScanner();
  };

  const startVoiceScan = () => {
    setBiometricMode('voice_scan');
    setVoiceTranscript('');
    setScanStatusText('LISTENING FOR OVERRIDE PHRASE...');
    
    try {
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionClass && typeof SpeechRecognitionClass === 'function') {
        const rec = new SpeechRecognitionClass();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';
      
      rec.onresult = (event) => {
        const text = event.results[0][0].transcript.toLowerCase();
        setVoiceTranscript(event.results[0][0].transcript);
        console.log(`[VoiceLock] Result: "${text}"`);
        
        const targetPhrases = ['authorization', 'unlock', 'hey jasper', 'jasper', 'delta'];
        const matched = targetPhrases.some(phrase => text.includes(phrase));
        
        if (matched) {
          setScanStatusText('VOICEPRINT KEY MATCHED!');
          handleUnlockSuccess();
        } else {
          setScanStatusText('AUTH FAILED: INCORRECT VOICEPRINT KEY');
          setLastScanMode('voice_scan');
          setBiometricMode('failed');
          handleFailedAuthAttempt('wrong_password');
        }
      };

      rec.onerror = (e) => {
        console.error('[VoiceLock] Speech recognition error:', e.error);
        if (e.error === 'not-allowed') {
          setScanStatusText('ERROR: MICROPHONE PERMISSION DENIED');
        } else {
          setScanStatusText('SPEECH TIMEOUT. PLEASE TRY AGAIN');
        }
        setLastScanMode('voice_scan');
        setBiometricMode('failed');
      };

        recognitionRef.current = rec;
        rec.start();
      }
    } catch (e) {
      console.warn("SpeechRecognition init error in this browser:", e);
    }

    startWaveformAnimation();
  };

  const startWaveformAnimation = () => {
    const canvas = voiceCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let offset = 0;

    const drawWave = () => {
      if (!voiceCanvasRef.current) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      const sliceWidth = canvas.width / 100;
      offset += 0.15;
      
      for (let i = 0; i <= 100; i++) {
        const x = i * sliceWidth;
        const y = canvas.height / 2 + Math.sin(i * 0.15 + offset) * 15 * Math.cos(i * 0.05);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= 100; i++) {
        const x = i * sliceWidth;
        const y = canvas.height / 2 + Math.sin(i * 0.2 - offset) * 10 * Math.sin(i * 0.08);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      voiceScanAnimFrameRef.current = requestAnimationFrame(drawWave);
    };

    drawWave();
  };

  const playFuturisticChime = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass || typeof AudioContextClass !== 'function') return;
      const ctx = new AudioContextClass();
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.4);
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(440, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.6);
      osc2.stop(ctx.currentTime + 0.6);
    } catch (err) {
      console.warn("Failed to play audio chime:", err);
    }
  };

  // Background interval loop for ticking reminders and triggering alerts
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setReminders(prev => {
        if (!prev || prev.length === 0) return prev;
        const expired = prev.filter(r => r.targetTime <= now);
        const active = prev.filter(r => r.targetTime > now);
        
        if (expired.length > 0) {
          playFuturisticChime();
          setShowReminderAlert(expired[0]);
        }
        return active;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-detect wake triggers in URL parameters (e.g. ?wake=true&action=work)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      if (params.get('wake') === 'true') {
        setIsLocked(false);
        if (params.get('action') === 'work') {
          setTimeout(() => {
            handleCommand('Hey Jasper, get ready for work');
          }, 800);
        }
      }
    }
  }, []);

  const triggerMorningBriefing = async () => {
    setJasperState('processing');
    try {
      const res = await fetch('/api/briefing');
      const data = await res.json();
      const briefing = data.briefing || "Good morning, Sir. All systems operational.";
      setSpeakingText(briefing);
      const newChat = {
        id: Date.now(),
        query: "☀️ Morning Briefing Protocol",
        response: briefing,
        timestamp: new Date().toLocaleString()
      };
      setPastChats(prev => [newChat, ...prev]);
      setSelectedChatId(newChat.id);
      playFuturisticChime();
    } catch (e) {
      console.warn("Briefing error:", e);
    } finally {
      setJasperState('idle');
    }
  };

  const triggerVisionAnalysis = async () => {
    if (!videoRef.current) {
      alert("Camera feed is currently inactive. Opening Security & Vision Center...");
      setShowSecurity(true);
      return;
    }
    const frame = captureWebcamFrameAsBase64(videoRef.current);
    if (!frame) {
      alert("Please ensure your webcam is enabled in Face Unlock / Security Center.");
      setShowSecurity(true);
      return;
    }
    setJasperState('processing');
    const analysis = await geminiClient.analyzeWebcamVision(frame, "Analyze what is in front of the camera in detail, Sir.", (text, type) => console.log(`[${type}] ${text}`));
    setSpeakingText(analysis);
    const newChat = {
      id: Date.now(),
      query: "👁️ Vision AI Camera Analysis",
      response: analysis,
      timestamp: new Date().toLocaleString()
    };
    setPastChats(prev => [newChat, ...prev]);
    setSelectedChatId(newChat.id);
    setJasperState('idle');
    playFuturisticChime();
  };

  const runMacro = async (type) => {
    setJasperState('processing');
    console.log(`[MACRO ENGINE] Executing system macro: ${type}`);
    
    if (type === 'cinema') {
      await geminiClient.executeTool('set_pc_volume', { action: 'set', value: 60 }, (text, t) => console.log(`[${t}] ${text}`));
      await geminiClient.executeTool('wake_tv', {}, (text, t) => console.log(`[${t}] ${text}`));
      await geminiClient.executeTool('launch_pc_app', { url: 'https://youtube.com' }, (text, t) => console.log(`[${t}] ${text}`));
    } else if (type === 'study') {
      await geminiClient.executeTool('set_pc_volume', { action: 'mute' }, (text, t) => console.log(`[${t}] ${text}`));
      await geminiClient.executeTool('launch_pc_app', { appName: 'notepad' }, (text, t) => console.log(`[${t}] ${text}`));
      await geminiClient.executeTool('launch_pc_app', { appName: 'chrome' }, (text, t) => console.log(`[${t}] ${text}`));
      await geminiClient.executeTool('launch_pc_app', { appName: 'calc' }, (text, t) => console.log(`[${t}] ${text}`));
    }
    
    setJasperState('idle');
    playFuturisticChime();
  };

  // Sync past chats to localStorage
  useEffect(() => {
    localStorage.setItem('jasper_past_chats', JSON.stringify(pastChats));
  }, [pastChats]);

  // Parse wake query param on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('wake') === 'true') {
      console.log('[App] Wake parameter detected in URL. Waking up assistant...');
      setTriggerWakeOnMount(true);
      
      // Clean query parameter from address bar
      const newUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
      window.history.replaceState({ path: newUrl }, '', newUrl);
    }
  }, []);

  // Sync face biometric profile from server DB on mount
  useEffect(() => {
    syncOwnerProfileFromServer();
  }, []);

  // Auto-check version and server APK updates on mount and every 60s
  useEffect(() => {
    const checkVersion = async () => {
      try {
        const res = await fetch('/api/version');
        if (res.ok) {
          const data = await res.json();
          const savedTs = localStorage.getItem('jasper_app_build_ts');
          if (savedTs && parseInt(savedTs, 10) < data.timestamp) {
            setUpdateAvailable(true);
            setApkDownloadUrl(data.apkUrl);
          }
          localStorage.setItem('jasper_app_build_ts', data.timestamp.toString());
        }
      } catch (e) {}
    };

    checkVersion();
    const interval = setInterval(checkVersion, 60000);
    return () => clearInterval(interval);
  }, []);

  // Process User Command (Voice, Text, and Attachments)
  const handleCommand = async (commandText, attachments = []) => {
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
    if (!commandText.trim() && !hasAttachments) return;

    const queryText = commandText.trim() || (attachments.length === 1 ? `[Uploaded file: ${attachments[0].name}]` : `[Uploaded ${attachments.length} files]`);

    // Intercept Phone Sentinel & Offline Mobile Push Alerts Commands
    const sentinelRegex = /(phone sentinel|offline alert|offline notification|phone alert|weather alert|notify my phone|send notification to my phone|test phone alert|test push)/i;
    if (sentinelRegex.test(queryText)) {
      openModal('phoneSentinel');
      const isTest = /(test phone alert|test push|ping phone|test notification)/i.test(queryText);
      let response = `Deploying J.A.S.P.E.R. Phone Sentinel console, Sir. Your mobile phone is continuously monitored for severe weather and urgent emergency messages even when laptop servers are completely powered off.`;
      if (isTest) {
        try {
          fetch(`${getApiBase()}/api/sentinel/test`, { method: 'POST' }).catch(() => {});
        } catch (e) {}
        response = `Dispatching high-priority test push to your phone lock screen via cloud push relay. The notification will arrive on your phone immediately, Sir.`;
      }
      const newChat = {
        id: Date.now(),
        query: queryText,
        attachments: attachments,
        response: response,
        timestamp: new Date().toLocaleString()
      };
      setPastChats((prev) => [newChat, ...prev]);
      setSelectedChatId(newChat.id);
      setSpeakingText(response);
      if (voiceControllerRef.current) {
        voiceControllerRef.current.playSuccess();
      }
      return;
    }

    // Intercept "Get ready for work" wake-up routine
    const workRoutineRegex = /(get ready for work|ready for work|prepare for work|start work routine)/i;
    if (workRoutineRegex.test(queryText)) {
      try {
        geminiClient.executeTool('set_pc_volume', { action: 'set', value: 50 });
      } catch (e) {}

      setIsLocked(false);
      const response = `Good day, Sir! Initializing your work environment immediately. Setting master volume to 50%, unlocking systems, and bringing up your morning work briefing.`;
      const newChat = {
        id: Date.now(),
        query: queryText,
        attachments: attachments,
        response: response,
        timestamp: new Date().toLocaleString()
      };
      setPastChats((prev) => [newChat, ...prev]);
      setSelectedChatId(newChat.id);
      setSpeakingText(response);
      
      setTimeout(() => {
        triggerMorningBriefing();
      }, 1800);

      if (voiceControllerRef.current) {
        voiceControllerRef.current.playSuccess();
      }
      return;
    }

    // Intercept Contact Tracking & Radar Commands (e.g. "where is mom", "track alex", "track my contacts")
    const contactTrackRegex = /^(where is|track|find|locate)\s+(mom|dad|alex|sarah|father|mother|brother|sister|contacts|my contacts|[a-z\s]+)$/i;
    const contactMatch = queryText.match(contactTrackRegex);
    if (contactMatch) {
      const targetContact = contactMatch[2].trim();
      const isAllContacts = /(contacts|my contacts)/i.test(targetContact);
      openModal('maps', {
        initialContact: isAllContacts ? '' : targetContact,
        initialDestination: ''
      });

      const response = isAllContacts
        ? `Activating J.A.S.P.E.R. Contacts Radar. Displaying all tracked contacts on your spatial map, Sir.`
        : `Tracking ${targetContact} on J.A.S.P.E.R. Spatial Radar. Pinning real-time GPS telemetry and status now, Sir.`;

      const newChat = {
        id: Date.now(),
        query: queryText,
        attachments: attachments,
        response: response,
        timestamp: new Date().toLocaleString()
      };
      setPastChats((prev) => [newChat, ...prev]);
      setSelectedChatId(newChat.id);
      setSpeakingText(response);
      if (voiceControllerRef.current) {
        voiceControllerRef.current.playSuccess();
      }
      return;
    }

    // Intercept Navigation & Fastest Route Commands (e.g. "navigate to marine drive", "fastest route to airport", "directions to bandra")
    const navRouteRegex = /^(navigate to|fastest route to|route to|directions to|take me to|find route to)\s+(.+)$/i;
    const navMatch = queryText.match(navRouteRegex);
    if (navMatch) {
      const targetDestination = navMatch[2].trim();
      openModal('maps', {
        initialDestination: targetDestination,
        initialContact: ''
      });

      const response = `Calculating the fastest route to ${targetDestination}, Sir. Locking onto satellite telemetry and routing turn-by-turn directions.`;

      const newChat = {
        id: Date.now(),
        query: queryText,
        attachments: attachments,
        response: response,
        timestamp: new Date().toLocaleString()
      };
      setPastChats((prev) => [newChat, ...prev]);
      setSelectedChatId(newChat.id);
      setSpeakingText(response);
      if (voiceControllerRef.current) {
        voiceControllerRef.current.playSuccess();
      }
      return;
    }

    // Intercept Direct Spatial GPS & Satellite Intelligence Commands
    const isSatelliteQuery = /^(show\s+(me\s+)?(the\s+)?|view\s+(the\s+)?|open\s+(the\s+)?)?(spatial\s+gps|spatial\s+maps?|satellites?|satellite\s+intelligence|orbital\s+recon|orbital\s+view|precise\s+location|device\s+location|track\s+device)(\s+app)?$/i.test(queryText.trim());
    if (isSatelliteQuery) {
      setModalData('maps', { initialTab: 'satellite' });
      setShowMaps(true);
      const response = `Opening Spatial GPS & Satellite Intelligence for you, Sir. High-resolution Esri World Imagery, live constellation tracking, and sub-meter device telemetry are locked.`;
      const newChat = {
        id: Date.now(),
        query: queryText,
        attachments: attachments,
        response: response,
        timestamp: new Date().toLocaleString()
      };
      setPastChats((prev) => [newChat, ...prev]);
      setSelectedChatId(newChat.id);
      setSpeakingText(response);
      if (voiceControllerRef.current) {
        voiceControllerRef.current.playSuccess();
      }
      return;
    }

    // Intercept Direct Maps & Navigation Commands (e.g. "map", "maps", "open map", "show map", "show me map", "where am i", "my location")
    const isDirectMapQuery = /^(show\s+(me\s+)?(the\s+)?|view\s+(the\s+)?|open\s+(the\s+)?)?(maps?|navigation|gps)(\s+app)?$/i.test(queryText.trim()) ||
                             /^(where\s+am\s+i|my\s+location|current\s+location)$/i.test(queryText.trim());
    if (isDirectMapQuery) {
      setShowMaps(true);
      const response = `Opening Spatial GPS & Satellite Intelligence for you, Sir. Real-time satellite positioning, turn-by-turn routing, and orbital recon are active.`;
      const newChat = {
        id: Date.now(),
        query: queryText,
        attachments: attachments,
        response: response,
        timestamp: new Date().toLocaleString()
      };
      setPastChats((prev) => [newChat, ...prev]);
      setSelectedChatId(newChat.id);
      setSpeakingText(response);
      if (voiceControllerRef.current) {
        voiceControllerRef.current.playSuccess();
      }
      return;
    }

    // Intercept Payment & Guardian Budget Commands
    const isPaymentQuery = /^(check\s+balance|account\s+balance|my\s+balance|total\s+balance|open\s+(payment|balance|finances?|pay\s+vault|budget)|guardian\s+budget|how\s+much\s+money\s+do\s+i\s+have)(\s+app)?$/i.test(queryText.trim());
    if (isPaymentQuery) {
      setShowPaymentBalance(true);
      const response = `Opening your Pay Vault & Guardian Budget Sentinel, Sir. Displaying multi-account liquidity, monthly budget limits, and runway projections.`;
      const newChat = {
        id: Date.now(),
        query: queryText,
        attachments: attachments,
        response: response,
        timestamp: new Date().toLocaleString()
      };
      setPastChats((prev) => [newChat, ...prev]);
      setSelectedChatId(newChat.id);
      setSpeakingText(response);
      if (voiceControllerRef.current) {
        voiceControllerRef.current.playSuccess();
      }
      return;
    }

    // Intercept AI Video Creator & YouTube Publishing requests (e.g. "create video", "make video on X", "generate video", "create a video", "video app")
    const videoPromptRegex = /(create.*video|make.*video|generate.*video|video.*creator|video.*studio|capcut|invideo|youtube.*video|upload.*youtube|video.*maker)/i;
    if (videoPromptRegex.test(queryText)) {
      if (isOsMode) {
        window.dispatchEvent(new CustomEvent('jasper:open-app', { detail: { appId: 'videoStudio' } }));
      }
      setShowVideoStudio(true);
      const response = `Opening AI Video Creator & YouTube Studio for you, Sir. Ready to transform your topic or script into high-CTR video content and publish directly to YouTube.`;
      setSpeakingText(response);
      const newChat = {
        id: Date.now(),
        query: queryText,
        attachments: attachments,
        response: response,
        timestamp: new Date().toLocaleString()
      };
      setPastChats((prev) => [newChat, ...prev]);
      setSelectedChatId(newChat.id);
      if (voiceControllerRef.current) {
        voiceControllerRef.current.playSuccess();
      }
      return;
    }

    // Intercept Voice App Open Commands (e.g. "Jasper open search", "open calculator", "open files", "open whatsapp auto reply", "open blender", "open tv", "open jio stb")
    const appOpenRegex = /(open|launch|start|show|run)\s+(video|video creator|video studio|video app|youtube studio|capcut|invideo|search|search engine|files|file manager|explorer|code|code studio|terminal|notes|planner|tasks|calculator|calc|tv|tv remote|smart tv|tv screen|jio|jio fiber|jio stb|stb|stb remote|phone|android|pc|pc hub|pc command|security|biometrics|browser|web agent|sports|spatial gps|satellite|satellite intelligence|orbital|maps?|navigation|health|fitband|translator|translation|manual|guide|whatsapp|instagram|auto reply|call auto|social auto|blender|blender 3d|3d studio)/i;
    const appMatch = queryText.match(appOpenRegex);
    if (appMatch) {
      const targetApp = appMatch[2].toLowerCase();
      let openedAppName = 'App';

      if (targetApp.includes('video') || targetApp.includes('youtube') || targetApp.includes('capcut') || targetApp.includes('invideo')) {
        if (isOsMode) {
          window.dispatchEvent(new CustomEvent('jasper:open-app', { detail: { appId: 'videoStudio' } }));
        }
        setShowVideoStudio(true);
        openedAppName = 'AI Video Creator & YouTube Studio';
      }
      else if (targetApp.includes('satellite') || targetApp.includes('orbital') || targetApp.includes('spatial') || targetApp.includes('map') || targetApp.includes('nav') || targetApp.includes('gps')) {
        setModalData('maps', { initialTab: targetApp.includes('nav') || targetApp.includes('route') ? 'navigation' : 'satellite' });
        setShowMaps(true);
        openedAppName = 'Spatial GPS & Satellite Intelligence';
      }
      else if (targetApp.includes('blender') || targetApp.includes('hologram') || targetApp.includes('3d')) { 
        setModalData('hologram', { initialTab: targetApp.includes('blender') ? 'blender' : 'viewport' }); 
        setShowHologramModal(true); 
        openedAppName = '3D Hologram & Blender Studio'; 
      }
      else if (targetApp.includes('search')) { setShowSearchEngine(true); openedAppName = 'JASPER AI Search Engine'; }
      else if (targetApp.includes('whatsapp') || targetApp.includes('instagram') || targetApp.includes('auto reply') || targetApp.includes('social')) { setShowSocialAutoReply(true); openedAppName = 'WhatsApp & Instagram Auto-Reply Hub'; }
      else if (targetApp.includes('file') || targetApp.includes('explorer')) { setShowFileManager(true); openedAppName = 'JASPER File Explorer'; }
      else if (targetApp.includes('code') || targetApp.includes('terminal')) { setShowCodeStudio(true); openedAppName = 'JASPER Code Studio'; }
      else if (targetApp.includes('note') || targetApp.includes('plan') || targetApp.includes('task')) { setShowNotesPlanner(true); openedAppName = 'JASPER Notes & Task Planner'; }
      else if (targetApp.includes('calc')) { setShowCalculator(true); openedAppName = 'JASPER Scientific Calculator'; }
      else if (targetApp.includes('tv') || targetApp.includes('jio') || targetApp.includes('stb') || targetApp.includes('screen')) { setShowTvRemote(true); openedAppName = 'Universal Smart TV & JioFiber STB'; }
      else if (targetApp.includes('phone') || targetApp.includes('android')) { setShowPhoneControl(true); openedAppName = 'Android Device Link'; }
      else if (targetApp.includes('pc')) { setShowPcMasterHub(true); openedAppName = 'PC Command Center'; }
      else if (targetApp.includes('security') || targetApp.includes('biometric')) { setShowSecurity(true); openedAppName = 'Biometric Security Center'; }
      else if (targetApp.includes('browser') || targetApp.includes('chrome') || targetApp.includes('web')) { setShowBrowser(true); openedAppName = 'JASPER Browser'; }
      else if (targetApp.includes('sport')) { setShowSportsHub(true); openedAppName = 'Sports Live Score Hub'; }
      else if (targetApp.includes('map') || targetApp.includes('nav')) { setShowMaps(true); openedAppName = 'Spatial Maps & GPS'; }
      else if (targetApp.includes('health') || targetApp.includes('fit')) { setShowHealthHub(true); openedAppName = 'Health & Fitband Tracker'; }
      else if (targetApp.includes('translat')) { setShowLiveTranslation(true); openedAppName = 'Universal Live Translator'; }
      else if (targetApp.includes('manual') || targetApp.includes('guide')) { setShowManual(true); openedAppName = 'JASPER OS Master Guide'; }

      const response = `Opening ${openedAppName} for you, Sir.`;
      setSpeakingText(response);
      const newChat = {
        id: Date.now(),
        query: queryText,
        attachments: attachments,
        response: response,
        timestamp: new Date().toLocaleString()
      };
      setPastChats((prev) => [newChat, ...prev]);
      setSelectedChatId(newChat.id);
      return;
    }

    // Intercept 3D & 4D Hologram & Simulation commands (including "show me X in 3D", "render in blender", "show hologram of X")
    const hologramRegex = /(4d hologram|4d|tesseract|temporal|3d hologram|hologram|show me .* in 3d|show me .* 3d|show .* in 3d|show .* hologram|visualize .* in 3d|show 3d|render 3d|3d model|spiderman|spider-man|spider man|peter parker|iron spider|miles morales|simulation|simulations|simulate|run 3d|3d simulation|physics simulation|quantum simulation|stark simulation|dna simulation|orbital simulation)/i;
    if (hologramRegex.test(queryText)) {
      setHologramQuery(queryText);
      setShowHologramModal(true);
      const response = `Activating J.A.S.P.E.R. 3D Holographic Rendering Suite & Blender Engine for query: "${queryText}"`;

      const newChat = {
        id: Date.now(),
        query: queryText,
        attachments: attachments,
        response: response,
        timestamp: new Date().toLocaleString()
      };
      setPastChats((prev) => [newChat, ...prev]);
      setSelectedChatId(newChat.id);
      setSpeakingText(response);
      if (voiceControllerRef.current) {
        voiceControllerRef.current.playSuccess();
      }
      return;
    }

    // Intercept Agentic Actions commands (book table, call restaurant, reserve, agentic action)
    const agenticRegex = /(book|reserve|call restaurant|agentic action|schedule appointment)/i;
    if (agenticRegex.test(queryText)) {
      setAgenticQuery(queryText);
      setShowAgenticActions(true);
      const response = `Initiating J.A.S.P.E.R. Agentic Actions module for query: "${queryText}"`;
      const newChat = {
        id: Date.now(),
        query: queryText,
        attachments: attachments,
        response: response,
        timestamp: new Date().toLocaleString()
      };
      setPastChats((prev) => [newChat, ...prev]);
      setSelectedChatId(newChat.id);
      if (voiceControllerRef.current) {
        voiceControllerRef.current.playSuccess();
      }
      return;
    }

    // Intercept time-based reminders
    const reminderRegex = /remind me to (.*?) in (\d+)\s*(second|sec|minute|min|hour|hr)s?/i;
    const match = queryText.match(reminderRegex);
    if (match) {
      const task = match[1];
      const amount = parseInt(match[2], 10);
      const unit = match[3].toLowerCase();
      
      let seconds = amount;
      if (unit.startsWith('min')) {
        seconds = amount * 60;
      } else if (unit.startsWith('hour') || unit.startsWith('hr')) {
        seconds = amount * 3600;
      }
      
      const targetTime = Date.now() + seconds * 1000;
      const newReminder = {
        id: Date.now(),
        task: task,
        targetTime: targetTime,
        duration: seconds
      };
      
      setReminders(prev => [...prev, newReminder]);
      
      const response = `Right away, Sir. I have scheduled a reminder to "${task}" in ${amount} ${unit}${amount > 1 ? 's' : ''}.`;
      
      const newChat = {
        id: Date.now(),
        query: queryText,
        attachments: attachments,
        response: response,
        timestamp: new Date().toLocaleString()
      };
      
      setPastChats((prev) => [newChat, ...prev]);
      setSelectedChatId(newChat.id);
      setSpeakingText(response);
      
      if (voiceControllerRef.current) {
        voiceControllerRef.current.playSuccess();
      }
      return;
    }

    setJasperState('processing');

    try {
      // 1. Query Gemini / Fallback Handler with Attachments & 15-second safety race
      const queryPromise = geminiClient.sendQuery(queryText, (text, type) => {
        console.log(`[${type.toUpperCase()}] ${text}`);
      }, attachments);

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Directive took longer than expected to complete')), 15000)
      );

      const response = await Promise.race([queryPromise, timeoutPromise]);

      // 2. Add new chat to history
      const newChat = {
        id: Date.now(),
        query: queryText,
        attachments: attachments,
        response: response || "Directive processed, Sir.",
        timestamp: new Date().toLocaleString()
      };

      setPastChats((prev) => [newChat, ...prev]);
      setSelectedChatId(newChat.id);

      // 3. Set Speaking Text for Text-to-Speech
      if (response && response.trim()) {
        setSpeakingText(response);
      } else {
        setJasperState('idle');
      }
      
      // Play success chime
      if (voiceControllerRef.current) {
        voiceControllerRef.current.playSuccess();
      }
    } catch (err) {
      console.error('[handleCommand Error]:', err);
      const fallbackResponse = `I received your directive: "${queryText}", Sir. Local systems are active and standing by.`;
      const errChat = {
        id: Date.now(),
        query: queryText,
        attachments: attachments,
        response: fallbackResponse,
        timestamp: new Date().toLocaleString()
      };
      setPastChats((prev) => [errChat, ...prev]);
      setSelectedChatId(errChat.id);
      setSpeakingText(fallbackResponse);
      if (voiceControllerRef.current) {
        voiceControllerRef.current.playError();
      }
      setJasperState('idle');
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput.trim() && pendingAttachments.length === 0) return;
    const cmd = manualInput;
    const atts = [...pendingAttachments];
    setManualInput('');
    setPendingAttachments([]);
    handleCommand(cmd, atts);
  };

  const handleSaveKey = (e) => {
    e.preventDefault();
    geminiClient.setApiKey(apiKey);
    geminiClient.setProvider(aiProvider);
    geminiClient.setOllamaModel(ollamaModel);
    setServerIp(serverIp);
    setShowSettings(false);
  };


  const handleNewChat = () => {
    setSelectedChatId(null);
    setManualInput('');
  };

  const handleClear = () => {
    setManualInput('');
    if (selectedChatId) {
      setPastChats(prev => prev.filter(c => c.id !== selectedChatId));
      setSelectedChatId(null);
    }
  };

  const handleImageGeneration = () => {
    setShowImageGenerator(true);
  };

  // Toggle voice engine listening manually
  const handleReactorClick = () => {
    if (voiceControllerRef.current) {
      voiceControllerRef.current.toggleListening();
    }
  };

  // Safe markdown image parsing helper
  const handleCopyResponse = (text, chatId) => {
    if (!text) return;
    try {
      navigator.clipboard?.writeText(text);
      setCopiedChatId(chatId);
      setTimeout(() => setCopiedChatId(null), 2000);
    } catch (_) {}
  };

  const handleCopyCodeSnippet = (codeText, snippetKey) => {
    if (!codeText) return;
    try {
      navigator.clipboard?.writeText(codeText);
      setCopiedCodeIndex(snippetKey);
      setTimeout(() => setCopiedCodeIndex(null), 2000);
    } catch (_) {}
  };

  // Safe markdown and code-block renderer
  const renderResponseContent = (text, chatId) => {
    if (!text) return null;

    // Detect code blocks ```lang ... ```
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const codeMatches = [];
    let match;
    while ((match = codeBlockRegex.exec(text)) !== null) {
      codeMatches.push({
        start: match.index,
        end: codeBlockRegex.lastIndex,
        lang: match[1] || 'text',
        code: match[2].trim()
      });
    }

    if (codeMatches.length === 0) {
      return (
        <div className="flex flex-col gap-3 leading-relaxed text-sm sm:text-[15px] text-[#F3F5FA]">
          {text.split('\n\n').map((para, pIdx) => {
            const trimmed = para.trim();
            if (!trimmed) return null;
            const imgMatch = /!\[(.*?)\]\((.*?)\)/.exec(trimmed);
            if (imgMatch) {
              const cleanCaption = trimmed.replace(/!\[(.*?)\]\((.*?)\)/, '').replace('[IMAGE]', '').trim();
              return (
                <div key={pIdx} className="flex flex-col gap-2 my-2">
                  {cleanCaption && <p>{cleanCaption}</p>}
                  <div 
                    onClick={() => setLightboxImage(imgMatch[2])}
                    className="relative rounded-xl overflow-hidden border border-white/[0.1] bg-[#0B0D12] cursor-pointer group max-w-lg shadow-lg hover:border-cyan-400/50 transition-all"
                  >
                    <img src={imgMatch[2]} alt={imgMatch[1]} className="w-full max-h-80 object-cover rounded-xl" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-medium text-cyan-300 transition-opacity">
                      🔍 Tap to expand
                    </div>
                  </div>
                </div>
              );
            }
            return <p key={pIdx} className="whitespace-pre-wrap leading-relaxed">{trimmed}</p>;
          })}
        </div>
      );
    }

    // Interleaved text and code blocks
    const elements = [];
    let cursor = 0;
    codeMatches.forEach((cm, idx) => {
      if (cm.start > cursor) {
        const textBefore = text.slice(cursor, cm.start).trim();
        if (textBefore) {
          elements.push(
            <div key={`txt-${idx}`} className="flex flex-col gap-2.5">
              {textBefore.split('\n\n').map((p, pIdx) => (
                <p key={pIdx} className="whitespace-pre-wrap leading-relaxed">{p.trim()}</p>
              ))}
            </div>
          );
        }
      }

      const snippetKey = `${chatId}-${idx}`;
      const isSnippetCopied = copiedCodeIndex === snippetKey;

      elements.push(
        <div key={`code-${idx}`} className="rounded-xl overflow-hidden border border-white/[0.08] bg-[#07090E] my-2 text-xs font-mono shadow-md">
          <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#111620] border-b border-white/[0.06] text-slate-400 select-none">
            <span className="text-[11px] font-sans font-medium uppercase tracking-wider text-cyan-300/90">
              {cm.lang || 'Code'}
            </span>
            <button
              type="button"
              onClick={() => handleCopyCodeSnippet(cm.code, snippetKey)}
              className="px-2.5 py-1 rounded-md hover:bg-white/[0.08] text-slate-300 hover:text-white transition-all text-[11px] font-sans cursor-pointer flex items-center gap-1"
            >
              {isSnippetCopied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <pre className="p-3.5 overflow-x-auto custom-scrollbar text-[#E2E8F0] leading-normal font-mono select-text">
            <code>{cm.code}</code>
          </pre>
        </div>
      );
      cursor = cm.end;
    });

    if (cursor < text.length) {
      const rest = text.slice(cursor).trim();
      if (rest) {
        elements.push(
          <div key="txt-rest" className="flex flex-col gap-2.5">
            {rest.split('\n\n').map((p, pIdx) => (
              <p key={pIdx} className="whitespace-pre-wrap leading-relaxed">{p.trim()}</p>
            ))}
          </div>
        );
      }
    }

    return <div className="flex flex-col gap-3 leading-relaxed text-sm sm:text-[15px] text-[#F3F5FA]">{elements}</div>;
  };

  const renderResponseText = (text) => {
    return renderResponseContent(text, selectedChatId);
  };

  const handleToggleViewMode = () => {
    if (viewMode === 'pc') {
      setViewMode('mobile');
      setShowSidebar(false);
    } else {
      setViewMode('pc');
      setShowSidebar(!isMobileScreen);
    }
  };

  const [isOsMode, setIsOsMode] = useState(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 1024) return false;
      return localStorage.getItem('jasper_is_os_mode') === 'true';
    }
    return false;
  });

  const handleSetOsMode = (val) => {
    setIsOsMode(val);
    try {
      localStorage.setItem('jasper_is_os_mode', val ? 'true' : 'false');
    } catch (_) {}
  };

  const filteredPastChats = pastChats.filter(c => {
    if (!chatSearchQuery.trim()) return true;
    const q = chatSearchQuery.toLowerCase();
    return (c.query && c.query.toLowerCase().includes(q)) || (c.response && c.response.toLowerCase().includes(q));
  });

  return (
    <div className={`jasper-shell w-full h-full min-h-screen min-h-dvh flex flex-col overflow-hidden bg-[#0B0D12] text-[#F3F5FA] select-none relative ${viewMode === 'mobile' && !isMobileScreen ? 'w-[390px] h-[844px] max-w-[100vw] max-h-[100dvh] mx-auto my-auto rounded-3xl border border-white/[0.12] shadow-[0_24px_80px_rgba(0,0,0,0.8)]' : ''}`}>
      
      {/* Cloud Cold-Start Indicator */}
      {isCloudColdStarting && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[99999] flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#111620]/95 border border-[#67DFFF]/30 text-[#F3F5FA] text-xs font-medium shadow-2xl backdrop-blur-xl">
          <span className="w-2 h-2 rounded-full bg-[#67DFFF] animate-pulse inline-block" />
          <span>Synchronizing with Cloud Core...</span>
        </div>
      )}
      
      {/* Mobile Simulation Banner on Desktop */}
      {viewMode === 'mobile' && !isMobileScreen && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[999999] flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#171D28]/95 border border-white/[0.1] shadow-2xl backdrop-blur-xl">
          <span className="text-xs text-[#A2ABBC] font-medium">Vivo V23e Viewport (390px)</span>
          <button
            onClick={() => setViewMode('pc')}
            className="px-3 py-1 rounded-full bg-white/[0.08] hover:bg-white/[0.16] text-white text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
            title="Switch back to full desktop layout"
          >
            <Monitor size={12} className="text-[#67DFFF]" />
            <span>Switch to Desktop</span>
          </button>
        </div>
      )}

      {/* Electron Drag Region */}
      {typeof window !== 'undefined' && (window.electronAPI || (navigator.userAgent && navigator.userAgent.toLowerCase().includes('electron'))) ? (
        <div style={{ WebkitAppRegion: 'drag', height: '24px', width: '100%', position: 'absolute', top: 0, left: 0, zIndex: 9999, pointerEvents: 'none' }}></div>
      ) : null}
      
      {/* OS Spatial Desktop Environment (Ubuntu GNOME Mode) */}
      {isOsMode ? (
        <div className="fixed inset-0 w-full h-full min-h-screen min-h-dvh z-30 overflow-hidden bg-[#1f0119]">
          <JasperOsDesktop 
            onToggleClassicMode={() => handleSetOsMode(false)} 
            jasperState={jasperState}
            onMicClick={() => {
              if (voiceControllerRef.current) {
                voiceControllerRef.current.startListening();
              }
            }}
            onLockSystem={() => setIsLocked(true)}
            onOpenSettings={() => setShowSettings(true)}
            aiStatusLabel={
              aiProvider === 'ollama' 
                ? `🦙 Ollama (${ollamaModel})`
                : (apiKey ? '☁️ Gemini Cloud' : 'Core Offline')
            }
            isAiOnline={Boolean(apiKey)}
          />
        </div>
      ) : (
        /* Regular Assistant Workspace */
        <div className="flex-1 flex overflow-hidden z-10 w-full h-full relative">
        
        {/* Mobile Backdrop for Sidebar */}
        {showSidebar && isMobileLayout && (
          <div 
            onClick={() => setShowSidebar(false)} 
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 animate-in fade-in duration-200" 
          />
        )}

        {/* Left Navigation Sidebar / Mobile Slide Drawer */}
        {showSidebar && (
          <aside className={`sidebar-panel flex flex-col justify-between h-full select-none shrink-0 border-r border-white/[0.08] bg-[#0E121A]/95 backdrop-blur-2xl transition-all duration-300 z-50 ${isMobileLayout ? 'fixed inset-y-0 left-0 w-[300px] max-w-[86vw] shadow-2xl p-4 safe-pt safe-pb' : 'w-[280px] relative z-20 p-3.5'}`}>
            <div className="flex flex-col gap-3 overflow-y-auto assistant-menu-scrollbar custom-scrollbar min-h-0 flex-1 pr-1.5">
              {/* Brand Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#171D28] border border-[#67DFFF]/25 flex items-center justify-center shrink-0 shadow-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#67DFFF] animate-pulse" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-sans font-bold text-sm tracking-wide text-white leading-none">
                      J.A.S.P.E.R.
                    </span>
                    <span className="font-sans text-[10px] text-[#A2ABBC] tracking-wider uppercase mt-0.5">
                      Personal Assistant
                    </span>
                  </div>
                </div>
                {isMobileLayout ? (
                  <button 
                    onClick={() => setShowSidebar(false)}
                    className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-[#A2ABBC] hover:text-white flex items-center justify-center transition-colors touch-target-44 cursor-pointer"
                    title="Close Drawer"
                    aria-label="Close Navigation Drawer"
                  >
                    <X size={16} />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="p-1.5 rounded-lg text-[#A2ABBC] hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
                    title="Collapse Sidebar"
                    aria-label="Collapse Sidebar"
                  >
                    <PanelLeftClose size={15} />
                  </button>
                )}
              </div>

              {/* Primary Action: New Conversation */}
              <button 
                onClick={() => {
                  handleNewChat();
                  if (isMobileLayout) setShowSidebar(false);
                }}
                className="w-full py-2.5 px-3.5 rounded-xl jasper-btn-primary font-sans font-semibold text-xs tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <MessageSquarePlus size={15} />
                <span>New Conversation</span>
              </button>

              {/* Conversation Search Bar */}
              <div className="relative w-full">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A2ABBC] pointer-events-none" />
                <input
                  type="text"
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                  placeholder="Search chats..."
                  className="w-full pl-8 pr-7 py-2 rounded-xl bg-[#111620] border border-white/[0.08] text-xs text-white placeholder-[#A2ABBC]/60 outline-none focus:border-[#67DFFF]/40 transition-all font-sans"
                />
                {chatSearchQuery && (
                  <button
                    onClick={() => setChatSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#A2ABBC] hover:text-white text-xs px-1"
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Switch to Ubuntu Spatial OS Desktop Mode */}
              <button 
                onClick={() => {
                  handleSetOsMode(true);
                  if (isMobileLayout) setShowSidebar(false);
                }}
                className="w-full py-2 px-3 bg-[#171D28] hover:bg-[#1E2638] border border-white/[0.08] hover:border-[#67DFFF]/30 text-[#F3F5FA] rounded-xl font-sans font-medium text-xs tracking-wide flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <Monitor size={14} className="text-[#67DFFF]" />
                  <span className="font-semibold text-xs">OS Desktop Mode</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-[#A2ABBC] font-mono group-hover:text-white">GNOME</span>
              </button>

              {/* Recent Conversations List */}
              <div className="flex flex-col gap-1.5 mt-1">
                <div className="flex items-center justify-between px-1">
                  <span className="font-sans text-[10px] text-[#A2ABBC] font-semibold uppercase tracking-wider">
                    Recent Conversations
                  </span>
                  <span className="text-[10px] text-[#A2ABBC]/60 font-mono">
                    {filteredPastChats.length}
                  </span>
                </div>

                <div className="flex flex-col gap-1 overflow-y-auto max-h-[180px] pr-0.5 custom-scrollbar">
                  {filteredPastChats.length === 0 ? (
                    <div className="py-4 text-center text-xs text-[#A2ABBC]/60 font-sans">
                      {chatSearchQuery ? 'No matching chats found' : 'No past conversations yet'}
                    </div>
                  ) : (
                    filteredPastChats.map((chat) => (
                      <div 
                        key={chat.id} 
                        onClick={() => {
                          setSelectedChatId(chat.id);
                          if (isMobileLayout) setShowSidebar(false);
                        }}
                        className={`p-2 rounded-xl border flex items-center justify-between gap-2 text-left transition-all cursor-pointer ${
                          selectedChatId === chat.id 
                            ? 'bg-[#171D28] border-[#67DFFF]/40 text-white shadow-sm' 
                            : 'bg-transparent border-transparent hover:bg-[#171D28]/60 hover:border-white/[0.06] text-[#A2ABBC] hover:text-white'
                        }`}
                      >
                        <div className="flex flex-col overflow-hidden min-w-0 flex-1">
                          <span className="font-medium text-xs truncate">
                            {chat.query || 'Conversation'}
                          </span>
                          <span className="text-[10px] text-[#A2ABBC]/60 mt-0.5 font-mono">
                            {chat.timestamp}
                          </span>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setPastChats(prev => prev.filter(c => c.id !== chat.id));
                            if (selectedChatId === chat.id) setSelectedChatId(null);
                          }}
                          className="w-6 h-6 rounded-lg text-[#A2ABBC] hover:text-rose-400 hover:bg-rose-500/10 text-xs flex items-center justify-center cursor-pointer transition-colors shrink-0"
                          title="Delete Chat"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Subsystems & Intelligence Applications */}
              <div className="border-t border-white/[0.06] pt-2.5 flex flex-col gap-1.5">
                <span className="font-sans text-[10px] text-[#A2ABBC] font-semibold uppercase tracking-wider px-1">
                  Core Subsystems
                </span>

                <div className="grid grid-cols-2 gap-1.5">
                  <button 
                    onClick={() => {
                      setShowAudioPage(true);
                      handleReactorClick();
                      if (isMobileLayout) setShowSidebar(false);
                    }}
                    className="p-2 rounded-xl bg-[#111620] hover:bg-[#171D28] border border-white/[0.06] hover:border-[#67DFFF]/30 text-[#A2ABBC] hover:text-white text-[11px] font-sans flex items-center gap-2 transition-all truncate cursor-pointer"
                  >
                    <Radio size={13} className="text-[#67DFFF] shrink-0 animate-pulse" />
                    <span className="truncate">Voice Room</span>
                  </button>

                  <button 
                    onClick={() => {
                      setShowHologramModal(true);
                      if (isMobileLayout) setShowSidebar(false);
                    }}
                    className="p-2 rounded-xl bg-[#111620] hover:bg-[#171D28] border border-white/[0.06] hover:border-[#67DFFF]/30 text-[#A2ABBC] hover:text-white text-[11px] font-sans flex items-center gap-2 transition-all truncate cursor-pointer"
                  >
                    <Box size={13} className="text-sky-400 shrink-0" />
                    <span className="truncate">3D Hologram</span>
                  </button>

                  <button 
                    onClick={() => {
                      setShowTelephony(true);
                      if (isMobileLayout) setShowSidebar(false);
                    }}
                    className="p-2 rounded-xl bg-[#111620] hover:bg-[#171D28] border border-white/[0.06] hover:border-[#67DFFF]/30 text-[#A2ABBC] hover:text-white text-[11px] font-sans flex items-center gap-2 transition-all truncate cursor-pointer"
                  >
                    <PhoneForwarded size={13} className="text-[#67DFFF] shrink-0" />
                    <span className="truncate">Telephony</span>
                  </button>

                  <button 
                    onClick={() => {
                      setShowPhoneControl(true);
                      if (isMobileLayout) setShowSidebar(false);
                    }}
                    className="p-2 rounded-xl bg-[#111620] hover:bg-[#171D28] border border-white/[0.06] hover:border-[#67DFFF]/30 text-[#A2ABBC] hover:text-white text-[11px] font-sans flex items-center gap-2 transition-all truncate cursor-pointer"
                  >
                    <Smartphone size={13} className="text-indigo-400 shrink-0" />
                    <span className="truncate">Phone Link</span>
                  </button>

                  <button 
                    onClick={() => {
                      setShowLaptopConnect(true);
                      if (isMobileLayout) setShowSidebar(false);
                    }}
                    className="p-2 rounded-xl bg-[#111620] hover:bg-[#171D28] border border-white/[0.06] hover:border-[#67DFFF]/30 text-[#A2ABBC] hover:text-white text-[11px] font-sans flex items-center gap-2 transition-all truncate cursor-pointer"
                  >
                    <Laptop size={13} className="text-violet-400 shrink-0" />
                    <span className="truncate">Laptop Bridge</span>
                  </button>

                  <button 
                    onClick={() => {
                      setShowTvRemote(!showTvRemote);
                      if (isMobileLayout) setShowSidebar(false);
                    }}
                    className="p-2 rounded-xl bg-[#111620] hover:bg-[#171D28] border border-white/[0.06] hover:border-[#67DFFF]/30 text-[#A2ABBC] hover:text-white text-[11px] font-sans flex items-center gap-2 transition-all truncate cursor-pointer"
                  >
                    <Tv size={13} className="text-sky-400 shrink-0" />
                    <span className="truncate">Smart TV</span>
                  </button>

                  <button 
                    onClick={() => {
                      setShowVideoStudio(true);
                      if (isMobileLayout) setShowSidebar(false);
                    }}
                    className="p-2 rounded-xl bg-[#111620] hover:bg-[#171D28] border border-white/[0.06] hover:border-[#67DFFF]/30 text-[#A2ABBC] hover:text-white text-[11px] font-sans flex items-center gap-2 transition-all truncate cursor-pointer"
                  >
                    <Video size={13} className="text-rose-400 shrink-0" />
                    <span className="truncate">Video Studio</span>
                  </button>

                  <button 
                    onClick={() => {
                      setShowPhoneSentinel(true);
                      if (isMobileLayout) setShowSidebar(false);
                    }}
                    className="p-2 rounded-xl bg-[#111620] hover:bg-[#171D28] border border-white/[0.06] hover:border-[#67DFFF]/30 text-[#A2ABBC] hover:text-white text-[11px] font-sans flex items-center gap-2 transition-all truncate cursor-pointer"
                  >
                    <ShieldAlert size={13} className="text-amber-400 shrink-0" />
                    <span className="truncate">Sentinel</span>
                  </button>

                  <button 
                    onClick={() => {
                      setShowSocialAutoReply(true);
                      if (isMobileLayout) setShowSidebar(false);
                    }}
                    className="p-2 rounded-xl bg-[#111620] hover:bg-[#171D28] border border-white/[0.06] hover:border-[#67DFFF]/30 text-[#A2ABBC] hover:text-white text-[11px] font-sans flex items-center gap-2 transition-all truncate cursor-pointer"
                  >
                    <MessageSquare size={13} className="text-emerald-400 shrink-0" />
                    <span className="truncate">Social Auto</span>
                  </button>

                  <button 
                    onClick={() => {
                      setShowLiveTranslation(true);
                      if (isMobileLayout) setShowSidebar(false);
                    }}
                    className="p-2 rounded-xl bg-[#111620] hover:bg-[#171D28] border border-white/[0.06] hover:border-[#67DFFF]/30 text-[#A2ABBC] hover:text-white text-[11px] font-sans flex items-center gap-2 transition-all truncate cursor-pointer"
                  >
                    <Languages size={13} className="text-sky-400 shrink-0" />
                    <span className="truncate">Translate</span>
                  </button>

                  <button 
                    onClick={() => {
                      setShowHealthHub(true);
                      if (isMobileLayout) setShowSidebar(false);
                    }}
                    className="p-2 rounded-xl bg-[#111620] hover:bg-[#171D28] border border-white/[0.06] hover:border-[#67DFFF]/30 text-[#A2ABBC] hover:text-white text-[11px] font-sans flex items-center gap-2 transition-all truncate cursor-pointer"
                  >
                    <Activity size={13} className="text-emerald-400 shrink-0" />
                    <span className="truncate">Health Hub</span>
                  </button>

                  <button 
                    onClick={() => {
                      setModalData('maps', { initialTab: 'satellite' });
                      setShowMaps(true);
                      if (isMobileLayout) setShowSidebar(false);
                    }}
                    className="p-2 rounded-xl bg-[#111620] hover:bg-[#171D28] border border-white/[0.06] hover:border-[#67DFFF]/30 text-[#A2ABBC] hover:text-white text-[11px] font-sans flex items-center gap-2 transition-all truncate cursor-pointer"
                  >
                    <Globe size={13} className="text-sky-400 shrink-0" />
                    <span className="truncate">Maps</span>
                  </button>

                  <button 
                    onClick={() => {
                      setShowPersonalAssistant(true);
                      if (isMobileLayout) setShowSidebar(false);
                    }}
                    className="p-2 rounded-xl bg-[#111620] hover:bg-[#171D28] border border-white/[0.06] hover:border-[#67DFFF]/30 text-[#A2ABBC] hover:text-white text-[11px] font-sans flex items-center gap-2 transition-all truncate cursor-pointer"
                  >
                    <Calendar size={13} className="text-emerald-400 shrink-0" />
                    <span className="truncate">Planner</span>
                  </button>

                  <button 
                    onClick={() => {
                      setShowMemory(true);
                      if (isMobileLayout) setShowSidebar(false);
                    }}
                    className="p-2 rounded-xl bg-[#111620] hover:bg-[#171D28] border border-white/[0.06] hover:border-[#67DFFF]/30 text-[#A2ABBC] hover:text-white text-[11px] font-sans flex items-center gap-2 transition-all truncate cursor-pointer"
                  >
                    <Brain size={13} className="text-violet-400 shrink-0" />
                    <span className="truncate">Memory</span>
                  </button>

                  <button 
                    onClick={() => {
                      setShowAutomation(true);
                      if (isMobileLayout) setShowSidebar(false);
                    }}
                    className="p-2 rounded-xl bg-[#111620] hover:bg-[#171D28] border border-white/[0.06] hover:border-[#67DFFF]/30 text-[#A2ABBC] hover:text-white text-[11px] font-sans flex items-center gap-2 transition-all truncate cursor-pointer"
                  >
                    <Workflow size={13} className="text-indigo-400 shrink-0" />
                    <span className="truncate">Automations</span>
                  </button>

                  <button 
                    onClick={() => {
                      setShowDiagnostics(true);
                      if (isMobileLayout) setShowSidebar(false);
                    }}
                    className="p-2 rounded-xl bg-[#111620] hover:bg-[#171D28] border border-white/[0.06] hover:border-[#67DFFF]/30 text-[#A2ABBC] hover:text-white text-[11px] font-sans flex items-center gap-2 transition-all truncate cursor-pointer"
                  >
                    <Cpu size={13} className="text-[#67DFFF] shrink-0" />
                    <span className="truncate">Diagnostics</span>
                  </button>
                </div>
              </div>

              {/* Weather & Media Telemetry HUD */}
              <div className="flex flex-col gap-2.5 mt-2">
                <WeatherWidget />
                <MediaControllerWidget />
              </div>

              {/* Active Reminders Block */}
              {reminders.length > 0 && (
                <div className="flex flex-col gap-2 mt-2 border-t border-white/[0.06] pt-2">
                  <span className="font-sans text-[10px] text-[#A2ABBC] uppercase tracking-wider font-semibold">
                    Active Reminders
                  </span>
                  <div className="flex flex-col gap-1 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
                    {reminders.map((r) => {
                      const timeLeft = Math.max(0, Math.round((r.targetTime - Date.now()) / 1000));
                      const mins = Math.floor(timeLeft / 60);
                      const secs = timeLeft % 60;
                      const timeString = `${mins}:${secs.toString().padStart(2, '0')}`;
                      
                      return (
                        <div key={r.id} className="flex justify-between items-center bg-[#111620] border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs">
                          <div className="flex flex-col overflow-hidden min-w-0">
                            <span className="text-white truncate max-w-[140px] font-medium">{r.task}</span>
                            <span className="text-[10px] text-[#67DFFF] font-mono">In {timeString}</span>
                          </div>
                          <button 
                            onClick={() => setReminders(prev => prev.filter(item => item.id !== r.id))}
                            className="text-[#A2ABBC] hover:text-rose-400 font-bold px-1 transition-colors cursor-pointer"
                            title="Cancel Reminder"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer details in sidebar */}
            <div className="border-t border-white/[0.06] pt-3 mt-2 flex items-center justify-between text-xs text-[#A2ABBC]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                <span className="text-[11px] font-mono text-[#F3F5FA]">Core Online</span>
              </div>
              <button
                onClick={() => setShowManual(true)}
                className="text-[11px] text-[#A2ABBC] hover:text-[#67DFFF] transition-colors flex items-center gap-1 cursor-pointer"
                title="User Manual & Documentation"
              >
                <BookOpen size={12} />
                <span>Docs</span>
              </button>
            </div>
          </aside>
        )}

        {/* Right Workspace */}
        <div className="flex-1 flex flex-col h-full w-full overflow-hidden relative">
          
          {/* Header Panel */}
          <header className={`flex items-center justify-between border-b border-white/[0.08] bg-[#0E121A]/90 backdrop-blur-2xl shrink-0 z-20 ${isMobileLayout ? 'h-14 px-3' : 'h-14 px-5'}`}>
              <div className="flex items-center gap-2.5">
                <button 
                  onClick={() => setShowSidebar(prev => !prev)}
                  className="w-9 h-9 rounded-xl text-[#A2ABBC] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all flex items-center justify-center cursor-pointer shrink-0 touch-target-44"
                  title={showSidebar ? 'Hide Sidebar' : 'Show Navigation Menu'}
                  aria-label="Toggle Navigation"
                >
                  <Menu size={18} />
                </button>
                <div className="flex items-center gap-2">
                  <span className="font-sans font-bold tracking-tight text-white leading-none text-sm sm:text-base">
                    J.A.S.P.E.R.
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#171D28] border border-white/[0.08] text-[10px] font-mono text-[#A2ABBC]">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      jasperState === 'listening' ? 'bg-[#67DFFF] animate-ping' :
                      jasperState === 'processing' || jasperState === 'thinking' ? 'bg-amber-400 animate-pulse' :
                      jasperState === 'speaking' ? 'bg-emerald-400 animate-pulse' :
                      jasperState === 'error' ? 'bg-rose-400' : 'bg-[#67DFFF]'
                    }`} />
                    <span className="uppercase text-[9px] tracking-wider text-[#F3F5FA] font-medium">
                      {jasperState}
                    </span>
                  </span>
                </div>
              </div>

              {/* Center Status / AI Provider indicator on desktop */}
              {!isMobileLayout && (
                <button
                  onClick={() => setShowSettings(true)}
                  className="px-3 py-1 rounded-full bg-[#111620] hover:bg-[#171D28] border border-white/[0.08] text-xs text-[#A2ABBC] hover:text-white flex items-center gap-2 transition-all cursor-pointer"
                  title="Active AI Engine. Click to configure settings."
                >
                  <Cpu size={12} className="text-[#67DFFF]" />
                  <span className="font-medium text-[#F3F5FA]">
                    {aiProvider === 'gemini' ? 'Gemini Cloud' : `Ollama (${ollamaModel})`}
                  </span>
                </button>
              )}

              {/* Actions Header Bar */}
              <div className="flex items-center gap-2 shrink-0">
                {/* OS Desktop Switcher */}
                <button 
                  onClick={() => handleSetOsMode(true)}
                  className={`text-xs py-1.5 px-3 rounded-xl font-sans font-medium text-white border border-white/[0.08] bg-[#171D28] hover:bg-[#1E2638] hover:border-[#67DFFF]/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${isMobileLayout ? 'touch-target-44' : ''}`}
                  title="Switch to Ubuntu GNOME Desktop Environment"
                >
                  <Monitor size={14} className="text-[#67DFFF]" />
                  {!isMobileLayout && <span>OS Desktop</span>}
                </button>

                {/* Cloud Downloads Hub */}
                {!isMobileLayout && (
                  <button
                    onClick={() => setShowDownloadsModal(true)}
                    className="text-xs py-1.5 px-3 rounded-xl font-sans font-medium text-[#A2ABBC] hover:text-white border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Download Android APK, Windows Desktop EXE, or Live Boot Kit"
                  >
                    <Download size={13} className="text-[#67DFFF]" />
                    <span>Downloads</span>
                  </button>
                )}

                {/* Direct Voice Room Trigger */}
                <button 
                  onClick={() => {
                    setShowAudioPage(true);
                    handleReactorClick();
                  }}
                  className={`text-xs py-1.5 px-3 rounded-xl font-sans font-medium text-[#67DFFF] border border-[#67DFFF]/30 bg-[#67DFFF]/10 hover:bg-[#67DFFF]/20 transition-all flex items-center gap-1.5 cursor-pointer ${isMobileLayout ? 'touch-target-44' : ''}`}
                  title="Open Full Voice Conversation"
                >
                  <Radio size={14} className="animate-pulse" />
                  {!isMobileLayout && <span>Voice Room</span>}
                </button>

                {/* Multi-User Profile Dropdown */}
                <UserProfileMenu onLockSystem={() => setIsLocked(true)} />

                {/* Quick Lock Button */}
                <button 
                  onClick={() => setIsLocked(true)}
                  className={`p-2 rounded-xl text-rose-300 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all cursor-pointer flex items-center justify-center ${isMobileLayout ? 'touch-target-44' : ''}`}
                  title="Lock Assistant Terminal"
                  aria-label="Lock Assistant"
                >
                  <Lock size={14} />
                </button>

                {/* Settings Button on Desktop */}
                {!isMobileLayout && (
                  <button 
                    onClick={() => setShowSettings(true)}
                    className="p-2 rounded-xl text-[#A2ABBC] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all flex items-center justify-center cursor-pointer"
                    title="Configure AI & Assistant Settings"
                    aria-label="Settings"
                  >
                    <Settings size={14} />
                  </button>
                )}
              </div>
            </header>

            {/* Main Workspace Area */}
            <main 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex-1 overflow-hidden flex flex-col relative ${isMobileLayout ? 'p-2 sm:p-3' : 'p-4'}`}
            >
              {/* Drag & Drop Overlay */}
                {isDraggingOver && (
                  <div className="drag-drop-overlay">
                    <div className="text-4xl animate-bounce">📥</div>
                    <div className="text-lg font-bold tracking-widest text-[#67DFFF]">DROP FILES TO UPLOAD TO J.A.S.P.E.R.</div>
                    <div className="text-xs font-mono text-[#A2ABBC]">Images, Code, PDFs, Text Documents & Audio supported</div>
                  </div>
                )}

                {/* Main Scrollable HUD View */}
                <div 
                  ref={hudPanelRef}
                  onScroll={handleHudScroll}
                  className={`flex-1 min-h-0 overflow-y-auto assistant-workspace-scrollbar custom-scrollbar relative bg-[#0B0D12] border border-white/[0.08] rounded-2xl backdrop-blur-2xl shadow-2xl ${isMobileLayout ? 'p-3' : 'p-6'} transition-all flex flex-col`}
                >
                  {/* Ambient Electric Border Highlight */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#67DFFF]/40 to-transparent pointer-events-none" />
                  
                  {/* Processing State Indicator */}
                  {jasperState === 'processing' && (
                    <div className="absolute inset-0 bg-[#0B0D12]/80 backdrop-blur-md flex flex-col items-center justify-center gap-3.5 z-30 animate-in fade-in duration-200">
                      <div className="w-9 h-9 border-2 border-[#67DFFF] border-t-transparent rounded-full animate-spin" />
                      <div className="font-sans text-xs text-[#F3F5FA] font-medium tracking-wide">
                        Executing directive...
                      </div>
                    </div>
                  )}

                  {/* Active Chat Conversation View */}
                  {selectedChatId ? (
                    <div className="flex flex-col gap-4 max-w-4xl w-full mx-auto pb-4">
                      {/* Chat Prompt Banner */}
                      <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#111620] border border-white/[0.08] text-xs text-[#A2ABBC]">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[#67DFFF] font-semibold uppercase text-[10px] tracking-wider">Prompt</span>
                          <span className="text-white font-medium truncate max-w-[200px] sm:max-w-md">
                            {pastChats.find(c => c.id === selectedChatId)?.query}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-[#A2ABBC]/60 font-mono">
                            {pastChats.find(c => c.id === selectedChatId)?.timestamp}
                          </span>
                          <button
                            onClick={handleNewChat}
                            className="px-2 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-white text-[11px] font-sans transition-colors cursor-pointer"
                          >
                            Close
                          </button>
                        </div>
                      </div>

                      {/* Attachments Preview */}
                      {pastChats.find(c => c.id === selectedChatId)?.attachments?.length > 0 && (
                        <div className="flex flex-wrap gap-2.5 my-1">
                          {pastChats.find(c => c.id === selectedChatId).attachments.map((att) => (
                            att.isImage ? (
                              <div 
                                key={att.id} 
                                className="relative group cursor-pointer border border-white/[0.1] rounded-xl overflow-hidden bg-[#111620] p-1 hover:border-[#67DFFF]/50 transition-all shadow-md"
                                onClick={() => setLightboxImage(att.dataUrl)}
                              >
                                <img src={att.dataUrl} alt={att.name} className="h-32 max-w-xs object-cover rounded-lg" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[#67DFFF] font-sans text-xs font-medium transition-opacity">
                                  Expand Image
                                </div>
                              </div>
                            ) : (
                              <div key={att.id} className="flex items-center gap-2.5 px-3 py-2 bg-[#111620] border border-white/[0.08] rounded-xl font-sans text-xs text-white shadow-sm">
                                <span className="text-lg">{att.icon || '📄'}</span>
                                <div className="flex flex-col">
                                  <span className="font-medium text-white truncate max-w-[180px]">{att.name}</span>
                                  <span className="text-[10px] text-[#A2ABBC]">{(att.size / 1024).toFixed(1)} KB</span>
                                </div>
                              </div>
                            )
                          ))}
                        </div>
                      )}

                      {/* Assistant Response Bubble with Formatted Markdown & Syntax Highlighting */}
                      <div className="p-5 rounded-2xl bg-[#111620]/90 border border-white/[0.08] shadow-sm leading-relaxed text-[#F3F5FA] font-sans text-sm sm:text-base">
                        {renderResponseContent(pastChats.find(c => c.id === selectedChatId)?.response)}
                      </div>

                      {/* Actions Toolbar */}
                      <div className="flex items-center justify-between px-2 text-xs">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleCopyResponse(pastChats.find(c => c.id === selectedChatId)?.response, selectedChatId)}
                            className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-[#A2ABBC] hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                            title="Copy response to clipboard"
                          >
                            {copySuccess === selectedChatId ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                            <span>{copySuccess === selectedChatId ? 'Copied' : 'Copy'}</span>
                          </button>
                          <button
                            onClick={() => {
                              const text = pastChats.find(c => c.id === selectedChatId)?.response;
                              if (text) speakDeviceAudio(text);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-[#A2ABBC] hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                            title="Read response aloud"
                          >
                            <Volume2 size={13} className="text-[#67DFFF]" />
                            <span>Speak</span>
                          </button>
                          <button
                            onClick={() => {
                              const query = pastChats.find(c => c.id === selectedChatId)?.query;
                              if (query) handleCommand(query);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-[#A2ABBC] hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                            title="Regenerate response"
                          >
                            <RefreshCw size={13} />
                            <span>Regenerate</span>
                          </button>
                        </div>
                        <button
                          onClick={handleClear}
                          className="text-xs text-[#A2ABBC] hover:text-rose-400 transition-colors cursor-pointer px-2 py-1"
                          title="Delete this conversation"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Command Center Hero & Quick Directive Cards */
                    <div className="flex-1 flex flex-col items-center justify-start sm:justify-center max-w-4xl w-full mx-auto py-6 px-2 gap-6 min-h-min">
                      {/* Core AI Arc Reactor Visualization */}
                      <div className="flex flex-col items-center gap-3">
                        <div 
                          onClick={handleReactorClick}
                          className="w-36 h-36 sm:w-44 sm:h-44 cursor-pointer hover:scale-105 active:scale-95 transition-transform duration-300 relative group"
                          title="Click to speak with J.A.S.P.E.R."
                        >
                          <ArcReactor state={jasperState} onClick={handleReactorClick} />
                        </div>
                        <div className="text-center">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111620] border border-white/[0.08] mb-2 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-[#67DFFF] animate-pulse" />
                            <span className="text-[11px] font-semibold tracking-wider uppercase text-white">J.A.S.P.E.R. Core Online</span>
                          </div>
                          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                            How can I assist you today?
                          </h2>
                          <p className="text-xs sm:text-sm text-[#A2ABBC] mt-1 max-w-md">
                            Tap the orb to speak, enter a directive below, or trigger an intelligent routine.
                          </p>
                        </div>
                      </div>

                      {/* Quick Bento Directive Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full">
                        <button 
                          onClick={() => setShowVideoStudio(true)}
                          className="p-3.5 rounded-2xl bg-[#111620]/80 hover:bg-[#171D28] border border-white/[0.08] hover:border-[#67DFFF]/40 text-left transition-all group flex flex-col gap-2 shadow-sm cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                            <Video size={16} />
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-white block">AI Video Studio</span>
                            <span className="text-[10px] text-[#A2ABBC] block mt-0.5">Shorts & YouTube creator</span>
                          </div>
                        </button>

                        <button 
                          onClick={triggerMorningBriefing}
                          className="p-3.5 rounded-2xl bg-[#111620]/80 hover:bg-[#171D28] border border-white/[0.08] hover:border-[#67DFFF]/40 text-left transition-all group flex flex-col gap-2 shadow-sm cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                            <Sparkles size={16} />
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-white block">Morning Briefing</span>
                            <span className="text-[10px] text-[#A2ABBC] block mt-0.5">News, weather & agenda</span>
                          </div>
                        </button>

                        <button 
                          onClick={() => handleCommand('Hey Jasper, get ready for work')}
                          className="p-3.5 rounded-2xl bg-[#111620]/80 hover:bg-[#171D28] border border-white/[0.08] hover:border-[#67DFFF]/40 text-left transition-all group flex flex-col gap-2 shadow-sm cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                            <Workflow size={16} />
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-white block">Work Protocol</span>
                            <span className="text-[10px] text-[#A2ABBC] block mt-0.5">Launch productivity suite</span>
                          </div>
                        </button>

                        <button 
                          onClick={() => setShowHealthHub(true)}
                          className="p-3.5 rounded-2xl bg-[#111620]/80 hover:bg-[#171D28] border border-white/[0.08] hover:border-[#67DFFF]/40 text-left transition-all group flex flex-col gap-2 shadow-sm cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                            <Activity size={16} />
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-white block">Health Vitals</span>
                            <span className="text-[10px] text-[#A2ABBC] block mt-0.5">Fitband & telemetry</span>
                          </div>
                        </button>

                        <button 
                          onClick={triggerVisionAnalysis}
                          className="p-3.5 rounded-2xl bg-[#111620]/80 hover:bg-[#171D28] border border-white/[0.08] hover:border-[#67DFFF]/40 text-left transition-all group flex flex-col gap-2 shadow-sm cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                            <Camera size={16} />
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-white block">Vision AI Scan</span>
                            <span className="text-[10px] text-[#A2ABBC] block mt-0.5">Scan desk & camera feed</span>
                          </div>
                        </button>

                        <button 
                          onClick={() => setShowHologramModal(true)}
                          className="p-3.5 rounded-2xl bg-[#111620]/80 hover:bg-[#171D28] border border-white/[0.08] hover:border-[#67DFFF]/40 text-left transition-all group flex flex-col gap-2 shadow-sm cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-xl bg-[#67DFFF]/10 border border-[#67DFFF]/20 flex items-center justify-center text-[#67DFFF] group-hover:scale-110 transition-transform">
                            <Box size={16} />
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-white block">3D Hologram</span>
                            <span className="text-[10px] text-[#A2ABBC] block mt-0.5">Blender scene graphics</span>
                          </div>
                        </button>

                        <button 
                          onClick={() => setShowTelephony(true)}
                          className="p-3.5 rounded-2xl bg-[#111620]/80 hover:bg-[#171D28] border border-white/[0.08] hover:border-[#67DFFF]/40 text-left transition-all group flex flex-col gap-2 shadow-sm cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                            <PhoneForwarded size={16} />
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-white block">Telephony Hub</span>
                            <span className="text-[10px] text-[#A2ABBC] block mt-0.5">AI receptionist & calls</span>
                          </div>
                        </button>

                        <button 
                          onClick={() => setShowTvRemote(!showTvRemote)}
                          className="p-3.5 rounded-2xl bg-[#111620]/80 hover:bg-[#171D28] border border-white/[0.08] hover:border-[#67DFFF]/40 text-left transition-all group flex flex-col gap-2 shadow-sm cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                            <Tv size={16} />
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-white block">Smart TV Remote</span>
                            <span className="text-[10px] text-[#A2ABBC] block mt-0.5">CEC & volume control</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Staged Attachments Preview Bar */}
                {pendingAttachments.length > 0 && (
                  <div className="chat-attachment-bar">
                    {pendingAttachments.map((att) => (
                      <div key={att.id} className="chat-attachment-chip">
                        {att.isImage ? (
                          <img src={att.dataUrl} alt={att.name} className="chat-attachment-thumb" />
                        ) : (
                          <div className="chat-attachment-icon-badge">{att.icon}</div>
                        )}
                        <div className="flex flex-col text-left">
                          <span className="font-medium text-white truncate max-w-[140px]">{att.name}</span>
                          <span className="text-[10px] text-[#A2ABBC]">{(att.size / 1024).toFixed(1)} KB</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="chat-attachment-remove"
                          title="Remove attachment"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  multiple
                  style={{ display: 'none' }}
                  accept="image/*,application/pdf,text/*,.js,.jsx,.ts,.tsx,.json,.csv,.py,.md,.html,.css,.c,.cpp,.java,.mp3,.wav,.ogg,.m4a"
                />

                {/* Responsive Message Composer Form */}
                <form 
                  onSubmit={handleManualSubmit} 
                  className={`p-2 bg-[#111620]/95 border border-white/[0.1] rounded-2xl backdrop-blur-2xl shadow-2xl mt-2 select-none shrink-0 flex items-center gap-2 safe-pb max-w-4xl w-full mx-auto`}
                >
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-10 h-10 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#A2ABBC] hover:text-white border border-white/[0.08] transition-all flex items-center justify-center cursor-pointer shrink-0 touch-target-44"
                    title="Upload files, images, or documents"
                    aria-label="Upload File"
                  >
                    <Paperclip size={18} />
                  </button>
                  
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    onPaste={handlePaste}
                    placeholder={pendingAttachments.length > 0 ? "Ask about attached file(s)..." : "Ask J.A.S.P.E.R. anything or enter a directive..."}
                    className="flex-1 bg-transparent px-3 py-2 text-white placeholder-[#A2ABBC]/60 outline-none font-sans text-base w-full min-w-0"
                    style={{ fontSize: '16px' }}
                  />

                  <button 
                    type="button" 
                    onClick={() => {
                      setShowAudioPage(true);
                      if (voiceControllerRef.current) {
                        voiceControllerRef.current.toggleListening();
                      }
                    }}
                    className="w-10 h-10 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#67DFFF] border border-white/[0.08] transition-all flex items-center justify-center cursor-pointer shrink-0 touch-target-44"
                    title="Speak to J.A.S.P.E.R."
                    aria-label="Voice Input"
                  >
                    <Mic size={18} />
                  </button>

                  <button 
                    type="submit" 
                    disabled={!manualInput.trim() && pendingAttachments.length === 0}
                    className="w-10 h-10 rounded-xl jasper-btn-primary flex items-center justify-center cursor-pointer shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed touch-target-44 shadow-sm"
                    title="Send directive"
                    aria-label="Send Directive"
                  >
                    <Send size={16} />
                  </button>
                </form>

                {/* Scroll-To-Top Floating Button */}
                {showScrollTopButton && (
                  <button
                    type="button"
                    onClick={scrollToTop}
                    className="absolute bottom-20 right-5 z-50 py-2 px-3.5 bg-[#171D28]/95 border border-white/[0.12] text-white font-sans font-medium text-xs rounded-full shadow-2xl flex items-center gap-1.5 hover:bg-[#1E2638] transition-all cursor-pointer backdrop-blur-md"
                    title="Scroll to Top"
                  >
                    <span>↑</span>
                    <span>Top</span>
                  </button>
                )}
            </main>
          </div>
        </div>
      )}

      {/* Sliding TV Remote Control Overlay */}
      {showTvRemote && (
        <div className={`fixed z-40 p-4 rounded-2xl bg-slate-950/95 border border-white/[0.1] shadow-2xl backdrop-blur-2xl animate-slide-in ${isMobileLayout ? 'top-14 inset-x-2 w-auto max-h-[85vh] overflow-y-auto' : 'top-16 right-4 w-[460px] max-w-[95vw] max-h-[88vh] overflow-y-auto'}`}>
          <div className="flex justify-between items-center border-b border-white/[0.08] pb-2.5 mb-3 select-none">
            <span className="font-sans font-semibold text-xs text-white">Smart TV & JioFiber Remote</span>
            <button onClick={() => setShowTvRemote(false)} className="text-slate-400 hover:text-white font-medium text-xs p-1 rounded-lg hover:bg-slate-800 transition-colors">Close</button>
          </div>
          <TvRemoteWidget onLog={(text, type) => console.log(`[${type}] ${text}`)} />
        </div>
      )}

      {/* Sliding Phone Control Overlay */}
      {showPhoneControl && (
        <div className={`fixed z-40 p-4 rounded-2xl bg-slate-950/95 border border-white/[0.1] shadow-2xl backdrop-blur-2xl animate-slide-in flex flex-col ${isMobileLayout ? 'top-14 inset-x-2 w-auto h-[calc(100%-4.5rem)]' : 'top-20 right-4 w-[580px] max-w-[92vw] h-[calc(100%-7rem)]'}`}>
          <div className="flex justify-between items-center border-b border-white/[0.08] pb-2.5 mb-3 select-none">
            <span className="font-sans font-semibold text-xs text-white">Phone Uplink</span>
            <button onClick={() => setShowPhoneControl(false)} className="text-slate-400 hover:text-white font-medium text-xs p-1 rounded-lg hover:bg-slate-800 transition-colors">Close</button>
          </div>
          <div className="flex-1 overflow-y-auto phone-scroll pr-2">
            <PhoneControlWidget />
          </div>
        </div>
      )}

      {/* Image Synthesis Lab Overlay */}
      {showImageGenerator && (
        <div className={`fixed z-40 p-4 rounded-2xl bg-slate-950/95 border border-white/[0.1] shadow-2xl backdrop-blur-2xl animate-slide-in flex flex-col ${isMobileLayout ? 'top-14 inset-x-2 w-auto max-h-[85vh]' : 'top-20 right-4 w-[380px] maxHeight-[calc(100%-7rem)]'}`}>
          <ImageGeneratorWidget
            onClose={() => setShowImageGenerator(false)}
            onLog={(text, type) => console.log(`[${type}] ${text}`)}
          />
        </div>
      )}

      {/* Sliding PC Diagnostics Overlay */}
      {showDiagnostics && (
        <div className={`fixed z-40 p-4 rounded-2xl bg-slate-950/95 border border-white/[0.1] shadow-2xl backdrop-blur-2xl animate-slide-in flex flex-col ${isMobileLayout ? 'top-14 inset-x-2 w-auto h-[calc(100%-4.5rem)]' : 'top-20 right-4 w-[420px] h-[calc(100%-7rem)]'}`}>
          <div className="flex justify-between items-center border-b border-white/[0.08] pb-2.5 mb-3 select-none">
            <span className="font-sans font-semibold text-xs text-white">System Diagnostics</span>
            <button onClick={() => setShowDiagnostics(false)} className="text-slate-400 hover:text-white font-medium text-xs p-1 rounded-lg hover:bg-slate-800 transition-colors">Close</button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <DiagnosticWidget />
          </div>
        </div>
      )}

      {/* Full-Screen Audio Conversation Page */}
      {showAudioPage && (
        <AudioConversationPage
          jasperState={jasperState}
          onToggleListening={handleReactorClick}
          latestQuery={pastChats.find(c => c.id === selectedChatId)?.query || ''}
          latestResponse={pastChats.find(c => c.id === selectedChatId)?.response || speakingText || ''}
          speakingText={speakingText}
          onStopSpeaking={() => {
            if (window.speechSynthesis) window.speechSynthesis.cancel();
            setJasperState('idle');
            setSpeakingText('');
          }}
          onManualSubmit={(text) => {
            handleCommand(text);
          }}
          onClose={() => setShowAudioPage(false)}
        />
      )}

      {/* Triggered Reminder Alert Modal */}
      {showReminderAlert && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md animate-in fade-in duration-200 p-4">
          <div className="max-w-sm w-full p-6 rounded-2xl bg-slate-900 border border-white/[0.1] shadow-2xl text-center flex flex-col gap-4 relative select-none">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Shield size={24} />
            </div>
            
            <div className="flex flex-col gap-1">
              <h2 className="font-semibold text-base text-white">Scheduled Reminder</h2>
              <span className="text-xs text-slate-400">Time-based reminder trigger</span>
            </div>
            
            <div className="bg-slate-950/60 border border-white/[0.08] rounded-xl p-3.5 my-1 text-left">
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1">Task</div>
              <p className="text-sm font-medium text-slate-200">
                {showReminderAlert.task}
              </p>
            </div>
            
            <button 
              onClick={() => {
                setShowReminderAlert(null);
                playFuturisticChime();
              }}
              className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors shadow-sm shadow-indigo-500/20 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Multi-User Security & Identity Lock Terminal */}
      {isLocked && (
        <MultiUserLockTerminal
          onUnlockSuccess={handleUnlockSuccess}
          biometricMode={biometricMode}
          onTriggerFaceScan={(user) => {
            setBiometricMode('face_scan');
            setLastScanMode('face_scan');
            startRealFaceScan();
          }}
          onTriggerFaceEnroll={(user) => {
            setBiometricMode('face_enroll');
            setLastScanMode('face_enroll');
            startFaceEnrollment();
          }}
          videoRef={videoRef}
          canvasRef={canvasRef}
          scanProgress={scanProgress}
          scanStatusText={scanStatusText}
          failedAuthAttempts={failedAuthAttempts}
          intrusionAlertDispatched={intrusionAlertDispatched}
          onFailedAttempt={handleFailedAuthAttempt}
        />
      )}

      {/* Settings Panel Modal */}
      {showSettings && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="max-w-md w-full p-6 rounded-2xl bg-slate-900 border border-white/[0.1] shadow-2xl font-sans text-xs flex flex-col gap-4 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Settings size={16} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-white">System Settings</h3>
                  <p className="text-[11px] text-slate-400">AI provider, server uplink & authentication</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSettings(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveKey} className="flex flex-col gap-3.5">
              {/* Primary AI Provider Selector */}
              <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-slate-950/60 border border-white/[0.06]">
                <label className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                  <Cpu size={14} className="text-indigo-400" /> AI Engine Provider
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAiProvider('gemini');
                      geminiClient.setProvider('gemini');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      aiProvider === 'gemini'
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-sm shadow-indigo-500/20'
                        : 'bg-slate-900/80 border-white/[0.08] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ☁️ Google Gemini
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAiProvider('ollama');
                      geminiClient.setProvider('ollama');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      aiProvider === 'ollama'
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-sm shadow-indigo-500/20'
                        : 'bg-slate-900/80 border-white/[0.08] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🦙 Ollama Local
                  </button>
                </div>

                {/* Ollama Model Selector & Status */}
                {aiProvider === 'ollama' && (
                  <div className="flex flex-col gap-2 mt-2 pt-2.5 border-t border-white/[0.06]">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] text-slate-400">Active Local Model</label>
                      <span className="text-[9px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        ● Local Daemon (127.0.0.1:11434)
                      </span>
                    </div>
                    <select
                      value={ollamaModel}
                      onChange={(e) => setOllamaModel(e.target.value)}
                      className="w-full bg-slate-900 border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-400 font-sans cursor-pointer"
                    >
                      {availableOllamaModels.map(m => (
                        <option key={m} value={m}>{m} (Local Model)</option>
                      ))}
                    </select>
                    
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                      Runs 100% locally on your computer with zero API keys and zero internet usage required.
                    </p>
                  </div>
                )}

                {/* Gemini Model Configuration */}
                {aiProvider === 'gemini' && (
                  <div className="flex flex-col gap-1.5 mt-2 pt-2.5 border-t border-white/[0.06]">
                    <label className="text-[11px] text-slate-300 font-medium">Gemini API Key</label>
                    <div className="relative flex items-center">
                      <input
                        type={showKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Paste Gemini API Key"
                        className="w-full bg-slate-950 border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-400 pr-9 font-mono"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-2.5 text-slate-400 hover:text-white"
                      >
                        {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 leading-normal font-sans">
                      Used for Gemini 2.0 Flash cloud execution. Free keys available at Google AI Studio.
                    </span>
                  </div>
                )}
              </div>

              {/* Server URL */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-slate-300 font-medium flex items-center gap-1.5">
                    <Radio size={12} className="text-indigo-400" /> Backend Server URL
                  </label>
                  <span className="text-[9px] text-slate-400 font-mono bg-slate-800 px-1.5 py-0.5 rounded">
                    Remote Relay
                  </span>
                </div>
                <input
                  type="text"
                  value={serverIp}
                  onChange={(e) => setServerIpState(e.target.value)}
                  placeholder="https://your-backend.ngrok-free.app"
                  className="w-full bg-slate-950 border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-400 font-mono"
                />
              </div>

              {/* Biometric Face Lock Security */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/[0.06] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-white font-medium text-xs">
                    <Fingerprint size={14} className="text-indigo-400" /> Face Biometrics
                  </div>
                  <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full ${hasOwnerProfile() ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                    {hasOwnerProfile() ? 'Enrolled' : 'Not Registered'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Webcam facial recognition unlocks your workspace automatically when authorized.
                </p>

                <div className="flex gap-2 mt-0.5">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowSettings(false);
                      setIsLocked(true);
                      setBiometricMode('face_enroll');
                    }}
                    className="flex-1 py-1.5 px-3 rounded-xl border border-white/[0.1] bg-slate-900 hover:bg-slate-850 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <UserPlus size={12} /> {hasOwnerProfile() ? 'Re-enroll Face' : 'Register Face'}
                  </button>

                  {hasOwnerProfile() && (
                    <button 
                      type="button"
                      onClick={() => {
                        clearOwnerProfile();
                        setTick(t => t + 1);
                      }}
                      className="py-1.5 px-3 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium transition-colors cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* System Passcode / PIN */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/[0.06] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-white font-medium text-xs">
                    <KeyRound size={14} className="text-indigo-400" /> System Passcode / PIN
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    Default: {systemPasscode || 'jasper'}
                  </span>
                </div>

                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={tempPasscode}
                    onChange={(e) => setTempPasscode(e.target.value)}
                    placeholder="New lock passcode"
                    className="bg-slate-950 border border-white/[0.1] rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-400 font-mono flex-1 transition-all"
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      if (!tempPasscode.trim()) return;
                      const newPass = tempPasscode.trim();
                      setSystemPasscode(newPass);
                      localStorage.setItem('jasper_system_passcode', newPass);
                      setPasscodeSavedBadge(true);
                      setTimeout(() => setPasscodeSavedBadge(false), 2500);
                    }}
                    className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-750 border border-white/[0.1] rounded-xl transition-all cursor-pointer"
                  >
                    Save
                  </button>
                </div>
                {passcodeSavedBadge && (
                  <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 size={11} /> Passcode saved
                  </span>
                )}
              </div>

              <button 
                type="submit" 
                className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors shadow-sm shadow-indigo-500/20 cursor-pointer mt-1"
              >
                Save Preferences
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Voice Synthesis & Dictation Controller Core (Non-visual component) */}
      <VoiceController
        ref={voiceControllerRef}
        onStateChange={setJasperState}
        onCommandReceived={handleCommand}
        speakingText={speakingText}
        onSpeakingComplete={() => {
          setSpeakingText('');
          setJasperState('idle');
        }}
        triggerWake={triggerWakeOnMount}
      />

      {/* Modular Code-Split Modals Wrapped in React.Suspense */}
      <React.Suspense fallback={null}>
      {/* 1. PC Command Center Modal */}
      {showPcCommand && (
        <DraggableModalWrapper isOpen={showPcCommand} onClose={() => setShowPcCommand(false)} title="PC Command Center">
          <PcCommandCenterWidget onClose={() => setShowPcCommand(false)} />
        </DraggableModalWrapper>
      )}

      {/* 2. Browser Agent Modal */}
      {showBrowserAgent && (
        <DraggableModalWrapper isOpen={showBrowserAgent} onClose={() => setShowBrowserAgent(false)} title="Autonomous Browser Agent">
          <BrowserAgentWidget onClose={() => setShowBrowserAgent(false)} />
        </DraggableModalWrapper>
      )}

      {/* 3. Personal Assistant Modal */}
      {showPersonalAssistant && (
        <DraggableModalWrapper isOpen={showPersonalAssistant} onClose={() => setShowPersonalAssistant(false)} title="Personal AI Assistant">
          <PersonalAssistantWidget 
            onClose={() => setShowPersonalAssistant(false)} 
            onSpeakBriefing={(text) => {
              setSpeakingText(text);
              setShowPersonalAssistant(false);
            }}
          />
        </DraggableModalWrapper>
      )}

      {/* 4. Memory Dashboard Modal */}
      {showMemory && (
        <DraggableModalWrapper isOpen={showMemory} onClose={() => setShowMemory(false)} title="Semantic Vector Memory">
          <MemoryDashboardWidget onClose={() => setShowMemory(false)} />
        </DraggableModalWrapper>
      )}

      {/* 5. Skills Store Modal */}
      {showSkillsStore && (
        <DraggableModalWrapper isOpen={showSkillsStore} onClose={() => setShowSkillsStore(false)} title="AI Skills & App Store">
          <SkillsStoreWidget onClose={() => setShowSkillsStore(false)} />
        </DraggableModalWrapper>
      )}

      {/* 6. Analytics Modal */}
      {showAnalytics && (
        <DraggableModalWrapper isOpen={showAnalytics} onClose={() => setShowAnalytics(false)} title="System Analytics & Insights">
          <AnalyticsWidget onClose={() => setShowAnalytics(false)} />
        </DraggableModalWrapper>
      )}

      {/* 7. Live AI Avatar Modal */}
      {showAvatar && (
        <DraggableModalWrapper isOpen={showAvatar} onClose={() => setShowAvatar(false)} title="Live AI Avatar & Synthesizer">
          <AiAvatarWidget 
            jasperState={jasperState}
            isSpeaking={jasperState === 'speaking'} 
            isListening={jasperState === 'listening'} 
            onClose={() => setShowAvatar(false)} 
          />
        </DraggableModalWrapper>
      )}

      {/* 8. Security Center Modal */}
      {showSecurity && (
        <DraggableModalWrapper isOpen={showSecurity} onClose={() => setShowSecurity(false)} title="Biometric Security Center">
          <SecurityCenterWidget 
            onClose={() => setShowSecurity(false)} 
            onLog={(msg, type) => addLog(msg, type)}
          />
        </DraggableModalWrapper>
      )}

      {/* 9. Smart Automation Builder Modal */}
      {showAutomation && (
        <DraggableModalWrapper isOpen={showAutomation} onClose={() => setShowAutomation(false)} title="Autonomous System Automation Engine">
          <AutomationBuilderWidget onClose={() => setShowAutomation(false)} />
        </DraggableModalWrapper>
      )}

      {/* 10. Mission Control Hero Screen Modal */}
      {showMissionControl && (
        <DraggableModalWrapper isOpen={showMissionControl} onClose={() => setShowMissionControl(false)} title="Mission Control Master Hub">
          <MissionControlWidget 
            onClose={() => setShowMissionControl(false)} 
            onNavigate={(target) => {
              if (target === 'pcmaster') setShowPcMasterHub(true);
              if (target === 'musicmaster') setShowMusicMasterHub(true);
              if (target === 'devicesmaster') setShowDevicesMasterHub(true);
              if (target === 'aimaster') setShowAiMasterHub(true);
              if (target === 'sports') setShowSportsHub(true);
              if (target === 'weather') {
                handleCommand('Give me a full local weather forecast and atmospheric report.');
              }
            }}
          />
        </DraggableModalWrapper>
      )}

      {/* 11. PC Master Control Hub */}
      {showPcMasterHub && (
        <DraggableModalWrapper isOpen={showPcMasterHub} onClose={() => setShowPcMasterHub(false)} title="PC Master Control Hub">
          <PcMasterHubWidget onClose={() => setShowPcMasterHub(false)} />
        </DraggableModalWrapper>
      )}

      {/* 12. Music & Media Master Hub */}
      {showMusicMasterHub && (
        <DraggableModalWrapper isOpen={showMusicMasterHub} onClose={() => setShowMusicMasterHub(false)} title="Music & Audio Master Hub">
          <MusicMasterHubWidget onClose={() => setShowMusicMasterHub(false)} />
        </DraggableModalWrapper>
      )}

      {/* 13. Smart Devices Master Hub */}
      {showDevicesMasterHub && (
        <DraggableModalWrapper isOpen={showDevicesMasterHub} onClose={() => setShowDevicesMasterHub(false)} title="Smart Devices Hub">
          <DevicesMasterHubWidget onClose={() => setShowDevicesMasterHub(false)} />
        </DraggableModalWrapper>
      )}

      {/* 14. AI & 3D Intelligence Master Hub */}
      {showAiMasterHub && (
        <DraggableModalWrapper isOpen={showAiMasterHub} onClose={() => setShowAiMasterHub(false)} title="AI Swarm & Intelligence Hub">
          <AiMasterHubWidget onClose={() => setShowAiMasterHub(false)} />
        </DraggableModalWrapper>
      )}

      {/* 15. Maps & Navigation Modal */}
      {showMaps && (
        <DraggableModalWrapper isOpen={showMaps} onClose={() => setShowMaps(false)} title="Spatial Maps & GPS Navigation" maxWidth="max-w-6xl">
          <MapsWidget 
            onClose={() => setShowMaps(false)} 
            initialDestination={getModalData('maps')?.initialDestination || ''}
            initialContact={getModalData('maps')?.initialContact || ''}
            initialTab={getModalData('maps')?.initialTab || 'navigation'}
          />
        </DraggableModalWrapper>
      )}

      {/* 15.1 Phone Sentinel & Offline Alerts Modal */}
      {showPhoneSentinel && (
        <DraggableModalWrapper isOpen={showPhoneSentinel} onClose={() => setShowPhoneSentinel(false)} title="Phone Sentinel & Offline Cloud Alerts" maxWidth="max-w-6xl">
          <PhoneSentinelWidget onClose={() => setShowPhoneSentinel(false)} />
        </DraggableModalWrapper>
      )}

      {/* 16. Football Sports Hub Modal */}
      {showSportsHub && (
        <DraggableModalWrapper isOpen={showSportsHub} onClose={() => setShowSportsHub(false)} title="Sports & Live Score Hub">
          <SportsHubWidget onClose={() => setShowSportsHub(false)} />
        </DraggableModalWrapper>
      )}

      {/* 17. Custom Themes Selector Modal */}
      {showThemes && (
        <DraggableModalWrapper isOpen={showThemes} onClose={() => setShowThemes(false)} title="Custom UI Themes" maxWidth="max-w-xl">
          <div className="bg-slate-950/90 border border-purple-500/30 rounded-2xl p-6 text-slate-100 w-full mx-auto relative overflow-hidden backdrop-blur-xl shadow-2xl">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 border border-purple-500/40 rounded-xl text-purple-400">
                  <Palette className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Custom Themes</h2>
                  <p className="text-xs text-slate-400">Select interface color theme</p>
                </div>
              </div>
              <button onClick={() => setShowThemes(false)} className="p-2 rounded-xl bg-slate-800/60 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'obsidian-modern', name: 'Obsidian Modern (Bento & Frosted Glass)', color: 'bg-gradient-to-tr from-indigo-500 to-sky-400 text-white', border: 'border-indigo-400' },
                { id: 'matte-gold', name: 'Obsidian Gold (Matte Black & Gold)', color: 'bg-amber-400 text-black', border: 'border-amber-400' },
                { id: 'cyber-blue', name: 'Cyber Blue', color: 'bg-cyan-500 text-black', border: 'border-cyan-500' },
                { id: 'matrix-green', name: 'Matrix Green', color: 'bg-emerald-500 text-black', border: 'border-emerald-500' },
                { id: 'iron-man-red', name: 'Iron Man Red', color: 'bg-rose-600 text-white', border: 'border-rose-600' },
                { id: 'purple-neon', name: 'Purple Neon', color: 'bg-purple-500 text-white', border: 'border-purple-500' },
                { id: 'amoled-black', name: 'AMOLED Black', color: 'bg-black text-white', border: 'border-slate-700' },
                { id: 'pure-white', name: 'Pure White', color: 'bg-slate-100 text-slate-950', border: 'border-slate-300' },
              ].map(theme => (
                <button
                  key={theme.id}
                  onClick={() => {
                    setCurrentTheme(theme.id);
                  }}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-2.5 text-xs font-semibold transition-all cursor-pointer ${
                    currentTheme === theme.id 
                      ? 'bg-indigo-500/20 border-indigo-400 text-indigo-200 ring-2 ring-indigo-500/40 shadow-lg' 
                      : 'bg-slate-900/80 border-white/[0.08] text-slate-300 hover:border-white/[0.2] hover:bg-slate-900'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full ${theme.color} border shadow-lg flex items-center justify-center`}>
                    {currentTheme === theme.id && <CheckCircle2 className="w-4 h-4 text-white drop-shadow" />}
                  </div>
                  <span className="text-center text-[11px] leading-tight">{theme.name}</span>
                </button>
              ))}
            </div>
          </div>
        </DraggableModalWrapper>
      )}

      {/* 18. J.A.S.P.E.R. Agentic Actions Modal */}
      {showAgenticActions && (
        <DraggableModalWrapper isOpen={showAgenticActions} onClose={() => { setShowAgenticActions(false); setAgenticQuery(''); }} title="Agentic Shell Actions">
          <AgenticActionsWidget 
            initialQuery={agenticQuery}
            onClose={() => {
              setShowAgenticActions(false);
              setAgenticQuery('');
            }} 
          />
        </DraggableModalWrapper>
      )}

      {/* 19. JASPER User Manual & Guide Modal */}
      {showManual && (
        <DraggableModalWrapper isOpen={showManual} onClose={() => setShowManual(false)} title="JASPER Master Guide">
          <UserManualWidget 
            onClose={() => setShowManual(false)} 
            onExecuteCommand={(cmd) => handleTextSubmit(cmd)} 
          />
        </DraggableModalWrapper>
      )}

      {/* 20. Health & Fitband Hub Modal */}
      {showHealthHub && (
        <DraggableModalWrapper isOpen={showHealthHub} onClose={() => setShowHealthHub(false)} title="Health & Fitband Hub" maxWidth="max-w-6xl">
          <div className="w-full flex-1">
            <HealthFitbandWidget 
              onClose={() => setShowHealthHub(false)} 
              onAskJasper={(query) => {
                setShowHealthHub(false);
                handleCommand(query);
              }}
            />
          </div>
        </DraggableModalWrapper>
      )}

      {/* 21. Connect to Laptop Mode Modal */}
      {showLaptopConnect && (
        <DraggableModalWrapper isOpen={showLaptopConnect} onClose={() => setShowLaptopConnect(false)} title="Dual Laptop Cluster Link" maxWidth="max-w-5xl">
          <LaptopConnectModal 
            onClose={() => setShowLaptopConnect(false)} 
            onLog={(text, type) => console.log(`[LAPTOP] ${text}`)}
          />
        </DraggableModalWrapper>
      )}

      {/* 22. Chrome-Style Live Translation Overlay */}
      <LiveTranslationWidget 
        isOpen={showLiveTranslation} 
        onClose={() => setShowLiveTranslation(false)} 
        autoTranslateEnabled={autoTranslateEnabled}
        onToggleAutoTranslate={(val) => setAutoTranslateEnabled(val)}
      />

      {/* 23. WhatsApp & Instagram Automated Messaging & Call Hub Modal */}
      {showSocialAutoReply && (
        <DraggableModalWrapper isOpen={showSocialAutoReply} onClose={() => setShowSocialAutoReply(false)} title="WhatsApp & Instagram Auto-Reply Hub" maxWidth="max-w-6xl">
          <SocialAutoReplyWidget onClose={() => setShowSocialAutoReply(false)} />
        </DraggableModalWrapper>
      )}

      {/* 23b. Autonomous Telephony & AI Receptionist Hub Modal */}
      {showTelephony && (
        <DraggableModalWrapper isOpen={showTelephony} onClose={() => setShowTelephony(false)} title="JASPER Telephony Core & Multi-Line Receptionist" maxWidth="max-w-5xl">
          <TelephonyReceptionistWidget onClose={() => setShowTelephony(false)} />
        </DraggableModalWrapper>
      )}

      {/* 23c. Multi-Platform Cloud Downloads Modal (APK / EXE / OS) */}
      {showDownloadsModal && (
        <PlatformDownloadsModal onClose={() => setShowDownloadsModal(false)} />
      )}

      {/* 24. 3D Hologram & Blender Studio Modal */}
      {showHologramModal && (
        <DraggableModalWrapper isOpen={showHologramModal} onClose={() => { setShowHologramModal(false); setHologramQuery(''); }} title="3D Hologram & Blender Studio" maxWidth="max-w-7xl">
          <HolographicAnswerModal 
            initialQuery={hologramQuery}
            initialTab={getModalData('hologram')?.initialTab || 'viewport'}
            onClose={() => {
              setShowHologramModal(false);
              setHologramQuery('');
            }} 
          />
        </DraggableModalWrapper>
      )}

      {/* 25. JASPER AI Agent Hub Modal */}
      {showAgentHub && (
        <DraggableModalWrapper isOpen={showAgentHub} onClose={() => setShowAgentHub(false)} title="JASPER AI Agent Hub" maxWidth="max-w-6xl">
          <JasperAgentHubWidget onClose={() => setShowAgentHub(false)} />
        </DraggableModalWrapper>
      )}

      {/* 26. AI Video Creator & YouTube Studio Modal */}
      {showVideoStudio && (
        <DraggableModalWrapper isOpen={showVideoStudio} onClose={() => setShowVideoStudio(false)} title="AI Video Creator & YouTube Studio" maxWidth="max-w-7xl">
          <div className="w-full h-full min-h-[640px] flex-1 relative flex flex-col">
            <JasperVideoStudioApp onClose={() => setShowVideoStudio(false)} />
          </div>
        </DraggableModalWrapper>
      )}

      {/* 27. JASPER Payment & Guardian Budget Modal */}
      {showPaymentBalance && (
        <DraggableModalWrapper isOpen={showPaymentBalance} onClose={() => setShowPaymentBalance(false)} title="JASPER Pay Vault & Guardian Hub" maxWidth="max-w-6xl">
          <div className="w-full h-full min-h-[580px] flex-1 relative flex flex-col">
            <PaymentBalanceWidget onClose={() => setShowPaymentBalance(false)} />
          </div>
        </DraggableModalWrapper>
      )}


      {/* Voice Triggered Standalone App Overlay Windows */}
      {showSearchEngine && (
        <DraggableModalWrapper isOpen={showSearchEngine} onClose={() => setShowSearchEngine(false)} title="JASPER AI Search Engine" maxWidth="max-w-6xl">
          <div className="w-full h-full min-h-[520px] flex-1 relative flex flex-col">
            <JasperSearchApp />
          </div>
        </DraggableModalWrapper>
      )}

      {showBrowser && (
        <DraggableModalWrapper isOpen={showBrowser} onClose={() => setShowBrowser(false)} title="JASPER Web Browser" maxWidth="max-w-6xl">
          <div className="w-full h-full min-h-[560px] flex-1 relative flex flex-col">
            <JasperBrowserApp />
          </div>
        </DraggableModalWrapper>
      )}

      {showFileManager && (
        <DraggableModalWrapper isOpen={showFileManager} onClose={() => setShowFileManager(false)} title="JASPER File Explorer" maxWidth="max-w-6xl">
          <div className="w-full h-full min-h-[480px] flex-1 relative flex flex-col">
            <JasperFileManagerApp />
          </div>
        </DraggableModalWrapper>
      )}

      {showCodeStudio && (
        <DraggableModalWrapper isOpen={showCodeStudio} onClose={() => setShowCodeStudio(false)} title="JASPER Code Studio" maxWidth="max-w-6xl">
          <div className="w-full h-full min-h-[540px] flex-1 relative flex flex-col">
            <JasperCodeStudioApp />
          </div>
        </DraggableModalWrapper>
      )}

      {showNotesPlanner && (
        <DraggableModalWrapper isOpen={showNotesPlanner} onClose={() => setShowNotesPlanner(false)} title="JASPER Notes & Task Planner" maxWidth="max-w-6xl">
          <div className="w-full h-full min-h-[500px] flex-1 relative flex flex-col">
            <JasperNotesPlannerApp />
          </div>
        </DraggableModalWrapper>
      )}

      {showCalculator && (
        <DraggableModalWrapper isOpen={showCalculator} onClose={() => setShowCalculator(false)} title="JASPER Scientific Calculator" maxWidth="max-w-4xl">
          <div className="w-full h-full min-h-[480px] flex-1 relative flex flex-col">
            <JasperCalculatorApp />
          </div>
        </DraggableModalWrapper>
      )}
      </React.Suspense>

      {/* 19. Lightbox Image Preview Modal */}
      {lightboxImage && (
        <div className="image-lightbox-backdrop" onClick={() => setLightboxImage(null)}>
          <div className="image-lightbox-content" onClick={e => e.stopPropagation()}>
            <button 
              type="button"
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-cyan-950/80 border border-cyan-400 text-cyan-200 flex items-center justify-center hover:bg-cyan-900 transition-all font-bold cursor-pointer"
              onClick={() => setLightboxImage(null)}
            >
              ✕
            </button>
            <img src={lightboxImage} alt="Uploaded attachment full preview" className="image-lightbox-img" />
          </div>
        </div>
      )}

      {/* 20. Global Critical Emergency Alert Toast */}
      {activeEmergency && (
        <EmergencyAlertToast
          emergency={activeEmergency}
          onDismiss={handleDismissEmergency}
          onOpenHub={() => setShowSocialAutoReply(true)}
        />
      )}

      {/* 21. Real-Time Autonomous Voice Call from JASPER (Priority Line 2) */}
      {incomingJasperCall && (
        <JasperIncomingCallModal
          callData={incomingJasperCall}
          onDecline={() => setIncomingJasperCall(null)}
          onRelaySuccess={() => {
            setIncomingJasperCall(null);
            setShowTelephony(true);
          }}
        />
      )}
    </div>
  );
}
