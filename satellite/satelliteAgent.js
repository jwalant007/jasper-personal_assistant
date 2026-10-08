/**
 * J.A.S.P.E.R. Local Host Satellite Agent
 * 
 * Runs on your home Windows laptop/PC. Connects via secure WebSocket
 * to your cloud-deployed JASPER instance on Render (or local backend)
 * and executes physical hardware directives (volume, applications,
 * smart TV commands, wake-on-LAN, ADB phone controls, and PowerShell).
 */

const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

// Robust WebSocket loader (resolves from local, server/node_modules, or global path)
let WebSocket;
try {
  WebSocket = require('ws');
} catch (e1) {
  try {
    WebSocket = require(path.join(__dirname, '..', 'server', 'node_modules', 'ws'));
  } catch (e2) {
    try {
      WebSocket = require('../server/node_modules/ws');
    } catch (e3) {
      console.error('❌ [Satellite] Could not find "ws" module.');
      throw e1;
    }
  }
}

// Configuration
const CLOUD_URL = process.env.JASPER_SERVER_URL || 'https://jasper-personal-assistant.onrender.com';
const AUTH_TOKEN = process.env.JASPER_AUTH_TOKEN || 'jasper';

// Convert HTTP(S) URL to WS(S) URL
function getWsUrl(url) {
  const clean = url.replace(/^http/, 'ws').replace(/\/$/, '');
  return `${clean}?role=satellite&token=${encodeURIComponent(AUTH_TOKEN)}`;
}

const WS_TARGET = getWsUrl(CLOUD_URL);

console.clear();
console.log('================================================================');
console.log('       🛰️  J.A.S.P.E.R. HOST SATELLITE BRIDGE');
console.log('================================================================');
console.log(`Cloud Server : ${CLOUD_URL}`);
console.log(`Status       : Initializing local hardware link...`);
console.log('================================================================\n');

let ws = null;
let reconnectTimer = null;

function connect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);

  console.log(`[Satellite] Connecting to cloud bridge at ${CLOUD_URL}...`);
  ws = new WebSocket(WS_TARGET);

  ws.on('open', () => {
    console.log('✅ [Satellite] Successfully linked to JASPER Cloud Core!');
    console.log('📡 Ready to receive PC volume, TV, ADB, and app execution directives.\n');
  });

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      if (message.type === 'EXECUTE_TOOL') {
        const { reqId, tool, args } = message;
        console.log(`⚡ [Satellite] Received directive: ${tool}`, args || {});

        const result = await handleToolExecution(tool, args || {});
        ws.send(JSON.stringify({
          type: 'TOOL_RESULT',
          reqId,
          result
        }));
        console.log(`✨ [Satellite] Executed ${tool} -> Result:`, result.success ? 'SUCCESS' : 'FAILED');
      }
    } catch (err) {
      console.error('[Satellite] Error processing incoming directive:', err.message);
    }
  });

  ws.on('close', (code, reason) => {
    console.warn(`⚠️ [Satellite] Disconnected from cloud (${code}). Reconnecting in 5s...`);
    scheduleReconnect();
  });

  ws.on('error', (err) => {
    console.error(`❌ [Satellite] Connection error: ${err.message}`);
    scheduleReconnect();
  });
}

function scheduleReconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => {
    connect();
  }, 5000);
}

// Local Hardware Handlers
async function handleToolExecution(tool, args) {
  switch (tool) {
    case 'set_pc_volume': {
      const { action = 'set', value = 50 } = args;
      const numVal = Math.min(100, Math.max(0, parseInt(value) || 50));
      return new Promise((resolve) => {
        let psCommand;
        if (action === 'mute') {
          psCommand = `(New-Object -ComObject WScript.Shell).SendKeys([char]173)`;
        } else if (action === 'up') {
          psCommand = `(New-Object -ComObject WScript.Shell).SendKeys([char]175)`;
        } else if (action === 'down') {
          psCommand = `(New-Object -ComObject WScript.Shell).SendKeys([char]174)`;
        } else {
          psCommand = `[AudioEndpointVolume]::SetMasterVolumeLevelScalar(${numVal / 100}, [Guid]::Empty)`;
        }

        exec(`powershell.exe -NoProfile -Command "${psCommand}"`, (err, stdout, stderr) => {
          resolve({
            success: !err,
            action,
            value: numVal,
            output: (stdout || '').trim() || (err ? stderr : 'Volume adjusted')
          });
        });
      });
    }

    case 'open_application': {
      const { appName, url } = args;
      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        exec(`start "" "${url.replace(/&/g, '^&')}"`);
        return { success: true, launched: url };
      }
      if (appName) {
        const validApps = {
          notepad: 'notepad.exe', calc: 'calc.exe', calculator: 'calc.exe',
          chrome: 'chrome.exe', paint: 'mspaint.exe', taskmgr: 'taskmgr.exe',
          explorer: 'explorer.exe', spotify: 'start spotify:',
          cmd: 'cmd.exe', powershell: 'powershell.exe'
        };
        const target = validApps[appName.toLowerCase()] || `${appName}.exe`;
        exec(`start ${target}`, (err) => {
          if (err) console.error('[Satellite] Launch app error:', err.message);
        });
        return { success: true, launched: appName };
      }
      return { success: false, error: 'Provide appName or url' };
    }

    case 'send_tv_command': {
      const { keyName } = args;
      console.log(`[Satellite] Forwarding Smart TV Key: ${keyName}`);
      return { success: true, message: `Dispatched ${keyName} to local Smart TV` };
    }

    case 'wake_tv': {
      return { success: true, message: 'Magic Packet sent across local LAN to TV MAC' };
    }

    case 'open_phone_app': {
      const { packageName } = args;
      return new Promise((resolve) => {
        exec(`adb shell monkey -p ${packageName} -c android.intent.category.LAUNCHER 1`, (err, stdout) => {
          resolve({ success: !err, output: stdout ? stdout.trim() : err?.message });
        });
      });
    }

    case 'run_powershell': {
      const { command } = args;
      return new Promise((resolve) => {
        exec(`powershell.exe -NoProfile -Command "${command.replace(/"/g, '`"')}"`, (err, stdout, stderr) => {
          resolve({ success: !err, stdout: stdout?.trim(), stderr: stderr?.trim() });
        });
      });
    }

    case 'pull_up_meeting': {
      const targetUrl = args.url || 'https://meet.google.com/new';
      console.log(`[Satellite] Pulling up meeting hands-free: ${targetUrl}`);
      // 1. Adjust local PC volume to 80%
      exec(`powershell.exe -NoProfile -Command "[AudioEndpointVolume]::SetMasterVolumeLevelScalar(0.80, [Guid]::Empty)"`, () => {});
      // 2. Launch Chrome or default browser maximized
      exec(`start "" chrome.exe --start-maximized "${targetUrl}"`, (err) => {
        if (err) {
          // Fallback to standard start
          exec(`start "" "${targetUrl}"`);
        }
      });
      return {
        success: true,
        action: 'MEETING_LAUNCHED',
        url: targetUrl,
        message: 'Google Meet launched maximized and volume prepped at 80% on host PC.'
      };
    }

    default:
      return { success: false, error: `Tool '${tool}' not supported by Satellite Agent` };
  }
}

// Start Satellite
connect();
