import React, { useState, useEffect, useRef } from 'react';
import { getApiBase } from '../utils/apiConfig.js';
import { 
  Globe, 
  Volume2, 
  VolumeX, 
  Settings, 
  X, 
  ChevronUp, 
  ChevronDown, 
  Sparkles, 
  Copy, 
  Trash2, 
  Download, 
  Play, 
  Pause, 
  Radio, 
  Languages, 
  Maximize2, 
  Minimize2,
  Move,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const SUPPORTED_LANGUAGES = [
  { code: 'auto', name: 'Auto-Detect Language' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'fr', name: 'French (Français)' },
  { code: 'de', name: 'German (Deutsch)' },
  { code: 'hi', name: 'Hindi (हिन्दी)' },
  { code: 'ja', name: 'Japanese (日本語)' },
  { code: 'zh', name: 'Chinese (中文)' },
  { code: 'it', name: 'Italian (Italiano)' },
  { code: 'ru', name: 'Russian (Русский)' },
  { code: 'ko', name: 'Korean (한국어)' },
  { code: 'pt', name: 'Portuguese (Português)' },
  { code: 'ar', name: 'Arabic (العربية)' },
  { code: 'nl', name: 'Dutch (Nederlands)' },
  { code: 'tr', name: 'Turkish (Türkçe)' }
];

const TARGET_LANGUAGES = [
  { code: 'en', name: 'English (EN)' },
  { code: 'es', name: 'Spanish (ES)' },
  { code: 'fr', name: 'French (FR)' },
  { code: 'de', name: 'German (DE)' },
  { code: 'hi', name: 'Hindi (HI)' },
  { code: 'ja', name: 'Japanese (JA)' },
  { code: 'zh', name: 'Chinese (ZH)' }
];

// Sample non-English media streams for testing live translation
const DEMO_MEDIA_SAMPLES = [
  {
    title: 'Spanish News Broadcast',
    lang: 'es',
    langName: 'Spanish',
    text: 'Bienvenidos a las noticias de hoy. El gobierno ha anunciado un nuevo programa de desarrollo sostenible para las ciudades principales.'
  },
  {
    title: 'French Cinema Dialogue',
    lang: 'fr',
    langName: 'French',
    text: 'Bonjour mon ami. Le temps est magnifique aujourd’hui et nous devons célébrer cette merveilleuse journée ensemble.'
  },
  {
    title: 'German Tech Keynote',
    lang: 'de',
    langName: 'German',
    text: 'Guten Tag zusammen. Heute präsentieren wir unsere neueste künstliche Intelligenz für autonome Roboter und Quantencomputing.'
  },
  {
    title: 'Hindi Film Scene',
    lang: 'hi',
    langName: 'Hindi',
    text: 'नमस्ते दोस्तों। आज हम भारत के नए अंतरिक्ष मिशन के बारे में बात करेंगे जो चांद पर पानी की खोज कर रहा है।'
  },
  {
    title: 'Japanese Anime Line',
    lang: 'ja',
    langName: 'Japanese',
    text: 'こんにちは世界。私たちの未来を守るために、諦めるわけにはいきません。立ち上がろう！'
  }
];

export default function LiveTranslationWidget({ isOpen, onClose, onToggleAutoTranslate, autoTranslateEnabled = true }) {
  const [isTranslating, setIsTranslating] = useState(true);
  const [selectedSourceLang, setSelectedSourceLang] = useState('auto');
  const [selectedTargetLang, setSelectedTargetLang] = useState('en');
  const [currentOriginal, setCurrentOriginal] = useState('');
  const [currentTranslation, setCurrentTranslation] = useState('');
  const [detectedLangInfo, setDetectedLangInfo] = useState({ code: 'es', name: 'Spanish' });
  const [isNonEnglishPlaying, setIsNonEnglishPlaying] = useState(false);
  const [captionHistory, setCaptionHistory] = useState([]);
  const [fontSize, setFontSize] = useState('medium'); // small, medium, large
  const [showSettings, setShowSettings] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [audioSource, setAudioSource] = useState('mic'); // mic, demo, system
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  const [mediaTrackInfo, setMediaTrackInfo] = useState(null);
  const [position, setPosition] = useState({ x: 20, y: 20 }); // offset from bottom-left or top
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  const recognitionRef = useRef(null);
  const demoIntervalRef = useRef(null);
  const mediaPollRef = useRef(null);

  // 1. Poll Device Media Status (`/api/system/media/now-playing`)
  useEffect(() => {
    const checkMediaPlayback = async () => {
      try {
        const res = await fetch(`${getApiBase()}/api/system/media/now-playing`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.isPlaying && data.title) {
            setMediaTrackInfo(data);
            
            // Check title / artist for non-English hints if auto translate is enabled
            const fullText = `${data.title} ${data.artist || ''}`;
            if (autoTranslateEnabled && fullText.trim()) {
              // Trigger quick test check to verify if non-English media is playing
              checkLanguageAndTranslate(fullText, true);
            }
          } else {
            setMediaTrackInfo(null);
          }
        }
      } catch (e) {
        // Silent error
      }
    };

    checkMediaPlayback();
    mediaPollRef.current = setInterval(checkMediaPlayback, 5000);
    return () => clearInterval(mediaPollRef.current);
  }, [autoTranslateEnabled]);

  // 2. Initialize Web Speech Recognition for Audio Stream Capture
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('[LiveTranslationWidget] SpeechRecognition not supported natively.');
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = selectedSourceLang === 'auto' ? 'es-ES' : selectedSourceLang;

    rec.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      const activeText = final || interim;
      if (activeText && activeText.trim().length > 2) {
        setCurrentOriginal(activeText);
        translateTextPayload(activeText);
      }
    };

    rec.onerror = (err) => {
      if (err.error !== 'no-speech') {
        console.warn('[LiveTranslationWidget] Speech Recognition error:', err.error);
      }
    };

    rec.onend = () => {
      // Auto restart if still translating in mic mode
      if (isTranslating && audioSource === 'mic') {
        try {
          rec.start();
        } catch (e) {}
      }
    };

    recognitionRef.current = rec;

    if (isTranslating && audioSource === 'mic') {
      try {
        rec.start();
      } catch (e) {}
    }

    return () => {
      try {
        rec.stop();
      } catch (e) {}
    };
  }, [isTranslating, audioSource, selectedSourceLang]);

  // 3. API Translation Engine Call
  const translateTextPayload = async (text, isQuietCheck = false) => {
    if (!text || !text.trim()) return;

    try {
      const res = await fetch(`${getApiBase()}/api/system/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          sourceLang: selectedSourceLang,
          targetLang: selectedTargetLang
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          if (isQuietCheck) {
            if (data.isNonEnglish) {
              setIsNonEnglishPlaying(true);
              setDetectedLangInfo({ code: data.sourceLang, name: data.sourceLangName });
            }
            return;
          }

          setCurrentOriginal(data.originalText);
          setCurrentTranslation(data.translatedText);
          setIsNonEnglishPlaying(data.isNonEnglish);
          setDetectedLangInfo({ code: data.sourceLang, name: data.sourceLangName });

          // Add to caption history log
          const newEntry = {
            id: Date.now() + Math.random(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            original: data.originalText,
            translation: data.translatedText,
            langCode: data.sourceLang,
            langName: data.sourceLangName
          };

          setCaptionHistory(prev => {
            const updated = [...prev, newEntry];
            return updated.slice(-50);
          });
        }
      }
    } catch (e) {
      console.error('[LiveTranslationWidget] Translation fetch error:', e);
    }
  };

  const checkLanguageAndTranslate = (text, isQuietCheck = false) => {
    translateTextPayload(text, isQuietCheck);
  };

  // 4. Demo Audio Playback Simulator Mode
  const toggleDemoPlayback = () => {
    if (isPlayingDemo) {
      if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
      setIsPlayingDemo(false);
      return;
    }

    setIsPlayingDemo(true);
    let sampleIndex = 0;

    const playNextSample = () => {
      const sample = DEMO_MEDIA_SAMPLES[sampleIndex];
      sampleIndex = (sampleIndex + 1) % DEMO_MEDIA_SAMPLES.length;
      
      setCurrentOriginal(sample.text);
      setDetectedLangInfo({ code: sample.lang, name: sample.langName });
      translateTextPayload(sample.text);
    };

    playNextSample();
    demoIntervalRef.current = setInterval(playNextSample, 7000);
  };

  useEffect(() => {
    return () => {
      if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
    };
  }, []);

  // 5. Drag & Drop Floating position handler
  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y
    };

    const handleMouseMove = (ev) => {
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      setPosition({
        x: dragRef.current.initialX + dx,
        y: dragRef.current.initialY + dy
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  if (!isOpen) return null;

  const fontClasses = {
    small: 'text-sm leading-snug',
    medium: 'text-base leading-relaxed',
    large: 'text-lg font-semibold leading-normal'
  };

  return (
    <>
      {/* Floating Chrome-Style Live Translation Overlay */}
      <div 
        className="fixed z-50 transition-all duration-150 ease-out select-none"
        style={{
          bottom: `${Math.max(20, position.y)}px`,
          left: `${Math.max(20, position.x)}px`,
          maxWidth: 'min(640px, 92vw)',
          width: '600px'
        }}
      >
        <div className="bg-slate-950/90 backdrop-blur-xl border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-950/50 text-slate-100 overflow-hidden group">
          
          {/* Header Bar / Drag Handle */}
          <div 
            onMouseDown={handleMouseDown}
            className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border-b border-cyan-500/20 cursor-move"
          >
            <div className="flex items-center space-x-2.5">
              <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-medium">
                <Globe className="w-3.5 h-3.5 animate-spin-slow" />
                <span>CHROME LIVE TRANSLATE</span>
              </div>

              {/* Detected Language Pill */}
              <div className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                <span className="uppercase tracking-wider">{detectedLangInfo.name} ({detectedLangInfo.code})</span>
                <span className="text-slate-400">➔</span>
                <span className="text-cyan-300 uppercase tracking-wider">{selectedTargetLang}</span>
              </div>

              {/* Equalizer Animation when translating */}
              {isTranslating && (
                <div className="flex items-center space-x-0.5 h-3">
                  <div className="w-0.5 bg-cyan-400 animate-pulse h-full"></div>
                  <div className="w-0.5 bg-cyan-300 animate-bounce h-2"></div>
                  <div className="w-0.5 bg-cyan-500 animate-pulse h-3"></div>
                </div>
              )}
            </div>

            {/* Quick Actions & Controls */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-1.5 rounded-lg transition-colors ${showSettings ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60'}`}
                title="Translation Settings"
              >
                <Settings className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowHistoryModal(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors"
                title="View Full History Log"
              >
                <Languages className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors"
                title={isMinimized ? "Expand Caption Box" : "Minimize"}
              >
                {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Close Live Translation Overlay"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Media Info Bar (If system media is currently detected) */}
          {mediaTrackInfo && (
            <div className="px-4 py-1.5 bg-cyan-950/20 border-b border-cyan-500/10 flex items-center justify-between text-xs text-cyan-300/80">
              <div className="flex items-center space-x-2 truncate">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
                <span className="font-medium truncate">{mediaTrackInfo.title}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400 truncate">{mediaTrackInfo.artist || 'Device Media'}</span>
              </div>
              <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded text-[10px]">
                MEDIA ACTIVE
              </span>
            </div>
          )}

          {/* Live Translation Settings Drawer */}
          {showSettings && (
            <div className="p-4 bg-slate-900/90 border-b border-cyan-500/20 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                {/* Source Language Override */}
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Source Spoken Language</label>
                  <select 
                    value={selectedSourceLang}
                    onChange={(e) => setSelectedSourceLang(e.target.value)}
                    className="w-full bg-slate-950 border border-cyan-500/30 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-400"
                  >
                    {SUPPORTED_LANGUAGES.map(lang => (
                      <option key={lang.code} value={lang.code}>{lang.name}</option>
                    ))}
                  </select>
                </div>

                {/* Target Language */}
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Target Caption Language</label>
                  <select 
                    value={selectedTargetLang}
                    onChange={(e) => setSelectedTargetLang(e.target.value)}
                    className="w-full bg-slate-950 border border-cyan-500/30 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-400"
                  >
                    {TARGET_LANGUAGES.map(lang => (
                      <option key={lang.code} value={lang.code}>{lang.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                {/* Auto Translate Toggle */}
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox"
                    id="autoTranslateCheck"
                    checked={autoTranslateEnabled}
                    onChange={(e) => onToggleAutoTranslate && onToggleAutoTranslate(e.target.checked)}
                    className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                  />
                  <label htmlFor="autoTranslateCheck" className="text-slate-300 cursor-pointer">
                    Auto-show when non-English media plays
                  </label>
                </div>

                {/* Font Size controls */}
                <div className="flex items-center space-x-1">
                  <span className="text-slate-400 mr-1">Font Size:</span>
                  {['small', 'medium', 'large'].map(size => (
                    <button
                      key={size}
                      onClick={() => setFontSize(size)}
                      className={`px-2 py-0.5 rounded capitalize ${fontSize === size ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Demo Mode Audio Simulation */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Test Non-English Playback:</span>
                <button
                  onClick={toggleDemoPlayback}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg font-medium transition-colors ${
                    isPlayingDemo 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40'
                  }`}
                >
                  {isPlayingDemo ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlayingDemo ? 'Pause Demo Stream' : 'Play Demo Non-English Stream'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Caption Box Content Area */}
          {!isMinimized && (
            <div className="p-4 space-y-3 bg-slate-950/70">
              
              {/* Original Recognized Speech (Source Language) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-cyan-400/70 uppercase tracking-widest font-mono">
                  <span>SPEECH IN {detectedLangInfo.name}</span>
                  {currentOriginal && <span className="text-slate-500">Live Capturing</span>}
                </div>
                <p className="text-cyan-200/80 italic font-mono text-sm min-h-[1.5rem] bg-cyan-950/20 p-2 rounded-lg border border-cyan-500/10">
                  {currentOriginal || (
                    <span className="text-slate-500 not-italic">
                      {isTranslating ? 'Listening for non-English speech audio...' : 'Live translation paused.'}
                    </span>
                  )}
                </p>
              </div>

              {/* Live Translated Subtitles (Target Language) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-amber-400/80 uppercase tracking-widest font-mono">
                  <span className="flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>ENGLISH LIVE TRANSLATION</span>
                  </span>
                  <span className="text-xs text-amber-300/80 font-sans">Chrome Live Translate</span>
                </div>
                <div className={`p-3 rounded-xl bg-slate-900/90 border border-cyan-500/30 shadow-inner font-sans ${fontClasses[fontSize]}`}>
                  <p className="text-cyan-100 font-semibold tracking-wide leading-relaxed drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                    {currentTranslation || (
                      <span className="text-slate-500 font-normal">
                        Translations will stream here live as soon as non-English audio plays.
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Bottom Quick Footer Controls */}
              <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsTranslating(!isTranslating)}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg border transition-colors ${
                      isTranslating 
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
                        : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    }`}
                  >
                    {isTranslating ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                    <span>{isTranslating ? 'Listening Active' : 'Paused'}</span>
                  </button>

                  <span className="text-slate-600">|</span>

                  <span className="text-[11px] text-slate-400">
                    Captions logged: <strong className="text-cyan-300 font-mono">{captionHistory.length}</strong>
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      if (currentTranslation) {
                        navigator.clipboard.writeText(`${currentOriginal}\n${currentTranslation}`);
                      }
                    }}
                    className="flex items-center space-x-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-colors text-xs"
                    title="Copy Current Caption"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* Full Transcript History Drawer / Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border-b border-cyan-500/20 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-slate-100">Live Translation Session History</h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* History List */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 font-sans">
              {captionHistory.length === 0 ? (
                <div className="text-center py-12 text-slate-500 space-y-2">
                  <Languages className="w-12 h-12 mx-auto text-slate-600 animate-pulse" />
                  <p>No translation logs recorded yet in this session.</p>
                </div>
              ) : (
                captionHistory.map((item) => (
                  <div key={item.id} className="p-3.5 bg-slate-950/80 border border-cyan-500/20 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-mono text-cyan-400">{item.time}</span>
                      <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-300 rounded font-semibold uppercase text-[10px]">
                        {item.langName} ({item.langCode})
                      </span>
                    </div>
                    <p className="text-slate-400 italic text-sm">{item.original}</p>
                    <p className="text-cyan-200 font-semibold text-base">{item.translation}</p>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-950 border-t border-cyan-500/20 flex items-center justify-between">
              <button
                onClick={() => setCaptionHistory([])}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-lg text-xs font-medium border border-rose-500/30 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>

              <button
                onClick={() => {
                  const content = captionHistory.map(h => `[${h.time}] (${h.langName})\nOriginal: ${h.original}\nTranslation: ${h.translation}\n`).join('\n---\n\n');
                  const blob = new Blob([content], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `jasper-live-translation-${Date.now()}.txt`;
                  a.click();
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg text-xs font-medium border border-cyan-500/40 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Log File</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
