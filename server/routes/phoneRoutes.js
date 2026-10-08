const express = require('express');
const router = express.Router();
const phoneController = require('../phoneController');

// In-Memory Icon Cache & Static Dictionary
const iconCache = {
  'com.whatsapp': 'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg',
  'com.instagram.android': 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png',
  'com.google.android.youtube': 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Youtube_logo.png',
  'com.android.chrome': 'https://upload.wikimedia.org/wikipedia/commons/e/e1/Google_Chrome_icon_%28February_2022%29.svg',
  'com.spotify.music': 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg',
  'org.telegram.messenger': 'https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg'
};

async function getAppIconUrl(packageName) {
  if (iconCache[packageName] === '__none__') return null;
  if (iconCache[packageName]) return iconCache[packageName];

  // In cloud environments or high load, avoid heavy external scraping
  if (process.env.RENDER) {
    iconCache[packageName] = '__none__';
    return null;
  }

  try {
    const url = `https://play.google.com/store/apps/details?id=${encodeURIComponent(packageName)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(1500)
    });
    if (!response.ok) {
      iconCache[packageName] = '__none__';
      return null;
    }
    const html = await response.text();
    const match = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i) ||
                  html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);
    const result = match ? match[1] : null;
    iconCache[packageName] = result || '__none__';
    return result;
  } catch (e) {
    iconCache[packageName] = '__none__';
    return null;
  }
}

// App Icon Endpoint
router.get('/app/icon/:packageName', async (req, res) => {
  const { packageName } = req.params;
  if (iconCache[packageName] && iconCache[packageName] !== '__none__') {
    return res.json({ icon: iconCache[packageName] });
  }
  if (iconCache[packageName] === '__none__') {
    return res.status(404).json({ error: 'Icon not found' });
  }

  const iconUrl = await getAppIconUrl(packageName);
  if (iconUrl) {
    return res.json({ icon: iconUrl });
  }

  res.status(404).json({ error: 'Icon not found' });
});

// Device Uplink Status
router.get('/status', async (req, res) => {
  try {
    const status = await phoneController.status();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mobile GPS Location endpoints
router.get('/location', async (req, res) => {
  try {
    const loc = await phoneController.getPhoneGpsLocation();
    if (loc) {
      return res.json({ success: true, location: loc });
    }
    res.json({ success: false, message: 'No active mobile GPS available' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/location', (req, res) => {
  try {
    const { lat, lon, accuracy, speed, heading } = req.body;
    if (!lat || !lon) return res.status(400).json({ success: false, error: 'Latitude and longitude required' });
    const loc = phoneController.setPhoneLocation({ lat, lon, accuracy, speed, heading });
    res.json({ success: true, location: loc });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Connect
router.post('/connect', async (req, res) => {
  try {
    const { ip } = req.body;
    if (!ip) return res.status(400).json({ error: 'IP address required' });
    const result = await phoneController.connect(ip);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Wireless ADB Pair (Android 11+)
router.post('/pair', async (req, res) => {
  try {
    const { ip, code, connectIp } = req.body;
    if (!ip) return res.status(400).json({ success: false, error: 'Pairing IP address and port required' });
    if (!code) return res.status(400).json({ success: false, error: '6-digit pairing code required' });
    const result = await phoneController.pair(ip, code, connectIp);
    res.json({ result, success: result.success, message: result.message, error: result.error });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Disconnect
router.post('/disconnect', async (req, res) => {
  try {
    const result = await phoneController.disconnect();
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle Virtual Mode
router.post('/toggle-virtual', (req, res) => {
  try {
    const enabled = req.body && typeof req.body.enabled === 'boolean' ? req.body.enabled : !phoneController.virtualMode;
    const currentMode = phoneController.setVirtualMode(enabled);
    res.json({ success: true, virtualMode: currentMode });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// SMS
router.post('/sms', async (req, res) => {
  try {
    const { number, message } = req.body;
    const result = await phoneController.sms(number, message);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Brightness
router.post('/brightness', async (req, res) => {
  try {
    const { level } = req.body;
    const result = await phoneController.brightness(level);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Wi-Fi
router.post('/wifi', async (req, res) => {
  try {
    const { enabled } = req.body;
    const result = await phoneController.wifi(enabled);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bluetooth
router.post('/bluetooth', async (req, res) => {
  try {
    const { enabled } = req.body;
    const result = await phoneController.bluetooth(enabled);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// App Launch & List
router.post('/app/open', async (req, res) => {
  try {
    const { packageName } = req.body;
    const result = await phoneController.openApp(packageName);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/app/list', async (req, res) => {
  try {
    const result = await phoneController.listApps();
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Media & Volume
router.post('/media', async (req, res) => {
  try {
    const { action } = req.body;
    const result = await phoneController.media(action);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/volume', async (req, res) => {
  try {
    const { action } = req.body;
    const result = await phoneController.volume(action);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Notifications
router.get('/notifications', async (req, res) => {
  try {
    const result = await phoneController.notifications();
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Screen Lock & Input
router.post('/lock', async (req, res) => {
  try {
    const result = await phoneController.lock();
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/type', async (req, res) => {
  try {
    const { text } = req.body;
    const result = await phoneController.typeText(text);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Screenshot
router.get('/screenshot', async (req, res) => {
  try {
    const result = await phoneController.screenshot();
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Touch & Keyevent
router.post('/tap', async (req, res) => {
  try {
    const { x, y } = req.body;
    const result = await phoneController.tap(x, y);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/keyevent', async (req, res) => {
  try {
    const { keycode } = req.body;
    const result = await phoneController.keyevent(keycode);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Phone Find My Phone Ring Endpoint
router.post('/find', async (req, res) => {
  try {
    const result = await phoneController.findPhone();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Phone WhatsApp Reply Endpoint
router.post('/whatsapp/reply', async (req, res) => {
  const { number, message } = req.body;
  if (!number || !message) return res.status(400).json({ error: 'Number and message are required' });
  try {
    const result = await phoneController.whatsappSend(number, message);
    const dbManager = require('../database');
    dbManager.addSocialLog({
      platform: 'whatsapp',
      type: 'direct_send',
      recipient: number,
      incomingTextOrCall: 'Manual WhatsApp Trigger',
      actionTaken: 'Sent WhatsApp Message',
      messageSent: message,
      status: 'Delivered',
      timestamp: new Date().toLocaleTimeString()
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Phone Contacts Sync Endpoint
router.get('/contacts', async (req, res) => {
  try {
    const contacts = await phoneController.contacts();
    res.json({ success: true, contacts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Phone Real Cellular Call Endpoint
router.post('/call', async (req, res) => {
  const { number } = req.body;
  if (!number) return res.status(400).json({ error: 'Phone number is required' });
  try {
    const result = await phoneController.call(number);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Phone Speakerphone Toggle Endpoint
router.post('/speaker', async (req, res) => {
  try {
    const result = await phoneController.toggleSpeaker();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Phone Direct In-Call Voice Speak Endpoint
router.post('/speak', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text parameter is required' });
  try {
    const result = await phoneController.speakOnDevice(text);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
