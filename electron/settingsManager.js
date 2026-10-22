const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const EventEmitter = require('events');

const DEFAULT_SETTINGS = {
  startWithWindows: true,
  backgroundListening: true,
  wakeWordEnabled: true,
  wakeWordSensitivity: 0.65, // 0.50 (low), 0.65 (medium), 0.80 (high)
  wakePhrase: 'Hey Jasper',
  microphoneDevice: 'Default',
  voiceResponsesEnabled: true,
  speechRate: 1.0,
  speechPitch: 1.0,
  floatingBarVisible: true,
  floatingBarPosition: null, // { x, y }
  floatingBarCompact: false,
  globalShortcut: 'CommandOrControl+Alt+J',
  speechRecognitionMode: 'local', // 'local' | 'cloud'
  privacyAudioProcessing: 'offline_strict',
  pauseUntil: null // timestamp when paused
};

class SettingsManager extends EventEmitter {
  constructor() {
    super();
    this.settingsPath = this._resolveSettingsPath();
    this.settings = { ...DEFAULT_SETTINGS };
    this.saveTimeout = null;
    this.load();
  }

  _resolveSettingsPath() {
    try {
      if (app && typeof app.getPath === 'function') {
        const userData = app.getPath('userData');
        return path.join(userData, 'jasper-desktop-settings.json');
      }
    } catch (_) {}
    return path.join(process.env.APPDATA || process.cwd(), 'jasper-desktop-settings.json');
  }

  load() {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const raw = fs.readFileSync(this.settingsPath, 'utf8');
        const parsed = JSON.parse(raw);
        this.settings = { ...DEFAULT_SETTINGS, ...parsed };
        console.log('[SettingsManager] Successfully loaded settings from:', this.settingsPath);
      } else {
        console.log('[SettingsManager] Initializing default settings at:', this.settingsPath);
        this.saveImmediately();
      }
    } catch (e) {
      console.warn('[SettingsManager] Error loading settings, falling back to defaults:', e.message);
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }

  get(key) {
    return this.settings[key] !== undefined ? this.settings[key] : DEFAULT_SETTINGS[key];
  }

  getAll() {
    return { ...this.settings };
  }

  set(key, value) {
    const oldVal = this.settings[key];
    this.settings[key] = value;
    this._scheduleSave();
    this.emit('change', { key, value, oldVal });
    this.emit(`change:${key}`, value, oldVal);
  }

  update(partial) {
    if (!partial || typeof partial !== 'object') return this.getAll();
    const changes = {};
    for (const [k, v] of Object.entries(partial)) {
      if (this.settings[k] !== v) {
        changes[k] = { oldVal: this.settings[k], newVal: v };
        this.settings[k] = v;
        this.emit(`change:${k}`, v, changes[k].oldVal);
      }
    }
    this._scheduleSave();
    if (Object.keys(changes).length > 0) {
      this.emit('change', changes);
    }
    return this.getAll();
  }

  _scheduleSave() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.saveImmediately();
    }, 400);
  }

  saveImmediately() {
    try {
      const dir = path.dirname(this.settingsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2), 'utf8');
      console.log('[SettingsManager] Settings written to disk.');
    } catch (e) {
      console.error('[SettingsManager] Failed writing settings:', e.message);
    }
  }
}

module.exports = new SettingsManager();
