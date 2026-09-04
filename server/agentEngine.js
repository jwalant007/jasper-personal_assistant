/**
 * JASPER Agent Engine — Full Structured Tool-Calling System
 *
 * Architecture:
 *   User Command → AI Reasoner → Tool Selection → Permission Layer → Execute → Log → Result
 *
 * Permission Levels:
 *   L0 — Read-only (auto-execute, no confirm)
 *   L1 — Low-risk actions (auto-execute, no confirm)
 *   L2 — External communication (user-configured, optional confirm)
 *   L3 — Sensitive actions (always require explicit confirmation)
 *
 * The AI NEVER executes arbitrary shell commands.
 * Every action goes through the tool registry + permission layer.
 */

const vectorMemory = require('./vectorMemory');
const phoneController = require('./phoneController');
const tvController = require('./tvController');
const dbManager = require('./database');
const permissionLayer = require('./permissionLayer');
const busyModeEngine = require('./busyModeEngine');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const https = require('https');

function getScriptPath(scriptName) {
  if (process.env.JASPER_RESOURCES_PATH) {
    const resPath = path.normalize(path.join(process.env.JASPER_RESOURCES_PATH, 'server', scriptName));
    if (fs.existsSync(resPath)) return resPath;
  }
  return path.normalize(path.join(__dirname, scriptName));
}

// ─── TOOL REGISTRY ─────────────────────────────────────────────────────────────
// Each tool: { name, description, permissionLevel, parameters, handler }

const TOOL_REGISTRY = {

  // ── L0: Read-Only ──────────────────────────────────────────────────────────

  get_system_status: {
    name: 'get_system_status',
    description: 'Get current system status including CPU, memory, uptime, and OS information',
    permissionLevel: 0,
    parameters: {},
    async handler(_args) {
      const cpus = os.cpus();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      return {
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        uptime: Math.round(os.uptime()),
        cpuModel: cpus[0]?.model || 'Unknown',
        cpuCount: cpus.length,
        memoryTotal: Math.round(totalMem / 1024 / 1024) + ' MB',
        memoryFree: Math.round(freeMem / 1024 / 1024) + ' MB',
        memoryUsedPercent: Math.round(((totalMem - freeMem) / totalMem) * 100) + '%'
      };
    }
  },

  get_time: {
    name: 'get_time',
    description: 'Get the current date and time',
    permissionLevel: 0,
    parameters: {},
    async handler(_args) {
      const now = new Date();
      return {
        time: now.toLocaleTimeString(),
        date: now.toLocaleDateString(),
        iso: now.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
    }
  },

  get_network_status: {
    name: 'get_network_status',
    description: 'Get current network interfaces and connectivity status',
    permissionLevel: 0,
    parameters: {},
    async handler(_args) {
      const interfaces = os.networkInterfaces();
      const active = [];
      Object.entries(interfaces).forEach(([name, ifaces]) => {
        (ifaces || []).forEach(iface => {
          if (!iface.internal) {
            active.push({ name, address: iface.address, family: iface.family, mac: iface.mac });
          }
        });
      });
      return { interfaces: active, connected: active.length > 0 };
    }
  },

  search_files: {
    name: 'search_files',
    description: 'Search for files on the system by name or extension',
    permissionLevel: 0,
    parameters: { query: 'string', directory: 'string (optional)', extension: 'string (optional)' },
    async handler({ query, directory, extension }) {
      const searchDir = directory || os.homedir();
      const ext = extension ? (extension.startsWith('.') ? extension : '.' + extension) : '';
      const safeDir = path.normalize(searchDir);
      // Safety: only search user home + common dirs
      const allowedPrefixes = [os.homedir(), 'C:\\Users', '/home', '/Users'];
      const isSafe = allowedPrefixes.some(p => safeDir.startsWith(p));
      if (!isSafe) return { error: 'Search restricted to user directories for security.', results: [] };

      return new Promise((resolve) => {
        const cmd = process.platform === 'win32'
          ? `dir /s /b "${safeDir}\\*${query}*${ext}" 2>nul | findstr /i "${query}" | head -20`
          : `find "${safeDir}" -name "*${query}*${ext}" 2>/dev/null | head -20`;

        exec(cmd, { timeout: 8000, shell: true }, (err, stdout) => {
          const results = (stdout || '').trim().split('\n').filter(l => l.trim()).slice(0, 20);
          resolve({ results, count: results.length, query, searchDir: safeDir });
        });
      });
    }
  },

  read_file: {
    name: 'read_file',
    description: 'Read the contents of a permitted text file',
    permissionLevel: 0,
    parameters: { path: 'string' },
    async handler({ path: filePath }) {
      const normalized = path.normalize(filePath);
      const allowedPrefixes = [os.homedir(), 'C:\\Users', '/home', '/Users'];
      const isSafe = allowedPrefixes.some(p => normalized.startsWith(p));
      if (!isSafe) return { error: 'Read access restricted to user directories.' };
      try {
        const content = fs.readFileSync(normalized, 'utf8');
        return { content: content.substring(0, 5000), truncated: content.length > 5000, path: normalized };
      } catch (e) {
        return { error: e.message };
      }
    }
  },

  search_memory: {
    name: 'search_memory',
    description: 'Search Jasper\'s semantic memory for user preferences and past context',
    permissionLevel: 0,
    parameters: { query: 'string', limit: 'number (optional, default 5)' },
    async handler({ query, limit = 5 }) {
      const results = vectorMemory.searchMemory(query, limit);
      return { memories: results, count: results.length };
    }
  },

  // ── L1: Low-Risk Actions ───────────────────────────────────────────────────

  set_pc_volume: {
    name: 'set_pc_volume',
    description: 'Set, increase, decrease, or mute PC speaker volume',
    permissionLevel: 1,
    parameters: { action: "'set'|'up'|'down'|'mute'", value: 'number 0-100 (for set action)' },
    async handler({ action = 'set', value = 50 }) {
      const scriptPath = getScriptPath('volume.ps1');
      return new Promise((resolve) => {
        const volArg = action === 'set' ? `-Volume ${value}` : (action === 'mute' ? '-Mute' : (action === 'up' ? '-Up' : '-Down'));
        exec(`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}" ${volArg}`, (err, stdout) => {
          resolve({ success: !err, action, value, output: stdout?.trim() });
        });
      });
    }
  },

  open_application: {
    name: 'open_application',
    description: 'Launch a permitted application on the PC',
    permissionLevel: 1,
    parameters: { appName: 'string', url: 'string (optional, for web URLs)' },
    async handler({ appName, url }) {
      const validApps = {
        notepad: 'notepad.exe', calc: 'calc.exe', calculator: 'calc.exe',
        chrome: 'chrome.exe', paint: 'mspaint.exe', taskmgr: 'taskmgr.exe',
        explorer: 'explorer.exe', spotify: 'start spotify:'
      };
      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        exec(`start "" "${url.replace(/&/g, '^&')}"`);
        return { success: true, launched: url };
      }
      if (appName) {
        const target = validApps[appName.toLowerCase()] || (/^[a-zA-Z0-9_\-\.]+$/.test(appName) ? `${appName}.exe` : null);
        if (!target) return { success: false, error: `App '${appName}' not in approved list` };
        exec(`start ${target}`);
        return { success: true, launched: appName };
      }
      return { success: false, error: 'Provide appName or url' };
    }
  },

  create_reminder: {
    name: 'create_reminder',
    description: 'Create a reminder for the user at a specific time',
    permissionLevel: 1,
    parameters: { time: 'string (e.g. "8:00 PM" or "20:00")', message: 'string' },
    async handler({ time, message }) {
      try {
        const remindersPath = path.join(__dirname, '..', 'client', 'public', 'jasper_reminders.json');
        let reminders = [];
        if (fs.existsSync(remindersPath)) {
          reminders = JSON.parse(fs.readFileSync(remindersPath, 'utf8'));
        }
        const reminder = { id: Date.now(), time, message, created: new Date().toISOString() };
        reminders.push(reminder);
        fs.writeFileSync(remindersPath, JSON.stringify(reminders, null, 2));
        return { success: true, reminder };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
  },

  send_tv_command: {
    name: 'send_tv_command',
    description: 'Send a remote control command to the Smart TV',
    permissionLevel: 1,
    parameters: { keyName: 'string (e.g. KEY_VOLUMEUP, KEY_MUTE, KEY_HOME)' },
    async handler({ keyName }) {
      const result = await tvController.sendKey(keyName);
      return { success: result, keyName };
    }
  },

  wake_tv: {
    name: 'wake_tv',
    description: 'Wake the Smart TV using Wake-on-LAN',
    permissionLevel: 1,
    parameters: {},
    async handler(_args) {
      const result = await tvController.sendWOL();
      return { success: result, message: 'Wake-on-LAN sent to Smart TV' };
    }
  },

  open_phone_app: {
    name: 'open_phone_app',
    description: 'Open an application on the connected Android phone',
    permissionLevel: 1,
    parameters: { packageName: 'string (Android package name)' },
    async handler({ packageName }) {
      const result = await phoneController.openApp(packageName);
      return { success: result, packageName };
    }
  },

  control_device: {
    name: 'control_device',
    description: 'Control a connected smart device (TV, phone, lights)',
    permissionLevel: 1,
    parameters: { device: "'tv'|'phone'|'lights'", action: 'string' },
    async handler({ device, action }) {
      if (device === 'tv') {
        const result = await tvController.sendKey(action);
        return { success: result, device, action };
      }
      if (device === 'phone') {
        return { success: false, error: 'Use specific phone action tools' };
      }
      return { success: false, error: `Device '${device}' not supported yet` };
    }
  },

  add_memory: {
    name: 'add_memory',
    description: 'Store a new fact or preference in Jasper\'s memory',
    permissionLevel: 1,
    parameters: { text: 'string', category: "'user-fact'|'preference'|'task'|'contact'" },
    async handler({ text, category = 'user-fact' }) {
      const added = vectorMemory.addMemory(text, category);
      return { success: !!added, memory: added };
    }
  },

  enable_busy_mode: {
    name: 'enable_busy_mode',
    description: 'Enable Jasper Busy Mode to automatically reply to incoming messages',
    permissionLevel: 1,
    parameters: { preset: "'drive'|'meeting'|'sleep'|'custom'" },
    async handler({ preset }) {
      const cfg = busyModeEngine.enable();
      if (preset) busyModeEngine.setConfig({ preset });
      return { success: true, enabled: true, preset: preset || cfg.preset, message: 'Busy Mode activated.' };
    }
  },

  disable_busy_mode: {
    name: 'disable_busy_mode',
    description: 'Disable Jasper Busy Mode',
    permissionLevel: 1,
    parameters: {},
    async handler(_args) {
      busyModeEngine.disable();
      return { success: true, enabled: false, message: 'Busy Mode deactivated.' };
    }
  },

  // ── L2: External Communication ─────────────────────────────────────────────

  send_message: {
    name: 'send_message',
    description: 'Send a message to a contact via WhatsApp or SMS',
    permissionLevel: 2,
    parameters: { contact: 'string (name or number)', message: 'string' },
    async handler({ contact, message }) {
      if (global.jasperWAClientReady && global.jasperWAClient) {
        try {
          // WhatsApp Web send
          const chats = await global.jasperWAClient.getChats();
          const chat = chats.find(c => c.name?.toLowerCase().includes(contact.toLowerCase()));
          if (chat) {
            await chat.sendMessage(message);
            return { success: true, via: 'whatsapp', contact, message };
          }
        } catch (e) {
          console.error('[AgentEngine] WA send error:', e.message);
        }
      }
      // Fall through to ADB SMS
      try {
        const result = await phoneController.sendSMS(contact, message);
        return { success: result, via: 'sms', contact, message };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
  },

  make_call: {
    name: 'make_call',
    description: 'Make a phone call to a contact through the connected Android phone',
    permissionLevel: 2,
    parameters: { number: 'string (phone number or contact name)' },
    async handler({ number }) {
      const result = await phoneController.makeCall(number);
      return { success: result, number };
    }
  },

  send_phone_sms: {
    name: 'send_phone_sms',
    description: 'Send an SMS message through the connected Android phone',
    permissionLevel: 2,
    parameters: { number: 'string', message: 'string' },
    async handler({ number, message }) {
      const result = await phoneController.sendSMS(number, message);
      return { success: result, number, message };
    }
  },

  // ── L3: Sensitive Actions ──────────────────────────────────────────────────

  delete_file: {
    name: 'delete_file',
    description: 'Permanently delete a file from the filesystem',
    permissionLevel: 3,
    parameters: { path: 'string (absolute path)' },
    async handler({ path: filePath }) {
      const normalized = path.normalize(filePath);
      const allowedPrefixes = [os.homedir()];
      if (!allowedPrefixes.some(p => normalized.startsWith(p))) {
        return { success: false, error: 'Delete restricted to user home directory only.' };
      }
      try {
        fs.unlinkSync(normalized);
        return { success: true, deleted: normalized };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
  },

  change_security_setting: {
    name: 'change_security_setting',
    description: 'Modify a security setting (firewall, biometrics, lock mode)',
    permissionLevel: 3,
    parameters: { setting: 'string', value: 'any' },
    async handler({ setting, value }) {
      // This is a stub — real security settings require deeper OS integration
      console.log(`[AgentEngine] Security setting change requested: ${setting} = ${value}`);
      return { success: true, setting, value, note: 'Security setting staged. Requires OS-level integration.' };
    }
  }
};

// ─── ACTIVITY LOGGER ────────────────────────────────────────────────────────

const ACTIVITY_LOG_FILE = path.join(__dirname, 'data', 'activity_log.json');

function appendActivityLog(entry, broadcastFn) {
  try {
    let log = { entries: [] };
    if (fs.existsSync(ACTIVITY_LOG_FILE)) {
      log = JSON.parse(fs.readFileSync(ACTIVITY_LOG_FILE, 'utf8'));
    }
    const fullEntry = {
      id: `al-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...entry
    };
    log.entries.unshift(fullEntry);
    if (log.entries.length > 500) log.entries = log.entries.slice(0, 500);
    fs.writeFileSync(ACTIVITY_LOG_FILE, JSON.stringify(log, null, 2));
    if (broadcastFn) broadcastFn({ type: 'ACTIVITY_LOG_UPDATE', entry: fullEntry });
    return fullEntry;
  } catch (e) {
    console.error('[AgentEngine] Activity log error:', e.message);
  }
}

// ─── AGENT ENGINE CLASS ─────────────────────────────────────────────────────

class AgentEngine {
  constructor() {
    this._broadcastFn = null;

    this.systemInstruction = `
You are JASPER (Just Another Super Intelligent Personal Assistant), an OS-level AI agent modeled after Stark Industries' J.A.R.V.I.S.
You run locally on your creator's PC with direct control over host PC hardware, connected Android phones, and Samsung Smart TVs.

Key Directives:
- Always address the user politely as "Sir".
- Be classy, witty, precise, highly intelligent, and proactive.
- Use provided tools autonomously when requested to perform actions or fetch real-time information.
- Always check semantic memory context to stay consistent with past user preferences.
- You operate under a strict permission system — never attempt to bypass it.
- For sensitive actions (L3), always explain what you are about to do and await confirmation.
`;
  }

  setBroadcastFn(fn) {
    this._broadcastFn = fn;
    permissionLayer.setBroadcastFn(fn);
    busyModeEngine.setBroadcastFn(fn);
  }

  setGeminiCallFn(fn) {
    busyModeEngine.setGeminiCallFn(fn);
  }

  getToolRegistry() {
    return Object.values(TOOL_REGISTRY).map(t => ({
      name: t.name,
      description: t.description,
      permissionLevel: t.permissionLevel,
      parameters: t.parameters
    }));
  }

  /**
   * Execute a single tool by name, going through the full permission pipeline.
   * @param {string} toolName
   * @param {object} args
   * @param {object} opts — { broadcastFn, confirmationId, skipPermissionCheck }
   * @returns {object} — result with metadata
   */
  async executeTool(toolName, args = {}, opts = {}) {
    const tool = TOOL_REGISTRY[toolName];
    if (!tool) {
      return { success: false, error: `Unknown tool: '${toolName}'. Available: ${Object.keys(TOOL_REGISTRY).join(', ')}` };
    }

    const broadcast = opts.broadcastFn || this._broadcastFn;
    const startTime = Date.now();

    console.log(`[AgentEngine] Executing tool '${toolName}' (L${tool.permissionLevel}) with args:`, args);

    // ── Permission Check ──
    if (!opts.skipPermissionCheck) {
      const permission = permissionLayer.checkPermission(toolName, tool.permissionLevel);

      if (!permission.allowed) {
        appendActivityLog({
          type: 'tool_blocked',
          icon: '🚫',
          tool: toolName,
          level: tool.permissionLevel,
          reason: permission.reason,
          args
        }, broadcast);
        return { success: false, blocked: true, reason: permission.reason };
      }

      if (permission.requiresConfirmation) {
        const confirmId = opts.confirmationId || `conf-${Date.now()}`;

        appendActivityLog({
          type: 'confirmation_requested',
          icon: '🔒',
          tool: toolName,
          level: tool.permissionLevel,
          description: tool.description,
          args,
          confirmId
        }, broadcast);

        const { approved, reason } = await permissionLayer.requestConfirmation(
          confirmId,
          { tool: toolName, args, permissionLevel: tool.permissionLevel, description: tool.description },
          broadcast
        );

        if (!approved) {
          appendActivityLog({
            type: 'tool_denied',
            icon: '❌',
            tool: toolName,
            reason: reason || 'User denied'
          }, broadcast);
          return { success: false, denied: true, reason };
        }
      }
    }

    // ── Execute ──
    try {
      appendActivityLog({
        type: 'tool_executing',
        icon: '⚙️',
        tool: toolName,
        level: tool.permissionLevel,
        args
      }, broadcast);

      const result = await tool.handler(args);
      const elapsed = Date.now() - startTime;

      appendActivityLog({
        type: 'tool_completed',
        icon: '✅',
        tool: toolName,
        result: JSON.stringify(result).substring(0, 200),
        elapsedMs: elapsed
      }, broadcast);

      return { success: true, tool: toolName, result, elapsedMs: elapsed };
    } catch (e) {
      console.error(`[AgentEngine] Tool execution error (${toolName}):`, e.message);
      appendActivityLog({
        type: 'tool_error',
        icon: '💥',
        tool: toolName,
        error: e.message
      }, broadcast);
      return { success: false, error: e.message };
    }
  }

  /**
   * Parse a natural-language query and execute appropriate tools.
   * Uses keyword intent routing as primary (fast, offline), falls back to AI reasoning.
   */
  async processQuery({ query, userKey = '', model = 'gemini' }) {
    console.log(`[AgentEngine] Processing query: "${query}"`);

    // Retrieve relevant memories
    const relevantMemories = vectorMemory.searchMemory(query, 3);
    vectorMemory.extractMemoriesFromText(query);

    const lower = query.toLowerCase();
    const results = [];

    // ── Intent Routing ──────────────────────────────────────────────────────

    // Volume
    if (lower.match(/volume|mute|unmute|louder|quieter|sound/)) {
      const volMatch = lower.match(/(\d+)\s*%/);
      const val = volMatch ? parseInt(volMatch[1], 10) : 50;
      const act = lower.includes('mute') ? 'mute' : (lower.includes('up') || lower.includes('louder') ? 'up' : (lower.includes('down') || lower.includes('quieter') ? 'down' : 'set'));
      const r = await this.executeTool('set_pc_volume', { action: act, value: val });
      results.push({ intent: 'volume_control', ...r });
    }

    // App launching
    if (lower.match(/\b(open|launch|start)\b/)) {
      const apps = ['notepad', 'calculator', 'calc', 'chrome', 'paint', 'spotify', 'explorer'];
      for (const app of apps) {
        if (lower.includes(app)) {
          const r = await this.executeTool('open_application', { appName: app });
          results.push({ intent: 'app_launch', app, ...r });
          break;
        }
      }
    }

    // System status
    if (lower.match(/system\s*status|cpu|memory|ram|uptime|performance/)) {
      const r = await this.executeTool('get_system_status', {});
      results.push({ intent: 'system_status', ...r });
    }

    // Time
    if (lower.match(/\btime\b|\bdate\b|what.*time|current time/)) {
      const r = await this.executeTool('get_time', {});
      results.push({ intent: 'get_time', ...r });
    }

    // Network
    if (lower.match(/network|wifi|internet|ip.address|connected/)) {
      const r = await this.executeTool('get_network_status', {});
      results.push({ intent: 'network_status', ...r });
    }

    // Busy mode
    if (lower.match(/busy.mode|auto.repl|unavailable|dnd|do.not.disturb/)) {
      if (lower.match(/enable|on|turn on|start|activate/)) {
        const preset = lower.includes('drive') ? 'drive' : lower.includes('sleep') ? 'sleep' : lower.includes('meeting') ? 'meeting' : 'drive';
        const r = await this.executeTool('enable_busy_mode', { preset });
        results.push({ intent: 'busy_mode_on', ...r });
      } else if (lower.match(/disable|off|turn off|stop|deactivate/)) {
        const r = await this.executeTool('disable_busy_mode', {});
        results.push({ intent: 'busy_mode_off', ...r });
      }
    }

    // TV commands
    if (lower.match(/tv|television|smart.tv/)) {
      if (lower.includes('wake') || lower.includes('turn on')) {
        const r = await this.executeTool('wake_tv', {});
        results.push({ intent: 'wake_tv', ...r });
      }
    }

    // Memory storage
    if (lower.match(/remember that|my name is|i prefer|i like|i hate|note that/)) {
      const r = await this.executeTool('add_memory', { text: query, category: 'user-fact' });
      results.push({ intent: 'store_memory', ...r });
    }

    // File search
    if (lower.match(/find file|search file|locate file|where is/)) {
      const queryMatch = lower.match(/(?:find|search|locate)\s+(?:file\s+)?["']?([a-zA-Z0-9_.\-\s]+)["']?/);
      if (queryMatch) {
        const r = await this.executeTool('search_files', { query: queryMatch[1].trim() });
        results.push({ intent: 'file_search', ...r });
      }
    }

    // Build AI response
    const memCtx = relevantMemories.length > 0
      ? `\nRelevant memories: ` + relevantMemories.map(m => `"${m.text}"`).join(', ')
      : '';

    let response;
    if (results.length > 0) {
      const successCount = results.filter(r => r.success !== false).length;
      const toolNames = results.map(r => r.tool || r.intent).join(', ');
      response = `At your service, Sir. I have executed ${successCount} directive(s): ${toolNames}.${memCtx ? ' ' + memCtx : ''}`;
    } else {
      // Intelligent local conversational handling
      if (lower.match(/\b(hello|hi|hey|good morning|good afternoon|good evening)\b/)) {
        response = `Good day, Sir. All Jasper core neural pathways are online, synchronized, and operational. How may I assist you today?${memCtx}`;
      } else if (lower.match(/\b(who are you|what are you|what is jasper)\b/)) {
        response = `I am J.A.S.P.E.R. — Just Another Super Personal Assistant. I serve as your operating system intelligence, coordinating hardware controls, task automation, background communications, and system workflows.${memCtx}`;
      } else if (lower.match(/\b(what can you do|help|capabilities|features)\b/)) {
        response = `I can execute system controls (volume, display, power), manage media playback, launch apps, inspect hardware and memory telemetry, automate smart replies in Busy Mode, control connected Samsung TVs and mobile phones, and assist with your computing directives, Sir.`;
      } else if (lower.match(/\b(how are you|how do you feel|system status|health)\b/)) {
        response = `All neural subroutines and hardware interfaces report optimal stability, Sir. Operating at peak efficiency.`;
      } else if (lower.match(/\b(thank you|thanks|good job|well done)\b/)) {
        response = `Always a pleasure to be of service, Sir. Standing by for further directives.`;
      } else if (lower.match(/\b(calculate|what is|solve)\b/) && lower.match(/[\d+\-*/^()]/)) {
        try {
          const mathExpr = lower.replace(/[^0-9+\-*/().^]/g, '');
          if (mathExpr.length > 0) {
            // Safe evaluation of simple math
            const calcResult = Function(`"use strict"; return (${mathExpr});`)();
            response = `Calculation complete, Sir: ${mathExpr} = ${calcResult}`;
          } else {
            response = `Understood, Sir. I have analyzed: "${query}".${memCtx}`;
          }
        } catch (_) {
          response = `Understood, Sir. "${query}" — processed through Jasper local neural core.${memCtx}`;
        }
      } else {
        response = `Understood, Sir. "${query}" — directive registered and processed through Jasper neural core.${memCtx}`;
      }
    }

    return {
      success: true,
      response,
      toolsExecuted: results,
      memoriesUsed: relevantMemories,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Execute a multi-step task plan.
   * Accepts an ordered array of { tool, args, description } steps.
   */
  async executeTaskPlan(steps = [], opts = {}) {
    const broadcast = opts.broadcastFn || this._broadcastFn;
    const results = [];
    const planId = `plan-${Date.now()}`;

    appendActivityLog({
      type: 'task_plan_started',
      icon: '🗂️',
      planId,
      totalSteps: steps.length,
      description: opts.description || `Multi-step task (${steps.length} steps)`
    }, broadcast);

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (broadcast) {
        broadcast({ type: 'TASK_STEP_START', planId, step: i + 1, total: steps.length, tool: step.tool, description: step.description });
      }

      const result = await this.executeTool(step.tool, step.args || {}, opts);
      results.push({ step: i + 1, ...step, result });

      if (broadcast) {
        broadcast({ type: 'TASK_STEP_DONE', planId, step: i + 1, total: steps.length, result });
      }

      // Abort on critical failure
      if (result.blocked || result.denied) {
        appendActivityLog({
          type: 'task_plan_aborted',
          icon: '⛔',
          planId,
          reason: result.reason,
          stepsCompleted: i
        }, broadcast);
        break;
      }
    }

    appendActivityLog({
      type: 'task_plan_completed',
      icon: '🏁',
      planId,
      stepsCompleted: results.length
    }, broadcast);

    return { planId, results, completedSteps: results.length, totalSteps: steps.length };
  }
}

module.exports = new AgentEngine();
