// Mobile Brain Mode State Manager
// Configures whether the Phone acts as the primary AI Neural Core or PC acts as Core

const STORAGE_KEY = 'jasper_phone_brain_mode';

export function getPhoneBrainMode() {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved !== null) {
    return saved === 'true';
  }
  // Default to true on mobile devices (transfer core to mobile)
  const ua = navigator.userAgent || navigator.vendor || window.opera || '';
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isNarrow = window.innerWidth < 960;
  return isMobileUA || isNarrow;
}

export function setPhoneBrainMode(enabled) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
  window.dispatchEvent(new CustomEvent('jasper_phone_brain_change', { detail: { enabled } }));
}

export function togglePhoneBrainMode() {
  const current = getPhoneBrainMode();
  setPhoneBrainMode(!current);
  return !current;
}

