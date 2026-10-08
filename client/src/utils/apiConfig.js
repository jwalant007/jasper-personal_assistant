// Dynamic API & WebSocket Base URL manager
// Supports 24/7 Render Cloud, local PC access, LAN mobile access, and custom server IP configuration
const API_PORT = 3001;

export const RENDER_CLOUD_HOST = 'jasper-personal-assistant.onrender.com';
export const RENDER_CLOUD_URL = 'https://jasper-personal-assistant.onrender.com';
export const DEFAULT_SERVER_IP = RENDER_CLOUD_HOST;

export function isCapacitorNative() {
  if (typeof window === 'undefined') return false;
  return !!(
    window.Capacitor?.isNativePlatform?.() ||
    window.location.protocol === 'capacitor:' ||
    (/Android|iPhone|iPad/i.test(navigator.userAgent) && window.location.hostname === 'localhost')
  );
}

export function isElectronApp() {
  if (typeof window === 'undefined') return false;
  return !!(
    window.location.protocol === 'file:' ||
    navigator.userAgent.includes('Electron') ||
    window.process?.type === 'renderer'
  );
}

export function getServerIp() {
  let saved = localStorage.getItem('jasper_server_ip');
  // Clear any old expired ngrok or outdated IP values from localStorage
  if (saved && (saved.includes('ngrok') || saved.trim() === '192.168.29.132' || saved.trim() === '192.168.1.100')) {
    localStorage.removeItem('jasper_server_ip');
    saved = null;
  }
  if (saved && saved.trim()) return saved.trim();

  // If running as native Android APK or Windows Desktop EXE, default directly to Render Cloud
  if (isCapacitorNative() || isElectronApp()) {
    return RENDER_CLOUD_HOST;
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // If hosted on Render or cloud domain
    if (host && host !== 'capacitor' && host !== 'localhost' && host !== '127.0.0.1') {
      return host;
    }
    // If local dev environment (Vite running on localhost:5173)
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'localhost';
    }
  }
  return DEFAULT_SERVER_IP;
}

export function setServerIp(ip) {
  if (ip && ip.trim()) {
    localStorage.setItem('jasper_server_ip', ip.trim());
  } else {
    localStorage.removeItem('jasper_server_ip');
  }
}

export function setServerToCloud() {
  localStorage.setItem('jasper_server_ip', RENDER_CLOUD_HOST);
}

export function setServerToLocalhost() {
  localStorage.setItem('jasper_server_ip', 'localhost');
}

export function isCloudMode() {
  const ip = getServerIp().toLowerCase();
  return ip.includes('onrender.com') || ip.includes('render.com') || ip.startsWith('https://');
}

export function getApiBase() {
  let ip = getServerIp().trim().replace(/\/+$/, '');
  if (ip.startsWith('http://') || ip.startsWith('https://')) {
    return ip;
  }
  if (
    ip.includes('onrender.com') || 
    ip.includes('render.com') || 
    ip.includes('ngrok') || 
    (ip.includes('.') && !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip) && !ip.includes('localhost'))
  ) {
    return `https://${ip}`;
  }
  return `http://${ip}:${API_PORT}`;
}

export function getWsBase() {
  let url = getServerIp().trim().replace(/\/+$/, '');
  const isHttpsPage = typeof window !== 'undefined' && window.location.protocol === 'https:';

  if (url.startsWith('https://')) {
    url = url.replace('https://', 'wss://');
  } else if (url.startsWith('http://')) {
    url = isHttpsPage ? url.replace('http://', 'wss://') : url.replace('http://', 'ws://');
  } else if (url.startsWith('wss://')) {
    return url;
  } else if (url.startsWith('ws://')) {
    return isHttpsPage ? url.replace('ws://', 'wss://') : url;
  } else if (
    url.includes('onrender.com') || 
    url.includes('render.com') || 
    url.includes('ngrok') || 
    (url.includes('.') && !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(url) && !url.includes('localhost'))
  ) {
    url = `wss://${url}/ws`;
  } else {
    url = isHttpsPage ? `wss://${url}:${API_PORT}` : `ws://${url}:${API_PORT}`;
  }

  return url;
}

export const API_BASE = {
  toString: () => getApiBase(),
  valueOf: () => getApiBase()
};

export const WS_BASE = {
  toString: () => getWsBase(),
  valueOf: () => getWsBase()
};

