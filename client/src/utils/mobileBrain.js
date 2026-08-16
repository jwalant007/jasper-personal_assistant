// Mobile Brain Mode State Manager
// Configures whether the Phone acts as the primary AI Neural Core or PC acts as Core

const STORAGE_KEY = 'jasper_phone_brain_mode';

export function getPhoneBrainMode() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) === 'true';
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
