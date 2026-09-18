/**
 * J.A.S.P.E.R. HOLOGRAPHIC VOICE COMMAND LISTENER
 * Wake word ("jarvis" / "jasper") & rapid command recognition matching the reel:
 * - "next one" / "that one" / "go back" / "zoom in" / "zoom out"
 * - "explode view" / "reassemble" / "switch to arc reactor" / "switch to repulsor"
 */

export class HolographicVoiceCommander {
  constructor(callbacks = {}) {
    this.callbacks = {
      onCommand: callbacks.onCommand || (() => {}),
      onTranscript: callbacks.onTranscript || (() => {}),
      onStatusChange: callbacks.onStatusChange || (() => {}),
      ...callbacks
    };

    this.recognition = null;
    this.isListening = false;
    this.wakeWordRequired = false; // set true for strict wake word mode
    this.lastProcessed = '';
  }

  isSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  start() {
    if (this.isListening) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

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

  evaluateCommand(text) {
    // Strip wake words
    let clean = text.replace(/^(hey\s+)?(jarvis|jasper)[,\s]*/i, '').trim();

    if (clean === this.lastProcessed) return;

    let matchedCmd = null;

    if (clean.includes('next one') || clean.includes('next creation') || clean.includes('swipe right') || clean === 'next') {
      matchedCmd = 'NEXT';
    } else if (clean.includes('previous one') || clean.includes('go back') || clean.includes('swipe left') || clean === 'back' || clean === 'previous') {
      matchedCmd = 'PREV';
    } else if (clean.includes('that one') || clean.includes('open this') || clean.includes('select this')) {
      matchedCmd = 'SELECT';
    } else if (clean.includes('zoom in') || clean.includes('magnify')) {
      matchedCmd = 'ZOOM_IN';
    } else if (clean.includes('zoom out') || clean.includes('shrink')) {
      matchedCmd = 'ZOOM_OUT';
    } else if (clean.includes('explode view') || clean.includes('explode suit') || clean.includes('explode armor') || clean.includes('disassemble')) {
      matchedCmd = 'EXPLODE';
    } else if (clean.includes('reassemble') || clean.includes('assemble') || clean.includes('restore armor')) {
      matchedCmd = 'REASSEMBLE';
    } else if (clean.includes('arc reactor') || clean.includes('reactor core')) {
      matchedCmd = 'SWITCH_REACTOR';
    } else if (clean.includes('repulsor') || clean.includes('thruster')) {
      matchedCmd = 'SWITCH_REPULSOR';
    } else if (clean.includes('genome') || clean.includes('dna') || clean.includes('double helix')) {
      matchedCmd = 'SWITCH_GENOME';
    } else if (clean.includes('iron man') || clean.includes('mark 85') || clean.includes('mark 7')) {
      matchedCmd = 'SWITCH_IRONMAN';
    } else if (clean.includes('spider man') || clean.includes('spiderman') || clean.includes('spider suit')) {
      matchedCmd = 'SWITCH_SPIDERMAN';
    } else if (clean.includes('tesseract') || clean.includes('4d') || clean.includes('hypercube')) {
      matchedCmd = 'SWITCH_TESSERACT';
    } else if (clean.includes('toggle camera') || clean.includes('toggle webcam') || clean.includes('toggle ar') || clean.includes('ar mode')) {
      matchedCmd = 'TOGGLE_AR';
    } else if (clean.includes('reset camera') || clean.includes('default view') || clean.includes('center view')) {
      matchedCmd = 'RESET_VIEW';
    } else if (clean.includes('blender studio') || clean.includes('switch to blender') || clean.includes('open blender') || clean === 'blender' || clean.includes('3d studio')) {
      matchedCmd = 'SWITCH_BLENDER';
    } else if (clean.includes('generate 3d') || clean.includes('create 3d model') || clean.includes('synthesize 3d') || clean.includes('make 3d model') || clean.includes('blender generate')) {
      matchedCmd = 'GENERATE_BLENDER';
    } else if (clean.includes('project to hologram') || clean.includes('project model') || clean.includes('beam model') || clean.includes('send to workstation') || clean.includes('holographic projection')) {
      matchedCmd = 'PROJECT_BLENDER';
    } else if (clean.includes('satellite intelligence') || clean.includes('satellite view') || clean.includes('satellite mode') || clean.includes('orbital recon') || clean.includes('orbital view') || clean.includes('recon satellite') || clean === 'satellite' || clean.includes('spatial gps') || clean.includes('spatial map') || clean.includes('spatial intelligence') || clean.includes('satellite and gps') || clean.includes('gps and satellite')) {
      matchedCmd = 'SWITCH_SATELLITE';
    } else if (clean.includes('device location') || clean.includes('where am i') || clean.includes('precise location') || clean.includes('my location') || clean.includes('track device') || clean.includes('gps location') || clean.includes('show location')) {
      matchedCmd = 'DEVICE_LOCATION';
    } else if (clean.includes('satellite lock') || clean.includes('orbital lock') || clean.includes('lock on device') || clean.includes('pinpoint device') || clean.includes('spatial lock')) {
      matchedCmd = 'SATELLITE_LOCK';
    } else if (clean.includes('phone sentinel') || clean.includes('phone alert') || clean.includes('offline alert') || clean.includes('weather alert') || clean.includes('sentinel mode') || clean.includes('mobile sentinel')) {
      matchedCmd = 'SWITCH_SENTINEL';
    } else if (clean.includes('test phone alert') || clean.includes('test notification') || clean.includes('ping phone') || clean.includes('test push') || clean.includes('test alert')) {
      matchedCmd = 'TEST_PHONE_ALERT';
    }

    if (matchedCmd) {
      this.lastProcessed = clean;
      this.callbacks.onCommand(matchedCmd, clean);
      setTimeout(() => {
        if (this.lastProcessed === clean) this.lastProcessed = '';
      }, 1500);
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
