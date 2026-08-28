// Utility to ensure Jasper's voice plays loud and clear on the device placing the call

let audioContextInstance = null;

// Unlock AudioContext and SpeechSynthesis on user interaction / call start
export const unlockDeviceAudio = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      if (!audioContextInstance) {
        audioContextInstance = new AudioContextClass();
      }
      if (audioContextInstance.state === 'suspended') {
        audioContextInstance.resume();
      }
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }
  } catch (e) {
    console.warn('[speakDeviceAudio] Audio unlock notice:', e);
  }
};

// Play sound chimes for call events (dialing, connection, end)
export const playCallChime = (type = 'dialing') => {
  try {
    unlockDeviceAudio();
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass || typeof AudioContextClass !== 'function') return;
    const ctx = audioContextInstance || new AudioContextClass();

    if (type === 'dialing') {
      // Dual tone multi-frequency style dialing ringback tone (440Hz + 480Hz)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.value = 440;
      osc2.frequency.value = 480;

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 1.25);
      osc2.stop(ctx.currentTime + 1.25);
    } else if (type === 'connected') {
      // Rising double chime for connected call
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.1, ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.35);
      });
    } else if (type === 'ended') {
      // Descending tone for ended call
      [440, 330].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.15 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.15);
        osc.stop(ctx.currentTime + idx * 0.15 + 0.35);
      });
    }
  } catch (e) {
    console.warn('[speakDeviceAudio] Chime playback warning:', e);
  }
};

/**
 * Robustly play speech output directly on the device from which the call is placed.
 * Uses Web Speech API with automatic voice fallback, plus HTML5 Audio backup.
 */
export const speakDeviceAudio = (text, options = {}) => {
  if (!text || typeof window === 'undefined') return;

  const {
    rate = 1.0,
    pitch = 0.98,
    onStart,
    onEnd,
    onError
  } = options;

  unlockDeviceAudio();

  // Try Web Speech API first
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();

      let spoken = false;

      const executeSpeak = () => {
        if (spoken) return;
        spoken = true;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate;
        utterance.pitch = pitch;

        const voices = window.speechSynthesis.getVoices() || [];
        const preferredVoice = voices.find(v => v.lang?.startsWith('en-GB')) ||
                               voices.find(v => v.name?.includes('Google UK English')) ||
                               voices.find(v => v.name?.includes('Natural')) ||
                               voices.find(v => v.name?.includes('George') || v.name?.includes('Hazel')) ||
                               voices.find(v => v.lang?.startsWith('en')) ||
                               voices[0];

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        if (onStart) utterance.onstart = onStart;
        utterance.onend = () => {
          if (onEnd) onEnd();
        };
        utterance.onerror = (err) => {
          console.warn('[speakDeviceAudio] WebSpeech error event:', err);
          fallbackHtml5Audio(text, onStart, onEnd, onError);
        };

        window.speechSynthesis.speak(utterance);
      };

      const voices = window.speechSynthesis.getVoices() || [];
      if (voices && voices.length > 0) {
        executeSpeak();
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.onvoiceschanged = null;
          executeSpeak();
        };
        // Safety timeout if voiceschanged doesn't fire promptly
        setTimeout(executeSpeak, 200);
      }
      return;
    } catch (e) {
      console.warn('[speakDeviceAudio] WebSpeech synthesis exception, triggering fallback:', e);
    }
  }

  // Fallback if Web Speech API is unavailable or threw exception
  fallbackHtml5Audio(text, onStart, onEnd, onError);
};

function fallbackHtml5Audio(text, onStart, onEnd, onError) {
  try {
    const encoded = encodeURIComponent(text);
    const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=en&client=tw-ob`;
    const audio = new Audio(audioUrl);
    if (onStart) audio.onplay = onStart;
    audio.onended = () => {
      if (onEnd) onEnd();
    };
    audio.onerror = (e) => {
      console.error('[speakDeviceAudio] Fallback audio playback error:', e);
      if (onError) onError(e);
      if (onEnd) onEnd();
    };
    audio.play().catch(err => {
      console.warn('[speakDeviceAudio] Audio element play prevented by browser policy:', err);
      if (onEnd) onEnd();
    });
  } catch (err) {
    console.error('[speakDeviceAudio] All audio playback methods failed:', err);
    if (onEnd) onEnd();
  }
}

export const speakMessage = speakDeviceAudio;

