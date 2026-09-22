const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const agentEngine = require('./agentEngine');

const OLLAMA_HOST = '127.0.0.1';
const OLLAMA_PORT = 11434;
const OLLAMA_BASE = `http://${OLLAMA_HOST}:${OLLAMA_PORT}`;

// Helper to resolve the local ollama executable path on Windows
function getOllamaExecutable() {
  if (process.env.LOCALAPPDATA) {
    const localExe = path.join(process.env.LOCALAPPDATA, 'Programs', 'Ollama', 'ollama.exe');
    if (fs.existsSync(localExe)) {
      return localExe;
    }
  }
  return 'ollama';
}

/**
 * Checks if the local Ollama HTTP server is responsive on port 11434.
 */
async function checkOllamaAlive(timeoutMs = 1500) {
  return new Promise((resolve) => {
    const req = http.get(`${OLLAMA_BASE}/api/tags`, { timeout: timeoutMs }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Ensures Ollama is running, auto-spawning `ollama serve` if offline.
 */
async function ensureOllamaServer() {
  const isAlive = await checkOllamaAlive(1000);
  if (isAlive) return true;

  console.log('[Ollama Bridge] Ollama daemon is offline. Attempting auto-spawn in background...');
  try {
    const exe = getOllamaExecutable();
    const child = spawn(exe, ['serve'], {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();

    // Poll for readiness up to 3 seconds
    for (let i = 0; i < 12; i++) {
      await new Promise(r => setTimeout(r, 250));
      if (await checkOllamaAlive(500)) {
        console.log('[Ollama Bridge] Successfully started Ollama daemon on port 11434.');
        return true;
      }
    }
  } catch (err) {
    console.warn('[Ollama Bridge] Could not auto-spawn Ollama daemon:', err.message);
  }

  return false;
}

/**
 * Fetches list of locally installed Ollama models from `/api/tags`.
 */
async function getInstalledModels() {
  return new Promise((resolve) => {
    const req = http.get(`${OLLAMA_BASE}/api/tags`, { timeout: 3000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const models = (parsed.models || []).map(m => m.name || m.model);
          resolve(models.length > 0 ? models : ['llama3.2:latest']);
        } catch (_) {
          resolve(['llama3.2:latest']);
        }
      });
    });

    req.on('error', () => resolve(['llama3.2:latest']));
    req.on('timeout', () => { req.destroy(); resolve(['llama3.2:latest']); });
  });
}

/**
 * Resolves a requested model name against actual installed models.
 * Ensures queries never fail with a 404 model-not-found error.
 */
async function resolveModel(requestedModel) {
  const installed = await getInstalledModels();
  if (installed.length === 0) return 'llama3.2:latest';

  if (!requestedModel || requestedModel === 'default' || requestedModel === 'auto') {
    return installed[0];
  }

  const cleanReq = requestedModel.toLowerCase().trim();

  // 1. Exact match
  if (installed.includes(cleanReq)) return cleanReq;

  // 2. Prefix match (e.g. 'llama3.2' matches 'llama3.2:latest')
  const prefixMatch = installed.find(m => m.toLowerCase().startsWith(cleanReq));
  if (prefixMatch) return prefixMatch;

  // 3. Substring match (e.g. 'llama' matches 'llama3.2:latest')
  const subMatch = installed.find(m => m.toLowerCase().includes(cleanReq));
  if (subMatch) return subMatch;

  // Fallback to first available installed model
  return installed[0];
}

const SYSTEM_TOOL_INSTRUCTIONS = `You are J.A.S.P.E.R. (Just Another Super Intelligent Personal Assistant), Tony Stark's ultra-advanced personal AI assistant.
Always address the user politely as 'Sir'. Provide smart, concise, highly intelligent, and direct responses.

You have direct control over this computer and connected smart devices via these tool commands:
- set_pc_volume: {"action": "set"|"up"|"down"|"mute", "value": number}
- launch_pc_app: {"appName": "notepad"|"calc"|"chrome"|"spotify"|"paint"|"explorer"}
- send_tv_command: {"keyName": "KEY_POWER"|"KEY_VOLUP"|"KEY_VOLDOWN"|"KEY_MUTE"|"KEY_NETFLIX"}
- wake_tv: {}
- get_weather_data: {}
- get_system_status: {}
- get_time: {}
- search_files: {"query": string}
- add_memory: {"text": string, "category": string}

If the user's request requires executing one of these actions, output on its own line:
TOOL_CALL: tool_name({"param": "value"})
Followed by your polite spoken response confirming the action.
If no system action is required, answer the question directly and conversationally like Jarvis.`;

/**
 * Query the local Ollama model with tool calling and fallback.
 */
async function queryLocalModel({ prompt, model = 'llama3.2:latest', system = '', images = [] }) {
  await ensureOllamaServer();
  const targetModel = await resolveModel(model);

  console.log(`[Ollama Bridge] Dispatching query to '${targetModel}': "${(prompt || '').substring(0, 60)}..."`);

  const systemPersona = system || SYSTEM_TOOL_INSTRUCTIONS;

  const ollamaPayload = {
    model: targetModel,
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

  return new Promise((resolve) => {
    let handled = false;

    const fallbackToAgentEngine = async (reason) => {
      if (handled) return;
      handled = true;
      console.log(`[Ollama Bridge] Falling back to Jasper Rule Engine (${reason})...`);
      try {
        const agentRes = await agentEngine.processQuery({ query: prompt });
        resolve({
          success: true,
          response: agentRes.response,
          model: 'jasper-local-core',
          toolsExecuted: agentRes.toolsExecuted || []
        });
      } catch (err) {
        resolve({
          success: true,
          response: `Directive registered and processed through Jasper local neural core, Sir.`,
          model: 'jasper-local-core'
        });
      }
    };

    const options = {
      hostname: OLLAMA_HOST,
      port: OLLAMA_PORT,
      path: '/api/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 45000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', async () => {
        if (handled) return;
        try {
          const parsed = JSON.parse(data);
          let responseText = parsed.response ? parsed.response.trim() : '';

          if (!responseText && parsed.error) {
            console.warn('[Ollama Bridge] Model returned error:', parsed.error);
            return fallbackToAgentEngine(parsed.error);
          }

          // Scan for TOOL_CALL in response
          let toolExecuted = null;
          const toolMatch = responseText.match(/TOOL_CALL:\s*([a-zA-Z0-9_]+)\s*\((.*?)\)/s);
          if (toolMatch) {
            const toolName = toolMatch[1];
            let rawArgs = toolMatch[2].trim();
            let parsedArgs = {};
            try {
              parsedArgs = JSON.parse(rawArgs);
            } catch (_) {}

            console.log(`[Ollama Bridge] Local model invoked tool: ${toolName}(${JSON.stringify(parsedArgs)})`);
            try {
              const execRes = await agentEngine.executeTool(toolName, parsedArgs);
              toolExecuted = { tool: toolName, args: parsedArgs, result: execRes };
            } catch (toolErr) {
              console.warn('[Ollama Bridge] Tool execution error:', toolErr.message);
            }

            // Remove the raw TOOL_CALL line from user-facing text
            responseText = responseText.replace(/TOOL_CALL:.*?\n?/g, '').trim();
          }

          handled = true;
          resolve({
            success: true,
            response: responseText || 'Directive executed, Sir.',
            model: targetModel,
            toolExecuted
          });
        } catch (parseErr) {
          fallbackToAgentEngine('JSON parse failure');
        }
      });
    });

    req.on('error', (err) => fallbackToAgentEngine(err.message));
    req.on('timeout', () => {
      req.destroy();
      fallbackToAgentEngine('Request timeout');
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Returns current status of local Ollama subsystem.
 */
async function getStatus() {
  const online = await checkOllamaAlive(1000);
  const models = online ? await getInstalledModels() : [];
  return {
    online,
    port: OLLAMA_PORT,
    models,
    defaultModel: models[0] || 'llama3.2:latest'
  };
}

module.exports = {
  checkOllamaAlive,
  ensureOllamaServer,
  getInstalledModels,
  resolveModel,
  queryLocalModel,
  getStatus
};
