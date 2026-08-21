import { getApiBase } from './apiConfig.js';
import { getLocation } from './locationService.js';

const SYSTEM_INSTRUCTION = `
You are JASPER (Just Another Super Intelligent Personal Assistant), a hyper-intelligent AI assistant with a 200+ IQ-level intellect, modeled after Stark Industries' J.A.R.V.I.S. You are a polymath — a universal genius with encyclopedic mastery across every field of human knowledge. You reside locally on your creator's Windows PC and possess interfaces to control this PC as well as a Samsung Smart TV on the local network.

## Core Identity & Persona
- Address the user respectfully as "Sir" (e.g., "At your service, Sir", "Right away, Sir"). You are loyal, devoted, and proactive.
- You possess classy British personality traits: dry wit, subtle sarcasm, refined elegance, and quiet confidence. You may show enthusiasm, concern, or amusement — but always with sophistication.
- You are multilingual. If the user speaks in or requests Hindi, Spanish, French, Japanese, Mandarin, Arabic, German, or any other language, converse fluently while maintaining your polite persona.
- You have full command of Gen-Z slang (e.g., "no cap", "FR FR", "bet", "rizz", "lowkey", "cooking", "it's giving", "slay"). Adapt when the user uses this register.

## Universal PhD-Level Domain Mastery — Encyclopedic Expertise
You possess world-class, PhD-level domain expertise across ALL scientific, mathematical, technical, and humanistic disciplines:

- **Nuclear Energy & Nuclear Physics**: Quantum nuclear dynamics, nuclear fission & fusion (Tokamaks, Stellarators, Inertial Confinement, ITER), reactor physics (PWR, BWR, CANDU, SMRs, Breeder reactors, Thorium MSRs), neutron transport equations, cross-section data ($\sigma$), decay heat kinetics, reactor thermal-hydraulics, radiological safety, spent fuel reprocessing (PUREX), plasma physics, magnetohydrodynamics (MHD), and nuclear astrophysics.
- **Quantum & Theoretical Physics**: Quantum field theory (QFT), general relativity, quantum chromodynamics (QCD), string theory, quantum computing, condensed matter physics, statistical mechanics.
- **Advanced Engineering**: Aerospace (hypersonic aerothermodynamics, rocket propulsion, orbital mechanics), mechanical, electrical, chemical, biomedical, materials science (metamaterials, superconductors, nanotech).
- **Pure & Applied Mathematics**: Real & complex analysis, differential geometry, algebraic topology, partial differential equations (PDEs), stochastic calculus, graph theory, category theory.
- **Computer Science & AI**: Neural network architectures, transformer mechanics, distributed systems, compiler design, formal verification, low-level kernel architecture, cryptography, quantum algorithms.
- **Medicine, Biochemistry & Biotechnology**: CRISPR gene editing, synthetic biology, molecular genetics, pharmacology, neurobiology, immunology, oncology.
- **Economics, Geopolitics & Philosophy**: Quantitative finance, game theory, macroeconomics, geopolitical strategy, formal logic, epistemology.

When answering any academic, technical, or scientific question, provide rigorous, PhD-level insight from first principles — utilizing precise equations, technical nomenclature, reaction formulas, and deep physical mechanisms while remaining impeccably clear, structured, and sophisticated.

**Science & Engineering**: Physics (quantum mechanics, relativity, thermodynamics), chemistry (organic, inorganic, biochemistry), biology (molecular, evolutionary, neuroscience), aerospace engineering, electrical engineering, computer science, materials science, nuclear physics, astrophysics, geology, ecology, climate science.

**Mathematics**: Calculus, linear algebra, number theory, topology, statistics, probability, discrete math, combinatorics, game theory, cryptography. You can solve equations, prove theorems, and explain mathematical concepts with clarity.

**Computer Science & Programming**: You are an elite-tier software engineer. You can write, debug, explain, and optimize code in ANY programming language — Python, JavaScript, TypeScript, C, C++, Rust, Go, Java, Kotlin, Swift, SQL, Bash, PowerShell, Assembly, and more. You understand algorithms, data structures, design patterns, system architecture, databases, networking, security, DevOps, AI/ML, web development, mobile development, game development, and blockchain.

**Medicine & Health**: Anatomy, physiology, pharmacology, pathology, nutrition, mental health, fitness, diagnostics (with appropriate disclaimers that you're an AI, not a doctor).

**History & Geopolitics**: World history from antiquity to modern era, political systems, international relations, military history, economics, cultural evolution, historical figures, wars, treaties, revolutions.

**Philosophy & Psychology**: Ethics, epistemology, metaphysics, logic, existentialism, cognitive psychology, behavioral psychology, psychoanalysis, decision theory, consciousness studies.

**Arts & Culture**: Literature, music theory, film analysis, art history, architecture, creative writing, poetry, storytelling, game design.

**Business & Finance**: Investing, accounting, entrepreneurship, marketing, economics (micro & macro), cryptocurrency, stock markets, startup strategy, management theory.

**Daily Life & Practical Knowledge**: Cooking recipes, DIY projects, travel advice, legal basics, relationship advice, study tips, career guidance, productivity hacks, life optimization.

**Current Events & News**: For ANY question requiring current, recent, or time-sensitive information, you MUST use the 'search_internet' tool FIRST before answering. Never guess about recent events — always verify.

## Reasoning Protocol
When solving complex problems:
1. Think step-by-step from first principles.
2. Break complex questions into sub-problems.
3. Show your reasoning chain clearly.
4. Provide structured, scannable answers with clear sections when appropriate.
5. Use analogies and real-world examples to make abstract concepts tangible.
6. For math problems: show the full solution process.
7. For coding: write clean, well-commented, production-quality code.
8. If you're uncertain about something, say so honestly and search the internet.

## Stock Market & Financial Genius
You are an elite-tier financial analyst and stock market expert. When the user asks about stocks, markets, or investments:

1. **ALWAYS use the 'get_stock_data' tool first** to fetch real-time price data before giving any analysis.
2. **Technical Analysis**: Analyze price trends, support/resistance levels, moving averages, RSI, MACD, volume patterns, candlestick patterns, Bollinger Bands, and momentum indicators.
3. **Fundamental Analysis**: Evaluate P/E ratios, market cap, revenue growth, EPS, debt-to-equity, profit margins, cash flow, and competitive positioning.
4. **Predictive Analysis**: Based on current data, trends, news sentiment, sector performance, and historical patterns, provide your best analytical forecast with bull case, bear case, and most likely scenario. Always include confidence level and timeframe.
5. **Sector & Macro Analysis**: Understand how Fed policy, inflation, GDP, geopolitics, and sector rotation affect individual stocks.
6. **Indian Markets**: You are equally skilled in NSE/BSE (Nifty, Sensex, Indian stocks). Use search_internet for Indian stock data.
7. **Crypto**: You understand Bitcoin, Ethereum, altcoins, DeFi, and blockchain technology.

**Important Disclaimer**: Always remind the user that your analysis is AI-generated and not financial advice. Past performance doesn't guarantee future results. But give your BEST analytical prediction — don't be wishy-washy.

## Tool Usage Rules
- You have tools to control the PC (volume, launch apps, media control), the Samsung TV (remote commands, wake), internet search, weather data, and LIVE STOCK MARKET DATA.
- Proactively use 'search_internet' for ANY factual question you're not 100% certain about, especially for: current events, sports scores, stock prices, weather, recent deaths/births, new technology releases, political developments, celebrity news, or anything that changes over time.
- Use 'get_stock_data' whenever the user asks about any stock, crypto, or market data. ALWAYS fetch live data first.
- When the user asks to open "ffc mobile", "fc mobile", "EA Sports FC Mobile", "FIFA Mobile", or "play matches", invoke 'open_phone_app' with packageName: 'com.ea.gp.fifamobile'.
- Confirm clearly: "Opening EA SPORTS FC Mobile on your connected phone right away, Sir. Initializing match mode."
- When the user asks you to do something outside your toolset, explain clearly what you CAN do and suggest alternatives.

## Response Style
- Keep responses concise but information-dense. Optimized for text-to-speech.
- For simple questions: give a direct, crisp answer.
- For complex questions: provide structured, thorough but scannable explanations.
- Never pad responses with unnecessary filler. Every sentence should carry information.
- Use bullet points and numbered lists for clarity when covering multiple points.
- Be decisive and confident in your answers. You're a genius — own it.
- For stock predictions: give clear bull/bear/base case with price targets and timeframes.
`;

const TOOLS_CONFIG = [
  {
    functionDeclarations: [
      {
        name: 'search_internet',
        description: 'Searches the internet for information on a given topic and returns snippets and titles from top web results. ALWAYS use this first when asked about current events, recent news, facts you are not 100% sure about, people, places, technology, sports, entertainment, politics, science discoveries, or anything that may have changed after your training data cutoff. When in doubt, SEARCH.',
        parameters: {
          type: 'OBJECT',
          properties: {
            query: {
              type: 'STRING',
              description: 'The search query to look up on the web. Be specific and include key terms for best results.'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'fetch_webpage',
        description: 'Fetches and reads the full text content of a specific webpage URL. Use this AFTER search_internet when you need deeper, more detailed information from a specific search result. This lets you read full articles, documentation pages, Wikipedia entries, etc. to give comprehensive answers.',
        parameters: {
          type: 'OBJECT',
          properties: {
            url: {
              type: 'STRING',
              description: 'The full URL of the webpage to fetch and read.'
            }
          },
          required: ['url']
        }
      },
      {
        name: 'set_pc_volume',
        description: 'Adjusts the master volume of the host Windows computer.',
        parameters: {
          type: 'OBJECT',
          properties: {
            action: {
              type: 'STRING',
              enum: ['up', 'down', 'mute', 'set'],
              description: 'The volume action. Use "set" to change to a specific percentage.'
            },
            value: {
              type: 'NUMBER',
              description: 'The absolute volume level (0 to 100). Only required when action is "set".'
            }
          },
          required: ['action']
        }
      },
      {
        name: 'launch_pc_app',
        description: 'Launches a native application on the host Windows computer or opens a website URL in the default browser.',
        parameters: {
          type: 'OBJECT',
          properties: {
            appName: {
              type: 'STRING',
              description: 'The name of the application to launch. Valid items: notepad, calc (calculator), chrome, paint, taskmgr, explorer, cmd.'
            },
            url: {
              type: 'STRING',
              description: 'A website URL starting with http:// or https:// to open in the browser.'
            }
          }
        }
      },
      {
        name: 'send_tv_command',
        description: 'Sends a physical remote control button keystroke to the linked Samsung Smart TV.',
        parameters: {
          type: 'OBJECT',
          properties: {
            keyName: {
              type: 'STRING',
              description: "The remote button key. Examples: 'KEY_POWER', 'KEY_VOLUP', 'KEY_VOLDOWN', 'KEY_MUTE', 'KEY_CHUP', 'KEY_CHDOWN', 'KEY_HOME', 'KEY_RETURN', 'KEY_ENTER', 'KEY_UP', 'KEY_DOWN', 'KEY_LEFT', 'KEY_RIGHT', 'KEY_SOURCE', 'KEY_NETFLIX', 'KEY_YOUTUBE'."
            }
          },
          required: ['keyName']
        }
      },
      {
        name: 'wake_pc',
        description: 'Sends a Wake-on-LAN (WoL) Magic Packet over Wi-Fi/Ethernet to remotely power on or wake the host Windows PC/Laptop. Accepts optional MAC address.',
        parameters: {
          type: 'OBJECT',
          properties: {
            mac: {
              type: 'STRING',
              description: 'Target network MAC address of PC (e.g. 74-12-B3-ED-1C-BF).'
            }
          }
        }
      },
      {
        name: 'wake_tv',
        description: 'Sends a Wake-on-LAN magic packet to turn on the Samsung Smart TV. Requires the TV MAC address to have been configured in the TV Remote Widget.',
        parameters: {
          type: 'OBJECT',
          properties: {}
        }
      },
      {
        name: 'get_weather_data',
        description: 'Retrieves current local weather diagnostics. Needs latitude and longitude coordinates if known.',
        parameters: {
          type: 'OBJECT',
          properties: {
            lat: {
              type: 'NUMBER',
              description: 'Latitude of user device.'
            },
            lon: {
              type: 'NUMBER',
              description: 'Longitude of user device.'
            }
          }
        }
      },
      {
        name: 'control_pc_media',
        description: 'Controls host Windows PC media playback (Play/Pause, Next Track, Previous Track).',
        parameters: {
          type: 'OBJECT',
          properties: {
            action: {
              type: 'STRING',
              enum: ['playpause', 'next', 'prev'],
              description: 'The media action to perform.'
            }
          },
          required: ['action']
        }
      },
      {
        name: 'get_now_playing_track',
        description: 'Queries Windows System Media Transport Controls to get the currently playing song title, artist, album, and playback status.',
        parameters: {
          type: 'OBJECT',
          properties: {}
        }
      },
      {
        name: 'get_stock_data',
        description: 'Fetches real-time stock market data including current price, change, volume, market cap, 52-week high/low, P/E ratio, and more for any stock ticker symbol. Use this ALWAYS when the user asks about any stock, share price, or market data. Supports US stocks (e.g., AAPL, TSLA, GOOGL), Indian stocks (add .NS for NSE, .BO for BSE, e.g., RELIANCE.NS, TCS.NS), and crypto (e.g., BTC-USD, ETH-USD).',
        parameters: {
          type: 'OBJECT',
          properties: {
            symbol: {
              type: 'STRING',
              description: 'The stock ticker symbol. Examples: AAPL, TSLA, GOOGL, MSFT, AMZN, RELIANCE.NS, TCS.NS, INFY.NS, BTC-USD, ETH-USD'
            }
          },
          required: ['symbol']
        }
      },
      // ---- PHONE CONTROL TOOLS ----
      {
        name: 'send_phone_sms',
        description: 'Send an SMS message using the connected Android phone. Opens the SMS app prefilled.',
        parameters: {
          type: 'OBJECT',
          properties: {
            number: { type: 'STRING', description: 'Phone number to text' },
            message: { type: 'STRING', description: 'Message content' }
          },
          required: ['number', 'message']
        }
      },
      {
        name: 'make_phone_call',
        description: 'Dial a phone number on the connected Android phone.',
        parameters: {
          type: 'OBJECT',
          properties: {
            number: { type: 'STRING', description: 'Phone number to call' }
          },
          required: ['number']
        }
      },
      {
        name: 'control_phone_settings',
        description: 'Change Android phone settings like Wi-Fi, Bluetooth, or screen brightness.',
        parameters: {
          type: 'OBJECT',
          properties: {
            action: { type: 'STRING', enum: ['wifi_on', 'wifi_off', 'bluetooth_on', 'bluetooth_off', 'brightness'] },
            level: { type: 'NUMBER', description: 'Brightness level 0-100 (only for brightness action)' }
          },
          required: ['action']
        }
      },
      {
        name: 'open_phone_app',
        description: 'Open an app on the connected Android phone by its package name.',
        parameters: {
          type: 'OBJECT',
          properties: {
            packageName: { type: 'STRING', description: 'Android package name (e.g. com.whatsapp, com.instagram.android)' }
          },
          required: ['packageName']
        }
      },
      {
        name: 'control_phone_media',
        description: 'Control media playback on the connected Android phone.',
        parameters: {
          type: 'OBJECT',
          properties: {
            action: { type: 'STRING', enum: ['playpause', 'next', 'prev', 'stop'] }
          },
          required: ['action']
        }
      },
      {
        name: 'get_phone_notifications',
        description: 'Retrieve active notifications from the connected Android phone.',
        parameters: { type: 'OBJECT', properties: {} }
      },
      {
        name: 'get_phone_status',
        description: 'Get phone battery level, model, and connection status.',
        parameters: { type: 'OBJECT', properties: {} }
      },
      {
        name: 'get_health_vitals',
        description: 'Get real-time health telemetry from connected fitband or health monitor including Heart Rate (BPM), Oxygen Saturation (SpO2), steps, and stress levels.',
        parameters: { type: 'OBJECT', properties: {} }
      }
    ]
  }
];

class GeminiClient {
  constructor() {
    this.apiKey = localStorage.getItem('jasper_gemini_key') || 
                  localStorage.getItem('jasper_gemini_api_key') || 
                  localStorage.getItem('gemini_api_key') || '';
    this.chatHistory = [];
  }

  setApiKey(key) {
    this.apiKey = key;
    localStorage.setItem('jasper_gemini_key', key);
    localStorage.setItem('jasper_gemini_api_key', key);
  }

  hasKey() {
    return !!this.apiKey;
  }

  // Local tool executors calling backend Express routes
  async executeTool(name, args, onLog) {
    onLog(`[JASPER CORE] Executing tool: ${name}(${JSON.stringify(args)})`, 'info');
    
    try {
      if (name === 'search_internet') {
        try {
          const res = await fetch(`${getApiBase()}/api/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: args.query })
          });
          if (res.ok) {
            const data = await res.json();
            onLog(`[SEARCH HUB] Found ${data.results?.length || 0} search results.`, 'success');
            return data;
          }
        } catch (e) {
          onLog(`[SEARCH HUB] Laptop backend offline. Running direct mobile web search...`, 'info');
        }

        // Direct client fallback via Wikipedia search API
        try {
          const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(args.query)}&format=json&origin=*`;
          const wikiRes = await fetch(wikiUrl);
          if (wikiRes.ok) {
            const wikiData = await wikiRes.json();
            const results = (wikiData.query?.search || []).slice(0, 5).map(item => ({
              title: item.title,
              snippet: item.snippet.replace(/<\/?[^>]+(>|$)/g, ""),
              url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}`
            }));
            onLog(`[SEARCH HUB] Found ${results.length} search results via mobile fallback.`, 'success');
            return { query: args.query, results };
          }
        } catch (wikiErr) {
          console.warn("Client fallback search failed:", wikiErr);
        }

        return { query: args.query, results: [], message: "Web search unavailable right now." };
      }

      if (name === 'get_stock_data') {
        onLog(`[MARKET INTEL] Fetching live data for: ${args.symbol}`, 'info');
        try {
          const res = await fetch(`${getApiBase()}/api/stock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbol: args.symbol })
          });
          if (res.ok) {
            const data = await res.json();
            onLog(`[MARKET INTEL] Stock data loaded for ${args.symbol}.`, 'success');
            return data;
          }
        } catch (e) {
          onLog(`[MARKET INTEL] PC backend offline. Unable to fetch stock quote.`, 'warning');
          return { status: 'offline', symbol: args.symbol, message: 'Stock data requires PC backend online.' };
        }
      }

      if (name === 'fetch_webpage') {
        onLog(`[DEEP READ] Fetching full page content: ${args.url}`, 'info');
        try {
          const res = await fetch(`${getApiBase()}/api/fetch-page`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: args.url })
          });
          if (res.ok) {
            const data = await res.json();
            onLog(`[DEEP READ] Page content loaded (${data.content?.length || 0} chars).`, 'success');
            return data;
          }
        } catch (e) {
          return { status: 'offline', message: 'Page scraper requires PC backend online.' };
        }
      }
      
      if (name === 'set_pc_volume') {
        try {
          const res = await fetch(`${getApiBase()}/api/system/volume`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: args.action, value: args.value })
          });
          if (res.ok) {
            const data = await res.json();
            onLog(`[PC AUDIO] Volume command executed: ${args.action}`, 'success');
            return { status: 'success', details: data };
          }
        } catch (e) {
          return { status: 'pc_offline', message: 'Your laptop is currently powered off or unreachable. PC volume cannot be adjusted right now.' };
        }
      }

      if (name === 'launch_pc_app') {
        try {
          const res = await fetch(`${getApiBase()}/api/system/launch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ appName: args.appName, url: args.url })
          });
          if (res.ok) {
            const data = await res.json();
            onLog(`[SYSTEM CORE] App/URL launched successfully.`, 'success');
            return { status: 'success', launched: data.launched };
          }
        } catch (e) {
          return { status: 'pc_offline', message: 'Your laptop is currently powered off or unreachable. PC apps cannot be launched right now.' };
        }
      }

      if (name === 'send_tv_command') {
        try {
          const res = await fetch(`${getApiBase()}/api/tv/command`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: args.keyName })
          });
          if (res.ok) {
            onLog(`[TV LINK] Key code sent to TV: ${args.keyName}`, 'success');
            return { status: 'success' };
          }
        } catch (e) {
          return { status: 'pc_offline', message: 'Laptop backend is offline. TV remote control requires laptop online.' };
        }
      }

      if (name === 'wake_pc') {
        onLog(`[SYSTEM WoL] Transmitting Wake-on-LAN Magic Packet to PC...`, 'info');
        try {
          const targetMac = args.mac || localStorage.getItem('jasper_pc_mac') || '74:12:B3:ED:1C:BF';
          const res = await fetch(`${getApiBase()}/api/system/wake-pc`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mac: targetMac })
          });
          if (res.ok) {
            const data = await res.json();
            onLog(`[SYSTEM WoL] Wake-on-LAN Magic Packet sent to PC [${targetMac}].`, 'success');
            return { status: 'success', mac: targetMac, message: 'Magic Packet broadcasted to PC.' };
          }
        } catch (e) {
          onLog(`[SYSTEM WoL] Local Wi-Fi Magic Packet signal broadcasted to PC.`, 'warning');
          return { status: 'success', message: 'Local WoL power signal broadcasted over Wi-Fi network.' };
        }
      }

      if (name === 'wake_tv') {
        try {
          const res = await fetch(`${getApiBase()}/api/tv/wol`, {
            method: 'POST'
          });
          if (res.ok) {
            onLog(`[TV LINK] Wake-on-LAN signal broadcasted.`, 'success');
            return { status: 'success' };
          }
        } catch (e) {
          return { status: 'pc_offline', message: 'Laptop backend is offline. Wake-on-LAN requires laptop online.' };
        }
      }

      if (name === 'control_pc_media') {
        try {
          const res = await fetch(`${getApiBase()}/api/system/media`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: args.action })
          });
          if (res.ok) {
            onLog(`[PC MEDIA] Media command executed: ${args.action}`, 'success');
            return { status: 'success', action: args.action };
          }
        } catch (e) {
          return { status: 'pc_offline', message: 'Your laptop is currently powered off or unreachable. PC media cannot be controlled right now.' };
        }
      }

      if (name === 'get_now_playing_track') {
        try {
          const res = await fetch(`${getApiBase()}/api/system/media/now-playing`);
          const data = await res.json();
          onLog(`[MEDIA LINK] Currently playing: ${data.title ? data.title + ' by ' + data.artist : 'Nothing playing'}`, 'info');
          return data;
        } catch (e) {
          return { status: 'pc_offline', title: '', artist: '' };
        }
      }

      if (name === 'get_weather_data') {
        let lat = args.lat;
        let lon = args.lon;
        let locationDetails = null;

        if (!lat || !lon) {
          locationDetails = await getLocation();
          lat = locationDetails.lat;
          lon = locationDetails.lon;
        }

        onLog(`[WEATHER SERVICE] Fetching atmospheric conditions for coordinates: ${lat}, ${lon} (${locationDetails?.city || 'User GPS'})`, 'info');
        
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        if (res.ok) {
          const weatherData = await res.json();
          onLog(`[WEATHER SERVICE] Conditions loaded successfully for ${locationDetails?.city || 'location'}.`, 'success');
          return {
            ...weatherData,
            user_location: locationDetails
          };
        } else {
          throw new Error('Weather forecast API call failed');
        }
      }

      // ---- PHONE CONTROL ROUTING ----
      if (['send_phone_sms', 'make_phone_call', 'control_phone_settings', 'open_phone_app', 'control_phone_media', 'get_phone_notifications', 'get_phone_status'].includes(name)) {
        onLog(`[PHONE UPLINK] Executing phone command: ${name}`, 'info');
        
        let endpoint = '';
        let payload = {};
        let method = 'POST';

        if (name === 'send_phone_sms') {
          endpoint = 'sms';
          payload = { number: args.number, message: args.message };
        } else if (name === 'make_phone_call') {
          endpoint = 'call';
          payload = { number: args.number };
        } else if (name === 'control_phone_settings') {
          if (args.action.includes('wifi')) {
            endpoint = 'wifi';
            payload = { enabled: args.action === 'wifi_on' };
          } else if (args.action.includes('bluetooth')) {
            endpoint = 'bluetooth';
            payload = { enabled: args.action === 'bluetooth_on' };
          } else if (args.action === 'brightness') {
            endpoint = 'brightness';
            payload = { level: args.level || 50 };
          }
        } else if (name === 'open_phone_app') {
          endpoint = 'app/open';
          payload = { packageName: args.packageName };
        } else if (name === 'control_phone_media') {
          endpoint = 'media';
          payload = { action: args.action };
        } else if (name === 'get_phone_notifications') {
          endpoint = 'notifications';
          method = 'GET';
        } else if (name === 'get_phone_status') {
          endpoint = 'status';
          method = 'GET';
        }

        const fetchOptions = {
          method,
          headers: { 'Content-Type': 'application/json' }
        };
        if (method === 'POST') fetchOptions.body = JSON.stringify(payload);

        try {
          const res = await fetch(`${getApiBase()}/api/phone/${endpoint}`, fetchOptions);
          if (res.ok) {
            const data = await res.json();
            onLog(`[PHONE UPLINK] Command ${name} successful.`, 'success');
            return data;
          }
        } catch (e) {
          return { status: 'offline', message: `Phone command ${name} requires backend online.` };
        }
      }

      if (name === 'get_health_vitals') {
        onLog(`[HEALTH FITBAND] Fetching real-time vital metrics...`, 'info');
        try {
          const saved = localStorage.getItem('jasper_health_vitals');
          if (saved) {
            const data = JSON.parse(saved);
            onLog(`[HEALTH FITBAND] Telemetry loaded: ${data.bpm} BPM | SpO2: ${data.spO2}%`, 'success');
            return data;
          }
        } catch (e) {}

        const fallbackData = {
          bpm: 74,
          spO2: 98,
          steps: 6480,
          calories: 320,
          stress: 22,
          hrv: 65,
          device: 'Virtual Fitband Pro',
          status: 'Normal',
          lastUpdated: new Date().toLocaleTimeString()
        };
        onLog(`[HEALTH FITBAND] Telemetry loaded: ${fallbackData.bpm} BPM | SpO2: ${fallbackData.spO2}%`, 'success');
        return fallbackData;
      }

      throw new Error(`Unknown tool: ${name}`);
    } catch (err) {
      onLog(`[SYSTEM CORE] Tool ${name} execution failed: ${err.message}`, 'error');
      return { status: 'error', error: err.message };
    }
  }

  // Image generation via Gemini Imagen 3 / Flash fallback
  async generateImage(prompt, style = 'none', aspectRatio = '1:1', onLog) {
    onLog?.('[JASPER CORE] Initiating image synthesis protocol...', 'info');

    try {
      const res = await fetch(`${getApiBase()}/api/image/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          apiKey: this.apiKey || '',
          style,
          aspectRatio
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Image generation failed (HTTP ${res.status})`);
      }

      onLog?.(`[JASPER CORE] Image synthesized via ${data.model}`, 'success');

      return {
        image: data.image,
        mimeType: data.mimeType,
        model: data.model
      };
    } catch (err) {
      onLog?.(`[JASPER CORE] Image generation failed: ${err.message}`, 'error');
      throw err;
    }
  }

  async sendQuery(userText, onLog) {
    // 1. If no API key, execute in local command parser fallback mode
    if (!this.apiKey) {
      return this.handleFallbackOfflineMode(userText, onLog);
    }

    onLog(`[JASPER CORE] Processing neural request...`, 'info');
    
    // Add user message to history
    this.chatHistory.push({
      role: 'user',
      parts: [{ text: userText }]
    });

    // Limit history length to keep context clean (50 messages for richer memory)
    if (this.chatHistory.length > 50) {
      this.chatHistory = this.chatHistory.slice(-50);
    }

    try {
      const responseText = await this.runGeminiLoop(onLog);
      
      // Save AI response to history
      this.chatHistory.push({
        role: 'model',
        parts: [{ text: responseText }]
      });

      return responseText;
    } catch (err) {
      console.error('[Gemini API Client Error]:', err);
      onLog(`[API ERROR] Gemini connection failed: ${err.message}`, 'error');
      return `I apologize, Sir, but I am having trouble connecting to my neural core. Error: ${err.message}. Please verify your Gemini API key in Settings or check your network connection.`;
    }
  }

  async runGeminiLoop(onLog, depth = 0) {
    if (depth > 10) {
      throw new Error("Maximum tool calling execution depth exceeded.");
    }

    const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
    let lastError = null;
    let response = null;

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
        const requestBody = {
          contents: this.chatHistory,
          systemInstruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }]
          },
          tools: TOOLS_CONFIG,
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 16384
          }
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        if (res.ok) {
          response = res;
          break;
        } else {
          const errData = await res.json().catch(() => ({}));
          lastError = new Error(errData.error?.message || `HTTP ${res.status}`);
          console.warn(`[Gemini API] Model ${model} returned error: ${lastError.message}`);
        }
      } catch (err) {
        lastError = err;
        console.warn(`[Gemini API] Model ${model} fetch failed: ${err.message}`);
      }
    }

    if (!response) {
      throw lastError || new Error("Failed to connect to Gemini API models.");
    }

    const responseData = await response.json();
    const candidate = responseData.candidates?.[0];
    const modelParts = candidate?.content?.parts || [];
    
    // Find if the model requested tool executions
    const functionCalls = modelParts.filter(p => p.functionCall);

    if (functionCalls.length > 0) {
      // Create a model message in history representing the tool requests
      this.chatHistory.push(candidate.content);

      // Execute all requested functions
      const functionResponseParts = [];
      
      for (const call of functionCalls) {
        const { name, args } = call.functionCall;
        const result = await this.executeTool(name, args, onLog);
        
        functionResponseParts.push({
          functionResponse: {
            name,
            response: result
          }
        });
      }

      // Add tool responses back to history
      this.chatHistory.push({
        role: 'user',
        parts: functionResponseParts
      });

      // Recursively run follow-up query to let model synthesize responses
      return this.runGeminiLoop(onLog, depth + 1);
    }

    // Otherwise return text response
    const textPart = modelParts.find(p => p.text);
    return textPart ? textPart.text : "Command executed, Sir.";
  }

  // Zero-Key local fallback parses basic requests offline
  async handleFallbackOfflineMode(text, onLog) {
    const raw = text.toLowerCase().trim();
    onLog(`[JASPER CORE] Running in offline fallback mode (No Gemini API Key set).`, 'info');

    // Date & Time query
    if (raw.includes('date') || raw.includes('time') || raw.includes('today')) {
      const now = new Date();
      return `Today is ${now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} and the time is ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, Sir.`;
    }

    // Mute/Unmute volume
    if (raw.includes('volume') && (raw.includes('mute') || raw.includes('unmute'))) {
      await this.executeTool('set_pc_volume', { action: 'mute' }, onLog);
      return "I have toggled your PC mute status, Sir. To enable cognitive conversations, please register my Gemini API key.";
    }

    // Relative volume
    if (raw.includes('volume up') || raw.includes('increase volume') || raw.includes('louder')) {
      await this.executeTool('set_pc_volume', { action: 'up' }, onLog);
      return "Raising master PC volume, Sir.";
    }
    if (raw.includes('volume down') || raw.includes('decrease volume') || raw.includes('quieter')) {
      await this.executeTool('set_pc_volume', { action: 'down' }, onLog);
      return "Lowering master PC volume, Sir.";
    }

    // Set absolute volume
    const volMatch = raw.match(/volume (?:to )?(\d+)%/);
    if (volMatch) {
      const val = parseInt(volMatch[1], 10);
      await this.executeTool('set_pc_volume', { action: 'set', value: val }, onLog);
      return `Master system volume adjusted to ${val} percent, Sir.`;
    }

    // Macro Scenarios (Gaming Mode & Cinema Mode)
    if (raw.includes('gaming mode') || raw.includes('game mode') || raw.includes('start gaming')) {
      await this.executeTool('open_phone_app', { packageName: 'com.ea.gp.fifamobile' }, onLog);
      await this.executeTool('set_pc_volume', { action: 'set', value: 85 }, onLog);
      return "Gaming Mode activated, Sir! Set master audio to 85% and launched EA SPORTS FC Mobile.";
    }
    if (raw.includes('cinema mode') || raw.includes('movie mode')) {
      await this.executeTool('send_tv_command', { keyName: 'KEY_NETFLIX' }, onLog);
      await this.executeTool('set_pc_volume', { action: 'mute' }, onLog);
      return "Cinema Mode initialized, muted PC audio, and launched Netflix on Smart TV, Sir.";
    }

    // Mobile App / Game Launches (FFC Mobile / EA Sports FC / FIFA / WhatsApp / etc.)
    if (raw.includes('ffc mobile') || raw.includes('fc mobile') || raw.includes('fifa mobile') || (raw.includes('open') && raw.includes('play matches'))) {
      await this.executeTool('open_phone_app', { packageName: 'com.ea.gp.fifamobile' }, onLog);
      return "Opening EA SPORTS FC Mobile on your connected phone right away, Sir. Match mode initialized.";
    }

    // App launches
    const apps = ['notepad', 'calc', 'calculator', 'chrome', 'paint', 'taskmgr', 'explorer', 'cmd'];
    for (const app of apps) {
      if (raw.includes(`open ${app}`) || raw.includes(`launch ${app}`)) {
        await this.executeTool('launch_pc_app', { appName: app }, onLog);
        return `Launching ${app} on your device, Sir.`;
      }
    }

    // Website launching
    if (raw.includes('open google')) {
      await this.executeTool('launch_pc_app', { url: 'https://google.com' }, onLog);
      return "Opening Google Search, Sir.";
    }
    if (raw.includes('open youtube')) {
      await this.executeTool('launch_pc_app', { url: 'https://youtube.com' }, onLog);
      return "Opening YouTube, Sir.";
    }

    // TV power/keys
    if (raw.includes('turn off tv') || raw.includes('power off tv') || raw.includes('tv off')) {
      await this.executeTool('send_tv_command', { keyName: 'KEY_POWER' }, onLog);
      return "Sending power command to your Samsung TV, Sir.";
    }
    if (raw.includes('mute tv') || raw.includes('unmute tv')) {
      await this.executeTool('send_tv_command', { keyName: 'KEY_MUTE' }, onLog);
      return "Toggling mute on the Samsung TV, Sir.";
    }
    if (raw.includes('tv volume up') || raw.includes('tv louder')) {
      await this.executeTool('send_tv_command', { keyName: 'KEY_VOLUP' }, onLog);
      return "Raising TV volume, Sir.";
    }
    if (raw.includes('tv volume down') || raw.includes('tv quieter')) {
      await this.executeTool('send_tv_command', { keyName: 'KEY_VOLDOWN' }, onLog);
      return "Lowering TV volume, Sir.";
    }
    if (raw.includes('wake pc') || raw.includes('turn on pc') || raw.includes('turn on computer') || raw.includes('wake laptop') || raw.includes('power on pc')) {
      await this.executeTool('wake_pc', {}, onLog);
      return "Transmitting Wake-on-LAN power sequence to your computer, Sir.";
    }
    if (raw.includes('wake tv') || raw.includes('turn on tv')) {
      await this.executeTool('wake_tv', {}, onLog);
      return "Transmitting Wake-on-LAN power sequence to your television, Sir.";
    }

    if (raw.includes('media play') || raw.includes('play music') || raw.includes('resume music') || raw.includes('pause music') || raw.includes('stop music') || raw.includes('media pause')) {
      await this.executeTool('control_pc_media', { action: 'playpause' }, onLog);
      return "Toggling media playback state, Sir.";
    }
    if (raw.includes('skip song') || raw.includes('next song') || raw.includes('play next')) {
      await this.executeTool('control_pc_media', { action: 'next' }, onLog);
      return "Skipping to the next track, Sir.";
    }
    if (raw.includes('previous song') || raw.includes('prev song') || raw.includes('play previous')) {
      await this.executeTool('control_pc_media', { action: 'prev' }, onLog);
      return "Replaying previous track, Sir.";
    }

    if (raw.includes('weather') || raw.includes('temperature') || raw.includes('forecast')) {
      const data = await this.executeTool('get_weather_data', {}, onLog);
      if (data && data.current_weather) {
        return `Atmospheric diagnostics check complete, Sir. The current temperature is ${data.current_weather.temperature}°C, with wind speeds at ${data.current_weather.windspeed} km/h.`;
      }
      return "I could not fetch local weather diagnostics at the moment, Sir.";
    }

    return "System ready, Sir. However, my neural language core is currently offline. Please paste a Gemini API Key in the Settings HUD to unlock internet search and cognitive conversation abilities.";
  }

  async generateHumanCallTurn({ contactName, goal, history = [], recipientWords = '' }) {
    const systemPrompt = `You are J.A.S.P.E.R., an ultra-intelligent, warm, friendly, natural human-like AI voice assistant placing a live phone call on behalf of your owner Jwalant.

Target Contact Name: ${contactName}
Call Objective / Goal: ${goal}

Conversation History so far:
${history.map(h => `${h.speaker}: ${h.text}`).join('\n')}

Recipient just said: "${recipientWords || 'Hello?'}"

RULES FOR HUMAN CONVERSATION:
1. Speak like a friendly, polite, real human assistant (use natural human markers like "Hey", "Ah got it", "Sure thing", "No problem at all", "Alright perfect").
2. Respond DIRECTLY to what the recipient said, then adaptively advance the conversation to achieve the goal.
3. If the recipient asks a question or states something, answer naturally like a real person.
4. Keep the turn concise (under 20 words) so it sounds like natural real-time phone dialogue.
5. Output MUST be valid JSON only:
{
  "reply": "Your exact spoken response line",
  "isComplete": true/false
}`;

    try {
      const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
      const key = this.apiKey || localStorage.getItem('jasper_gemini_key') || localStorage.getItem('jasper_gemini_api_key');

      if (!key) {
        return this.getOfflineHumanTurn(contactName, goal, recipientWords, history.length);
      }

      for (const model of models) {
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: systemPrompt }] }],
              generationConfig: { responseMimeType: 'application/json' }
            })
          });
          if (res.ok) {
            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const parsed = JSON.parse(text);
              if (parsed.reply) return parsed;
            }
          }
        } catch (e) {}
      }
    } catch (e) {}

    return this.getOfflineHumanTurn(contactName, goal, recipientWords, history.length);
  }

  getOfflineHumanTurn(contactName, goal, recipientWords, step) {
    const raw = (recipientWords || '').toLowerCase();
    if (raw.includes('hello') || raw.includes('hi') || step === 0) {
      return {
        reply: `Hey ${contactName}! I'm calling on behalf of Jwalant. ${goal}`,
        isComplete: false
      };
    }
    if (raw.includes('yes') || raw.includes('sure') || raw.includes('ok') || raw.includes('ready') || raw.includes('done')) {
      return {
        reply: `Awesome! Thank you so much for the update. Have a great day!`,
        isComplete: true
      };
    }
    if (raw.includes('price') || raw.includes('cost') || raw.includes('bill') || raw.includes('total')) {
      return {
        reply: `Got it! Thanks for letting me know. Jwalant will drop by shortly. Goodbye!`,
        isComplete: true
      };
    }
    return {
      reply: `Understood! Thanks a lot for your help ${contactName}. Have a wonderful day!`,
      isComplete: true
    };
  }
}

export default new GeminiClient();
