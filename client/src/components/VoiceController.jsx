import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { getWsBase, getApiBase } from '../utils/apiConfig.js';
import { speakDeviceAudio, unlockDeviceAudio } from '../utils/speakDeviceAudio.js';

// Web Audio API Sound Generator helper
const playChime = (type = 'wake') => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    if (type === 'wake') {
      // Stark Tech rising arpeggio: 3 quick notes
      const notes = [440, 660, 880]; // A4, E5, A5
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.08);
        
        gain.gain.setValueAtTime(0.15, ctx.currentTime + index * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.08 + 0.25);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + index * 0.08);
        osc.stop(ctx.currentTime + index * 0.08 + 0.3);
      });
    } else if (type === 'sleep') {
      // Descending tone
      const notes = [600, 400];
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.12);
        
        gain.gain.setValueAtTime(0.12, ctx.currentTime + index * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.12 + 0.2);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + index * 0.12);
        osc.stop(ctx.currentTime + index * 0.12 + 0.25);
      });
    } else if (type === 'success') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, ctx.currentTime); // B5
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (e) {
    console.error('Audio synthesis failed:', e);
  }
};

const VoiceController = forwardRef(({ 
  onStateChange, 
  onCommandReceived, 
  speakingText, 
  onSpeakingComplete,
  triggerWake
}, ref) => {
  const [recognition, setRecognition] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const socketRef = useRef(null);
  const speechTimeoutRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser. Use Chrome.');
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setIsListening(true);
      onStateChange('listening');
      // Set a safety timeout: if no speech is detected for 10 seconds, abort listening
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = setTimeout(() => {
        rec.abort();
      }, 10000);
    };

    rec.onresult = (event) => {
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
      const command = event.results[0][0].transcript;
      console.log('[VoiceController] Recognized speech:', command);
      onCommandReceived(command);
    };

    rec.onerror = (e) => {
      console.error('[VoiceController] Speech error:', e);
      setIsListening(false);
      onStateChange('idle');
      playChime('sleep');
    };

    rec.onend = () => {
      setIsListening(false);
      // Wait to see if we transitioned to speaking or processing, otherwise set idle
      setTimeout(() => {
        onStateChange(current => {
          if (current === 'listening') return 'idle';
          return current;
        });
      }, 200);
    };

    setRecognition(rec);
    return () => {
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    };
  }, []);

  // Connect to Backend WebSocket for Background Wake-Word Events with pre-flight bypass & resilient reconnect
  useEffect(() => {
    let isDisposed = false;
    let reconnectTimer = null;

    const connectWS = async () => {
      if (isDisposed) return;
      
      const wsUrl = getWsBase();
      const apiUrl = getApiBase();

      // Pre-flight HTTP ping to register Ngrok bypass headers / cookie before WebSocket handshake
      try {
        await fetch(`${apiUrl}/api/system/diagnostics`, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
      } catch (e) {
        // Continue to WS connection attempt even if preflight fails
      }

      if (isDisposed) return;

      // Protocol Guard: Prevent initiating insecure ws:// from an https:// page
      if (typeof window !== 'undefined' && window.location.protocol === 'https:' && wsUrl.startsWith('ws://')) {
        console.warn('[VoiceController WS] Suppressed insecure ws:// connection on https:// page to prevent SecurityError.');
        return;
      }

      try {
        console.log(`[VoiceController WS] Initializing connection to: ${wsUrl}`);
        let socket;
        try {
          socket = new WebSocket(wsUrl);
        } catch (wsErr) {
          console.warn('[VoiceController WS] WebSocket constructor error suppressed:', wsErr?.message || wsErr);
          if (!isDisposed) reconnectTimer = setTimeout(connectWS, 10000);
          return;
        }



        socket.onopen = () => {
          console.log('[VoiceController WS] Successfully connected to backend voice triggers.');
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'WAKE_UP') {
              console.log('[VoiceController WS] Woke up from background voice listener!');
              startListeningWithChime();
            }
          } catch (err) {
            console.error('[VoiceController WS] Parse error:', err);
          }
        };

        socket.onerror = (err) => {
          console.warn('[VoiceController WS] Connection notice/error:', err?.message || 'Handshake or network interruption');
        };

        socket.onclose = () => {
          if (!isDisposed) {
            console.log('[VoiceController WS] Connection closed. Reconnecting in 5s...');
            reconnectTimer = setTimeout(connectWS, 5000);
          }
        };

        socketRef.current = socket;
      } catch (err) {
        console.warn('[VoiceController WS] Initialization failed:', err.message);
        if (!isDisposed) {
          reconnectTimer = setTimeout(connectWS, 5000);
        }
      }
    };

    connectWS();
    return () => {
      isDisposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (socketRef.current) {
        try {
          socketRef.current.close();
        } catch (e) {}
      }
    };
  }, [recognition]);


  // Handle manual wake requests (e.g. from App.jsx when ?wake=true is matched)
  useEffect(() => {
    if (triggerWake && recognition) {
      startListeningWithChime();
    }
  }, [triggerWake, recognition]);

  // Handle Output Voice Synthesis (Speak text when speakingText updates)
  useEffect(() => {
    if (!speakingText || typeof window === 'undefined') return;

    try {
      speakDeviceAudio(speakingText, {
        rate: 1.05,
        pitch: 0.95,
        onStart: () => onStateChange('speaking'),
        onEnd: () => {
          onStateChange('idle');
          onSpeakingComplete();
        },
        onError: () => {
          onStateChange('idle');
          onSpeakingComplete();
        }
      });
    } catch (e) {
      console.warn('[VoiceController] Speech synthesis failed:', e);
      onStateChange('idle');
      onSpeakingComplete();
    }
  }, [speakingText]);

  const startListeningWithChime = () => {
    if (!recognition) return;
    try {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel(); // Mute if speaking
      }
      playChime('wake');
      recognition.abort(); // Cancel active recognition
      setTimeout(() => {
        recognition.start();
      }, 150);
    } catch (e) {
      console.error('Failed to start recognition:', e);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognition?.abort();
    } else {
      startListeningWithChime();
    }
  };

  useImperativeHandle(ref, () => ({
    toggleListening,
    isListening,
    playSuccess: () => playChime('success'),
    playError: () => playChime('sleep')
  }));

  return null;
});

export default VoiceController;
export { playChime };
