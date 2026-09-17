/**
 * J.A.S.P.E.R. AUTONOMOUS MOBILE SENTINEL
 * Standalone, offline-capable alerting engine that protects the user
 * EVEN WHEN THE LAPTOP AND HOME SERVERS ARE COMPLETELY POWERED OFF.
 * 
 * Channels:
 * 1. Autonomous Weather Sentinel (Open-Meteo GPS API)
 * 2. Instant Zero-Auth Cloud Push Relay (ntfy.sh)
 * 3. Local Phone Notifications & Vibration Alarms
 * 4. Emergency Keyword & Priority Message Scanner
 */

const STORAGE_KEY = 'jasper_sentinel_config';

// Default Sentinel Configuration
export const getDefaultSentinelConfig = () => {
  let savedTopic = 'jasper-jwalant-alerts';
  if (typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...JSON.parse(stored) };
      }
    } catch (e) {}
  }

  return {
    channelTopic: savedTopic,
    enabled: true,
    checkIntervalMinutes: 20,
    weatherSentinelEnabled: true,
    urgentMessagesEnabled: true,
    voiceAlertEnabled: true,
    soundAlertEnabled: true,
    vibrationEnabled: true,
    alertThresholds: {
      thunderstorm: true,       // WMO codes 95, 96, 99
      highWindSpeedKmH: 50,     // Gale force winds
      heavyRainMm: 15,          // Torrential downpours
      extremeHeatC: 42,         // Severe heatwave
      extremeColdC: 0           // Freezing conditions
    },
    emergencyKeywords: [
      'SOS',
      'URGENT',
      'EMERGENCY',
      'HOSPITAL',
      'ACCIDENT',
      'ASAP',
      'CALL ME',
      'HELP'
    ],
    lastWeatherCheck: null,
    lastAlertSent: null
  };
};

export const saveSentinelConfig = (cfg) => {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    } catch (e) {}
  }
};

/**
 * Dispatch an Instant High-Priority Push Notification to User's Phone via Cloud Push Relay (ntfy.sh)
 * Works when laptop is OFF, screen is locked, or user is away.
 */
export async function sendCloudPushAlert({
  topic,
  title = '🚨 JASPER Sentinel Alert',
  message,
  priority = 'urgent', // 'min' | 'low' | 'default' | 'high' | 'urgent'
  tags = ['warning', 'rotating_light'],
  actions = []
}) {
  const targetTopic = topic || getDefaultSentinelConfig().channelTopic || 'jasper-jwalant-alerts';
  const url = `https://ntfy.sh/${targetTopic}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      body: message,
      headers: {
        'Title': title,
        'Priority': priority,
        'Tags': Array.isArray(tags) ? tags.join(',') : tags,
        ...(actions.length > 0 ? { 'Actions': JSON.stringify(actions) } : {})
      }
    });

    if (res.ok) {
      console.log(`[MobileSentinel] ✓ Cloud push dispatched to ntfy.sh/${targetTopic}: "${title}"`);
      return { success: true, topic: targetTopic };
    } else {
      console.warn(`[MobileSentinel] Cloud push error ${res.status}: ${await res.text()}`);
      return { success: false, error: `HTTP ${res.status}` };
    }
  } catch (err) {
    console.error('[MobileSentinel] Cloud push network error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Dispatch a Native Local Device Notification (on Phone or Browser)
 */
export function sendLocalDeviceNotification({
  title = '🚨 JASPER Critical Alert',
  body,
  icon = '/vite.svg',
  tag = 'jasper-sentinel',
  vibrate = [300, 100, 300, 100, 500]
}) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  // Trigger hardware vibration if supported
  if (navigator.vibrate && vibrate) {
    try {
      navigator.vibrate(vibrate);
    } catch (e) {}
  }

  if (Notification.permission === 'granted') {
    try {
      const n = new Notification(title, {
        body,
        icon,
        tag,
        requireInteraction: true,
        vibrate
      });
      n.onclick = () => {
        window.focus();
        n.close();
      };
      return true;
    } catch (e) {
      console.warn('[MobileSentinel] Notification constructor error:', e);
      return false;
    }
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((perm) => {
      if (perm === 'granted') {
        sendLocalDeviceNotification({ title, body, icon, tag, vibrate });
      }
    });
  }
  return false;
}

/**
 * Play a high-contrast audio siren / alert chime through the device speaker
 */
export function playAlertChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.45);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.6);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.75);
  } catch (e) {}
}

/**
 * Check Real-Time Weather Hazards via Open-Meteo
 * Completely free, no API key needed, global coverage
 */
export async function checkWeatherHazard(lat = 18.922, lon = 72.834) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_gusts_10m&hourly=precipitation_probability,weather_code&forecast_days=1`;
    const res = await fetch(url, { priority: 'high' });
    if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);

    const data = await res.json();
    const current = data.current || {};
    const code = current.weather_code || 0;
    const temp = current.temperature_2m || 25;
    const wind = current.wind_speed_10m || 0;
    const gusts = current.wind_gusts_10m || wind;
    const precip = current.precipitation || 0;

    // Evaluate Severe Weather Codes (WMO Interpretation):
    // 95: Thunderstorm slight/moderate
    // 96, 99: Thunderstorm with hail
    // 65: Heavy rain
    // 67: Heavy freezing rain
    // 75: Heavy snow
    // 82: Violent rain showers
    let isSevere = false;
    let hazardType = 'NORMAL';
    let description = 'Weather conditions normal.';
    let tags = ['white_check_mark'];

    if (code === 95 || code === 96 || code === 99) {
      isSevere = true;
      hazardType = 'THUNDERSTORM';
      description = `Severe thunderstorm with lightning active in your area. Wind gusts: ${gusts} km/h.`;
      tags = ['warning', 'thunder_cloud_and_rain'];
    } else if (wind >= 50 || gusts >= 65) {
      isSevere = true;
      hazardType = 'HIGH_WINDS';
      description = `Gale force wind alert: sustained ${wind} km/h, gusts up to ${gusts} km/h.`;
      tags = ['warning', 'wind_face'];
    } else if (code === 65 || code === 82 || precip >= 15) {
      isSevere = true;
      hazardType = 'TORRENTIAL_RAIN';
      description = `Torrential downpour & flood risk: ${precip} mm/h precipitation detected.`;
      tags = ['warning', 'droplet'];
    } else if (temp >= 42) {
      isSevere = true;
      hazardType = 'EXTREME_HEAT';
      description = `Extreme heatwave alert: ambient temperature reached ${temp}°C.`;
      tags = ['warning', 'fire'];
    } else if (temp <= 0) {
      isSevere = true;
      hazardType = 'FREEZE_ALERT';
      description = `Sub-zero freezing alert: ambient temperature dropped to ${temp}°C.`;
      tags = ['warning', 'snowflake'];
    }

    return {
      success: true,
      isSevere,
      hazardType,
      description,
      temperature: temp,
      windSpeed: wind,
      windGusts: gusts,
      precipitation: precip,
      weatherCode: code,
      tags
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      isSevere: false
    };
  }
}

/**
 * Evaluate if an incoming message or notification contains an urgent priority keyword
 */
export function classifyUrgentMessage(text, customKeywords = []) {
  if (!text) return { isUrgent: false };
  const keywords = customKeywords.length > 0 ? customKeywords : getDefaultSentinelConfig().emergencyKeywords;
  const upper = text.toUpperCase();

  for (const kw of keywords) {
    const pattern = new RegExp(`\\b${kw}\\b`, 'i');
    if (pattern.test(upper)) {
      return {
        isUrgent: true,
        keywordMatched: kw,
        snippet: text.slice(0, 100)
      };
    }
  }

  return { isUrgent: false };
}

/**
 * Execute a complete Sentinel Routine: checks weather and fires cloud push + local alarm if hazard found
 */
export async function runSentinelCheck(lat, lon) {
  const config = getDefaultSentinelConfig();
  if (!config.enabled) return null;

  const result = await checkWeatherHazard(lat, lon);
  if (result.success && result.isSevere) {
    const title = `🚨 JASPER Severe Weather Alert: ${result.hazardType}`;
    const body = result.description;

    // 1. Cloud Push Relay (rings phone even when laptop servers are OFF)
    await sendCloudPushAlert({
      topic: config.channelTopic,
      title,
      message: body,
      priority: 'urgent',
      tags: result.tags
    });

    // 2. Local device notification
    sendLocalDeviceNotification({
      title,
      body,
      vibrate: [300, 100, 300, 100, 500]
    });

    // 3. Audio Chime
    if (config.soundAlertEnabled) {
      playAlertChime();
    }

    config.lastAlertSent = Date.now();
  }

  config.lastWeatherCheck = Date.now();
  saveSentinelConfig(config);
  return result;
}
