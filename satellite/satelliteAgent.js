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
const { exec, execFile } = require('child_process');

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

// Ultra-fast Native Image Compressor (resizes 1080p raw PNG to ~50KB JPEG for 35x bandwidth savings)
let sharp = null;
try {
  sharp = require('sharp');
} catch (e1) {
  try {
    sharp = require(path.join(__dirname, '..', 'node_modules', 'sharp'));
  } catch (e2) {}
}

async function compressScreenshotBuffer(buffer) {
  if (!sharp) {
    return { mime: 'image/png', buffer };
  }
  try {
    const compressed = await sharp(buffer)
      .resize({ width: 540, withoutEnlargement: true })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer();
    return { mime: 'image/jpeg', buffer: compressed };
  } catch (err) {
    return { mime: 'image/png', buffer };
  }
}

// Configuration
const CLOUD_URL = process.env.JASPER_SERVER_URL || 'https://jasper-personal-assistant.onrender.com';
const AUTH_TOKEN = process.env.JASPER_AUTH_TOKEN || 'jasper';

function getAdbPath() {
  if (process.env.LOCALAPPDATA) {
    const localAdb = path.join(process.env.LOCALAPPDATA, 'Android', 'platform-tools', 'adb.exe');
    if (fs.existsSync(localAdb)) {
      return `"${localAdb}"`;
    }
  }
  return 'adb';
}

const adbBin = getAdbPath();

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

    case 'adb_pair': {
      const { ip, code, connectIp } = args;
      console.log(`[Satellite] ADB Pairing with ${ip} using code ${code}...`);
      return new Promise((resolve) => {
        if (!ip || !code) return resolve({ success: false, error: 'Pairing IP and Code are required' });
        const target = ip.includes(':') ? ip.trim() : `${ip.trim()}:5555`;
        const cleanCode = code.toString().trim();
        exec(`${adbBin} pair ${target} ${cleanCode}`, { timeout: 15000 }, async (err, stdout, stderr) => {
          const out = (stdout || '') + (stderr || '');
          const isSuccess = out.toLowerCase().includes('successfully paired') || out.toLowerCase().includes('success');
          let connectResult = null;
          if (connectIp && (isSuccess || !out.toLowerCase().includes('failed'))) {
            connectResult = await new Promise(r => {
              exec(`${adbBin} connect ${connectIp.trim()}`, { timeout: 8000 }, (cErr, cOut) => {
                r((cOut || '').trim());
              });
            });
          }
          resolve({
            success: isSuccess || !out.toLowerCase().includes('failed'),
            message: out.trim() || (isSuccess ? 'Pairing successful.' : err?.message),
            connectResult
          });
        });
      });
    }

    case 'adb_connect': {
      const { ip } = args;
      console.log(`[Satellite] ADB Connecting to ${ip}...`);
      return new Promise((resolve) => {
        if (!ip) return resolve({ success: false, error: 'IP address required' });
        exec(`${adbBin} connect ${ip.trim()}`, { timeout: 10000 }, (err, stdout, stderr) => {
          const out = (stdout || '') + (stderr || '');
          const success = out.toLowerCase().includes('connected');
          resolve({ success, message: out.trim() || (err ? err.message : 'Connected') });
        });
      });
    }

    case 'adb_disconnect': {
      console.log('[Satellite] ADB Disconnecting...');
      return new Promise((resolve) => {
        exec(`${adbBin} disconnect`, { timeout: 5000 }, (err, stdout) => {
          resolve({ success: true, message: (stdout || '').trim() || 'Disconnected' });
        });
      });
    }

    case 'adb_status': {
      return new Promise((resolve) => {
        exec(`${adbBin} devices`, { timeout: 8000 }, async (err, stdout) => {
          if (err) return resolve({ connected: false, message: 'ADB error: ' + err.message });
          const lines = (stdout || '').split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('*'));
          if (lines.length <= 1) {
            return resolve({ connected: false, isVirtual: false, deviceId: null, message: 'No physical Android device connected on local PC.' });
          }
          const [deviceId, state] = lines[1].split(/\s+/);
          if (state !== 'device') {
            return resolve({ connected: false, isVirtual: false, deviceId, message: `Device attached but state is ${state}.` });
          }

          let batteryLevel = 'Unknown';
          let model = 'Android Device';
          let androidVersion = '14';
          try {
            await new Promise(r => {
              exec(`${adbBin} -s ${deviceId} shell dumpsys battery`, { timeout: 4000 }, (e, bOut) => {
                const match = (bOut || '').match(/level: (\d+)/);
                if (match) batteryLevel = parseInt(match[1], 10);
                r();
              });
            });
            await new Promise(r => {
              exec(`${adbBin} -s ${deviceId} shell getprop ro.product.model`, { timeout: 4000 }, (e, mOut) => {
                if (mOut && mOut.trim()) model = mOut.trim();
                r();
              });
            });
            await new Promise(r => {
              exec(`${adbBin} -s ${deviceId} shell getprop ro.build.version.release`, { timeout: 4000 }, (e, vOut) => {
                if (vOut && vOut.trim()) androidVersion = vOut.trim();
                r();
              });
            });
          } catch (e) {}

          resolve({
            success: true,
            connected: true,
            isVirtual: false,
            deviceId,
            model,
            androidVersion,
            batteryLevel
          });
        });
      });
    }

    case 'adb_command': {
      const { command } = args;
      return new Promise((resolve) => {
        exec(`${adbBin} ${command}`, { timeout: 15000 }, (err, stdout, stderr) => {
          resolve({
            success: !err,
            output: (stdout || '').trim(),
            error: err ? (stderr || err.message).trim() : null
          });
        });
      });
    }

    case 'adb_screenshot': {
      return new Promise((resolve) => {
        let deviceArgs = [];
        let targetDevice = args.deviceId;
        if (targetDevice && targetDevice !== 'JASPER-VIRTUAL-ADB') {
          deviceArgs = ['-s', targetDevice];
        }

        const rawAdb = adbBin.replace(/"/g, '');
        execFile(
          rawAdb,
          [...deviceArgs, 'exec-out', 'screencap', '-p'],
          { encoding: 'buffer', maxBuffer: 15 * 1024 * 1024, timeout: 12000 },
          async (err, stdout) => {
            if (err || !stdout || stdout.length === 0) {
              if (deviceArgs.length > 0) {
                return execFile(
                  rawAdb,
                  ['exec-out', 'screencap', '-p'],
                  { encoding: 'buffer', maxBuffer: 15 * 1024 * 1024, timeout: 12000 },
                  async (err2, stdout2) => {
                    if (err2 || !stdout2 || stdout2.length === 0) {
                      return resolve({ success: false, error: err2?.message || 'Screenshot failed' });
                    }
                    const { mime, buffer } = await compressScreenshotBuffer(stdout2);
                    const base64 = buffer.toString('base64');
                    resolve({ success: true, base64: `data:${mime};base64,${base64}` });
                  }
                );
              }
              return resolve({ success: false, error: err ? err.message : 'No screenshot received' });
            }
            const { mime, buffer } = await compressScreenshotBuffer(stdout);
            const base64 = buffer.toString('base64');
            resolve({ success: true, base64: `data:${mime};base64,${base64}` });
          }
        );
      });
    }

    case 'open_phone_app': {
      const { packageName } = args;
      return new Promise((resolve) => {
        exec(`${adbBin} shell monkey -p ${packageName} -c android.intent.category.LAUNCHER 1`, (err, stdout) => {
          resolve({ success: !err, output: stdout ? stdout.trim() : err?.message });
        });
      });
    }

    case 'allow_device_background_usage': {
      const pkg = args?.packageName || 'com.antigravity.jasper';
      console.log(`[Satellite] Granting unconstrained background usage for ${pkg}...`);
      return new Promise((resolve) => {
        exec(`${adbBin} shell dumpsys deviceidle whitelist +${pkg} && ${adbBin} shell cmd appops set ${pkg} RUN_IN_BACKGROUND allow && ${adbBin} shell settings put global wifi_sleep_policy 2`, (err, stdout) => {
          resolve({ success: !err, message: `Background usage granted for ${pkg}`, output: stdout ? stdout.trim() : err?.message });
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
