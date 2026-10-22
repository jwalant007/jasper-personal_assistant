const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');
const readline = require('readline');

class WakeWordManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.threshold = options.threshold || 0.65;
    this.micDevice = options.micDevice || 'Default';
    this.process = null;
    this.isListening = false;
    this.isMuted = false;
    this.isDisposed = false;
    this.restartAttempts = 0;
    this.maxRestartAttempts = 5;
    this.restartTimeout = null;
  }

  start() {
    if (this.process) return;
    this.isDisposed = false;

    let scriptPath = path.join(__dirname, 'wake-word-engine.ps1');
    if (process.resourcesPath) {
      const packagedCandidate = path.join(process.resourcesPath, 'electron', 'wake-word-engine.ps1');
      if (fs.existsSync(packagedCandidate)) {
        scriptPath = packagedCandidate;
      }
    }
    console.log('[WakeWordManager] Spawning Windows Speech wake-word engine:', scriptPath);

    const args = [
      '-ExecutionPolicy', 'Bypass',
      '-NoProfile',
      '-File', scriptPath,
      '-ConfidenceThreshold', String(this.threshold),
      '-MicDevice', this.micDevice
    ];

    try {
      this.process = spawn('powershell.exe', args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true
      });

      const rl = readline.createInterface({
        input: this.process.stdout,
        terminal: false
      });

      rl.on('line', (line) => {
        this._handleStdoutLine(line);
      });

      this.process.stderr.on('data', (data) => {
        const errStr = data.toString().trim();
        if (errStr) {
          console.warn('[WakeWordManager Engine Notice]:', errStr);
        }
      });

      this.process.on('error', (err) => {
        console.error('[WakeWordManager] Spawn error:', err.message);
        this.emit('error', err);
      });

      this.process.on('close', (code) => {
        console.log(`[WakeWordManager] Engine process exited with code ${code}`);
        this.process = null;
        this.isListening = false;
        this.emit('status', { isListening: false });

        if (!this.isDisposed && this.restartAttempts < this.maxRestartAttempts) {
          this.restartAttempts++;
          console.log(`[WakeWordManager] Auto-recovering in 3s (attempt ${this.restartAttempts})...`);
          this.restartTimeout = setTimeout(() => this.start(), 3000);
        }
      });
    } catch (e) {
      console.error('[WakeWordManager] Failed to launch PowerShell listener:', e);
    }
  }

  _handleStdoutLine(line) {
    const trimmed = line.trim();
    if (!trimmed) return;

    try {
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        const event = JSON.parse(trimmed);
        switch (event.type) {
          case 'READY':
            console.log('[WakeWordManager] Engine READY. Listening on device:', event.device, 'Threshold:', event.threshold);
            this.isListening = true;
            this.restartAttempts = 0;
            this.emit('ready', event);
            this.emit('status', { isListening: true });
            break;

          case 'WAKE':
            console.log(`[WakeWordManager] Wake-phrase detected! "${event.phrase}" (Confidence: ${event.confidence})`);
            this.emit('wake', event);
            break;

          case 'MUTED':
            this.isListening = false;
            this.isMuted = true;
            console.log('[WakeWordManager] Microphone input released/muted.');
            this.emit('muted', event);
            this.emit('status', { isListening: false });
            break;

          case 'RESUMED':
            this.isListening = true;
            this.isMuted = false;
            console.log('[WakeWordManager] Microphone input restored/resumed.');
            this.emit('resumed', event);
            this.emit('status', { isListening: true });
            break;

          case 'THRESHOLD_UPDATED':
            this.threshold = event.threshold;
            console.log('[WakeWordManager] Sensitivity threshold updated to:', event.threshold);
            this.emit('threshold', event.threshold);
            break;

          case 'WARNING':
            console.warn('[WakeWordManager Engine Warning]:', event.message);
            break;

          case 'ERROR':
            console.error('[WakeWordManager Engine Error]:', event.message);
            this.emit('error', new Error(event.message));
            break;

          default:
            break;
        }
      } else {
        // Non-JSON logging
        console.log('[WakeWordManager stdout]:', trimmed);
      }
    } catch (parseErr) {
      // Ignore invalid JSON lines
    }
  }

  mute() {
    this.isMuted = true;
    if (this.process && this.process.stdin && !this.process.stdin.destroyed) {
      try {
        this.process.stdin.write('PAUSE\n');
      } catch (_) {}
    }
  }

  resume() {
    this.isMuted = false;
    if (this.process && this.process.stdin && !this.process.stdin.destroyed) {
      try {
        this.process.stdin.write('RESUME\n');
      } catch (_) {}
    } else if (!this.process) {
      this.start();
    }
  }

  setThreshold(val) {
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0 && num <= 1.0) {
      this.threshold = num;
      if (this.process && this.process.stdin && !this.process.stdin.destroyed) {
        try {
          this.process.stdin.write(`SET_THRESHOLD ${num}\n`);
        } catch (_) {}
      }
    }
  }

  stop() {
    this.isDisposed = true;
    if (this.restartTimeout) clearTimeout(this.restartTimeout);

    if (this.process) {
      try {
        if (this.process.stdin && !this.process.stdin.destroyed) {
          this.process.stdin.write('QUIT\n');
        }
      } catch (_) {}

      setTimeout(() => {
        if (this.process && this.process.pid) {
          try {
            if (process.platform === 'win32') {
              require('child_process').execSync(`taskkill /F /T /PID ${this.process.pid}`, { stdio: 'ignore' });
            } else {
              this.process.kill();
            }
          } catch (_) {}
          this.process = null;
        }
      }, 500);
    }
  }
}

module.exports = WakeWordManager;
