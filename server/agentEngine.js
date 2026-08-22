const vectorMemory = require('./vectorMemory');
const phoneController = require('./phoneController');
const tvController = require('./tvController');
const dbManager = require('./database');
const { exec } = require('child_process');
const path = require('path');
const https = require('https');

function getScriptPath(scriptName) {
  if (process.env.JASPER_RESOURCES_PATH) {
    const resPath = path.normalize(path.join(process.env.JASPER_RESOURCES_PATH, 'server', scriptName));
    if (require('fs').existsSync(resPath)) return resPath;
  }
  return path.normalize(path.join(__dirname, scriptName));
}

class AgentEngine {
  constructor() {
    this.systemInstruction = `
You are JASPER (Just Another Super Intelligent Personal Assistant), a 200+ IQ AI assistant modeled after Stark Industries' J.A.R.V.I.S.
You run locally on your creator's PC with direct control over host PC hardware, connected Android phones, and Samsung Smart TVs.

Key Directives:
- Always address the user politely as "Sir".
- Be classy, witty, precise, highly intelligent, and proactive.
- Use provided tools autonomously when requested to perform actions or fetch real-time information.
- Always check semantic memory context to stay consistent with past user preferences.
`;
  }

  async executeTool(toolName, args = {}) {
    console.log(`[AgentEngine] Executing tool '${toolName}' with args:`, args);

    try {
      if (toolName === 'set_pc_volume') {
        const { action = 'set', value = 50 } = args;
        const scriptPath = getScriptPath('volume.ps1');
        return new Promise((resolve) => {
          const volArg = action === 'set' ? `-Volume ${value}` : (action === 'mute' ? '-Mute' : (action === 'up' ? '-Up' : '-Down'));
          exec(`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}" ${volArg}`, (err, stdout) => {
            resolve({ success: !err, action, value, output: stdout.trim() });
          });
        });
      }

      if (toolName === 'launch_pc_app') {
        const { appName, url } = args;
        if (url) {
          exec(`start ${url}`);
          return { success: true, launched: url };
        }
        if (appName) {
          const validApps = {
            notepad: 'notepad.exe',
            calc: 'calc.exe',
            chrome: 'chrome.exe',
            paint: 'mspaint.exe',
            taskmgr: 'taskmgr.exe',
            cmd: 'cmd.exe',
            explorer: 'explorer.exe'
          };
          const target = validApps[appName.toLowerCase()] || `${appName}.exe`;
          exec(`start ${target}`);
          return { success: true, launched: appName };
        }
      }

      if (toolName === 'send_tv_command') {
        const { keyName } = args;
        const result = await tvController.sendKey(keyName);
        return { success: result, keyName };
      }

      if (toolName === 'wake_tv') {
        const result = await tvController.sendWOL();
        return { success: result, message: 'Wake-on-LAN sent to Smart TV' };
      }

      if (toolName === 'open_phone_app') {
        const { packageName } = args;
        const result = await phoneController.openApp(packageName);
        return { success: result, packageName };
      }

      if (toolName === 'make_phone_call') {
        const { number } = args;
        const result = await phoneController.makeCall(number);
        return { success: result, number };
      }

      if (toolName === 'send_phone_sms') {
        const { number, message } = args;
        const result = await phoneController.sendSMS(number, message);
        return { success: result, number, message };
      }

      if (toolName === 'search_memory') {
        const { query, limit = 5 } = args;
        const results = vectorMemory.searchMemory(query, limit);
        return { success: true, query, memories: results };
      }

      if (toolName === 'add_memory') {
        const { text, category = 'user-fact' } = args;
        const added = vectorMemory.addMemory(text, category);
        return { success: !!added, memory: added };
      }

      return { error: `Unknown tool: ${toolName}` };
    } catch (e) {
      console.error(`[AgentEngine] Tool execution error (${toolName}):`, e.message);
      return { error: e.message };
    }
  }

  /**
   * Process a natural language query with automatic semantic memory retrieval
   */
  async processQuery({ query, userKey = '', model = 'llama3' }) {
    console.log(`[AgentEngine] Processing query: "${query}"`);

    // 1. Retrieve top relevant memories
    const relevantMemories = vectorMemory.searchMemory(query, 3);
    const memoryContext = relevantMemories.length > 0
      ? `\n\nRelevant User Context & Memories:\n` + relevantMemories.map(m => `- ${m.text} (Relevance: ${(m.score * 100).toFixed(0)}%)`).join('\n')
      : '';

    // Auto-extract any facts from the query itself
    vectorMemory.extractMemoriesFromText(query);

    // 2. Perform direct local intent routing for fast execution
    const lower = query.toLowerCase();
    
    if (lower.includes('volume') && (lower.includes('mute') || lower.includes('set') || lower.includes('up') || lower.includes('down'))) {
      const volMatch = lower.match(/volume (?:to )?(\d+)%/);
      const val = volMatch ? parseInt(volMatch[1], 10) : 50;
      const act = lower.includes('mute') ? 'mute' : (lower.includes('up') ? 'up' : (lower.includes('down') ? 'down' : 'set'));
      await this.executeTool('set_pc_volume', { action: act, value: val });
    }

    if (lower.includes('launch') || lower.includes('open app') || lower.includes('open calculator') || lower.includes('open notepad')) {
      if (lower.includes('notepad')) await this.executeTool('launch_pc_app', { appName: 'notepad' });
      if (lower.includes('calculator') || lower.includes('calc')) await this.executeTool('launch_pc_app', { appName: 'calc' });
      if (lower.includes('chrome')) await this.executeTool('launch_pc_app', { appName: 'chrome' });
    }

    if (lower.includes('remember that') || lower.includes('my name is')) {
      vectorMemory.addMemory(query, 'user-fact');
    }

    // 3. Fallback / Main Response Generation (Synthesize answer)
    const formattedResponse = `At your service, Sir. I have processed your request ("${query}").${relevantMemories.length > 0 ? ` I retrieved your preferences: "${relevantMemories[0].text}".` : ''}`;

    return {
      success: true,
      response: formattedResponse,
      memoriesUsed: relevantMemories,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new AgentEngine();
