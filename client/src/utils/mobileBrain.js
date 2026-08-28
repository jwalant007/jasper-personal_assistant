// Mobile & Desktop Dual Central AI Brain Swarm Manager
// Configures whether Phone, Laptop, or Both operate as the Primary AI Neural Core Mesh

const STORAGE_KEY = 'jasper_phone_brain_mode';
const DUAL_MESH_KEY = 'jasper_dual_brain_mesh_mode';

export function getPhoneBrainMode() {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved !== null) {
    return saved === 'true';
  }
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

export function isDualBrainMeshActive() {
  if (typeof window === 'undefined') return true;
  const saved = localStorage.getItem(DUAL_MESH_KEY);
  return saved !== null ? saved === 'true' : true; // Default to true (Dual Central Brain Mesh Active)
}

export function setDualBrainMeshMode(enabled) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DUAL_MESH_KEY, enabled ? 'true' : 'false');
  window.dispatchEvent(new CustomEvent('jasper_dual_mesh_change', { detail: { enabled } }));
}

export function togglePhoneBrainMode() {
  const current = getPhoneBrainMode();
  setPhoneBrainMode(!current);
  return !current;
}
