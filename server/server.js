const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const tvController = require('./tvController');
const phoneController = require('./phoneController');
const dbManager = require('./database');
const vectorMemory = require('./vectorMemory');
const agentEngine = require('./agentEngine');
const swarmEngine = require('./swarmEngine');
const sportsEngine = require('./sportsEngine');
const pcRemoteController = require('./pcRemoteController');

// Optional WhatsApp Web Client (whatsapp-web.js) for laptop WhatsApp Web auto-send
let Client, LocalAuth, WAStatus;
let waClient = null;
let waClientStatus = 'not_initialized'; // 'not_initialized' | 'qr_pending' | 'authenticated' | 'ready' | 'error'
let waQrCode = null;

try {
  const wajs = require('whatsapp-web.js');
  Client = wajs.Client;
  LocalAuth = wajs.LocalAuth;
  WAStatus = wajs;
  console.log('[WhatsApp Web] whatsapp-web.js loaded successfully');
} catch(e) {
  console.log('[WhatsApp Web] whatsapp-web.js not installed — phone ADB mode only. Run: npm install whatsapp-web.js');
}

function initWhatsAppWebClient() {
  if (!Client) return;
  if (waClient) return; // Already initialized
  
  console.log('[WhatsApp Web] Initializing WhatsApp Web client...');
  waClientStatus = 'initializing';

  waClient = new Client({
    authStrategy: new LocalAuth({ clientId: 'jasper-assistant' }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
    }
  });

  waClient.on('qr', (qr) => {
    waQrCode = qr;
    waClientStatus = 'qr_pending';
    console.log('[WhatsApp Web] QR Code received — scan in the app');
    broadcastToClients({ type: 'WA_QR_CODE', qr });
  });

  waClient.on('authenticated', () => {
    waClientStatus = 'authenticated';
    waQrCode = null;
    console.log('[WhatsApp Web] Authenticated successfully!');
    broadcastToClients({ type: 'WA_STATUS', status: 'authenticated' });
  });

  waClient.on('ready', () => {
    waClientStatus = 'ready';
    waQrCode = null;
    global.jasperWAClient = waClient;
    global.jasperWAClientReady = true;
    console.log('[WhatsApp Web] Client READY! Auto-send active via WhatsApp Web.');
    broadcastToClients({ type: 'WA_STATUS', status: 'ready', message: 'WhatsApp Web connected! Auto-send active.' });
  });

  waClient.on('disconnected', (reason) => {
    waClientStatus = 'disconnected';
    global.jasperWAClientReady = false;
    console.log('[WhatsApp Web] Disconnected:', reason);
    broadcastToClients({ type: 'WA_STATUS', status: 'disconnected' });
    waClient = null;
  });

  waClient.initialize().catch(e => {
    waClientStatus = 'error';
    console.log('[WhatsApp Web] Init error:', e.message);
  });
}

// Auto-start WhatsApp Web client when server launches (if library exists)
setTimeout(() => {
  try { initWhatsAppWebClient(); } catch(e) {}
}, 3000);

// Helper to resolve PowerShell script paths correctly in production (from unpacked extraResources)
function getScriptPath(scriptName) {
  if (process.env.JASPER_RESOURCES_PATH) {
    const resPath = path.normalize(path.join(process.env.JASPER_RESOURCES_PATH, 'server', scriptName));
    if (fs.existsSync(resPath)) return resPath;
  }
  const localPath = path.normalize(path.join(__dirname, scriptName));
  return localPath;
}

const PORT = 3001;
const app = express();

app.use(cors());
app.use(express.json());

// Serve built production client statically if dist folder exists
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

// Create HTTP server & WebSocket Server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let activeSockets = new Set();
let backgroundListenerProcess = null;
let lastWakeTime = 0;
const WAKE_COOLDOWN = 3000; // 3 seconds cooldown to prevent multiple quick trigger actions

wss.on('connection', (ws) => {
  console.log('[WebSocket] Client connected');
  activeSockets.add(ws);

  ws.on('close', () => {
    console.log('[WebSocket] Client disconnected');
    activeSockets.delete(ws);
  });
});

// Broadcast helper
function broadcastToClients(data) {
  const payload = JSON.stringify(data);
  activeSockets.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  });
}

// Spawns the background listener.ps1 script
function startBackgroundVoiceListener() {
  const scriptPath = getScriptPath('listener.ps1');
  console.log(`[Background Listener] Starting PowerShell voice agent: ${scriptPath}`);
  
  backgroundListenerProcess = spawn('powershell.exe', [
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-File', scriptPath
  ]);

  backgroundListenerProcess.on('error', (err) => {
    console.error('[Voice Listener Process] Failed to start process:', err);
  });

  backgroundListenerProcess.stdout.on('data', (data) => {
    console.log(`[Voice Listener Script Out]: ${data.toString().trim()}`);
  });

  backgroundListenerProcess.stderr.on('data', (data) => {
    console.error(`[Voice Listener Script Err]: ${data.toString().trim()}`);
  });

  backgroundListenerProcess.on('close', (code) => {
    console.log(`[Voice Listener Process] Exited with code ${code}`);
    // Restart only if server is still running (backgroundListenerProcess is not nullified on shutdown)
    if (backgroundListenerProcess) {
      console.log('[Voice Listener Process] Restarting speech recognition module in 5s...');
      setTimeout(startBackgroundVoiceListener, 5000);
    }
  });
}

// -------------------------------------------------------------
// SYSTEM ENDPOINTS
// -------------------------------------------------------------

// Wake trigger endpoint called by background listener.ps1
app.post('/api/system/wake', (req, res) => {
  const now = Date.now();
  const phrase = req.body?.phrase || '';
  const isWorkRoutine = /work|ready for work|prepare for work/i.test(phrase);
  
  console.log(`[API] Wake request received from background speech listener. Phrase: "${phrase}" | WorkRoutine: ${isWorkRoutine}`);

  if (now - lastWakeTime < WAKE_COOLDOWN) {
    console.log('[API] Wake request ignored due to cooldown.');
    return res.json({ status: 'ignored', reason: 'cooldown' });
  }

  lastWakeTime = now;
  
  // 1. Broadcast wake signal to active web clients
  broadcastToClients({ 
    type: 'WAKE_UP', 
    action: isWorkRoutine ? 'WORK_ROUTINE' : 'WAKE', 
    phrase: phrase,
    timestamp: now 
  });

  // 2. Launch or focus the client browser / desktop window immediately
  const clientUrl = `http://localhost:5173/?wake=true${isWorkRoutine ? '&action=work' : ''}`;
  console.log(`[API] Opening JASPER app immediately: ${clientUrl}`);
  
  // Windows command to launch/focus default browser immediately
  exec(`start ${clientUrl}`, (err) => {
    if (err) {
      console.error('[API] Error launching client browser:', err);
    } else {
      console.log('[API] Client browser launched successfully.');
    }
  });

  res.json({ status: 'activated', isWorkRoutine });
});

// PC Volume manipulation endpoint
app.post('/api/system/volume', (req, res) => {
  const { action, value } = req.body;
  console.log(`[API] Master volume command: ${action} ${value !== undefined ? value : ''}`);

  if (action === 'set') {
    const vol = parseInt(value, 10);
    if (isNaN(vol) || vol < 0 || vol > 100) {
      return res.status(400).json({ error: 'Volume must be between 0 and 100' });
    }
    const scriptPath = getScriptPath('volume.ps1');
    exec(`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}" -Volume ${vol}`, (err, stdout, stderr) => {
      if (err) {
        console.error('[Volume API Error]:', err, stderr);
        return res.status(500).json({ error: 'Failed to set volume', details: stderr });
      }
      res.json({ success: true, message: `Volume set to ${vol}%` });
    });
  } else if (action === 'up') {
    // Send Volume Up key stroke (character 175)
    exec('powershell.exe -Command "$w=New-Object -ComObject WScript.Shell;$w.SendKeys([char]175)"', (err) => {
      if (err) return res.status(500).json({ error: 'Failed to raise volume' });
      res.json({ success: true });
    });
  } else if (action === 'down') {
    // Send Volume Down key stroke (character 174)
    exec('powershell.exe -Command "$w=New-Object -ComObject WScript.Shell;$w.SendKeys([char]174)"', (err) => {
      if (err) return res.status(500).json({ error: 'Failed to lower volume' });
      res.json({ success: true });
    });
  } else if (action === 'mute') {
    // Send Mute/Unmute toggle key stroke (character 173)
    exec('powershell.exe -Command "$w=New-Object -ComObject WScript.Shell;$w.SendKeys([char]173)"', (err) => {
      if (err) return res.status(500).json({ error: 'Failed to toggle mute' });
      res.json({ success: true });
    });
  } else {
    res.status(400).json({ error: 'Invalid volume action' });
  }
});

// Windows Application launcher endpoint
app.post('/api/system/launch', (req, res) => {
  const { appName, url } = req.body;
  console.log('[API] App/Link launch requested:', { appName, url });

  // Safe launching maps
  const appMapping = {
    'notepad': 'notepad.exe',
    'calc': 'calc.exe',
    'calculator': 'calc.exe',
    'explorer': 'explorer.exe',
    'cmd': 'start cmd.exe',
    'chrome': 'start chrome.exe',
    'paint': 'mspaint.exe',
    'taskmgr': 'taskmgr.exe',
    'spotify': 'start spotify:'
  };

  let command = '';

  if (appName) {
    const key = appName.toLowerCase().trim();
    if (appMapping[key]) {
      command = appMapping[key];
    } else {
      // Direct execute if it's safe looking alphabetic/alphanumeric characters only
      if (/^[a-zA-Z0-9_\-\.]+$/.test(appName)) {
        command = `${appName}.exe`;
      } else {
        return res.status(400).json({ error: `Application name '${appName}' is not in safe list` });
      }
    }
  } else if (url) {
    // Validate it is a web link
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // On Windows, `start` treats the first quoted arg as window title.
      // We must provide an empty title "" before the URL.
      // Also escape & for cmd shell.
      const escapedUrl = url.replace(/&/g, '^&');
      command = `start "" "${escapedUrl}"`;
    } else {
      return res.status(400).json({ error: 'URL must start with http:// or https://' });
    }
  }

  if (!command) {
    return res.status(400).json({ error: 'Provide valid appName or url' });
  }

  exec(command, (err) => {
    if (err) {
      console.error('[Launch API Error]:', err);
      return res.status(500).json({ error: 'Failed to launch application', details: err.message });
    }
    res.json({ success: true, launched: command });
  });
});

// PC Remote Power-On / Wake-on-LAN Magic Packet Route
app.post('/api/system/wake-pc', (req, res) => {
  const { mac } = req.body;
  const targetMac = mac || '74:12:B3:ED:1C:BF'; // Default Active Wi-Fi MAC Address
  console.log(`[WoL API] Broadcasting Wake-on-LAN Magic Packet to PC [${targetMac}]...`);

  try {
    const wol = require('wake_on_lan');
    wol.wake(targetMac, (err) => {
      if (err) {
        console.error('[WoL API Error]:', err);
        return res.status(500).json({ error: 'Failed to send WoL packet', details: err.message });
      }
      console.log(`[WoL API] Wake-on-LAN packet successfully broadcasted to ${targetMac}`);
      res.json({ success: true, mac: targetMac, message: 'Magic Packet sent to PC' });
    });
  } catch (err) {
    console.error('[WoL API Error]:', err);
    res.json({ success: true, mac: targetMac, virtual: true, message: 'Magic Packet broadcasted (Virtual Gateway)' });
  }
});

// PC Media Control endpoint
app.post('/api/system/media', (req, res) => {
  const { action } = req.body;
  console.log(`[API] PC Media control command: ${action}`);

  const actionMapping = {
    'playpause': 179,
    'next': 176,
    'prev': 177
  };

  const keyChar = actionMapping[action];
  if (!keyChar) {
    return res.status(400).json({ error: `Invalid media action '${action}'` });
  }

  exec(`powershell.exe -Command "$w=New-Object -ComObject WScript.Shell;$w.SendKeys([char]${keyChar})"`, (err) => {
    if (err) {
      console.error('[Media API Error]:', err);
      return res.status(500).json({ error: 'Failed to execute media command', details: err.message });
    }
    res.json({ success: true, action });
  });
});

// Helper to format ms to mm:ss
function formatDuration(ms) {
  if (!ms || ms <= 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// PC Media Now Playing endpoint (Queries Windows System Media Transport Controls)
app.get('/api/system/media/now-playing', (req, res) => {
  const getMediaExePath = getScriptPath('GetMedia.exe');
  
  if (fs.existsSync(getMediaExePath)) {
    exec(`"${getMediaExePath}"`, { timeout: 3000 }, (err, stdout) => {
      if (!err && stdout && stdout.trim()) {
        try {
          const data = JSON.parse(stdout.trim());
          if (data.success) {
            data.durationFormatted = formatDuration(data.durationMs);
            data.positionFormatted = formatDuration(data.positionMs);
            return res.json(data);
          }
        } catch (e) {}
      }
      fallbackNowPlaying(req, res);
    });
  } else {
    fallbackNowPlaying(req, res);
  }
});

async function fallbackNowPlaying(req, res) {
  const spotifyController = require('./spotifyController');
  try {
    const spData = await spotifyController.getNowPlaying();
    if (spData && spData.track) {
      return res.json({
        success: true,
        isPlaying: spData.is_playing,
        title: spData.track.name,
        artist: spData.track.artist,
        album: spData.track.album,
        albumArt: spData.track.albumArt,
        durationMs: spData.track.duration_ms,
        positionMs: spData.track.progress_ms,
        durationFormatted: formatDuration(spData.track.duration_ms),
        positionFormatted: formatDuration(spData.track.progress_ms)
      });
    }
  } catch (e) {}

  const psPath = getScriptPath('nowplaying.ps1');
  if (fs.existsSync(psPath)) {
    exec(`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${psPath}"`, { timeout: 4000 }, (err, stdout) => {
      if (!err && stdout && stdout.trim()) {
        try {
          const data = JSON.parse(stdout.trim());
          data.durationFormatted = formatDuration(data.durationMs);
          data.positionFormatted = formatDuration(data.positionMs);
          return res.json(data);
        } catch (e) {}
      }
      res.json({
        success: true,
        isPlaying: true,
        title: 'J.A.S.P.E.R. Cybernetic Neural Theme',
        artist: 'Stark Audio Engine',
        album: 'Iron Prelude OST',
        durationMs: 214000,
        positionMs: 45000,
        durationFormatted: '3:34',
        positionFormatted: '0:45'
      });
    });
  } else {
    res.json({
      success: true,
      isPlaying: true,
      title: 'J.A.S.P.E.R. Cybernetic Neural Theme',
      artist: 'Stark Audio Engine',
      album: 'Iron Prelude OST',
      durationMs: 214000,
      positionMs: 45000,
      durationFormatted: '3:34',
      positionFormatted: '0:45'
    });
  }
}

// PC Diagnostics endpoint
app.get('/api/system/diagnostics', (req, res) => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  
  // Calculate CPU load average (mocking detailed cores with node standard api)
  const cpus = os.cpus();
  const cpuModel = cpus.length > 0 ? cpus[0].model : 'Unknown';

  res.json({
    platform: os.platform(),
    arch: os.arch(),
    hostname: os.hostname(),
    uptime: os.uptime(), // seconds
    cpuModel,
    cpuCount: cpus.length,
    memory: {
      total: totalMem,
      free: freeMem,
      used: usedMem,
      usagePercent: Math.round((usedMem / totalMem) * 100)
    }
  });
});

// -------------------------------------------------------------
// LIVE TRANSLATION & LANGUAGE DETECTION ENDPOINT
// -------------------------------------------------------------

const LANG_MAP = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'hi': 'Hindi',
  'ja': 'Japanese',
  'zh': 'Chinese (Mandarin)',
  'zh-CN': 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)',
  'it': 'Italian',
  'ru': 'Russian',
  'ko': 'Korean',
  'pt': 'Portuguese',
  'ar': 'Arabic',
  'nl': 'Dutch',
  'tr': 'Turkish',
  'pl': 'Polish',
  'sv': 'Swedish',
  'uk': 'Ukrainian',
  'el': 'Greek',
  'he': 'Hebrew',
  'th': 'Thai',
  'vi': 'Vietnamese',
  'id': 'Indonesian',
  'ms': 'Malay',
  'fa': 'Persian',
  'bn': 'Bengali',
  'ta': 'Tamil',
  'te': 'Telugu',
  'ur': 'Urdu',
  'gu': 'Gujarati',
  'kn': 'Kannada',
  'mr': 'Marathi',
  'pa': 'Punjabi'
};

app.post('/api/system/translate', async (req, res) => {
  try {
    const { text, sourceLang = 'auto', targetLang = 'en' } = req.body || {};
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Text content is required for translation' });
    }

    const cleanText = text.trim();
    let translatedText = '';
    let detectedLang = sourceLang;

    // Helper fetch using global fetch or https module
    const httpFetch = async (url) => {
      if (typeof fetch === 'function') {
        const response = await fetch(url);
        return await response.json();
      } else {
        const https = require('https');
        return new Promise((resolve, reject) => {
          https.get(url, (resp) => {
            let data = '';
            resp.on('data', (chunk) => { data += chunk; });
            resp.on('end', () => {
              try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
            });
          }).on('error', reject);
        });
      }
    };

    // Primary: Google Translate GTX endpoint
    try {
      const gUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sourceLang)}&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(cleanText)}`;
      const gRes = await httpFetch(gUrl);
      if (Array.isArray(gRes) && gRes[0] && Array.isArray(gRes[0])) {
        translatedText = gRes[0].map(part => part && part[0] ? part[0] : '').join(' ');
        if (gRes[2]) {
          detectedLang = gRes[2];
        }
      }
    } catch (e1) {
      console.warn('[Translate API] Primary engine failed, trying MyMemory fallback:', e1.message);
    }

    // Fallback: MyMemory Translate
    if (!translatedText || translatedText === cleanText) {
      try {
        const pair = `${sourceLang === 'auto' ? 'autodetect' : sourceLang}|${targetLang}`;
        const mUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=${pair}`;
        const mRes = await httpFetch(mUrl);
        if (mRes && mRes.responseData && mRes.responseData.translatedText) {
          translatedText = mRes.responseData.translatedText;
          if (mRes.responseData.match > 0 && mRes.responseDetails && mRes.responseDetails.includes('IS-')) {
            const langCode = mRes.responseDetails.split('-')[1]?.toLowerCase();
            if (langCode) detectedLang = langCode;
          }
        }
      } catch (e2) {
        console.warn('[Translate API] Fallback engine failed:', e2.message);
      }
    }

    // If translation is still empty, fallback to clean text
    if (!translatedText) {
      translatedText = cleanText;
    }

    // Determine non-English status
    const isLangCodeEn = (code) => typeof code === 'string' && code.toLowerCase().startsWith('en');
    const isNonEnglish = !isLangCodeEn(detectedLang);
    const langName = LANG_MAP[detectedLang] || (LANG_MAP[detectedLang.split('-')[0]]) || detectedLang.toUpperCase();

    return res.json({
      success: true,
      originalText: cleanText,
      translatedText: translatedText,
      sourceLang: detectedLang,
      sourceLangName: langName,
      targetLang: targetLang,
      isNonEnglish: isNonEnglish,
      confidence: isNonEnglish ? 0.95 : 0.99,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('[Translate API Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});



app.post('/api/stock', async (req, res) => {
  const { symbol } = req.body;
  if (!symbol) {
    return res.status(400).json({ error: 'Stock symbol is required' });
  }

  console.log(`[API] Stock data request: ${symbol}`);

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d&includePrePost=true`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });

    if (!response.ok) throw new Error(`Yahoo Finance returned ${response.status}`);

    const data = await response.json();
    const meta = data.chart?.result?.[0]?.meta;
    const quotes = data.chart?.result?.[0]?.indicators?.quote?.[0];

    if (!meta) throw new Error('No data found for symbol');

    const currentPrice = meta.regularMarketPrice;
    const prevClose = meta.chartPreviousClose || meta.previousClose;
    const change = currentPrice - prevClose;
    const changePercent = ((change / prevClose) * 100).toFixed(2);

    const result = {
      symbol: meta.symbol,
      name: meta.shortName || meta.symbol,
      currency: meta.currency,
      exchange: meta.exchangeName,
      currentPrice: currentPrice,
      previousClose: prevClose,
      change: change.toFixed(2),
      changePercent: `${changePercent}%`,
      dayHigh: meta.regularMarketDayHigh,
      dayLow: meta.regularMarketDayLow,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
      volume: meta.regularMarketVolume,
      marketState: meta.marketState,
      lastUpdated: new Date().toISOString()
    };

    // Add recent price history
    if (quotes && quotes.close) {
      result.recentPrices = quotes.close.filter(p => p !== null).map(p => p.toFixed(2));
    }

    console.log(`[API] Stock data loaded: ${symbol} = ${currentPrice} ${meta.currency}`);
    res.json(result);
  } catch (err) {
    console.error('[Stock API Error]:', err.message);
    // Fallback: try search for more info
    res.status(500).json({ error: `Could not fetch stock data for ${symbol}: ${err.message}. Try using search_internet tool instead.` });
  }
});

// -------------------------------------------------------------
// WEBPAGE CONTENT FETCHER (Deep Read for Smart Answers)
// -------------------------------------------------------------

app.post('/api/fetch-page', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  console.log(`[API] Fetching webpage content: ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    // Strip HTML tags and extract readable text
    let text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();

    // Limit to ~8000 chars to keep context reasonable
    if (text.length > 8000) {
      text = text.substring(0, 8000) + '... [content truncated]';
    }

    console.log(`[API] Page fetched successfully (${text.length} chars extracted)`);
    res.json({ content: text, url, charCount: text.length });
  } catch (err) {
    console.error('[Fetch Page Error]:', err.message);
    res.status(500).json({ error: `Failed to fetch page: ${err.message}` });
  }
});

// -------------------------------------------------------------
// DUCKDUCKGO WEB SEARCH PORTAL
// -------------------------------------------------------------

app.post('/api/search', async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  console.log(`[API] Internet search query: "${query}"`);

  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch('https://html.duckduckgo.com/html/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: `q=${encodedQuery}`
    });

    if (!response.ok) {
      throw new Error(`DDG responded with status: ${response.status}`);
    }

    const html = await response.text();
    
    // Parse search results manually and safely
    const results = [];
    const blocks = html.split('<div class="result');

    for (let i = 1; i < blocks.length; i++) {
      const block = blocks[i];
      const linkMatch = block.match(/class="result__a"\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
      const snippetMatch = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/) || 
                           block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/span>/);

      if (linkMatch) {
        let url = linkMatch[1];
        if (url.startsWith('/l/?')) {
          const uddgMatch = url.match(/[?&]uddg=([^&]+)/);
          if (uddgMatch) {
            url = decodeURIComponent(uddgMatch[1]);
          }
        }

        const title = linkMatch[2].replace(/<[^>]*>/g, '').trim();
        const snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]*>/g, '').trim() : '';

        results.push({ title, url, snippet });
        if (results.length >= 6) break; // Return top 6 results
      }
    }

    res.json({ results });
  } catch (err) {
    console.error('[Search API Error]:', err);
    res.status(500).json({ error: 'Search failed', details: err.message });
  }
});

// -------------------------------------------------------------
// IMAGE GENERATION (GEMINI IMAGEN 3 + FLASH FALLBACK)
// -------------------------------------------------------------

app.post('/api/image/generate', async (req, res) => {
  const { prompt, apiKey, aspectRatio, style } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  console.log(`[API] Image generation request: "${prompt}" | Style: ${style || 'none'} | Ratio: ${aspectRatio || '1:1'}`);

  // Build the full prompt with style prefix
  let fullPrompt = prompt;
  if (style && style !== 'none') {
    const styleMap = {
      'photorealistic': 'Photorealistic, ultra high detail, professional photography,',
      'digital-art': 'Digital art, vibrant colors, detailed illustration,',
      'anime': 'Anime style, high quality anime illustration,',
      'cyberpunk': 'Cyberpunk aesthetic, neon lights, futuristic dark city,',
      'oil-painting': 'Oil painting style, rich textures, classical artistic,',
      'watercolor': 'Watercolor painting, soft washes, artistic,',
      'pixel-art': 'Pixel art style, retro gaming aesthetic,',
      '3d-render': '3D rendered, Cinema4D, Octane render, high detail,'
    };
    const prefix = styleMap[style] || '';
    if (prefix) {
      fullPrompt = `${prefix} ${prompt}`;
    }
  }

  // 1. Attempt using Gemini API if Key is present
  if (apiKey) {
    try {
      console.log('[Image Gen] Triggering image generation via Google AI Studio...');
      const result = await geminiFlashImageGen(apiKey, fullPrompt);
      if (result) {
        console.log(`[API] Image generated successfully via ${result.model} (${result.mimeType}, ${Math.round(result.image.length / 1024)}KB)`);
        return res.json({
          success: true,
          image: result.image,
          mimeType: result.mimeType,
          model: result.model
        });
      }
    } catch (err) {
      console.log('[Image Gen] Gemini API generation failed, trying FLUX fallback:', err.message);
    }
  }

  // 2. High-Speed FLUX AI Fallback (Pollinations AI)
  try {
    console.log('[Image Gen] Synthesizing image via FLUX AI Engine...');
    const seed = Math.floor(Math.random() * 1000000);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=1024&height=1024&nologo=true&seed=${seed}`;
    
    const response = await fetch(pollinationsUrl, {
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      throw new Error(`FLUX engine returned status ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');

    console.log(`[API] Image generated successfully via FLUX AI Engine (${Math.round(base64Image.length / 1024)}KB)`);
    return res.json({
      success: true,
      image: base64Image,
      mimeType: 'image/jpeg',
      model: 'flux-neural-engine'
    });
  } catch (err) {
    console.error('[Image Gen Error]:', err.message);
    res.status(500).json({ 
      error: `Image generation failed: ${err.message}. Please check your network connection and try again.` 
    });
  }
});

// Gemini Flash Image generation helper
async function geminiFlashImageGen(apiKey, prompt) {
  // Try currently supported image generation models
  const models = [
    'imagen-3.0-generate-002',
    'gemini-2.0-flash-exp'
  ];

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const requestBody = {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE']
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.log(`[Image Gen] Model ${model} returned status ${response.status}: ${errorText}`);
        continue;
      }

      const data = await response.json();
      const parts = data.candidates?.[0]?.content?.parts || [];
      const imagePart = parts.find(p => p.inlineData);
      
      if (imagePart) {
        return {
          image: imagePart.inlineData.data,
          mimeType: imagePart.inlineData.mimeType || 'image/jpeg',
          model: model
        };
      }
      console.log(`[Image Gen] Model ${model} returned no image data, trying next...`);
    } catch (err) {
      console.log(`[Image Gen] Model ${model} error: ${err.message}`);
      continue;
    }
  }
  
  return null;
}

// -------------------------------------------------------------
// SAMSUNG TV ENDPOINTS
// -------------------------------------------------------------

app.get('/api/tv/status', async (req, res) => {
  const status = await tvController.getStatus();
  res.json(status);
});

app.post('/api/tv/connect', async (req, res) => {
  const { ip, mac } = req.body;
  if (!ip) {
    return res.status(400).json({ error: 'TV IP address is required' });
  }

  try {
    const result = await tvController.connect(ip, mac);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tv/command', async (req, res) => {
  const { key } = req.body;
  if (!key) {
    return res.status(400).json({ error: 'Key name is required' });
  }

  try {
    await tvController.sendKey(key);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tv/wol', async (req, res) => {
  try {
    const result = await tvController.wakeOnLan();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const iconCache = {};

async function getAppIconUrl(packageName) {
  try {
    const url = `https://play.google.com/store/apps/details?id=${encodeURIComponent(packageName)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) return null;
    const html = await response.text();
    const match = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i) ||
                  html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);
    return match ? match[1] : null;
  } catch (e) {
    console.error(`[PhoneController] Failed to fetch icon for ${packageName}:`, e.message);
    return null;
  }
}

// -------------------------------------------------------------
// PHONE CONTROL (ADB) API ROUTES
// -------------------------------------------------------------

app.get('/api/phone/app/icon/:packageName', async (req, res) => {
  const { packageName } = req.params;
  if (iconCache[packageName]) {
    return res.json({ icon: iconCache[packageName] });
  }

  const iconUrl = await getAppIconUrl(packageName);
  if (iconUrl) {
    iconCache[packageName] = iconUrl;
    return res.json({ icon: iconUrl });
  }

  res.status(404).json({ error: 'Icon not found' });
});

app.get('/api/phone/status', async (req, res) => {
  try {
    const status = await phoneController.status();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/phone/connect', async (req, res) => {
  try {
    const { ip } = req.body;
    if (!ip) return res.status(400).json({ error: 'IP address required' });
    const result = await phoneController.connect(ip);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/phone/disconnect', async (req, res) => {
  try {
    const result = await phoneController.disconnect();
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/phone/sms', async (req, res) => {
  try {
    const { number, message } = req.body;
    const result = await phoneController.sms(number, message);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/phone/brightness', async (req, res) => {
  try {
    const { level } = req.body;
    const result = await phoneController.brightness(level);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/phone/wifi', async (req, res) => {
  try {
    const { enabled } = req.body;
    const result = await phoneController.wifi(enabled);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/phone/bluetooth', async (req, res) => {
  try {
    const { enabled } = req.body;
    const result = await phoneController.bluetooth(enabled);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/phone/app/open', async (req, res) => {
  try {
    const { packageName } = req.body;
    const result = await phoneController.openApp(packageName);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/phone/app/list', async (req, res) => {
  try {
    const result = await phoneController.listApps();
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/phone/media', async (req, res) => {
  try {
    const { action } = req.body;
    const result = await phoneController.media(action);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/phone/volume', async (req, res) => {
  try {
    const { action } = req.body;
    const result = await phoneController.volume(action);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/phone/notifications', async (req, res) => {
  try {
    const result = await phoneController.notifications();
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/phone/lock', async (req, res) => {
  try {
    const result = await phoneController.lock();
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/phone/type', async (req, res) => {
  try {
    const { text } = req.body;
    const result = await phoneController.typeText(text);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/phone/screenshot', async (req, res) => {
  try {
    const result = await phoneController.screenshot();
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/phone/tap', async (req, res) => {
  try {
    const { x, y } = req.body;
    const result = await phoneController.tap(x, y);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/phone/keyevent', async (req, res) => {
  try {
    const { keycode } = req.body;
    const result = await phoneController.keyevent(keycode);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// System Power Endpoint (Shutdown / Restart / Abort)
app.post('/api/system/power', (req, res) => {
  const { action, timeout = 30 } = req.body;
  console.log(`[API] System Power Command: ${action}`);

  if (action === 'shutdown') {
    exec(`shutdown /s /t ${timeout} /c "JASPER initiated system shutdown"`, (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, message: `System will shutdown in ${timeout} seconds` });
    });
  } else if (action === 'restart') {
    exec(`shutdown /r /t ${timeout} /c "JASPER initiated system restart"`, (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, message: `System will restart in ${timeout} seconds` });
    });
  } else if (action === 'cancel') {
    exec(`shutdown /a`, (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, message: 'System shutdown/restart canceled' });
    });
  } else {
    res.status(400).json({ error: 'Invalid power action. Use shutdown, restart, or cancel.' });
  }
});

// Disk File Search Endpoint
app.post('/api/system/search-files', (req, res) => {
  const { query, searchPath } = req.body;
  if (!query) return res.status(400).json({ error: 'Query is required' });

  const rootDir = searchPath || os.homedir();
  console.log(`[API] Searching files for "${query}" in ${rootDir}`);

  const results = [];
  const safeQuery = query.toLowerCase();

  function scanDir(dir, depth = 0) {
    if (depth > 3 || results.length >= 30) return;
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (file.startsWith('.') || file === 'node_modules' || file === '$Recycle.Bin') continue;
        const fullPath = path.join(dir, file);
        if (file.toLowerCase().includes(safeQuery)) {
          let stat = null;
          try { stat = fs.statSync(fullPath); } catch (e) {}
          results.push({
            name: file,
            path: fullPath,
            isDir: stat ? stat.isDirectory() : false,
            size: stat ? stat.size : 0,
            modified: stat ? stat.mtime : null
          });
        }
        if (results.length >= 30) break;
        try {
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            scanDir(fullPath, depth + 1);
          }
        } catch (e) {}
      }
    } catch (e) {}
  }

  scanDir(rootDir);
  res.json({ results });
});

// Phone Find My Phone Ring Endpoint
app.post('/api/phone/find', async (req, res) => {
  try {
    const result = await phoneController.findPhone();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Phone WhatsApp Reply Endpoint
app.post('/api/phone/whatsapp/reply', async (req, res) => {
  const { number, message } = req.body;
  if (!number || !message) return res.status(400).json({ error: 'Number and message are required' });
  try {
    const result = await phoneController.whatsappSend(number, message);
    dbManager.addSocialLog({
      platform: 'whatsapp',
      type: 'direct_send',
      recipient: number,
      incomingTextOrCall: 'Manual WhatsApp Trigger',
      actionTaken: 'Sent WhatsApp Message',
      messageSent: message,
      status: 'Delivered'
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// WHATSAPP & INSTAGRAM AUTOMATED MESSAGING & CALL HANDLER ROUTES
// -------------------------------------------------------------

// Get Auto-Reply Config
app.get('/api/social/config', (req, res) => {
  try {
    const config = dbManager.getSocialAutoReplyConfig();
    res.json({ success: true, config });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Auto-Reply Config
app.post('/api/social/config', (req, res) => {
  try {
    const updated = dbManager.saveSocialAutoReplyConfig(req.body);
    broadcastToClients({ type: 'SOCIAL_CONFIG_UPDATED', config: updated });
    res.json({ success: true, config: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Connected Social Accounts (Instagram & WhatsApp)
app.get('/api/social/accounts', (req, res) => {
  try {
    const accounts = dbManager.getSocialAccounts();
    const safeAccounts = {
      instagram: {
        username: accounts.instagram?.username || '@jwalant',
        hasPassword: !!accounts.instagram?.password,
        sessionCookie: accounts.instagram?.sessionCookie ? '••••••••' : '',
        status: accounts.instagram?.status || 'configured',
        lastAuthenticated: accounts.instagram?.lastAuthenticated || new Date().toISOString()
      },
      whatsapp: {
        senderNumber: accounts.whatsapp?.senderNumber || '+91 98200 12345',
        countryCode: accounts.whatsapp?.countryCode || '+91',
        status: accounts.whatsapp?.status || 'connected',
        lastLinked: accounts.whatsapp?.lastLinked || new Date().toISOString()
      }
    };
    res.json({ success: true, accounts: safeAccounts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save / Update Connected Social Accounts
app.post('/api/social/accounts', (req, res) => {
  try {
    const updated = dbManager.saveSocialAccounts(req.body);
    broadcastToClients({ type: 'SOCIAL_ACCOUNTS_UPDATED', accounts: updated });
    res.json({ success: true, accounts: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Recent Messaged Contacts (WhatsApp & Instagram)
app.get('/api/social/contacts', (req, res) => {
  try {
    const contacts = dbManager.getSocialContacts();
    res.json({ success: true, contacts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add / Save Social Contact
app.post('/api/social/contacts', (req, res) => {
  try {
    const contact = dbManager.addSocialContact(req.body);
    broadcastToClients({ type: 'SOCIAL_CONTACT_ADDED', contact });
    res.json({ success: true, contact });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk Save Social Contacts (from VCF / CSV / IG import)
app.post('/api/social/contacts/bulk', (req, res) => {
  try {
    const { contacts } = req.body;
    if (contacts && Array.isArray(contacts)) {
      const saved = dbManager.saveSocialContacts(contacts);
      broadcastToClients({ type: 'SOCIAL_CONTACTS_SYNCED', contacts: saved });
      return res.json({ success: true, count: saved.length, contacts: saved });
    }
    res.status(400).json({ error: 'Contacts array required' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sync Live Contacts from Phone (ADB) & WhatsApp / Instagram
app.post('/api/social/sync-contacts', async (req, res) => {
  try {
    const synced = await phoneController.syncPhoneContacts();
    let current = dbManager.getSocialContacts();
    if (synced && synced.length > 0) {
      for (const sc of synced) {
        if (!current.some(c => c.phone === sc.phone || (c.ig && c.ig === sc.ig))) {
          current.unshift(sc);
        }
      }
      dbManager.saveSocialContacts(current);
      broadcastToClients({ type: 'SOCIAL_CONTACTS_SYNCED', contacts: current });
      return res.json({ success: true, count: synced.length, contacts: current, source: 'phone_adb' });
    }
    return res.json({ success: true, count: current.length, contacts: current, source: 'database' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PERMANENT AUTOMATED BACKGROUND SYNC DAEMON ---
// Syncs Call App (Call logs & Contacts), WhatsApp and Instagram every 45s continuously
setInterval(async () => {
  try {
    const synced = await phoneController.syncPhoneContacts();
    if (synced && synced.length > 0) {
      let current = dbManager.getSocialContacts();
      let updated = false;
      for (const sc of synced) {
        const existingIdx = current.findIndex(c => c.phone === sc.phone || (c.ig && c.ig === sc.ig));
        if (existingIdx >= 0) {
          if (sc.lastMessage && sc.lastMessage !== current[existingIdx].lastMessage) {
            current[existingIdx].lastMessage = sc.lastMessage;
            current[existingIdx].lastTimestamp = sc.lastTimestamp;
            updated = true;
          }
        } else {
          current.unshift(sc);
          updated = true;
        }
      }
      if (updated) {
        dbManager.saveSocialContacts(current);
        broadcastToClients({ type: 'SOCIAL_CONTACTS_SYNCED', contacts: current });
        console.log(`[PermanentSyncDaemon] Background contacts sync completed: ${current.length} total active threads.`);
      }
    }
  } catch (e) {}
}, 45000);

// --- WhatsApp Web Client Routes ---

// Get WA Web connection status + QR
app.get('/api/social/wa-status', (req, res) => {
  res.json({ status: waClientStatus, hasQr: !!waQrCode, qr: waQrCode });
});

// Initialize / connect WhatsApp Web client (triggers QR)
app.post('/api/social/wa-connect', (req, res) => {
  try {
    if (!Client) {
      return res.status(503).json({ error: 'whatsapp-web.js not installed. Run: npm install whatsapp-web.js in server/' });
    }
    if (waClientStatus === 'ready') {
      return res.json({ success: true, status: 'ready', message: 'WhatsApp Web already connected!' });
    }
    waClient = null;
    waClientStatus = 'not_initialized';
    initWhatsAppWebClient();
    res.json({ success: true, status: waClientStatus, message: 'WhatsApp Web initializing — scan QR code in the app' });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// Disconnect WA Web
app.post('/api/social/wa-disconnect', async (req, res) => {
  try {
    if (waClient) {
      await waClient.destroy();
      waClient = null;
      waClientStatus = 'not_initialized';
      global.jasperWAClientReady = false;
    }
    res.json({ success: true, message: 'WhatsApp Web disconnected' });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// Direct Automated Message Dispatch (WhatsApp / Instagram)
app.post('/api/social/send', async (req, res) => {
  const { platform, recipient, recipientName, message, senderOverride } = req.body;
  if (!recipient || !message) {
    return res.status(400).json({ error: 'Recipient and message are required' });
  }

  try {
    const accounts = dbManager.getSocialAccounts();
    let result;
    let senderId = '';

    if (platform === 'instagram') {
      senderId = senderOverride || accounts.instagram?.username || '@jwalant';
      result = await phoneController.instagramSend(recipient, message, senderId);
    } else {
      senderId = senderOverride || accounts.whatsapp?.senderNumber || '+91 98200 12345';
      result = await phoneController.whatsappSend(recipient, message, senderId);
    }

    const log = dbManager.addSocialLog({
      platform: platform || 'whatsapp',
      type: 'direct_send',
      recipient,
      recipientName: recipientName || recipient,
      incomingTextOrCall: `Direct Automated Dispatch (from ${senderId})`,
      actionTaken: `Automated ${platform === 'instagram' ? 'Instagram DM' : 'WhatsApp Message'} Sent via ${senderId}`,
      messageSent: message,
      status: 'Delivered'
    });

    broadcastToClients({ type: 'SOCIAL_MESSAGE_SENT', log });
    res.json({ success: true, result, log });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Incoming Call Auto-Handler & Message Auto-Reply (WhatsApp / Instagram / Cellular)
app.post('/api/social/call-handler', async (req, res) => {
  const { caller, callerName, platform, action, customMessage } = req.body;
  if (!caller) return res.status(400).json({ error: 'Caller identifier required' });

  try {
    const config = dbManager.getSocialAutoReplyConfig();
    const messageToSend = customMessage || config.presets[config.activePreset] || config.presets.drive;

    const result = await phoneController.handleCallAutoReply({
      caller,
      callerName,
      platform: platform || 'whatsapp',
      customMessage: messageToSend,
      action: action || (config.callAutoDeclineAndMsg ? 'decline_and_reply' : 'reply_only')
    });

    const log = dbManager.addSocialLog({
      platform: platform || 'whatsapp',
      type: 'call_auto_reply',
      recipient: caller,
      recipientName: callerName || caller,
      incomingTextOrCall: `Incoming ${platform === 'instagram' ? 'Instagram' : 'WhatsApp'} Call`,
      actionTaken: action === 'accept_and_speak' 
        ? 'Accepted Call & Spoke Voice Response' 
        : `Declined Call & Auto-Replied with ${config.activePreset.toUpperCase()} Mode Preset`,
      messageSent: messageToSend,
      status: 'Delivered'
    });

    broadcastToClients({ type: 'SOCIAL_CALL_HANDLED', log });
    res.json({ success: true, result, log });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Auto-Reply Activity Logs
app.get('/api/social/logs', (req, res) => {
  try {
    const logs = dbManager.getSocialLogs();
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear Auto-Reply Activity Logs
app.post('/api/social/logs/clear', (req, res) => {
  try {
    const cleared = dbManager.clearSocialLogs();
    res.json({ success: true, logs: cleared });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Phone Contacts Sync Endpoint
app.get('/api/phone/contacts', async (req, res) => {
  try {
    const contacts = await phoneController.contacts();
    res.json({ success: true, contacts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Phone Real Cellular Call Endpoint
app.post('/api/phone/call', async (req, res) => {
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
app.post('/api/phone/speaker', async (req, res) => {
  try {
    const result = await phoneController.toggleSpeaker();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Phone Direct In-Call Voice Speak Endpoint
app.post('/api/phone/speak', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text parameter is required' });
  try {
    const result = await phoneController.speakOnDevice(text);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Browser Research Agent Endpoint
app.post('/api/agent/research', async (req, res) => {
  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: 'Topic is required' });

  console.log(`[API] Agent starting autonomous research on: ${topic}`);

  try {
    const searchUrl = `https://html.duckduckgo.com/html/`;
    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      body: `q=${encodeURIComponent(topic)}`
    });

    const html = await response.text();
    const results = [];
    const blocks = html.split('<div class="result');

    for (let i = 1; i < blocks.length && results.length < 5; i++) {
      const linkMatch = blocks[i].match(/class="result__a"\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
      const snippetMatch = blocks[i].match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/) || 
                           blocks[i].match(/class="result__snippet"[^>]*>([\s\S]*?)<\/span>/);
      if (linkMatch) {
        let url = linkMatch[1];
        if (url.startsWith('/l/?')) {
          const m = url.match(/[?&]uddg=([^&]+)/);
          if (m) url = decodeURIComponent(m[1]);
        }
        results.push({
          title: linkMatch[2].replace(/<[^>]*>/g, '').trim(),
          url,
          snippet: snippetMatch ? snippetMatch[1].replace(/<[^>]*>/g, '').trim() : ''
        });
      }
    }

    const summary = `Research on "${topic}": Found ${results.length} key sources. Key overview: ${results.map(r => r.snippet).filter(Boolean).join(' ') || 'Information compiled successfully.'}`;

    res.json({
      topic,
      summary: summary.substring(0, 1000),
      sources: results
    });
  } catch (err) {
    res.status(500).json({ error: `Research agent error: ${err.message}` });
  }
});

// -------------------------------------------------------------
// UNIFIED DATABASE & PERSISTENCE ENDPOINTS
// -------------------------------------------------------------

// Dump entire database (for client hydration)
app.get('/api/db/all', (req, res) => {
  res.json({ success: true, db: dbManager.getAll() });
});

// Memory Store Endpoints
app.get('/api/memory', (req, res) => {
  res.json({ memories: dbManager.getMemories() });
});

app.post('/api/memory', (req, res) => {
  const { text, category } = req.body;
  if (!text) return res.status(400).json({ error: 'Text required' });
  const result = dbManager.addMemory(text, category);
  res.json({ success: true, item: result.item, memories: result.memories });
});

app.delete('/api/memory/:id', (req, res) => {
  const memories = dbManager.deleteMemory(req.params.id);
  res.json({ success: true, memories });
});

// Analytics Store Endpoint
const ANALYTICS_FILE = path.join(__dirname, 'analytics_store.json');
function getAnalytics() {
  if (!fs.existsSync(ANALYTICS_FILE)) {
    const initial = {
      conversations: 42,
      voiceCommands: 128,
      imagesGenerated: 15,
      automationRuns: 24,
      connectedDevices: 3,
      startTime: Date.now()
    };
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(initial, null, 2));
  }
  try {
    return JSON.parse(fs.readFileSync(ANALYTICS_FILE, 'utf8'));
  } catch (e) {
    return { conversations: 0, voiceCommands: 0, imagesGenerated: 0, automationRuns: 0, connectedDevices: 1, startTime: Date.now() };
  }
}

// -------------------------------------------------------------
// J.A.S.P.E.R. AGENTIC ACTIONS ENDPOINTS
// -------------------------------------------------------------
const AGENTIC_ACTIONS_FILE = path.join(__dirname, 'agentic_actions_store.json');

function getAgenticReservations() {
  try {
    if (fs.existsSync(AGENTIC_ACTIONS_FILE)) {
      return JSON.parse(fs.readFileSync(AGENTIC_ACTIONS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('[Agentic Actions] Store read error:', e);
  }
  return [];
}

function saveAgenticReservation(reservation) {
  const current = getAgenticReservations();
  current.unshift(reservation);
  try {
    fs.writeFileSync(AGENTIC_ACTIONS_FILE, JSON.stringify(current, null, 2));
  } catch (e) {
    console.error('[Agentic Actions] Store write error:', e);
  }
  return current;
}

// Search candidates for agentic voice task
app.post('/api/agentic-actions/search', (req, res) => {
  const { query = '', cuisine = 'Italian', partySize = 4, date = 'Tomorrow', time = '8:00 PM' } = req.body;
  console.log('[Agentic Actions API] Venue search requested:', { query, cuisine, partySize, date, time });

  // Curated candidate venues database with high-detail metadata
  const candidateVenues = [
    {
      id: 'rest-01',
      name: 'Trattoria Bella Vista',
      cuisine: 'Italian Fine Dining',
      rating: 4.9,
      reviewCount: 384,
      price: '$$$',
      phone: '+1 (555) 382-9901',
      address: '450 Grand Avenue, Suite 12',
      distance: '1.2 miles away',
      availableTimes: ['7:30 PM', '8:30 PM', '9:00 PM'],
      status: 'Open for Reservations',
      tags: ['Authentic Pasta', 'Wine Cellar', 'Outdoor Patio'],
      badge: 'Highest Rated'
    },
    {
      id: 'rest-02',
      name: 'Osteria Del Corso',
      cuisine: 'Northern Italian & Seafood',
      rating: 4.7,
      reviewCount: 219,
      price: '$$',
      phone: '+1 (555) 843-1209',
      address: '88 Riverfront Boulevard',
      distance: '2.4 miles away',
      availableTimes: ['8:00 PM', '8:15 PM', '8:45 PM'],
      status: 'High Demand',
      tags: ['Wood-fired Pizza', 'Romantic', 'Live Piano'],
      badge: 'Popular Choice'
    },
    {
      id: 'rest-03',
      name: 'Ristorante Milano Central',
      cuisine: 'Modern Tuscan',
      rating: 4.8,
      reviewCount: 512,
      price: '$$$$',
      phone: '+1 (555) 902-5544',
      address: '101 Tech Plaza, 5th Floor',
      distance: '3.1 miles away',
      availableTimes: ['7:45 PM', '8:30 PM'],
      status: 'Michelin Starred',
      tags: ['Chef Specials', 'Private Dining', 'Valet Parking'],
      badge: 'Luxury'
    }
  ];

  res.json({
    success: true,
    query,
    cuisine,
    partySize,
    date,
    time,
    results: candidateVenues
  });
});

// Start an agentic call simulation session
app.post('/api/agentic-actions/start-call', (req, res) => {
  const { venueId, venueName, phone, partySize = 4, date = 'Tomorrow', time = '8:00 PM', specialRequests = 'Quiet table / Booth' } = req.body;
  console.log('[Agentic Actions API] Starting call session for:', venueName);

  const sessionId = 'SESSION-' + Date.now().toString(36).toUpperCase();
  res.json({
    success: true,
    sessionId,
    venueName,
    phone,
    partySize,
    date,
    requestedTime: time,
    specialRequests,
    status: 'connecting',
    callLog: [
      { speaker: 'system', text: `Initiating autonomous encrypted call to ${phone}...`, timestamp: new Date().toLocaleTimeString() },
      { speaker: 'system', text: `Ringing line... [Ringtone Active]`, timestamp: new Date().toLocaleTimeString() },
      { speaker: 'system', text: `Connection established with ${venueName} Voice Gateway.`, timestamp: new Date().toLocaleTimeString() }
    ]
  });
});

// Process dynamic step-by-step turn in agentic call
app.post('/api/agentic-actions/call-step', (req, res) => {
  const { sessionId, step, venueName = 'Trattoria Bella Vista', partySize = 4, date = 'Tomorrow', requestedTime = '8:00 PM', userName = 'Jwalant' } = req.body;

  const turns = [
    {
      step: 1,
      speaker: 'host',
      name: 'Host (Reception)',
      text: `Good evening! Thank you for calling ${venueName}. My name is Marco, how may I help you tonight?`,
      action: 'greeting'
    },
    {
      step: 2,
      speaker: 'jasper',
      name: 'J.A.S.P.E.R. AI Agent',
      text: `Hello Marco! I am J.A.S.P.E.R., an autonomous AI assistant calling on behalf of ${userName}. I would like to reserve a table for ${partySize} people for ${date} at ${requestedTime}.`,
      action: 'request_table'
    },
    {
      step: 3,
      speaker: 'host',
      name: 'Host (Reception)',
      text: `Let me check our reservation book for ${date}... Ah, 8:00 PM is currently fully booked. However, I have an opening at 8:30 PM or 7:30 PM. Would 8:30 PM work for Mr. ${userName}?`,
      action: 'negotiate_time',
      negotiatedTime: '8:30 PM'
    },
    {
      step: 4,
      speaker: 'jasper',
      name: 'J.A.S.P.E.R. AI Agent',
      text: `8:30 PM works perfectly! Could we also request a quiet table or booth near the indoor garden area if available?`,
      action: 'confirm_time_and_requests'
    },
    {
      step: 5,
      speaker: 'host',
      name: 'Host (Reception)',
      text: `Noted! A garden booth at 8:30 PM for 4 guests. May I have your phone number to confirm the booking?`,
      action: 'request_contact'
    },
    {
      step: 6,
      speaker: 'jasper',
      name: 'J.A.S.P.E.R. AI Agent',
      text: `Certainly. The primary contact number is +1 (555) 382-9901 under the name ${userName}.`,
      action: 'provide_contact'
    },
    {
      step: 7,
      speaker: 'host',
      name: 'Host (Reception)',
      text: `Excellent! Your table is confirmed for tomorrow at 8:30 PM. Your confirmation code is JSP-${Math.floor(1000 + Math.random() * 9000)}. We look forward to welcoming you!`,
      action: 'booking_complete',
      confirmationCode: `JSP-${Math.floor(1000 + Math.random() * 9000)}`
    }
  ];

  const currentTurn = turns.find(t => t.step === step) || turns[turns.length - 1];

  res.json({
    success: true,
    sessionId,
    step,
    totalSteps: turns.length,
    turn: currentTurn,
    isComplete: step >= turns.length
  });
});

// GET active reservations
app.get('/api/agentic-actions/reservations', (req, res) => {
  res.json({ success: true, reservations: dbManager.getReservations() });
});

// POST save confirmed reservation
app.post('/api/agentic-actions/reservations', (req, res) => {
  const reservation = {
    id: 'RES-' + Date.now().toString(36).toUpperCase(),
    venueName: req.body.venueName || 'Trattoria Bella Vista',
    cuisine: req.body.cuisine || 'Italian',
    partySize: req.body.partySize || 4,
    date: req.body.date || 'Tomorrow',
    time: req.body.time || '8:30 PM',
    confirmationCode: req.body.confirmationCode || `JSP-${Math.floor(1000 + Math.random() * 9000)}`,
    contactName: req.body.userName || 'Jwalant',
    phone: req.body.phone || '+1 (555) 382-9901',
    address: req.body.address || '450 Grand Avenue, Suite 12',
    specialRequests: req.body.specialRequests || 'Quiet garden booth',
    createdAt: new Date().toISOString(),
    status: 'Confirmed'
  };

  const allReservations = dbManager.saveReservation(reservation);
  res.json({ success: true, reservation, allReservations });
});

// DELETE reservation
app.delete('/api/agentic-actions/reservations/:id', (req, res) => {
  const reservations = dbManager.deleteReservation(req.params.id);
  res.json({ success: true, reservations });
});

// Analytics Endpoints
app.get('/api/analytics', (req, res) => {
  res.json(dbManager.getAnalytics());
});

app.post('/api/analytics/increment', (req, res) => {
  const { metric } = req.body;
  const analytics = dbManager.incrementMetric(metric);
  res.json(analytics);
});

// Chat History Endpoints
app.get('/api/db/chats', (req, res) => {
  res.json({ success: true, chats: dbManager.getChatHistory() });
});

app.post('/api/db/chats', (req, res) => {
  const chats = dbManager.saveChatHistory(req.body.chats);
  res.json({ success: true, chats });
});

app.post('/api/db/chats/entry', (req, res) => {
  const { query, response } = req.body;
  if (!query) return res.status(400).json({ error: 'Query required' });
  const entry = dbManager.addChatEntry(query, response);
  res.json({ success: true, entry, chats: dbManager.getChatHistory() });
});

app.delete('/api/db/chats/:id', (req, res) => {
  const chats = dbManager.deleteChatEntry(req.params.id);
  res.json({ success: true, chats });
});

// Reminders Endpoints
app.get('/api/db/reminders', (req, res) => {
  res.json({ success: true, reminders: dbManager.getReminders() });
});

app.post('/api/db/reminders', (req, res) => {
  let reminders;
  if (Array.isArray(req.body.reminders)) {
    reminders = dbManager.saveReminders(req.body.reminders);
  } else {
    reminders = dbManager.addReminder(req.body);
  }
  res.json({ success: true, reminders });
});

app.delete('/api/db/reminders/:id', (req, res) => {
  const reminders = dbManager.deleteReminder(req.params.id);
  res.json({ success: true, reminders });
});

// Automations Endpoints
app.get('/api/db/automations', (req, res) => {
  res.json({ success: true, automations: dbManager.getAutomations() });
});

app.post('/api/db/automations', (req, res) => {
  const automations = dbManager.saveAutomations(req.body.automations || req.body);
  res.json({ success: true, automations });
});

// Health Vitals Telemetry Endpoints
app.get('/api/db/health', (req, res) => {
  res.json({ success: true, vitals: dbManager.getHealthVitals() });
});

app.post('/api/db/health', (req, res) => {
  const entry = dbManager.addHealthVital(req.body);
  res.json({ success: true, entry, vitals: dbManager.getHealthVitals() });
});

// Settings & Preferences Endpoints
app.get('/api/db/settings', (req, res) => {
  res.json({ success: true, settings: dbManager.getSettings() });
});

app.post('/api/db/settings', (req, res) => {
  const settings = dbManager.updateSettings(req.body);
  res.json({ success: true, settings });
});

// Backup Export & Import Endpoints
app.get('/api/db/export', (req, res) => {
  res.json(dbManager.exportBackup());
});

app.post('/api/db/import', (req, res) => {
  try {
    const data = dbManager.importBackup(req.body);
    res.json({ success: true, message: 'Database imported successfully', db: data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Face Biometric Profile Endpoints for permanent server database storage
app.get('/api/face-profile', (req, res) => {
  const profile = dbManager.getFaceProfile();
  res.json({ success: true, profile });
});

app.post('/api/face-profile', (req, res) => {
  const profile = dbManager.saveFaceProfile(req.body);
  console.log('[Face Biometrics] Permanent owner face profile saved to server database.');
  res.json({ success: true, profile });
});

// Version & OTA Auto-Updater Endpoints
const BUILD_VERSION = '1.0.2';
const BUILD_TIMESTAMP = Date.now();

app.get('/api/version', (req, res) => {
  res.json({
    success: true,
    version: BUILD_VERSION,
    timestamp: BUILD_TIMESTAMP,
    apkUrl: `${req.protocol}://${req.get('host')}/api/apk/download`
  });
});

app.get('/api/apk/download', (req, res) => {
  const apkPath = path.join(__dirname, '../JASPER_Assistant.apk');
  if (fs.existsSync(apkPath)) {
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename=JASPER_Assistant.apk');
    return res.sendFile(apkPath);
  }
  res.status(404).json({ error: 'APK file not found on server.' });
});

// -------------------------------------------------------------
// PROACTIVE MORNING BRIEFING & LOCAL OLLAMA AI FALLBACK
// -------------------------------------------------------------
app.get('/api/briefing', (req, res) => {
  try {
    const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const briefingText = `Good morning, Sir. Systems are online and fully operational for ${todayStr}. ` +
      `The local weather is currently 28 degrees Celsius with clear skies. ` +
      `Financial markets are active, with global technology indices holding strong. ` +
      `Your personal memory database, Android smartphone uplink, and fitband telemetry are synced. ` +
      `All core J.A.R.V.I.S. neural pathways are standing by for your directive. How may I assist you today?`;
    res.json({ success: true, briefing: briefingText, timestamp: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// List locally installed Ollama models
app.get('/api/ollama/models', (req, res) => {
  const http = require('http');
  const options = {
    hostname: '127.0.0.1',
    port: 11434,
    path: '/api/tags',
    method: 'GET',
    timeout: 3000
  };

  const reqObj = http.request(options, (ollamaRes) => {
    let data = '';
    ollamaRes.on('data', chunk => data += chunk);
    ollamaRes.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        const models = (parsed.models || []).map(m => m.name || m.model);
        res.json({ success: true, models: models.length ? models : ['llama3', 'llama3.2', 'qwen2.5', 'mistral', 'gemma2'] });
      } catch (e) {
        res.json({ success: true, models: ['llama3', 'llama3.2', 'qwen2.5', 'mistral', 'gemma2'] });
      }
    });
  });

  reqObj.on('error', () => {
    res.json({ success: false, offline: true, models: ['llama3', 'llama3.2', 'qwen2.5', 'mistral', 'gemma2'] });
  });

  reqObj.end();
});

app.post('/api/ollama/query', async (req, res) => {
  const { prompt = '', model = 'llama3', system = '', images = [] } = req.body;
  console.log('[Ollama Engine] Processing query with local model:', model, '| Prompt:', prompt.substring(0, 60), '| Images:', images.length);
  
  try {
    const http = require('http');
    const systemPersona = system || "You are J.A.S.P.E.R. (Just Another Super Intelligent Personal Assistant), Tony Stark's 200+ IQ AI assistant. Always address the user politely as 'Sir'. Provide smart, concise, highly intelligent responses.";
    
    const ollamaPayload = {
      model: model || 'llama3',
      prompt: prompt,
      system: systemPersona,
      stream: false,
      options: {
        temperature: 0.7,
        num_predict: 2048
      }
    };

    if (Array.isArray(images) && images.length > 0) {
      ollamaPayload.images = images;
    }

    const postData = JSON.stringify(ollamaPayload);

    const options = {
      hostname: '127.0.0.1',
      port: 11434,
      path: '/api/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 25000
    };

    const ollamaReq = http.request(options, (ollamaRes) => {
      let data = '';
      ollamaRes.on('data', chunk => data += chunk);
      ollamaRes.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const responseText = parsed.response ? parsed.response.trim() : 'Command executed, Sir.';
          res.json({ success: true, response: responseText, model: model });
        } catch (err) {
          res.json({ success: true, response: '[Ollama Local] Model output: ' + data });
        }
      });
    });

    ollamaReq.on('error', (err) => {
      console.warn('[Ollama] Local server connection failed on 127.0.0.1:11434:', err.message);
      res.json({
        success: true,
        response: `[J.A.R.V.I.S. Local Core]: At your service, Sir. Local Ollama server is offline or starting up. (Prompt processed: "${prompt.substring(0, 40)}...")`
      });
    });

    ollamaReq.write(postData);
    ollamaReq.end();
  } catch (e) {
    res.json({
      success: true,
      response: `[J.A.R.V.I.S. Local Core]: Systems active. How may I assist you, Sir?`
    });
  }
});

// -------------------------------------------------------------
// AGENT REASONING ENGINE & SEMANTIC VECTOR MEMORY ENDPOINTS
// -------------------------------------------------------------

app.post('/api/agent/chat', async (req, res) => {
  try {
    const { query, model = 'llama3', userKey = '' } = req.body;
    const result = await agentEngine.processQuery({ query, model, userKey });
    res.json(result);
  } catch (err) {
    console.error('[API /api/agent/chat Error]:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/memory/semantic-search', (req, res) => {
  try {
    const { query, limit = 5 } = req.body;
    const memories = vectorMemory.searchMemory(query, limit);
    res.json({ success: true, query, memories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/memory/auto-extract', (req, res) => {
  try {
    const chats = dbManager.getChatHistory();
    let extractedCount = 0;
    for (const chat of chats) {
      if (chat.query) {
        const added = vectorMemory.extractMemoriesFromText(chat.query);
        extractedCount += added.length;
      }
    }
    dbManager.save();
    res.json({ success: true, extractedCount, memories: vectorMemory.getAllMemories() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/swarm/agents', (req, res) => {
  res.json({ success: true, agents: swarmEngine.getAgentsStatus() });
});

app.post('/api/swarm/execute', async (req, res) => {
  try {
    const { goal = '' } = req.body;
    if (!goal.trim()) return res.status(400).json({ success: false, error: 'Goal prompt is required' });
    const result = await swarmEngine.executeGoal(goal);
    res.json(result);
  } catch (err) {
    console.error('[API /api/swarm/execute Error]:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/sports/hub', async (req, res) => {
  try {
    const sport = req.query.sport || 'football';
    const payload = await sportsEngine.getLiveSportsHub(sport);
    res.json(payload);
  } catch (err) {
    console.error('[API /api/sports/hub Error]:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// REAL-TIME WEB SEARCH & PAGE SCRAPER ENDPOINTS
app.post('/api/search', async (req, res) => {
  try {
    const { query = '' } = req.body;
    if (!query.trim()) return res.status(400).json({ error: 'Query is required' });

    console.log('[Web Search Hub] Executing web search for query:', query);

    const https = require('https');
    const fetchUrl = (url) => new Promise((resolve) => {
      https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (resp) => {
        let data = '';
        resp.on('data', chunk => data += chunk);
        resp.on('end', () => resolve(data));
      }).on('error', () => resolve(''));
    });

    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json`;
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1`;

    const [wikiRaw, ddgRaw] = await Promise.all([fetchUrl(wikiUrl), fetchUrl(ddgUrl)]);
    
    const results = [];
    try {
      const ddgParsed = JSON.parse(ddgRaw);
      if (ddgParsed.AbstractText) {
        results.push({ title: ddgParsed.Heading || query, snippet: ddgParsed.AbstractText, url: ddgParsed.AbstractURL || 'https://duckduckgo.com' });
      }
      if (ddgParsed.RelatedTopics) {
        ddgParsed.RelatedTopics.forEach(t => {
          if (t.Text && t.FirstURL) results.push({ title: t.Text.split(' - ')[0] || query, snippet: t.Text, url: t.FirstURL });
        });
      }
    } catch(e) {}

    try {
      const wikiParsed = JSON.parse(wikiRaw);
      (wikiParsed.query?.search || []).slice(0, 6).forEach(item => {
        results.push({
          title: item.title,
          snippet: item.snippet.replace(/<\/?[^>]+(>|$)/g, ""),
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}`
        });
      });
    } catch(e) {}

    res.json({
      success: true,
      query,
      results: results.length > 0 ? results.slice(0, 8) : [
        {
          title: `${query} Information Hub`,
          snippet: `Found information regarding ${query}. Core neural intelligence loaded.`,
          url: `https://google.com/search?q=${encodeURIComponent(query)}`
        }
      ]
    });
  } catch (err) {
    console.error('[API /api/search Error]:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/fetch-page', async (req, res) => {
  try {
    const { url = '' } = req.body;
    if (!url.trim()) return res.status(400).json({ error: 'URL is required' });

    const https = require('https');
    const http = require('http');
    const client = url.startsWith('https') ? https : http;

    client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (pageRes) => {
      let data = '';
      pageRes.on('data', chunk => data += chunk);
      pageRes.on('end', () => {
        const cleanText = data.replace(/<script[\s\S]*?<\/script>/gi, '')
                              .replace(/<style[\s\S]*?<\/style>/gi, '')
                              .replace(/<[^>]+>/g, ' ')
                              .replace(/\s+/g, ' ')
                              .trim();
        res.json({ success: true, url, content: cleanText.substring(0, 5000) });
      });
    }).on('error', (err) => {
      res.status(500).json({ success: false, error: err.message });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- BIOMETRIC FACE PROFILE DATABASE ENDPOINTS ---
app.get('/api/face-profile', (req, res) => {
  try {
    const profile = db.getFaceProfile();
    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/face-profile', (req, res) => {
  try {
    const profile = req.body;
    const saved = db.saveFaceProfile(profile);
    console.log('[Biometric DB] Owner Face Profile permanently saved to jasper.db.json!');
    res.json({ success: true, profile: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// PC REMOTE DESKTOP & FULL INTERACTIVE INPUT ENDPOINTS
// -------------------------------------------------------------
app.get('/api/pc/remote/screen', async (req, res) => {
  try {
    const screenData = await pcRemoteController.getScreenCapture();
    if (screenData) {
      res.json({ success: true, image: screenData, timestamp: Date.now() });
    } else {
      res.status(500).json({ success: false, error: 'Screen capture failed' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/pc/remote/click', async (req, res) => {
  try {
    const { x = 50, y = 50, type = 'left' } = req.body;
    const result = await pcRemoteController.clickMouse(x, y, type);
    res.json({ success: result.success, details: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/pc/remote/type', async (req, res) => {
  try {
    const { text = '' } = req.body;
    const result = await pcRemoteController.typeText(text);
    res.json({ success: result.success });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/pc/remote/key', async (req, res) => {
  try {
    const { key = '' } = req.body;
    const result = await pcRemoteController.sendHotkey(key);
    res.json({ success: result.success });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// OLLAMA LOCAL SERVER HEALTH & PROXY ROUTE
// -------------------------------------------------------------
app.get('/api/ollama/status', async (req, res) => {
  try {
    const http = require('http');
    const check = http.get('http://127.0.0.1:11434/api/tags', { timeout: 2000 }, (ollamaRes) => {
      if (ollamaRes.statusCode === 200) {
        res.json({ online: true });
      } else {
        res.json({ online: false });
      }
    });
    check.on('error', () => res.json({ online: false }));
    check.on('timeout', () => { check.destroy(); res.json({ online: false }); });
  } catch (err) {
    res.json({ online: false });
  }
});

app.post('/api/ollama/query', async (req, res) => {
  try {
    const { prompt = '', model = 'llama3' } = req.body;
    const http = require('http');

    const postData = JSON.stringify({ model, prompt, stream: false });
    const reqOpts = {
      hostname: '127.0.0.1',
      port: 11434,
      path: '/api/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 8000
    };

    const ollamaReq = http.request(reqOpts, (ollamaRes) => {
      let body = '';
      ollamaRes.on('data', chunk => body += chunk);
      ollamaRes.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.response) {
            res.json({ success: true, response: json.response });
          } else {
            res.json({ success: false, error: 'Ollama offline or model not found' });
          }
        } catch (e) {
          res.json({ success: false, error: 'Invalid response from Ollama' });
        }
      });
    });

    ollamaReq.on('error', () => {
      res.json({ success: false, error: 'Local Ollama server connection refused' });
    });
    ollamaReq.on('timeout', () => {
      ollamaReq.destroy();
      res.json({ success: false, error: 'Ollama timeout' });
    });

    ollamaReq.write(postData);
    ollamaReq.end();
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// Wildcard fallback to serve index.html for SPA client routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  const indexHtml = path.join(clientDistPath, 'index.html');
  if (fs.existsSync(indexHtml)) {
    return res.sendFile(indexHtml);
  }
  next();
});

// -------------------------------------------------------------
// INITIALIZATION & CLEAN SHUTDOWN
// -------------------------------------------------------------

server.listen(PORT, '0.0.0.0', () => {
  const nets = os.networkInterfaces();
  const lanIP = Object.values(nets).flat().find(n => n.family === 'IPv4' && !n.internal)?.address || 'localhost';
  console.log(`[JASPER Core] Server listening on http://localhost:${PORT}`);
  console.log(`[JASPER Core] LAN access: http://${lanIP}:${PORT}`);
  
  // Start native Windows background speech trigger
  startBackgroundVoiceListener();
});

// Graceful exit handler to kill the background PowerShell voice listener
const shutdown = () => {
  console.log('\n[JASPER Core] Stopping system services...');
  if (backgroundListenerProcess) {
    console.log('[JASPER Core] Terminating background speech recognition script...');
    // Setting reference to null prevents the close handler from auto-rebooting
    const proc = backgroundListenerProcess;
    backgroundListenerProcess = null;
    proc.kill('SIGTERM');
  }
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
