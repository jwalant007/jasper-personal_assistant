const net = require('net');
const { spawn, execSync } = require('child_process');

const adbPath = 'C:\\Users\\Jwalant\\AppData\\Local\\Android\\platform-tools\\adb.exe';
const ip = '192.168.29.159';
const pairPort = '45465';
const code = '796978';

// Step 1: Ensure daemon is alive
try {
  execSync(`"${adbPath}" start-server`, { encoding: 'utf8', timeout: 5000 });
  console.log('ADB daemon started.');
} catch(e) {}

// Step 2: Directly write the TLS pairing session via socket to bypass PowerShell buffering
function sendPairRequest() {
  return new Promise((resolve) => {
    // Build the ADB host:pair message
    const service = `host:pair:${code}:${ip}:${pairPort}`;
    const lenHex = service.length.toString(16).padStart(4, '0');
    const msg = `${lenHex}${service}`;
    
    console.log(`Connecting to adb server at 127.0.0.1:5037...`);
    const sock = new net.Socket();
    sock.setTimeout(5000);
    
    sock.connect(5037, '127.0.0.1', () => {
      console.log('Connected to adb server! Sending pair request:', msg);
      sock.write(msg);
    });
    
    let response = '';
    sock.on('data', (d) => {
      response += d.toString();
      console.log('RAW RESPONSE:', d.toString('hex'), '|', d.toString());
      if (response.includes('OKAY') || response.includes('FAIL')) {
        sock.destroy();
      }
    });
    
    sock.on('close', () => {
      console.log('Socket closed. Full response was:', response);
      resolve(response);
    });
    
    sock.on('timeout', () => {
      console.log('Socket timed out');
      sock.destroy();
    });
    
    sock.on('error', (e) => {
      console.log('Socket error:', e.message);
      sock.destroy();
    });
  });
}

(async () => {
  const result = await sendPairRequest();
  console.log('Pair result:', result);
  
  // Check devices
  try {
    const devs = execSync(`"${adbPath}" devices`, { encoding: 'utf8' });
    console.log('DEVICES:\n', devs);
  } catch(e) {}
})();
