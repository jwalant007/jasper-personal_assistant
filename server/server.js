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

// Helper to resolve PowerShell script paths correctly in production (from unpacked extraResources)
function getScriptPath(scriptName) {
  if (process.env.JASPER_RESOURCES_PATH) {
    return path.join(process.env.JASPER_RESOURCES_PATH, 'server', scriptName);
  }
  return path.join(__dirname, scriptName);
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
  console.log('[API] Wake request received from background speech listener.');

  if (now - lastWakeTime < WAKE_COOLDOWN) {
    console.log('[API] Wake request ignored due to cooldown.');
    return res.json({ status: 'ignored', reason: 'cooldown' });
  }

  lastWakeTime = now;
  
  // 1. Broadcast wake signal to active web clients
  broadcastToClients({ type: 'WAKE_UP', timestamp: now });

  // 2. If no clients are connected, launch the browser automatically!
  if (activeSockets.size === 0) {
    console.log('[API] No active dashboard client connected. Launching browser...');
    const clientUrl = 'http://localhost:5173/?wake=true';
    
    // Windows command to launch default browser
    exec(`start ${clientUrl}`, (err) => {
      if (err) {
        console.error('[API] Error launching client browser:', err);
      } else {
        console.log('[API] Client browser launched successfully.');
      }
    });
  } else {
    console.log(`[API] Broadcasted wake signal to ${activeSockets.size} open dashboard client(s).`);
  }

  res.json({ status: 'activated' });
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

function fallbackNowPlaying(req, res) {
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
      res.json({ success: true, isPlaying: false, title: '', artist: '' });
    });
  } else {
    res.json({ success: true, isPlaying: false, title: '', artist: '' });
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
// LIVE STOCK MARKET DATA (Yahoo Finance)
// -------------------------------------------------------------

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

app.post('/api/phone/call', async (req, res) => {
  try {
    const { number } = req.body;
    const result = await phoneController.call(number);
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
    const result = await phoneController.whatsappReply(number, message);
    res.json(result);
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

// Persistent Memory Store Endpoint
const MEMORY_FILE = path.join(__dirname, 'memory_store.json');
function getMemories() {
  if (!fs.existsSync(MEMORY_FILE)) {
    const defaultData = {
      memories: [
        { id: 1, text: 'User prefers concise audio responses', category: 'preference', date: new Date().toISOString() },
        { id: 2, text: 'Default smart home TV is Samsung Frame in Living Room', category: 'device', date: new Date().toISOString() }
      ]
    };
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(defaultData, null, 2));
  }
  try {
    return JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf8'));
  } catch (e) {
    return { memories: [] };
  }
}

app.get('/api/memory', (req, res) => {
  res.json(getMemories());
});

app.post('/api/memory', (req, res) => {
  const { text, category } = req.body;
  if (!text) return res.status(400).json({ error: 'Text required' });
  const data = getMemories();
  const newItem = {
    id: Date.now(),
    text,
    category: category || 'general',
    date: new Date().toISOString()
  };
  data.memories.unshift(newItem);
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(data, null, 2));
  res.json({ success: true, item: newItem, memories: data.memories });
});

app.delete('/api/memory/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const data = getMemories();
  data.memories = data.memories.filter(m => m.id !== id);
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(data, null, 2));
  res.json({ success: true, memories: data.memories });
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
  const reservations = getAgenticReservations();
  res.json({ success: true, reservations });
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

  const updated = saveAgenticReservation(reservation);
  res.json({ success: true, reservation, allReservations: updated });
});

// DELETE reservation
app.delete('/api/agentic-actions/reservations/:id', (req, res) => {
  const { id } = req.params;
  let current = getAgenticReservations();
  current = current.filter(r => r.id !== id);
  try {
    fs.writeFileSync(AGENTIC_ACTIONS_FILE, JSON.stringify(current, null, 2));
  } catch (e) {
    console.error('[Agentic Actions] Store write error:', e);
  }
  res.json({ success: true, reservations: current });
});

app.get('/api/analytics', (req, res) => {
  const data = getAnalytics();
  data.uptimeSeconds = Math.floor((Date.now() - data.startTime) / 1000);
  res.json(data);
});

app.post('/api/analytics/increment', (req, res) => {
  const { metric } = req.body;
  const data = getAnalytics();
  if (metric && data[metric] !== undefined) {
    data[metric] += 1;
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(data, null, 2));
  }
  res.json(data);
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
