// Dynamic API & WebSocket Base URL manager
// Supports local PC access, LAN mobile access, and custom server IP or Ngrok URL configuration
const API_PORT = 3001;
export const DEFAULT_SERVER_IP = 'https://5b34-2405-201-202f-28a9-ddad-6cf0-2973-7f39.ngrok-free.app';

export function getServerIp() {
  let saved = localStorage.getItem('jasper_server_ip');
  // If saved contains old local IP default, clear it to use the new ngrok server URL default
  if (saved && (saved.trim() === '192.168.29.132' || saved.trim() === '192.168.1.100')) {
    localStorage.removeItem('jasper_server_ip');
    saved = null;
  }
  if (saved && saved.trim()) return saved.trim();

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const ua = navigator.userAgent || '';
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isLocalHost = !host || host === 'localhost' || host === '127.0.0.1' || host === 'capacitor';

    // If running inside Capacitor / APK or on mobile device with localhost, use DEFAULT_SERVER_IP
    if (isLocalHost || isMobileUA || window.Capacitor) {
      return DEFAULT_SERVER_IP;
    }
    return host;
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

export function getApiBase() {
  let ip = getServerIp().trim().replace(/\/+$/, '');
  if (ip.startsWith('http://') || ip.startsWith('https://')) {
    return ip;
  }
  // Domain / ngrok host without protocol (e.g. 5b34-...ngrok-free.app)
  if (ip.includes('ngrok') || (ip.includes('.') && !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip))) {
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
  } else if (url.includes('ngrok') || (url.includes('.') && !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(url))) {
    url = `wss://${url}`;
  } else {
    url = isHttpsPage ? `wss://${url}:${API_PORT}` : `ws://${url}:${API_PORT}`;
  }

  return url;
}

// Dynamic string objects: calling toString() or template string evaluates getApiBase() / getWsBase() dynamically!
export const API_BASE = {
  toString: () => getApiBase(),
  valueOf: () => getApiBase()
};

export const WS_BASE = {
  toString: () => getWsBase(),
  valueOf: () => getWsBase()
};


