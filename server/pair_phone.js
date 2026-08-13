const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const target = process.argv[2] || ''; // e.g. 192.168.29.133:38421 or 192.168.29.133
const code = process.argv[3] || '468526';

if (!target) {
  console.log('Usage: node pair_phone.js <IP:PORT> <PAIRING_CODE>');
  process.exit(1);
}

// Get ADB path
function getAdbPath() {
  if (process.env.LOCALAPPDATA) {
    const localAdb = path.join(process.env.LOCALAPPDATA, 'Android', 'platform-tools', 'adb.exe');
    if (fs.existsSync(localAdb)) return `"${localAdb}"`;
  }
  return 'adb';
}

const adbBin = getAdbPath();
const formattedTarget = target.includes(':') ? target : `${target}:5555`;

console.log(`[PAIRING SERVICE] Initiating ADB pair to ${formattedTarget} with code: ${code}`);

try {
  const output = execSync(`${adbBin} pair ${formattedTarget} ${code}`, { encoding: 'utf8', timeout: 15000 });
  console.log('[PAIRING OUTPUT]:\n', output);

  // Parse IP to attempt connection
  const ipOnly = formattedTarget.split(':')[0];
  console.log(`[PAIRING SERVICE] Attempting connection to ${ipOnly}...`);

  // Try standard connect ports (or Wireless Debugging main port)
  try {
    const connOut = execSync(`${adbBin} connect ${ipOnly}:5555`, { encoding: 'utf8', timeout: 10000 });
    console.log('[CONNECT OUTPUT]:\n', connOut);
  } catch (e) {
    console.log('[CONNECT ATTEMPT]: Standard port 5555 failed, checking adb devices...');
  }

  const devOut = execSync(`${adbBin} devices`, { encoding: 'utf8' });
  console.log('[DEVICES ONLINE]:\n', devOut);
} catch (err) {
  console.error('[PAIRING ERROR]:', err.stdout || err.stderr || err.message);
}
