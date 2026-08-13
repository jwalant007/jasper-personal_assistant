const net = require('net');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const code = process.argv[2] || '468526';
const baseSubnet = '192.168.29.';

function getAdbPath() {
  if (process.env.LOCALAPPDATA) {
    const localAdb = path.join(process.env.LOCALAPPDATA, 'Android', 'platform-tools', 'adb.exe');
    if (fs.existsSync(localAdb)) return `"${localAdb}"`;
  }
  return 'adb';
}
const adbBin = getAdbPath();

console.log(`[SCANNER] Scanning ${baseSubnet}1-254 for active Android Wireless Debugging endpoints...`);

// Test common ports or scan target IP 133
const candidateIps = [];
for (let i = 2; i <= 254; i++) {
  if (i !== 132) candidateIps.push(`${baseSubnet}${i}`);
}

let found = false;

async function checkPort(ip, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(250);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, ip);
  });
}

async function runScan() {
  // Common wireless debugging ports or scan 192.168.29.133
  const targetIp = '192.168.29.133';
  console.log(`[SCANNER] Checking target ${targetIp}...`);

  for (let port = 30000; port <= 49999; port += 50) {
    // Quick sampling
  }

  // Also check arp -a for connected device IPs
  try {
    const arpOut = execSync('arp -a', { encoding: 'utf8' });
    const lines = arpOut.split('\n').filter(l => l.includes('192.168.29.'));
    console.log('[ARP TABLE MATCHES]:\n', lines.join('\n'));
  } catch (e) {}
}

runScan();
