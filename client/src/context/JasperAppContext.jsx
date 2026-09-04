import React, { createContext, useContext, useState, useEffect } from 'react';
import geminiClient from '../utils/geminiClient';
import { getServerIp } from '../utils/apiConfig.js';
import { getPhoneBrainMode } from '../utils/mobileBrain.js';

const JasperAppContext = createContext(null);

export function JasperAppProvider({ children }) {
  // Theme State
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('jasper_theme') || 'matte-gold';
  });

  useEffect(() => {
    localStorage.setItem('jasper_theme', currentTheme);
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  // AI Assistant Operational State
  const [jasperState, setJasperState] = useState('idle'); // idle | listening | processing | speaking
  const [speakingText, setSpeakingText] = useState('');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [showAudioPage, setShowAudioPage] = useState(false);

  // Security & Lock State
  const [isLocked, setIsLocked] = useState(false);
  const [biometricMode, setBiometricMode] = useState('idle'); // idle | face_scan | voice_scan | success | failed | face_enroll
  const [lastScanMode, setLastScanMode] = useState(null);
  const [scanStatusText, setScanStatusText] = useState('');
  const [scanProgress, setScanProgress] = useState(0);

  // Reminders & Clock Tick
  const [reminders, setReminders] = useState([]);
  const [showReminderAlert, setShowReminderAlert] = useState(null);
  const [tick, setTick] = useState(0);

  // Layout & Device View
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('jasper_view_mode') || 'hud'; // 'hud' | 'desktop' | 'mobile'
  });
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  useEffect(() => {
    localStorage.setItem('jasper_view_mode', viewMode);
  }, [viewMode]);

  // AI Providers & Brain Settings
  const [apiKey, setApiKey] = useState(geminiClient.apiKey);
  const [chatGptKey, setChatGptKey] = useState(() => geminiClient.chatGptKey || '');
  const [chatGptModel, setChatGptModel] = useState(() => geminiClient.chatGptModel || 'gpt-6-astra');
  const [aiProvider, setAiProvider] = useState(() => geminiClient.provider || (geminiClient.chatGptKey ? 'chatgpt' : 'ollama'));
  const [ollamaModel, setOllamaModel] = useState(() => geminiClient.ollamaModel || 'llama3');
  const [availableOllamaModels, setAvailableOllamaModels] = useState(['llama3', 'llama3.2', 'qwen2.5', 'mistral', 'gemma2']);
  const [serverIp, setServerIpState] = useState(getServerIp);
  const [isPhoneBrainMode, setIsPhoneBrainModeState] = useState(() => getPhoneBrainMode());

  useEffect(() => {
    const handleBrainChange = (e) => {
      if (e?.detail?.enabled !== undefined) {
        setIsPhoneBrainModeState(e.detail.enabled);
      }
    };
    window.addEventListener('jasper_phone_brain_change', handleBrainChange);
    return () => window.removeEventListener('jasper_phone_brain_change', handleBrainChange);
  }, []);

  const value = {
    // Theme
    currentTheme,
    setCurrentTheme,
    // Assistant state
    jasperState,
    setJasperState,
    speakingText,
    setSpeakingText,
    voiceTranscript,
    setVoiceTranscript,
    showAudioPage,
    setShowAudioPage,
    // Security & Lock
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
    // Reminders
    reminders,
    setReminders,
    showReminderAlert,
    setShowReminderAlert,
    tick,
    setTick,
    // Layout
    viewMode,
    setViewMode,
    isMobileScreen,
    setIsMobileScreen,
    isMobileLayout: viewMode === 'mobile' || isMobileScreen,
    // AI Settings
    apiKey,
    setApiKey,
    chatGptKey,
    setChatGptKey,
    chatGptModel,
    setChatGptModel,
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
  };

  return (
    <JasperAppContext.Provider value={value}>
      {children}
    </JasperAppContext.Provider>
  );
}

export function useJasperApp() {
  const context = useContext(JasperAppContext);
  if (!context) {
    throw new Error('useJasperApp must be used within a JasperAppProvider');
  }
  return context;
}
