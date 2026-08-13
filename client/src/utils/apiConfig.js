// Dynamic API & WebSocket Base URL manager
// Supports local PC access, LAN mobile access, and custom server IP configuration
const API_PORT = 3001;
export const DEFAULT_SERVER_IP = 'localhost';

export function getServerIp() {
  let saved = localStorage.getItem('jasper_server_ip');
  // Clear any old expired ngrok or outdated IP values from localStorage
  if (saved && (saved.includes('ngrok') || saved.trim() === '192.168.29.132' || saved.trim() === '192.168.1.100')) {
    localStorage.removeItem('jasper_server_ip');
    saved = null;
  }
  if (saved && saved.trim()) return saved.trim();

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host && host !== 'capacitor') {
      return host;
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

export function getApiBase() {
  let ip = getServerIp().trim().replace(/\/+$/, '');
  if (ip.startsWith('http://') || ip.startsWith('https://')) {
    return ip;
  }
  if (ip.includes('ngrok') || (ip.includes('.') && !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip) && !ip.includes('localhost'))) {
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
  } else if (url.includes('ngrok') || (url.includes('.') && !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(url) && !url.includes('localhost'))) {
    url = `wss://${url}`;
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
