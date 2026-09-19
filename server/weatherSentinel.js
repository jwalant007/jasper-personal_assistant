/**
 * J.A.S.P.E.R. SERVER WEATHER SENTINEL
 * Background daemon that continuously monitors severe weather hazards
 * and delivers instantaneous push alerts directly to the user's phone via ntfy.sh.
 */

const https = require('https');

let sentinelInterval = null;
let lastAlertTimestamp = 0;
const ALERT_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour cooldown per same hazard type

let currentConfig = {
  enabled: true,
  checkIntervalMinutes: 30,
  channelTopic: 'jasper-jwalant-alerts',
  lastLat: 18.922,
  lastLon: 72.834,
  cityName: 'Mumbai'
};

/**
 * Dispatch Push Notification directly to user's phone via ntfy.sh
 */
function sanitizeHeader(val, fallback = '') {
  if (!val) return fallback;
  // Strip characters outside ASCII 32-126 range to satisfy Node.js HTTP/1.1 header specifications
  const clean = String(val).replace(/[^\x20-\x7E]/g, '').trim();
  return clean || fallback;
}

function sendPushToPhone({
  topic = currentConfig.channelTopic,
  title = '🚨 JASPER Server Sentinel',
  message,
  priority = 'urgent',
  tags = ['warning', 'thunder_cloud_and_rain']
}) {
  return new Promise((resolve) => {
    try {
      const prioMap = { urgent: 5, high: 4, default: 3, low: 2, min: 1 };
      const numericPriority = typeof priority === 'number' ? priority : (prioMap[priority] || 4);

      const payloadObj = {
        topic: topic || currentConfig.channelTopic || 'jasper-jwalant-alerts',
        title: title || 'JASPER Alert',
        message: message || 'Alert from JASPER Sentinel Core',
        priority: numericPriority,
        tags: Array.isArray(tags) ? tags : String(tags).split(',').map(s => s.trim())
      };

      const payload = Buffer.from(JSON.stringify(payloadObj), 'utf8');

      const req = https.request({
        hostname: 'ntfy.sh',
        port: 443,
        path: '/',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': payload.length
        }
      }, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`[WeatherSentinel] ✓ Dispatched urgent push to phone via ntfy.sh/${payloadObj.topic}: "${title}"`);
          resolve(true);
        } else {
          console.warn(`[WeatherSentinel] Push error HTTP ${res.statusCode}`);
          resolve(false);
        }
      });

      req.on('error', (err) => {
        console.warn(`[WeatherSentinel] Network push error:`, err.message);
        resolve(false);
      });

      req.write(payload);
      req.end();
    } catch (e) {
      console.error('[WeatherSentinel] Exception in sendPushToPhone:', e);
      resolve(false);
    }
  });
}

/**
 * Query Open-Meteo for Severe Weather
 */
function queryWeather(lat, lon) {
  return new Promise((resolve) => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,weather_code,wind_speed_10m,wind_gusts_10m`;
    
    https.get(url, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(raw);
          const current = data.current || {};
          const code = current.weather_code || 0;
          const wind = current.wind_speed_10m || 0;
          const gusts = current.wind_gusts_10m || wind;
          const precip = current.precipitation || 0;
          const temp = current.temperature_2m || 25;

          let isSevere = false;
          let hazardType = 'NORMAL';
          let description = 'Normal weather.';
          let tags = 'white_check_mark';

          if (code === 95 || code === 96 || code === 99) {
            isSevere = true;
            hazardType = 'THUNDERSTORM';
            description = `Severe thunderstorm with lightning active in your area. Wind gusts: ${gusts} km/h.`;
            tags = 'warning,thunder_cloud_and_rain';
          } else if (wind >= 50 || gusts >= 65) {
            isSevere = true;
            hazardType = 'HIGH_WINDS';
            description = `High wind alert: sustained ${wind} km/h, gusts ${gusts} km/h.`;
            tags = 'warning,wind_face';
          } else if (code === 65 || precip >= 15) {
            isSevere = true;
            hazardType = 'TORRENTIAL_RAIN';
            description = `Torrential downpour & flood risk: ${precip} mm/h precipitation.`;
            tags = 'warning,droplet';
          } else if (temp >= 42) {
            isSevere = true;
            hazardType = 'EXTREME_HEAT';
            description = `Extreme heatwave alert: ${temp}°C ambient temperature.`;
            tags = 'warning,fire';
          }

          resolve({ success: true, isSevere, hazardType, description, tags, temp, wind, precip });
        } catch (e) {
          resolve({ success: false, error: e.message });
        }
      });
    }).on('error', (err) => {
      resolve({ success: false, error: err.message });
    });
  });
}

/**
 * Execute weather check and dispatch if severe
 */
async function performWeatherCheck() {
  if (!currentConfig.enabled) return;

  const res = await queryWeather(currentConfig.lastLat, currentConfig.lastLon);
  if (res.success && res.isSevere) {
    const now = Date.now();
    if (now - lastAlertTimestamp > ALERT_COOLDOWN_MS) {
      lastAlertTimestamp = now;
      const title = `🚨 JASPER Severe Weather Alert: ${res.hazardType}`;
      await sendPushToPhone({
        title,
        message: `${res.description} Location: ${currentConfig.cityName}. Stay safe, Sir.`,
        priority: 'urgent',
        tags: res.tags
      });
    }
  }
}

/**
 * Start Sentinel Daemon
 */
function startWeatherSentinel(options = {}) {
  currentConfig = { ...currentConfig, ...options };
  
  if (sentinelInterval) clearInterval(sentinelInterval);
  
  // Initial check after 10 seconds
  setTimeout(performWeatherCheck, 10000);

  // Periodic checks
  const intervalMs = (currentConfig.checkIntervalMinutes || 30) * 60 * 1000;
  sentinelInterval = setInterval(performWeatherCheck, intervalMs);
  console.log(`[WeatherSentinel] Daemon started: polling every ${currentConfig.checkIntervalMinutes}m for ${currentConfig.cityName} -> ntfy.sh/${currentConfig.channelTopic}`);
}

/**
 * Update coordinates dynamically from client GPS updates
 */
function updateSentinelLocation(lat, lon, cityName = '') {
  if (lat && lon) {
    currentConfig.lastLat = parseFloat(lat);
    currentConfig.lastLon = parseFloat(lon);
    if (cityName) currentConfig.cityName = cityName;
  }
}

function getSentinelStatus() {
  return {
    ...currentConfig,
    lastAlertTimestamp
  };
}

module.exports = {
  startWeatherSentinel,
  updateSentinelLocation,
  performWeatherCheck,
  sendPushToPhone,
  getSentinelStatus
};
