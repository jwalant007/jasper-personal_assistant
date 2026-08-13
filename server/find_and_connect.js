const net = require('net');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ip = '192.168.29.159';

function getAdbPath() {
  if (process.env.LOCALAPPDATA) {
    const localAdb = path.join(process.env.LOCALAPPDATA, 'Android', 'platform-tools', 'adb.exe');
    if (fs.existsSync(localAdb)) return `"${localAdb}"`;
  }
  return 'adb';
}
const adbBin = getAdbPath();

console.log(`[CONNECT SCANNER] Probing open ports on ${ip}...`);

async function testPort(port) {
  return new Promise((resolve) => {
    const s = new net.Socket();
    s.setTimeout(150);
    s.on('connect', () => {
      s.destroy();
      resolve(port);
    });
    s.on('timeout', () => {
      s.destroy();
      resolve(null);
    });
    s.on('error', () => {
      s.destroy();
      resolve(null);
    });
    s.connect(port, ip);
  });
}

async function run() {
  const openPorts = [];
  const promises = [];
  
  // Test common wireless debugging ports & range 30000-50000 in chunks
  for (let port = 30000; port <= 50000; port++) {
    promises.push(testPort(port));
    if (promises.length >= 100) {
      const results = await Promise.all(promises);
      results.forEach(p => { if (p) openPorts.push(p); });
      promises.length = 0;
    }
  }
  if (promises.length > 0) {
    const results = await Promise.all(promises);
    results.forEach(p => { if (p) openPorts.push(p); });
  }

  console.log(`[OPEN PORTS DISCOVERED ON ${ip}]:`, openPorts);

  for (const p of openPorts) {
    console.log(`[CONNECTING TO ${ip}:${p}]...`);
    try {
      const out = execSync(`${adbBin} connect ${ip}:${p}`, { encoding: 'utf8', timeout: 5000 });
      console.log(`OUTPUT (${p}):`, out.trim());
    } catch (e) {}
  }

  const devOut = execSync(`${adbBin} devices -l`, { encoding: 'utf8' });
  console.log('[FINAL ADB DEVICES]:\n', devOut);
}

run();
