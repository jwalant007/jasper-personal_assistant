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
import PcCommandCenterWidget from './components/PcCommandCenterWidget';
import BrowserAgentWidget from './components/BrowserAgentWidget';
import PersonalAssistantWidget from './components/PersonalAssistantWidget';
import MemoryDashboardWidget from './components/MemoryDashboardWidget';
import SkillsStoreWidget from './components/SkillsStoreWidget';
import AnalyticsWidget from './components/AnalyticsWidget';
import AiAvatarWidget from './components/AiAvatarWidget';
import SecurityCenterWidget from './components/SecurityCenterWidget';
import AutomationBuilderWidget from './components/AutomationBuilderWidget';
import MissionControlWidget from './components/MissionControlWidget';
import MapsWidget from './components/MapsWidget';
import SportsHubWidget from './components/SportsHubWidget';
import AgenticActionsWidget from './components/AgenticActionsWidget';
import UserManualWidget from './components/UserManualWidget';
import HealthFitbandWidget from './components/HealthFitbandWidget';
import LaptopConnectModal from './components/LaptopConnectModal';
import geminiClient from './utils/geminiClient';
import { getServerIp, setServerIp } from './utils/apiConfig.js';
import { getPhoneBrainMode, setPhoneBrainMode, togglePhoneBrainMode } from './utils/mobileBrain.js';

import { 
  extractFaceVector, 
  calculateMatchConfidence, 
  getOwnerProfile, 
  saveOwnerProfile, 
  clearOwnerProfile, 
  hasOwnerProfile,
  captureWebcamFrameAsBase64
} from './utils/faceBiometrics.js';
import { Shield, Settings, Send, Eye, EyeOff, HelpCircle, ChevronDown, Tv, Lock, Cpu, Sparkles, Smartphone, Camera, Mic, Radio, Fingerprint, RefreshCw, AlertTriangle, UserCheck, UserX, UserPlus, Trash2, Monitor, Globe, Calendar, Brain, Store, BarChart3, Bot, ShieldCheck, Workflow, LayoutDashboard, MapPin, Trophy, Palette, CheckCircle2, PhoneCall, BookOpen, Activity, Heart, Laptop } from 'lucide-react';

export default function App() {
  const [jasperState, setJasperState] = useState('idle'); // idle, listening, processing, speaking
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [reminders, setReminders] = useState([]);
  const [showReminderAlert, setShowReminderAlert] = useState(null);
  const [tick, setTick] = useState(0);
  const [showPcCommand, setShowPcCommand] = useState(false);
  const [showBrowserAgent, setShowBrowserAgent] = useState(false);
  const [showPersonalAssistant, setShowPersonalAssistant] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [showSkillsStore, setShowSkillsStore] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAvatar, setShowAvatar] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [showAutomation, setShowAutomation] = useState(false);
  const [showMissionControl, setShowMissionControl] = useState(false);
  const [showMaps, setShowMaps] = useState(false);
  const [showSportsHub, setShowSportsHub] = useState(false);
  const [showAgenticActions, setShowAgenticActions] = useState(false);
  const [showHealthHub, setShowHealthHub] = useState(false);
  const [showLaptopConnect, setShowLaptopConnect] = useState(false);
  const [isPhoneBrainMode, setIsPhoneBrainModeState] = useState(() => getPhoneBrainMode());
  const [agenticQuery, setAgenticQuery] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('jasper_theme') || 'cyber-blue';
  });

  useEffect(() => {
    const handleBrainChange = (e) => {
      if (e?.detail?.enabled !== undefined) {
        setIsPhoneBrainModeState(e.detail.enabled);
      }
    };
    window.addEventListener('jasper_phone_brain_change', handleBrainChange);
    return () => window.removeEventListener('jasper_phone_brain_change', handleBrainChange);
  }, []);

  useEffect(() => {
    localStorage.setItem('jasper_theme', currentTheme);
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);
  const [pastChats, setPastChats] = useState(() => {
    const saved = localStorage.getItem('jasper_past_chats');
    return saved ? JSON.parse(saved) : [
      { 
        id: 1, 
        query: 'who is narendra modi', 
        response: 'Narendra Damodardas Modi is an Indian politician who has served as the prime minister of India since 2014. Modi was the chief minister of Gujarat from 2001 to 2014 and is the member of parliament for Varanasi. He is a member of the Bharatiya Janata Party and of the Rashtriya Swayamsevak Sangh, a right-wing Hindutva paramilitary volunteer organisation. He is the longest-serving prime minister outside the Indian National Congress. Modi was born and raised in Vadnagar, Bombay State, where he completed his secondary education. He was introduced to the RSS at the age of eight, becoming a full-time worker for the organisation in Gujarat in 1971. The RSS assigned him to the BJP in 1985, and he rose through the party hierarchy, becoming general secretary in 1998. In 2001, Modi was appointed chief minister of Gujarat and elected to the legislative assembly soon after.', 
        timestamp: new Date().toLocaleString() 
      }
    ];
  });
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const [apiKey, setApiKey] = useState(geminiClient.apiKey);
  const [serverIp, setServerIpState] = useState(getServerIp);
  const [showSettings, setShowSettings] = useState(false);

  const [showKey, setShowKey] = useState(false);
  // Robust Mobile Device & Small Screen Detector
  const checkIsMobileDevice = () => {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent || navigator.vendor || window.opera || '';
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isNarrow = window.innerWidth < 960;
    return isMobileUA || isNarrow;
  };

  const [isMobileScreen, setIsMobileScreen] = useState(checkIsMobileDevice);
  const [viewMode, setViewMode] = useState(() => checkIsMobileDevice() ? 'mobile' : 'pc');
  const [showSidebar, setShowSidebar] = useState(true);
  const [speakingText, setSpeakingText] = useState('');
  const [triggerWakeOnMount, setTriggerWakeOnMount] = useState(false);
  const [showTvRemote, setShowTvRemote] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [passcode, setPasscode] = useState('');
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [showPhoneControl, setShowPhoneControl] = useState(false);
  const [biometricMode, setBiometricMode] = useState('idle'); // idle, face_scan, voice_scan, success, failed
  const [lastScanMode, setLastScanMode] = useState(null); // tracks which scan was attempted before failure
  const [scanStatusText, setScanStatusText] = useState('');
  const [scanProgress, setScanProgress] = useState(0);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [showAudioPage, setShowAudioPage] = useState(false);

  // Auto-detect mobile screen on load & window resize
  useEffect(() => {
    const handleResize = () => {
      const isMob = checkIsMobileDevice();
      setIsMobileScreen(isMob);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobileLayout = viewMode === 'mobile' || isMobileScreen;

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

  const speakWelcomeBoss = () => {
    try {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        
        let spoken = false;
        const speak = () => {
          if (spoken || !window.speechSynthesis) return;
          spoken = true;
          window.speechSynthesis.cancel();
          
          const utterance = new SpeechSynthesisUtterance("Welcome boss");
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
      setSpeakingText("Welcome boss");
    } catch (e) {
      console.warn("TTS Welcome voice failed:", e);
    }
  };

  const handleUnlockSuccess = () => {
    if (unlockingRef.current) return;
    unlockingRef.current = true;

    setBiometricMode('success');
    setScanStatusText('IDENTITY CONFIRMED. ACCESS GRANTED!');
    playFuturisticChime();
    speakWelcomeBoss();
    setTimeout(() => {
      setIsLocked(false);
      setBiometricMode('idle');
      unlockingRef.current = false;
    }, 1200);
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
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
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
    } else {
      console.warn("SpeechRecognition not supported in this browser. Mocking voice scan...");
      setTimeout(() => {
        setScanStatusText('MOCK VOICE RECOGNITION: SPEAK NOW...');
        setTimeout(() => {
          setVoiceTranscript("Authorization Delta-Nine, unlock system");
          setScanStatusText('VOICEPRINT MATCHED (DEVELOPER OVERRIDE)');
          handleUnlockSuccess();
        }, 1500);
      }, 800);
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
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
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
        const expired = prev.filter(r => r.targetTime <= now);
        const active = prev.filter(r => r.targetTime > now);
        
        if (expired.length > 0) {
          playFuturisticChime();
          setShowReminderAlert(expired[0]);
        }
        return active;
      });
      setTick(t => t + 1);
    }, 1000);

    return () => clearInterval(interval);
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
      setShowSecurityCenter(true);
      return;
    }
    const frame = captureWebcamFrameAsBase64(videoRef.current);
    if (!frame) {
      alert("Please ensure your webcam is enabled in Face Unlock / Security Center.");
      setShowSecurityCenter(true);
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

  // Process User Command (Voice or Text)
  const handleCommand = async (commandText) => {
    if (!commandText.trim()) return;

    // Intercept Agentic Actions commands (book table, call restaurant, reserve, agentic action)
    const agenticRegex = /(book|reserve|call restaurant|agentic action|schedule appointment)/i;
    if (agenticRegex.test(commandText)) {
      setAgenticQuery(commandText);
      setShowAgenticActions(true);
      const response = `Initiating J.A.S.P.E.R. Agentic Actions module for query: "${commandText}"`;
      const newChat = {
        id: Date.now(),
        query: commandText,
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
    const match = commandText.match(reminderRegex);
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
        query: commandText,
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

    // 1. Query Gemini / Fallback Handler
    const response = await geminiClient.sendQuery(commandText, (text, type) => {
      console.log(`[${type.toUpperCase()}] ${text}`);
    });

    // 2. Add new chat to history
    const newChat = {
      id: Date.now(),
      query: commandText,
      response: response,
      timestamp: new Date().toLocaleString()
    };

    setPastChats((prev) => [newChat, ...prev]);
    setSelectedChatId(newChat.id);

    // 3. Set Speaking Text for Text-to-Speech
    setSpeakingText(response);
    
    // Play success chime
    if (voiceControllerRef.current) {
      voiceControllerRef.current.playSuccess();
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    const cmd = manualInput;
    setManualInput('');
    handleCommand(cmd);
  };

  const handleSaveKey = (e) => {
    e.preventDefault();
    geminiClient.setApiKey(apiKey);
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
  const renderResponseText = (text) => {
    if (!text) return null;
    const imgRegex = /!\[(.*?)\]\((.*?)\)/;
    const match = text.match(imgRegex);
    if (match) {
      const cleanText = text.replace(imgRegex, '').replace('[IMAGE]', '').trim();
      return (
        <div className="flex flex-col gap-4">
          <p className="whitespace-pre-wrap text-[20px] leading-relaxed" style={{ fontSize: '20px' }}>{cleanText}</p>
          <div className="relative border border-cyan-500/20 rounded-lg overflow-hidden bg-black/40 p-2 self-start max-w-lg">
            <img src={match[2]} alt={match[1]} className="max-w-full rounded shadow-[0_0_15px_rgba(0,240,255,0.2)]" />
          </div>
        </div>
      );
    }
    return <p className="whitespace-pre-wrap leading-relaxed text-[20px]" style={{ fontSize: '20px' }}>{text}</p>;
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

  return (
    <div className={`relative flex flex-col overflow-hidden bg-slate-950 text-cyan-50 select-none ${viewMode === 'mobile' && !isMobileScreen ? 'w-[360px] h-[800px] max-w-[100vw] max-h-[100dvh] mx-auto my-auto rounded-2xl border border-cyan-500/40 shadow-[0_0_50px_rgba(0,240,255,0.25)]' : 'w-full h-screen'}`}>
      
      {/* Electron Drag Region */}
      {typeof window !== 'undefined' && (window.electronAPI || (navigator.userAgent && navigator.userAgent.toLowerCase().includes('electron'))) ? (
        <div style={{ WebkitAppRegion: 'drag', height: '24px', width: '100%', position: 'absolute', top: 0, left: 0, zIndex: 9999, pointerEvents: 'none' }}></div>
      ) : null}

      {/* Background Holographic Grid */}
      <div className="hologram-grid" />
      
      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden z-10 w-full h-full">
        
        {/* Left Sidebar */}
        {showSidebar && (
          <aside className={`sidebar-panel p-3 sm:p-5 flex flex-col justify-between h-full select-none shrink-0 z-20 border-r border-cyan-500/20 bg-slate-950/98 backdrop-blur-2xl transition-all duration-300 ${isMobileLayout ? 'w-[200px] xs:w-[230px] sm:w-[270px] relative' : 'w-[280px] relative'}`}>
            <div className="flex flex-col gap-4 overflow-y-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse glow-green" />
                  <div className="flex flex-col">
                    <span className="font-orbitron font-extrabold text-sm tracking-widest text-cyan-400 glow-cyan leading-none">
                      JASPER
                    </span>
                    <span className="font-mono text-[9px] text-sky-500 tracking-wider mt-0.5">
                      AI command hub
                    </span>
                  </div>
                </div>
                {isMobileLayout && (
                  <button 
                    onClick={() => setShowSidebar(false)}
                    className="text-cyan-400 font-bold p-1 hover:text-cyan-200 text-xs font-mono border border-cyan-500/30 rounded bg-cyan-950/20"
                    title="Hide Sidebar"
                  >
                    ✕ HIDE
                  </button>
                )}
              </div>

              {/* Sidebar Action Buttons */}
              <button 
                onClick={() => {
                  handleNewChat();
                }}
                className="btn-sidebar w-full mt-2 sm:mt-4"
              >
                NEW CHAT
              </button>
              
              <button 
                onClick={() => {
                  setShowAudioPage(true);
                  handleReactorClick();
                }}
                className="btn-sidebar btn-sidebar-blue w-full flex gap-1.5 items-center justify-center font-bold"
              >
                <Radio size={12} className="text-cyan-400 animate-pulse" />
                AUDIO CONVERSATION
              </button>

              <button 
                onClick={() => {
                  handleImageGeneration();
                }}
                className="btn-sidebar btn-sidebar-purple w-full flex gap-1.5 items-center justify-center"
              >
                <Sparkles size={12} />
                IMAGE SYNTHESIS
              </button>

              <button 
                onClick={() => setShowManual(true)}
                className="btn-sidebar btn-sidebar-blue w-full flex gap-1.5 items-center justify-center font-bold border-cyan-500/50 bg-cyan-950/40 text-cyan-300"
              >
                <BookOpen size={12} className="text-cyan-400 animate-pulse" />
                USER MANUAL &amp; GUIDE
              </button>

              <div className="flex gap-1.5 w-full">
                <button 
                  onClick={() => {
                    setShowTvRemote(!showTvRemote);
                  }}
                  className="btn-sidebar btn-sidebar-blue flex-1 text-[10px] py-3 flex gap-1.5 items-center justify-center"
                >
                  <Tv size={12} />
                  CONNECT TV
                </button>
                <button 
                  onClick={() => setShowTvRemote(!showTvRemote)}
                  className="btn-sidebar btn-sidebar-blue px-3 flex items-center justify-center"
                >
                  <ChevronDown size={14} />
                </button>
              </div>
              
              <button 
                onClick={() => {
                  setShowPhoneControl(!showPhoneControl);
                }}
                className="btn-sidebar btn-sidebar-blue w-full flex gap-1.5 items-center justify-center"
              >
                <Smartphone size={12} />
                CONNECT PHONE
              </button>

              <button 
                onClick={() => {
                  setShowLaptopConnect(true);
                  if (isMobileLayout) setShowSidebar(false);
                }}
                className="btn-sidebar btn-sidebar-blue w-full flex gap-1.5 items-center justify-center font-bold border-cyan-400/60 bg-cyan-950/50 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.2)] hover:bg-cyan-900/60"
              >
                <Laptop size={14} className="text-cyan-400 animate-pulse" />
                CONNECT TO LAPTOP MODE
              </button>

              {/* Feature Modules Suite */}
              <div className="flex flex-col gap-1.5 border-t border-cyan-500/15 pt-2 mt-1">
                <span className="font-mono text-[9px] text-cyan-400 font-bold uppercase tracking-widest px-1">Feature Suite</span>
                
                <button onClick={() => setShowAgenticActions(!showAgenticActions)} className="btn-sidebar text-[10px] py-2 flex items-center justify-start gap-2 border-cyan-400/60 bg-cyan-500/20 text-cyan-300 font-extrabold shadow-[0_0_12px_rgba(6,182,212,0.25)]">
                  <PhoneCall size={12} className="text-cyan-400 animate-pulse" /> AGENTIC ACTIONS
                </button>
                <button onClick={() => setShowHealthHub(!showHealthHub)} className="btn-sidebar text-[10px] py-2 flex items-center justify-start gap-2 border-rose-500/40 bg-rose-500/10 text-rose-300 font-bold shadow-[0_0_12px_rgba(244,63,94,0.2)]">
                  <Activity size={12} className="text-rose-400 animate-pulse" /> HEALTH & FITBAND HUB
                </button>
                <button onClick={() => setShowMissionControl(!showMissionControl)} className="btn-sidebar text-[10px] py-2 flex items-center justify-start gap-2 border-cyan-500/40 bg-cyan-500/10 text-cyan-300 font-bold">
                  <LayoutDashboard size={12} className="text-cyan-400" /> MISSION CONTROL
                </button>
                <button onClick={() => setShowMaps(!showMaps)} className="btn-sidebar text-[10px] py-2 flex items-center justify-start gap-2 border-blue-500/30">
                  <MapPin size={12} className="text-blue-400" /> MAPS & NAVIGATION
                </button>
                <button onClick={() => setShowSportsHub(!showSportsHub)} className="btn-sidebar text-[10px] py-2 flex items-center justify-start gap-2 border-emerald-500/30">
                  <Trophy size={12} className="text-emerald-400" /> SPORTS HUB
                </button>
                <button onClick={() => setShowAutomation(!showAutomation)} className="btn-sidebar text-[10px] py-2 flex items-center justify-start gap-2 border-yellow-500/30">
                  <Workflow size={12} className="text-yellow-400" /> AUTOMATION BUILDER
                </button>
                <button onClick={() => setShowThemes(!showThemes)} className="btn-sidebar text-[10px] py-2 flex items-center justify-start gap-2 border-purple-500/30">
                  <Palette size={12} className="text-purple-400" /> CUSTOM THEMES
                </button>
                <button onClick={() => setShowPcCommand(!showPcCommand)} className="btn-sidebar text-[10px] py-2 flex items-center justify-start gap-2 border-cyan-500/30">
                  <Monitor size={12} className="text-cyan-400" /> PC COMMAND CENTER
                </button>
                <button onClick={() => setShowBrowserAgent(!showBrowserAgent)} className="btn-sidebar text-[10px] py-2 flex items-center justify-start gap-2 border-blue-500/30">
                  <Globe size={12} className="text-blue-400" /> BROWSER AGENT
                </button>
                <button onClick={() => setShowPersonalAssistant(!showPersonalAssistant)} className="btn-sidebar text-[10px] py-2 flex items-center justify-start gap-2 border-amber-500/30">
                  <Calendar size={12} className="text-amber-400" /> PERSONAL ASSISTANT
                </button>
                <button onClick={() => setShowMemory(!showMemory)} className="btn-sidebar text-[10px] py-2 flex items-center justify-start gap-2 border-purple-500/30">
                  <Brain size={12} className="text-purple-400" /> MEMORY DASHBOARD
                </button>
                <button onClick={() => setShowSkillsStore(!showSkillsStore)} className="btn-sidebar text-[10px] py-2 flex items-center justify-start gap-2 border-emerald-500/30">
                  <Store size={12} className="text-emerald-400" /> AI SKILLS STORE
                </button>
                <button onClick={() => setShowAnalytics(!showAnalytics)} className="btn-sidebar text-[10px] py-2 flex items-center justify-start gap-2 border-indigo-500/30">
                  <BarChart3 size={12} className="text-indigo-400" /> ANALYTICS
                </button>
                <button onClick={() => setShowAvatar(!showAvatar)} className="btn-sidebar text-[10px] py-2 flex items-center justify-start gap-2 border-violet-500/30">
                  <Bot size={12} className="text-violet-400" /> AI AVATAR
                </button>
                <button onClick={() => setShowSecurity(!showSecurity)} className="btn-sidebar text-[10px] py-2 flex items-center justify-start gap-2 border-emerald-500/30">
                  <ShieldCheck size={12} className="text-emerald-400" /> SECURITY CENTER
                </button>
              </div>

              <button 
                onClick={() => {
                  setShowDiagnostics(!showDiagnostics);
                }}
                className="btn-sidebar btn-sidebar-blue w-full flex gap-1.5 items-center justify-center text-[10px] py-3"
              >
                <Cpu size={12} />
                SYSTEM DIAGNOSTICS
              </button>

              {/* View Layout Mode Toggle inside Mobile Drawer */}
              {isMobileLayout && (
                <button 
                  onClick={() => {
                    handleToggleViewMode();
                  }}
                  className="btn-sidebar btn-sidebar-blue w-full text-[10px] py-2.5 mt-1 border-cyan-500/40 bg-cyan-950/30 text-cyan-300 font-bold"
                >
                  {viewMode === 'mobile' ? '💻 SWITCH TO PC LAYOUT' : '📱 SWITCH TO MOBILE LAYOUT'}
                </button>
              )}

              {/* System Routines Panel */}
              <div className="flex flex-col gap-3 mt-2">
                <span className="font-mono text-[9px] text-sky-500 uppercase tracking-widest border-b border-cyan-500/10 pb-1.5 font-bold">
                  System Routines
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      runMacro('cinema');
                    }}
                    className="btn-sidebar flex-1 text-[10px] py-2 flex items-center justify-center gap-1 border-cyan-500/30 hover:border-cyan-400 bg-cyan-950/15"
                  >
                    CINEMA
                  </button>
                  <button 
                    onClick={() => {
                      runMacro('study');
                    }}
                    className="btn-sidebar flex-1 text-[10px] py-2 flex items-center justify-center gap-1 border-cyan-500/30 hover:border-cyan-400 bg-cyan-950/15"
                  >
                    STUDY
                  </button>
                </div>
              </div>

              {/* Weather & Media Telemetry HUD */}
              <div className="flex flex-col gap-3 mt-3">
                <WeatherWidget />
                <MediaControllerWidget />
              </div>

              {/* Past Chats List */}
              <div className="flex flex-col gap-3 mt-4">
                <span className="font-mono text-[9px] text-sky-500 uppercase tracking-widest border-b border-cyan-500/10 pb-1.5 font-bold">
                  Past Chats
                </span>
                
                <div className="flex flex-col gap-2 overflow-y-auto max-h-[320px] pr-1">
                  {pastChats.map((chat) => (
                    <div 
                      key={chat.id} 
                      onClick={() => {
                        setSelectedChatId(chat.id);
                      }}
                      className={`chat-history-card flex items-center justify-between gap-2 text-left transition-all ${selectedChatId === chat.id ? 'active' : ''}`}
                    >
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-semibold text-[11px] text-cyan-100 truncate w-44">
                          {chat.query}
                        </span>
                        <span className="text-[8px] text-sky-600/70 font-mono mt-0.5">
                          {chat.timestamp}
                        </span>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setPastChats(prev => prev.filter(c => c.id !== chat.id));
                          if (selectedChatId === chat.id) {
                            setSelectedChatId(null);
                          }
                        }}
                        className="w-5 h-5 text-[9px] cursor-pointer btn-delete-chat"
                        title="Delete Chat"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Active Reminders countdown block */}
            {reminders.length > 0 && (
              <div className="flex flex-col gap-2 mt-4 border-t border-cyan-500/10 pt-3">
                <span className="font-mono text-[9px] text-sky-500 uppercase tracking-widest font-bold">
                  Active Reminders
                </span>
                <div className="flex flex-col gap-1.5 max-h-[150px] overflow-y-auto pr-1">
                  {reminders.map((r) => {
                    const timeLeft = Math.max(0, Math.round((r.targetTime - Date.now()) / 1000));
                    const mins = Math.floor(timeLeft / 60);
                    const secs = timeLeft % 60;
                    const timeString = `${mins}:${secs.toString().padStart(2, '0')}`;
                    
                    return (
                      <div key={r.id} className="flex justify-between items-center bg-cyan-950/10 border border-cyan-500/10 rounded px-2 py-1.5 text-[10px]">
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-cyan-100 truncate w-32 font-medium">{r.task}</span>
                          <span className="text-[8px] text-sky-600 font-mono">T-MINUS: {timeString}</span>
                        </div>
                        <button 
                          onClick={() => setReminders(prev => prev.filter(item => item.id !== r.id))}
                          className="text-red-400 hover:text-red-300 font-bold px-1"
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

            {/* Footer details in sidebar */}
            <div className="border-t border-cyan-500/10 pt-3 flex items-center justify-between text-[8px] font-mono text-sky-600/60 uppercase">
              <span>STARK CORE v4.1</span>
              <span>SECURE HUD</span>
            </div>
          </aside>
        )}

        {/* Right Workspace */}
        <div className="flex-1 flex flex-col h-full w-full overflow-hidden relative">
          
          {/* Header Panel */}
          <header className={`flex items-center justify-between border-b border-cyan-500/15 bg-black/40 backdrop-blur-md shrink-0 ${isMobileLayout ? 'px-3 py-2.5 gap-2' : 'px-6 py-4'}`}>
            <div className="flex items-center gap-2.5">
              <button 
                onClick={() => setShowSidebar(prev => !prev)}
                className="btn-hdr-action py-1.5 px-3 font-bold text-xs text-cyan-400 border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/60 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 z-30 shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                title="Toggle Navigation Menu"
              >
                <span className="text-sm font-extrabold leading-none">☰</span>
                <span className="text-[10px] font-mono uppercase tracking-wider">{showSidebar ? 'Hide Menu' : 'Menu'}</span>
              </button>
              <div className="flex flex-col shrink-0">
                <h1 className={`font-orbitron font-extrabold tracking-[0.2em] text-cyan-400 glow-cyan leading-none ${isMobileLayout ? 'text-xs sm:text-sm' : 'text-lg'}`}>
                  J.A.S.P.E.R
                </h1>
                {!isMobileLayout && (
                  <span className="font-mono text-[9px] text-sky-500 tracking-wider mt-1.5 uppercase font-semibold">
                    Futuristic AI assistant interface
                  </span>
                )}
              </div>
            </div>

            {/* Actions list */}
            <div className={`flex items-center gap-1.5 ${isMobileLayout ? 'justify-end' : 'gap-2'}`}>
              <button 
                onClick={() => setSelectedChatId(null)}
                className="btn-hdr-action text-[10px] py-1 px-2.5 font-mono font-extrabold text-cyan-300 border-cyan-400/60 bg-cyan-950/70 hover:bg-cyan-800/80 transition-all flex items-center gap-1 cursor-pointer shadow-[0_0_12px_rgba(0,240,255,0.3)]"
                title="Return to Main J.A.R.V.I.S. Home HUD"
              >
                🏠 {isMobileLayout ? 'HOME' : 'HOME HUD'}
              </button>

              <button 
                onClick={() => setShowLaptopConnect(true)}
                className="btn-hdr-action text-[10px] py-1 px-2 font-mono font-bold text-cyan-300 border-cyan-500/50 bg-cyan-950/60 hover:bg-cyan-900/80 transition-all flex items-center gap-1 cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                title="Connect to Laptop Mode"
              >
                <Laptop size={12} className="text-cyan-400" />
                {isMobileLayout ? '💻 Laptop' : '💻 Connect Laptop'}
              </button>

              <button 
                onClick={() => {
                  const updated = togglePhoneBrainMode();
                  setIsPhoneBrainModeState(updated);
                }}
                className={`btn-hdr-action text-[10px] py-1 px-2 font-mono font-bold transition-all flex items-center gap-1 ${
                  isPhoneBrainMode 
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.3)]' 
                    : 'text-cyan-400 hover:text-cyan-200'
                }`}
                title="Toggle Mobile Master Brain Mode"
              >
                {isPhoneBrainMode ? (isMobileLayout ? '📱 MOBILE CORE' : '📱 PHONE IS BRAIN') : (isMobileLayout ? '🧠 PC CORE' : '🧠 PC IS CORE')}
              </button>
              <button 
                onClick={() => setIsLocked(true)}
                className="btn-hdr-action text-[10px] py-1 px-2"
              >
                {isMobileLayout ? 'Lock' : 'Back to login'}
              </button>
              <button 
                onClick={() => setShowSettings(true)}
                className="btn-hdr-status glow-cyan cursor-pointer text-[10px] py-1 px-2"
              >
                {apiKey ? (isMobileLayout ? '● Online' : 'Core online') : (isMobileLayout ? '○ Offline' : 'Core offline')}
              </button>
            </div>
          </header>

          {/* Main Response Area */}
          <main className={`flex-1 overflow-hidden flex flex-col relative ${isMobileLayout ? 'p-2 sm:p-4' : 'p-6'}`}>
            <div className={`hud-panel flex-1 overflow-y-auto relative bg-gradient-to-b from-cyan-950/5 to-black/30 border border-cyan-500/10 ${isMobileLayout ? 'p-3 sm:p-5' : 'p-6'}`}>
              {/* Scanline laser */}
              <div className="absolute inset-x-0 top-0 h-0.5 bg-cyan-500/10 pointer-events-none animate-pulse" />
              
              {/* Loader */}
              {jasperState === 'processing' && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-20 animate-in fade-in duration-200">
                  <div className="relative w-12 h-12 flex items-center justify-center border border-cyan-500/30 rounded-full animate-spin" style={{ animationDuration: '6s' }}>
                    <div className="w-8 h-8 border border-cyan-400/50 rounded-full animate-ping" />
                  </div>
                  <div className="font-mono text-[9px] text-cyan-400 tracking-widest uppercase animate-pulse">
                    COMPUTING NEURAL PATHWAYS...
                  </div>
                </div>
              )}

              {/* Chat View */}
              {selectedChatId ? (
                <div className="flex flex-col gap-4 text-[20px] leading-relaxed text-slate-200" style={{ fontSize: '20px' }}>
                  <div className="flex justify-between items-center border-b border-cyan-500/10 pb-2 mb-1 select-none font-orbitron text-[9px] text-sky-500 tracking-wider">
                    <span className="truncate max-w-[70%]">QUERY: {pastChats.find(c => c.id === selectedChatId)?.query}</span>
                    <span className="shrink-0">{pastChats.find(c => c.id === selectedChatId)?.timestamp}</span>
                  </div>
                  {renderResponseText(pastChats.find(c => c.id === selectedChatId)?.response)}
                </div>
              ) : (
                /* Welcomes user with heroic Arc Reactor and J.A.R.V.I.S. Quick Pills */
                <div className="flex flex-col items-center justify-center h-full gap-5 sm:gap-6 py-4">
                  <div className="text-center font-orbitron max-w-md">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      <span className="text-[10px] font-bold tracking-widest text-cyan-300">SYSTEM CORE ONLINE • J.A.R.V.I.S. v4.1</span>
                    </div>
                    <h3 className="text-cyan-400 font-extrabold text-sm sm:text-base tracking-widest glow-cyan">AT YOUR SERVICE, SIR</h3>
                    <p className="font-mono text-[9px] sm:text-[10px] text-sky-400/80 uppercase tracking-widest leading-relaxed mt-1">
                      Select a quick command below or speak your directive.
                    </p>
                  </div>
                  <div className={`hero-arc-animated ${isMobileLayout ? 'w-36 h-36' : 'w-48 h-48'}`}>
                    <ArcReactor state={jasperState} onClick={handleReactorClick} />
                  </div>

                  {/* Interactive Stark HUD Quick Action Pills */}
                  <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl px-2">
                    <button onClick={triggerMorningBriefing} className="jarvis-pill bg-amber-500/20 border-amber-400/50 text-amber-200 hover:bg-amber-500/30">
                      ☀️ Morning Briefing
                    </button>
                    <button onClick={triggerVisionAnalysis} className="jarvis-pill bg-cyan-500/20 border-cyan-400/50 text-cyan-200 hover:bg-cyan-500/30">
                      👁️ Vision AI Desk Scan
                    </button>
                    <button onClick={() => handleCommand('Set PC volume to 50%')} className="jarvis-pill">
                      ⚡ Set Volume 50%
                    </button>
                    <button onClick={() => handleCommand('Open EA Sports FC Mobile on phone')} className="jarvis-pill">
                      📱 Open FC Mobile
                    </button>
                    <button onClick={() => handleCommand('What is the current price of AAPL stock?')} className="jarvis-pill">
                      📈 Check Apple Stock
                    </button>
                    <button onClick={() => setShowTvRemote(!showTvRemote)} className="jarvis-pill">
                      📺 TV Remote
                    </button>
                    <button onClick={() => setShowHealthHub(true)} className="jarvis-pill">
                      🩺 Health Vitals
                    </button>
                    <button onClick={() => handleCommand('Research latest news on Artificial Intelligence')} className="jarvis-pill">
                      🤖 Research AI
                    </button>
                    <button onClick={() => handleCommand('What song is currently playing on my PC?')} className="jarvis-pill">
                      🎵 Now Playing
                    </button>
                    <button onClick={() => setShowAgenticActions(true)} className="jarvis-pill">
                      🍽️ Reserve Table
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleManualSubmit} className={`flex border-t border-cyan-500/10 select-none shrink-0 ${isMobileLayout ? 'flex-col gap-2 mt-2 pt-2' : 'flex-row gap-3 mt-4 pt-4'}`}>
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Enter command or question..."
                className={`input-main bg-black/50 px-4 py-3 border border-cyan-500/20 text-cyan-100 placeholder-sky-700/80 outline-none font-mono text-sm sm:text-base w-full focus:border-cyan-400/60 transition-all`}
                style={{ fontSize: '16px' }}
              />
              <div className={`flex gap-2 ${isMobileLayout ? 'w-full' : ''}`}>
                <button 
                  type="submit" 
                  className={`btn-send flex items-center justify-center shrink-0 ${isMobileLayout ? 'flex-1 py-2.5 text-xs' : ''}`}
                >
                  Send
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowAudioPage(true);
                    if (voiceControllerRef.current) {
                      voiceControllerRef.current.toggleListening();
                    }
                  }}
                  className={`btn-speak flex items-center justify-center shrink-0 ${isMobileLayout ? 'flex-1 py-2.5 text-xs' : ''}`}
                >
                  Speak
                </button>
                <button 
                  type="button" 
                  onClick={handleClear}
                  className={`btn-clear flex items-center justify-center shrink-0 ${isMobileLayout ? 'flex-1 py-2.5 text-xs' : ''}`}
                >
                  Clear
                </button>
              </div>
            </form>
          </main>
        </div>
      </div>

      {/* Sliding TV Remote Control Overlay */}
      {showTvRemote && (
        <div className={`fixed z-40 p-4 rounded-lg tv-remote-panel animate-slide-in ${isMobileLayout ? 'top-14 inset-x-2 w-auto max-h-[85vh] overflow-y-auto' : 'top-20 right-4 w-80'}`}>
          <div className="flex justify-between items-center border-b border-cyan-500/20 pb-2 mb-3 select-none">
            <span className="font-orbitron font-bold text-xs text-cyan-400">TV REMOTE LINK</span>
            <button onClick={() => setShowTvRemote(false)} className="text-sky-500 hover:text-cyan-400 font-bold text-[10px]">[X] CLOSE</button>
          </div>
          <TvRemoteWidget onLog={(text, type) => console.log(`[${type}] ${text}`)} />
        </div>
      )}

      {/* Sliding Phone Control Overlay */}
      {showPhoneControl && (
        <div className={`fixed z-40 p-4 rounded-lg tv-remote-panel animate-slide-in flex flex-col ${isMobileLayout ? 'top-14 inset-x-2 w-auto h-[calc(100%-4.5rem)]' : 'top-20 right-4 w-[580px] max-w-[92vw] h-[calc(100%-7rem)]'}`}>
          <div className="flex justify-between items-center border-b border-cyan-500/20 pb-2 mb-3 select-none">
            <span className="font-orbitron font-bold text-xs text-cyan-400">PHONE UPLINK</span>
            <button onClick={() => setShowPhoneControl(false)} className="text-sky-500 hover:text-cyan-400 font-bold text-[10px]">[X] CLOSE</button>
          </div>
          <div className="flex-1 overflow-y-auto phone-scroll pr-2">
            <PhoneControlWidget />
          </div>
        </div>
      )}

      {/* Image Synthesis Lab Overlay */}
      {showImageGenerator && (
        <div className={`fixed z-40 p-4 rounded-lg imagen-panel animate-slide-in flex flex-col ${isMobileLayout ? 'top-14 inset-x-2 w-auto max-h-[85vh]' : 'top-20 right-4 w-[380px] maxHeight-[calc(100%-7rem)]'}`}>
          <ImageGeneratorWidget
            onClose={() => setShowImageGenerator(false)}
            onLog={(text, type) => console.log(`[${type}] ${text}`)}
          />
        </div>
      )}

      {/* Sliding PC Diagnostics Overlay */}
      {showDiagnostics && (
        <div className={`fixed z-40 p-4 rounded-lg diagnostics-panel animate-slide-in flex flex-col ${isMobileLayout ? 'top-14 inset-x-2 w-auto h-[calc(100%-4.5rem)]' : 'top-20 right-4 w-[420px] h-[calc(100%-7rem)]'}`}>
          <div className="flex justify-between items-center border-b border-cyan-500/20 pb-2 mb-3 select-none">
            <span className="font-orbitron font-bold text-xs text-cyan-400">SYSTEM DIAGNOSTICS</span>
            <button onClick={() => setShowDiagnostics(false)} className="text-sky-500 hover:text-cyan-400 font-bold text-[10px]">[X] CLOSE</button>
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
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
          <div className="hud-panel hud-panel-orange max-w-sm w-full p-6 font-mono text-center flex flex-col gap-5 relative select-none">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-orange-500/30 pointer-events-none animate-pulse" />
            <div className="flex justify-center mb-1">
              <div className="relative w-16 h-16 flex items-center justify-center border-2 border-orange-500/40 rounded-full animate-pulse glow-orange">
                <span className="w-3.5 h-3.5 rounded-full bg-orange-500 animate-ping absolute" />
                <Shield size={32} className="text-orange-500" />
              </div>
            </div>
            
            <div className="flex flex-col gap-0.5">
              <h2 className="font-orbitron font-extrabold text-sm text-orange-500 tracking-[0.15em] glow-orange">PROTOCOL ALERT</h2>
              <span className="text-[9px] text-sky-500 uppercase tracking-widest">Jasper Reminder Triggered</span>
            </div>
            
            <div className="bg-orange-950/15 border border-orange-500/30 rounded p-3.5 my-1">
              <div className="text-[9px] text-sky-400 font-bold uppercase tracking-wider mb-1">TASK DESCRIPTION</div>
              <p className="text-xs font-semibold text-orange-200 uppercase tracking-wider">
                {showReminderAlert.task}
              </p>
            </div>
            
            <p className="text-[9px] text-slate-400 leading-relaxed font-sans">
              System schedule parameter matched. Standing by for task acknowledgment protocols, Sir.
            </p>
            
            <button 
              onClick={() => {
                setShowReminderAlert(null);
                playFuturisticChime();
              }}
              className="btn-control btn-control-orange font-bold py-2.5 w-full text-center text-[10px] tracking-widest font-orbitron"
            >
              ACKNOWLEDGE & CLEAR ALERT
            </button>
          </div>
        </div>
      )}

      {/* Security lock state */}
      {isLocked && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-3 bg-black/95 backdrop-blur-lg overflow-y-auto">
          <div className="hud-panel max-w-md w-[92vw] sm:w-full p-5 sm:p-8 font-mono text-center flex flex-col gap-5 relative select-none my-auto">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-cyan-500/20 pointer-events-none" />
            
            {/* Header section */}
            <div className="flex justify-center mb-1">
              <div className="relative w-16 h-16 flex items-center justify-center border border-cyan-500/30 rounded-full animate-pulse">
                <Shield size={32} className={biometricMode === 'success' ? 'text-green-400 animate-pulse' : biometricMode === 'failed' ? 'text-red-500 animate-shake' : 'text-cyan-400'} />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="font-orbitron font-extrabold text-base text-cyan-400 tracking-[0.1em]">SECURITY OVERRIDE TERMINAL</h2>
              <span className="text-[9px] text-sky-500 uppercase tracking-widest">Jasper Secure Shield Protocol</span>
            </div>

            {/* Main Interactive Scanning Area */}
            {biometricMode === 'idle' && (
              <div className="flex flex-col gap-4 py-3">
                <div className="flex items-center justify-center gap-2">
                  {hasOwnerProfile() ? (
                    <span className="inline-flex items-center gap-1.5 text-[9px] font-mono font-bold px-2.5 py-1 rounded bg-green-950/60 border border-green-500/40 text-green-400">
                      <UserCheck size={12} /> OWNER FACE PROFILE ACTIVE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[9px] font-mono font-bold px-2.5 py-1 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300">
                      <UserX size={12} /> NO OWNER FACE ENROLLED
                    </span>
                  )}
                </div>

                <p className="text-[10px] text-slate-400 leading-relaxed font-sans max-w-xs mx-auto">
                  Strict security protocol active. Enter passcode or use biometric recognition to unlock system core.
                </p>

                {/* Passcode Login Form */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUnlockSuccess();
                  }}
                  className="flex flex-col gap-2 my-1"
                >
                  <div className="flex gap-2">
                    <input 
                      type="password"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      placeholder="Enter passcode / password..."
                      className="bg-black/60 border border-cyan-500/30 rounded px-3 py-2 text-xs text-cyan-200 placeholder-sky-700 outline-none focus:border-cyan-400 font-mono flex-1 transition-all"
                    />
                    <button 
                      type="submit"
                      className="px-4 py-2 text-xs font-orbitron font-bold uppercase tracking-wider text-cyan-400 border border-cyan-500/40 bg-cyan-950/60 hover:bg-cyan-900/80 hover:border-cyan-400 rounded transition-all glow-cyan"
                    >
                      LOGIN
                    </button>
                  </div>
                </form>

                <div className="grid grid-cols-2 gap-2.5 mt-1">
                  <button 
                    onClick={() => setBiometricMode('face_scan')}
                    className="btn-control flex flex-col items-center gap-1.5 py-3 rounded border-cyan-500/40 bg-cyan-950/20 hover:border-cyan-400 hover:bg-cyan-950/40 transition-all duration-300"
                  >
                    <Camera size={18} className="text-cyan-400" />
                    <span className="text-[9px] font-orbitron font-bold tracking-wider">FACE SCAN (STRICT)</span>
                  </button>
                  <button 
                    onClick={() => setBiometricMode('face_enroll')}
                    className="btn-control flex flex-col items-center gap-1.5 py-3 rounded border-cyan-500/40 bg-cyan-950/20 hover:border-cyan-400 hover:bg-cyan-950/40 transition-all duration-300"
                  >
                    <UserPlus size={18} className="text-cyan-400" />
                    <span className="text-[9px] font-orbitron font-bold tracking-wider">{hasOwnerProfile() ? 'RE-ENROLL FACE' : 'ENROLL MY FACE'}</span>
                  </button>
                </div>

                <button 
                  onClick={startVoiceScan}
                  className="btn-control flex items-center justify-center gap-2 py-2 rounded border-cyan-500/20 bg-cyan-950/10 hover:border-cyan-400 text-slate-300 transition-all"
                >
                  <Mic size={14} className="text-cyan-400" />
                  <span className="text-[9px] font-orbitron font-bold tracking-wider">USE VOICE PRINT OVERRIDE</span>
                </button>

                <button 
                  onClick={handleUnlockSuccess}
                  className="text-[9px] text-slate-500 hover:text-slate-400 uppercase tracking-widest font-bold mt-1 transition-colors"
                >
                  Bypass with override key
                </button>
              </div>
            )}

            {/* Face Scanning Screen & Face Enrollment Screen */}
            {(biometricMode === 'face_scan' || biometricMode === 'face_enroll') && (
              <div className="flex flex-col items-center gap-4 py-2">
                <div className="text-[10px] font-orbitron font-bold text-cyan-400 tracking-wider">
                  {biometricMode === 'face_enroll' ? 'ENROLLING OWNER BIOMETRICS' : 'VERIFYING OWNER BIOMETRICS'}
                </div>
                <div className="relative w-48 h-48 rounded-full overflow-hidden border-2 border-cyan-500/50 bg-black flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover rounded-full transform scale-x-[-1]" 
                  />
                  <canvas 
                    ref={canvasRef} 
                    width={192} 
                    height={192} 
                    className="absolute inset-0 pointer-events-none" 
                  />
                </div>
                <div className="flex flex-col gap-1.5 w-full">
                  <div className="w-full bg-cyan-950/60 h-2 rounded-full overflow-hidden border border-cyan-500/30">
                    <div 
                      className={`h-full transition-all duration-100 ${biometricMode === 'face_enroll' ? 'bg-amber-400' : 'bg-cyan-400'}`}
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[8px] text-cyan-400 uppercase tracking-wider font-semibold font-mono px-1">
                    <span className="truncate max-w-[220px] text-left">{scanStatusText}</span>
                    <span>{scanProgress}%</span>
                  </div>
                </div>
                <button 
                  onClick={() => setBiometricMode('idle')}
                  className="text-[9px] text-red-400 hover:text-red-300 font-bold tracking-widest uppercase mt-1 transition-colors border border-red-500/30 px-3 py-1 rounded"
                >
                  Cancel Scan
                </button>
              </div>
            )}


            {/* Voice Scanning Screen */}
            {biometricMode === 'voice_scan' && (
              <div className="flex flex-col items-center gap-4 py-4 w-full">
                <div className="relative w-full h-20 bg-cyan-950/15 border border-cyan-500/20 rounded flex items-center justify-center overflow-hidden">
                  <canvas 
                    ref={voiceCanvasRef} 
                    width={380} 
                    height={80} 
                    className="w-full h-full" 
                  />
                </div>
                <div className="flex flex-col gap-2 bg-cyan-950/10 border border-cyan-500/10 rounded p-3 text-center w-full">
                  <span className="text-[8px] text-sky-400 uppercase font-bold tracking-wider">PLEASE SAY</span>
                  <p className="text-[11px] font-semibold text-cyan-200 uppercase tracking-wide">
                    "Authorization Delta-Nine, unlock system"
                  </p>
                  {voiceTranscript && (
                    <div className="mt-2 border-t border-cyan-500/10 pt-2 text-[9px] italic text-sky-500">
                      Detected: "{voiceTranscript}"
                    </div>
                  )}
                </div>
                <div className="text-[8px] text-cyan-400 uppercase tracking-wider font-mono">
                  {scanStatusText}
                </div>
                <button 
                  onClick={() => setBiometricMode('idle')}
                  className="text-[9px] text-red-400 hover:text-red-300 font-bold tracking-widest uppercase mt-1 transition-colors"
                >
                  Cancel Scan
                </button>
              </div>
            )}

            {/* Success Screen */}
            {biometricMode === 'success' && (
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="relative w-16 h-16 rounded-full border-2 border-green-500 flex items-center justify-center text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)] animate-bounce">
                  <Shield size={28} />
                </div>
                <div className="flex flex-col gap-1 text-center">
                  <h3 className="font-orbitron font-extrabold text-sm text-green-400 tracking-wider uppercase">ACCESS GRANTED</h3>
                  <span className="text-[9px] text-slate-400 font-mono tracking-widest">{scanStatusText}</span>
                </div>
              </div>
            )}

            {/* Failed Screen */}
            {biometricMode === 'failed' && (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="relative w-16 h-16 rounded-full border-2 border-red-500 flex items-center justify-center text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-shake">
                  <AlertTriangle size={28} className="text-red-500" />
                </div>
                <div className="flex flex-col gap-2 text-center w-full">
                  <h3 className="font-orbitron font-extrabold text-sm text-red-500 tracking-wider uppercase">OVERRIDE REJECTED</h3>
                  <p className="text-[9px] text-slate-400 leading-relaxed px-4">{scanStatusText}</p>
                </div>
                <div className="flex gap-4 mt-2">
                  <button 
                    onClick={() => {
                      if (lastScanMode === 'face_scan') {
                        setBiometricMode('face_scan');
                      } else if (lastScanMode === 'voice_scan') {
                        startVoiceScan();
                      } else {
                        setBiometricMode('idle');
                      }
                    }}
                    className="text-[9px] text-cyan-400 hover:text-cyan-300 font-bold tracking-widest uppercase font-mono border border-cyan-500/30 px-3 py-1.5 rounded transition-colors"
                  >
                    Try Again
                  </button>
                  <button 
                    onClick={handleUnlockSuccess}
                    className="text-[9px] text-red-400 hover:text-red-300 font-bold tracking-widest uppercase font-mono border border-red-500/30 px-3 py-1.5 rounded transition-colors"
                  >
                    Bypass Core
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Settings Panel HUD Overlay */}
      {showSettings && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="hud-panel max-w-md w-full p-5 font-mono text-xs flex flex-col gap-4 relative animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
              <div className="flex items-center gap-1.5 font-orbitron font-bold text-cyan-400 text-sm tracking-wider">
                <Shield size={16} />
                SYSTEM SETTINGS HUD
              </div>
              <button 
                onClick={() => setShowSettings(false)}
                className="text-sky-500 hover:text-cyan-400 font-bold"
              >
                [X] CLOSE
              </button>
            </div>

            <form onSubmit={handleSaveKey} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-sky-400 uppercase font-semibold">Gemini API Studio Access Key</label>
                <div className="relative flex items-center">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Paste Gemini API Key (AI Studio)"
                    className="w-full bg-black/60 border border-cyan-500/30 rounded px-3 py-2 text-xs text-cyan-100 outline-none focus:border-cyan-400 pr-9 font-mono"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2.5 text-sky-500 hover:text-cyan-400"
                  >
                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <span className="text-[9px] text-sky-600 leading-normal font-sans">
                  Required to search the internet and enable smart reasoning. Get a free API Key from the Google AI Studio console. If left blank, JASPER runs in offline fallback mode for local controls.
                </span>
              </div>

              <div className="flex flex-col gap-1.5 border-t border-cyan-500/20 pt-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-sky-400 uppercase font-semibold flex items-center gap-1">
                    <Radio size={12} className="text-cyan-400" /> JASPER Server URL / IP Address
                  </label>
                  <span className="text-[8px] text-cyan-400 font-bold bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30">
                    REMOTE / NGROK
                  </span>
                </div>
                <input
                  type="text"
                  value={serverIp}
                  onChange={(e) => setServerIpState(e.target.value)}
                  placeholder="https://5b34-2405-201-202f-28a9-ddad-6cf0-2973-7f39.ngrok-free.app"
                  className="w-full bg-black/60 border border-cyan-500/30 rounded px-3 py-2 text-xs text-cyan-100 outline-none focus:border-cyan-400 font-mono"
                />
                <span className="text-[9px] text-sky-600 leading-normal font-sans">
                  Target backend server URL or IP address. Automatically defaults to <strong className="text-cyan-400">https://5b34-2405-201-202f-28a9-ddad-6cf0-2973-7f39.ngrok-free.app</strong>.
                </span>
              </div>


              <div className="border-t border-cyan-500/20 pt-3 flex flex-col gap-2.5 bg-cyan-950/20 p-3.5 rounded border border-cyan-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold uppercase text-[10px] font-orbitron">
                    <Fingerprint size={14} /> BIOMETRIC FACE LOCK SECURITY
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${hasOwnerProfile() ? 'bg-green-950 text-green-400 border border-green-500/40' : 'bg-amber-950 text-amber-400 border border-amber-500/40'}`}>
                    {hasOwnerProfile() ? 'ENROLLED' : 'NOT REGISTERED'}
                  </span>
                </div>

                <p className="text-[9px] text-slate-300 leading-relaxed font-sans">
                  Strict biometric face matching ensures JASPER will <strong>only unlock when your specific face</strong> is recognized by the webcam.
                </p>

                <div className="flex gap-2 mt-1">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowSettings(false);
                      setIsLocked(true);
                      setBiometricMode('face_enroll');
                    }}
                    className="btn-control flex-1 py-2 text-[9px] font-bold font-orbitron flex items-center justify-center gap-1.5 bg-cyan-950/40 border-cyan-500/40 hover:border-cyan-400"
                  >
                    <UserPlus size={12} /> {hasOwnerProfile() ? 'RE-ENROLL MY FACE' : 'REGISTER MY FACE'}
                  </button>

                  {hasOwnerProfile() && (
                    <button 
                      type="button"
                      onClick={() => {
                        clearOwnerProfile();
                        setTick(t => t + 1);
                      }}
                      className="btn-control py-2 px-3 text-[9px] font-bold font-orbitron text-red-400 border-red-500/40 bg-red-950/20 hover:bg-red-950/40"
                    >
                      <Trash2 size={12} /> CLEAR
                    </button>
                  )}
                </div>
              </div>

              <div className="border-t border-cyan-500/10 pt-3 flex flex-col gap-2 bg-cyan-950/10 p-3 rounded">
                <div className="flex items-center gap-1 text-sky-400 font-bold uppercase text-[9px]">
                  <HelpCircle size={11} /> WAKE WORD GUIDE
                </div>
                <p className="text-[9px] text-cyan-300/80 leading-relaxed font-sans">
                  JASPER is configured for continuous background listening. Minimize this browser or keep it open. Simply say <strong className="text-cyan-400 glow-cyan">"Hey Jasper"</strong> from anywhere in the room. 
                  Windows native speech recognition will auto-focus this tab, play the chime, and prompt you for commands.
                </p>
              </div>

              <button 
                type="submit" 
                className="btn-control font-bold py-2 mt-2 w-full text-center"
              >
                COMMIT ACCESS KEY & SYSTEM SYNC
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
        onSpeakingComplete={() => setSpeakingText('')}
        triggerWake={triggerWakeOnMount}
      />

      {/* 1. PC Command Center Modal */}
      {showPcCommand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <PcCommandCenterWidget onClose={() => setShowPcCommand(false)} />
        </div>
      )}

      {/* 2. Browser Agent Modal */}
      {showBrowserAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <BrowserAgentWidget onClose={() => setShowBrowserAgent(false)} />
        </div>
      )}

      {/* 3. Personal Assistant Modal */}
      {showPersonalAssistant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <PersonalAssistantWidget 
            onClose={() => setShowPersonalAssistant(false)} 
            onSpeakBriefing={(text) => {
              setSpeakingText(text);
              setShowPersonalAssistant(false);
            }}
          />
        </div>
      )}

      {/* 4. Memory Dashboard Modal */}
      {showMemory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <MemoryDashboardWidget onClose={() => setShowMemory(false)} />
        </div>
      )}

      {/* 5. Skills Store Modal */}
      {showSkillsStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <SkillsStoreWidget onClose={() => setShowSkillsStore(false)} />
        </div>
      )}

      {/* 6. Analytics Modal */}
      {showAnalytics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <AnalyticsWidget onClose={() => setShowAnalytics(false)} />
        </div>
      )}

      {/* 7. Live AI Avatar Modal */}
      {showAvatar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <AiAvatarWidget 
            isSpeaking={jasperState === 'speaking'} 
            isListening={jasperState === 'listening'} 
            onClose={() => setShowAvatar(false)} 
          />
        </div>
      )}

      {/* 8. Security Center Modal */}
      {showSecurity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <SecurityCenterWidget 
            hasFaceProfile={hasOwnerProfile()} 
            onTriggerFaceEnroll={() => {
              setShowSecurity(false);
              setIsLocked(true);
              setBiometricMode('face_enroll');
            }} 
            onClose={() => setShowSecurity(false)} 
          />
        </div>
      )}

      {/* 9. Automation Builder Modal */}
      {showAutomation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <AutomationBuilderWidget onClose={() => setShowAutomation(false)} />
        </div>
      )}

      {/* 10. Mission Control Hero Screen Modal */}
      {showMissionControl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <MissionControlWidget 
            onClose={() => setShowMissionControl(false)} 
            onNavigate={(target) => {
              setShowMissionControl(false);
              if (target === 'automation') setShowAutomation(true);
              if (target === 'sports') setShowSportsHub(true);
              if (target === 'maps') setShowMaps(true);
            }}
          />
        </div>
      )}

      {/* 11. Maps & Navigation Modal */}
      {showMaps && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <MapsWidget onClose={() => setShowMaps(false)} />
        </div>
      )}

      {/* 12. Football Sports Hub Modal */}
      {showSportsHub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <SportsHubWidget onClose={() => setShowSportsHub(false)} />
        </div>
      )}

      {/* 13. Custom Themes Selector Modal */}
      {showThemes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-950/90 border border-purple-500/30 rounded-2xl p-6 text-slate-100 max-w-xl w-full mx-auto relative overflow-hidden backdrop-blur-xl shadow-2xl">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 border border-purple-500/40 rounded-xl text-purple-400">
                  <Palette className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-wider text-purple-300 uppercase font-orbitron">Custom Themes</h2>
                  <p className="text-xs text-slate-400 font-mono">Select UI visual theme preset</p>
                </div>
              </div>
              <button onClick={() => setShowThemes(false)} className="p-2 rounded-xl bg-slate-800/60 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { id: 'cyber-blue', name: 'Cyber Blue', color: 'bg-cyan-500', border: 'border-cyan-500' },
                { id: 'matrix-green', name: 'Matrix Green', color: 'bg-emerald-500', border: 'border-emerald-500' },
                { id: 'iron-man-red', name: 'Iron Man Red', color: 'bg-rose-600', border: 'border-rose-600' },
                { id: 'purple-neon', name: 'Purple Neon', color: 'bg-purple-500', border: 'border-purple-500' },
                { id: 'pure-white', name: 'Pure White', color: 'bg-slate-100 text-slate-950', border: 'border-slate-300' },
                { id: 'amoled-black', name: 'AMOLED Black', color: 'bg-black text-white', border: 'border-slate-700' },
              ].map(theme => (
                <button
                  key={theme.id}
                  onClick={() => {
                    setCurrentTheme(theme.id);
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-bold transition-all ${
                    currentTheme === theme.id 
                      ? 'bg-purple-500/20 border-purple-500 text-purple-300 ring-2 ring-purple-500/40' 
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-purple-500/30'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full ${theme.color} border shadow-lg flex items-center justify-center`}>
                    {currentTheme === theme.id && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                  <span>{theme.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 14. J.A.S.P.E.R. Agentic Actions Modal */}
      {showAgenticActions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <AgenticActionsWidget 
            initialQuery={agenticQuery}
            onClose={() => {
              setShowAgenticActions(false);
              setAgenticQuery('');
            }} 
          />
        </div>
      )}

      {/* 15. JASPER User Manual & Guide Modal */}
      {showManual && (
        <UserManualWidget 
          onClose={() => setShowManual(false)} 
          onExecuteCommand={(cmd) => handleTextSubmit(cmd)} 
        />
      )}

      {/* 16. Health & Fitband Hub Modal */}
      {showHealthHub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="max-w-4xl w-full">
            <HealthFitbandWidget 
              onClose={() => setShowHealthHub(false)} 
              onAskJasper={(query) => {
                setShowHealthHub(false);
                handleCommand(query);
              }}
            />
          </div>
        </div>
      )}

      {/* 17. Connect to Laptop Mode Modal */}
      {showLaptopConnect && (
        <LaptopConnectModal 
          onClose={() => setShowLaptopConnect(false)} 
          onLog={(text, type) => console.log(`[LAPTOP] ${text}`)}
        />
      )}
    </div>
  );
}
