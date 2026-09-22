/**
 * J.A.S.P.E.R. HOLOGRAPHIC VOICE COMMAND LISTENER
 * Modern semantic intent classifier with multi-synonym matching,
 * Levenshtein typo-tolerance, and conversational fallback routing.
 */

// Intent definitions with synonym sets and triggers
const INTENTS = [
  {
    id: 'NEXT',
    triggers: ['next', 'next one', 'swipe right', 'forward', 'subsequent', 'next creation', 'advance', 'turn right']
  },
  {
    id: 'PREV',
    triggers: ['previous', 'prev', 'back', 'go back', 'swipe left', 'prior', 'last one', 'return', 'turn left']
  },
  {
    id: 'SELECT',
    triggers: ['select', 'open this', 'choose this', 'inspect this', 'expand this', 'inspect model']
  },
  {
    id: 'ZOOM_IN',
    triggers: ['zoom in', 'magnify', 'enhance', 'enlarge', 'closer', 'scale up', 'make bigger', 'bring closer', 'closer look']
  },
  {
    id: 'ZOOM_OUT',
    triggers: ['zoom out', 'shrink', 'smaller', 'further', 'step back', 'scale down', 'pull back', 'back up']
  },
  {
    id: 'EXPLODE',
    triggers: ['explode', 'explode view', 'explode suit', 'explode armor', 'disassemble', 'break apart', 'tear down', 'exploded view']
  },
  {
    id: 'REASSEMBLE',
    triggers: ['reassemble', 'assemble', 'restore armor', 'put together', 'rebuild', 'reconstruct', 'reassembly']
  },
  {
    id: 'SWITCH_REACTOR',
    triggers: ['arc reactor', 'reactor core', 'palladium core', 'energy core', 'tokamak', 'switch to reactor']
  },
  {
    id: 'SWITCH_REPULSOR',
    triggers: ['repulsor', 'repulsor engine', 'thruster', 'flight stabilizer', 'switch to repulsor']
  },
  {
    id: 'SWITCH_GENOME',
    triggers: ['genome', 'dna', 'double helix', 'synthetic genome', 'crispr', 'switch to genome']
  },
  {
    id: 'SWITCH_IRONMAN',
    triggers: ['iron man', 'mark 85', 'mark 7', 'stark armor', 'ironman', 'switch to iron man', 'suit armor']
  },
  {
    id: 'SWITCH_SPIDERMAN',
    triggers: ['spider man', 'spiderman', 'spider suit', 'iron spider', 'switch to spiderman']
  },
  {
    id: 'SWITCH_TESSERACT',
    triggers: ['tesseract', '4d', 'hypercube', 'four dimensions', 'switch to tesseract']
  },
  {
    id: 'SWITCH_BLENDER',
    triggers: ['blender studio', 'switch to blender', 'open blender', 'blender', '3d studio', 'blender viewport']
  },
  {
    id: 'GENERATE_BLENDER',
    triggers: ['generate 3d', 'create 3d model', 'synthesize 3d', 'make 3d model', 'blender generate', 'procedural 3d']
  },
  {
    id: 'PROJECT_BLENDER',
    triggers: ['project to hologram', 'project model', 'beam model', 'send to workstation', 'holographic projection']
  },
  {
    id: 'SWITCH_SATELLITE',
    triggers: ['satellite intelligence', 'satellite view', 'satellite mode', 'orbital recon', 'orbital view', 'recon satellite', 'satellite', 'spatial gps', 'spatial map', 'spatial intelligence']
  },
  {
    id: 'DEVICE_LOCATION',
    triggers: ['device location', 'where am i', 'precise location', 'my location', 'track device', 'gps location', 'show location', 'coordinates']
  },
  {
    id: 'SATELLITE_LOCK',
    triggers: ['satellite lock', 'orbital lock', 'lock on device', 'pinpoint device', 'spatial lock', 'lock target']
  },
  {
    id: 'SWITCH_SENTINEL',
    triggers: ['phone sentinel', 'phone alert', 'offline alert', 'weather alert', 'sentinel mode', 'mobile sentinel']
  },
  {
    id: 'TEST_PHONE_ALERT',
    triggers: ['test phone alert', 'test notification', 'ping phone', 'test push', 'test alert']
  },
  {
    id: 'TOGGLE_AR',
    triggers: ['toggle camera', 'toggle webcam', 'toggle ar', 'ar mode', 'augmented reality']
  },
  {
    id: 'RESET_VIEW',
    triggers: ['reset camera', 'default view', 'center view', 'recenter', 'reset view', 'home position']
  },
  {
    id: 'TOGGLE_WIREFRAME',
    triggers: ['toggle wireframe', 'wireframe mode', 'show wireframe', 'mesh view', 'toggle mesh']
  },
  {
    id: 'CLOSE_MODAL',
    triggers: ['close hologram', 'exit hologram', 'close modal', 'dismiss', 'back to desktop', 'shut down hologram', 'exit view', 'close this', 'close window']
  }
];

/**
 * Levenshtein distance for fuzzy matching speech recognition mishears
 */
function levenshteinDistance(a, b) {
  if (!a || !b) return (a || '').length + (b || '').length;
  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

export class HolographicVoiceCommander {
  constructor(callbacks = {}) {
    this.callbacks = {
      onCommand: callbacks.onCommand || (() => {}),
      onTranscript: callbacks.onTranscript || (() => {}),
      onGeneralQuery: callbacks.onGeneralQuery || (() => {}),
      onStatusChange: callbacks.onStatusChange || (() => {}),
      ...callbacks
    };

    this.recognition = null;
    this.isListening = false;
    this.wakeWordRequired = false;
    this.lastProcessed = '';
  }

  isSupported() {
    return !!(typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition));
  }

  start() {
    if (this.isListening) return;
    const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SpeechRecognition) {
      console.warn('[VoiceCommander] SpeechRecognition not supported in this browser.');
      this.callbacks.onStatusChange({ status: 'UNSUPPORTED' });
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
        this.callbacks.onStatusChange({ status: 'LISTENING' });
      };

      this.recognition.onresult = (event) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += trans;
          } else {
            interim += trans;
          }
        }

        const text = (final || interim).trim().toLowerCase();
        if (text) {
          this.callbacks.onTranscript(text);
          this.evaluateCommand(text);
        }
      };

      this.recognition.onerror = (err) => {
        if (err.error !== 'no-speech') {
          console.warn('[VoiceCommander] Notice:', err.error);
        }
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          try {
            this.recognition.start();
          } catch (e) {}
        } else {
          this.callbacks.onStatusChange({ status: 'STOPPED' });
        }
      };

      this.recognition.start();
    } catch (err) {
      console.warn('[VoiceCommander] Failed to start recognition:', err.message);
      this.callbacks.onStatusChange({ status: 'ERROR', error: err.message });
    }
  }

  /**
   * Evaluates text using the semantic intent classifier.
   * Strips wake words, performs exact, synonym, and fuzzy trigger matching,
   * and routes unrecognized questions to general conversational fallback.
   */
  evaluateCommand(text) {
    // Strip multi-modal wake words ("hey jasper", "ok jasper", "jasper", "hey jarvis", "jarvis", "computer")
    let clean = text.replace(/^(hey|ok|okay|hi|hello|yo)?\s*(jarvis|jasper|computer|assistant)[,\s]*/i, '').trim();

    if (!clean || clean === this.lastProcessed) return;

    let matchedCmd = null;

    // 1. Direct trigger & synonym match
    for (const intent of INTENTS) {
      for (const trigger of intent.triggers) {
        if (clean === trigger || clean.includes(trigger)) {
          matchedCmd = intent.id;
          break;
        }
      }
      if (matchedCmd) break;
    }

    // 2. Fuzzy / Typo match for single-word / short-phrase mishears
    if (!matchedCmd && clean.length >= 4 && clean.length <= 25) {
      for (const intent of INTENTS) {
        for (const trigger of intent.triggers) {
          if (Math.abs(clean.length - trigger.length) <= 3) {
            const dist = levenshteinDistance(clean, trigger);
            if (dist <= 2) {
              matchedCmd = intent.id;
              break;
            }
          }
        }
        if (matchedCmd) break;
      }
    }

    // 3. Dispatch matched command or route to conversational fallback
    if (matchedCmd) {
      this.lastProcessed = clean;
      this.callbacks.onCommand(matchedCmd, clean);
      setTimeout(() => {
        if (this.lastProcessed === clean) this.lastProcessed = '';
      }, 1500);
    } else if (clean.length > 8 && clean.split(/\s+/).length >= 2) {
      // Natural language conversational utterance: route to conversational AI
      this.lastProcessed = clean;
      this.callbacks.onGeneralQuery(clean);
      this.callbacks.onCommand('GENERAL_QUERY', clean);
      setTimeout(() => {
        if (this.lastProcessed === clean) this.lastProcessed = '';
      }, 3000);
    }
  }

  stop() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
      this.recognition = null;
    }
    this.callbacks.onStatusChange({ status: 'STOPPED' });
  }
}
