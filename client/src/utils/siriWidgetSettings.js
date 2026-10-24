/**
 * J.A.S.P.E.R. Siri-Type Voice Assistant & Floating Hover Widget Settings
 * Persistent configuration via localStorage with reactive broadcast events.
 */

const STORAGE_KEY = 'jasper_siri_assistant_settings_v1';

export const DEFAULT_SIRI_SETTINGS = {
  enabled: true,
  triggerKey: 'Space', // 'Space' | 'Alt' | 'Control' | 'Backquote' | 'F8' | 'KeyJ'
  holdSeconds: 1.5, // 0.8s to 3.0s
  widgetSize: 'standard', // 'compact' (44px) | 'standard' (56px) | 'large' (68px)
  theme: 'siri', // 'siri' | 'arc' | 'stark' | 'neon' | 'cyber'
  autoWake: true,
  soundChime: true,
  posX: null, // calculated dynamically on first mount
  posY: null
};

export const HOTKEY_OPTIONS = [
  { key: 'Space', label: 'Spacebar (Hold)', description: 'Press & hold Spacebar (outside text inputs)' },
  { key: 'Alt', label: 'Alt Key (Hold)', description: 'Press & hold Alt key for a few seconds' },
  { key: 'Control', label: 'Ctrl Key (Hold)', description: 'Press & hold Control key' },
  { key: 'Backquote', label: 'Tilde ` ~ (Hold)', description: 'Key under Escape button' },
  { key: 'F8', label: 'F8 Key (Hold)', description: 'Dedicated Function key' },
  { key: 'KeyJ', label: 'J Key (Hold)', description: 'Hold J for J.A.S.P.E.R. assistant' }
];

export const THEME_OPTIONS = [
  { 
    id: 'siri', 
    name: 'Siri Aurora', 
    gradient: 'from-pink-500 via-indigo-500 to-cyan-400',
    ring: 'border-cyan-400',
    glow: 'rgba(236, 72, 153, 0.45)',
    core: 'bg-gradient-to-tr from-pink-500 to-cyan-400'
  },
  { 
    id: 'arc', 
    name: 'Arc Reactor Cyan', 
    gradient: 'from-cyan-400 via-sky-500 to-blue-600',
    ring: 'border-cyan-300',
    glow: 'rgba(0, 229, 255, 0.45)',
    core: 'bg-gradient-to-tr from-cyan-400 to-blue-600'
  },
  { 
    id: 'stark', 
    name: 'Stark Gold & Ruby', 
    gradient: 'from-amber-400 via-orange-500 to-rose-600',
    ring: 'border-amber-400',
    glow: 'rgba(245, 158, 11, 0.45)',
    core: 'bg-gradient-to-tr from-amber-400 to-rose-600'
  },
  { 
    id: 'cyber', 
    name: 'Cyber Emerald', 
    gradient: 'from-emerald-400 via-teal-500 to-cyan-500',
    ring: 'border-emerald-400',
    glow: 'rgba(16, 185, 129, 0.45)',
    core: 'bg-gradient-to-tr from-emerald-400 to-cyan-500'
  },
  { 
    id: 'neon', 
    name: 'Neon Violet', 
    gradient: 'from-purple-500 via-fuchsia-500 to-pink-500',
    ring: 'border-fuchsia-400',
    glow: 'rgba(168, 85, 247, 0.45)',
    core: 'bg-gradient-to-tr from-purple-500 to-pink-500'
  }
];

export function getSiriWidgetSettings() {
  if (typeof window === 'undefined') return DEFAULT_SIRI_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SIRI_SETTINGS;
    return { ...DEFAULT_SIRI_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.warn('[SiriSettings] Failed to parse stored settings:', e);
    return DEFAULT_SIRI_SETTINGS;
  }
}

export function saveSiriWidgetSettings(updates) {
  if (typeof window === 'undefined') return;
  try {
    const current = getSiriWidgetSettings();
    const next = { ...current, ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('jasper:siri-settings-changed', { detail: next }));
    return next;
  } catch (e) {
    console.warn('[SiriSettings] Failed to save settings:', e);
  }
}

export function openSiriSettingsModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('jasper:open-siri-settings'));
  }
}

export function triggerSiriAssistant() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('jasper:trigger-siri-assistant'));
  }
}
