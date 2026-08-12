const { spawn } = require('child_process');
const net = require('net');

const port = 33577;
const code = '243149';

console.log(`Scanning 192.168.29.1 to 254 for open pairing port ${port}...`);

let pending = 254;

for (let i = 1; i <= 254; i++) {
  const ip = `192.168.29.${i}`;
  const socket = new net.Socket();
  socket.setTimeout(800);

  socket.on('connect', () => {
    console.log(`\n🎉 FOUND MATCHING DEVICE IP: ${ip}:${port}`);
    socket.destroy();
    pairDevice(ip);
  });

  socket.on('timeout', () => socket.destroy());
  socket.on('error', () => socket.destroy());
  socket.on('close', () => {
    pending--;
    if (pending === 0) {
      console.log('Scan complete.');
    }
  });

  socket.connect(port, ip);
}

function pairDevice(ip) {
  console.log(`[PAIRING] Executing adb pair ${ip}:${port}...`);
  const child = spawn('adb', ['pair', `${ip}:${port}`], { shell: true });

  child.stdout.on('data', data => {
    console.log(`[ADB OUT] ${data.toString()}`);
    if (data.toString().includes('Enter pairing code')) {
      child.stdin.write(`${code}\n`);
    }
  });

  child.stderr.on('data', data => {
    console.log(`[ADB ERR] ${data.toString()}`);
  });

  child.on('exit', code => {
    console.log(`[ADB EXIT] Code ${code}`);
    // Check adb devices
    setTimeout(() => {
      const dev = spawn('adb', ['devices'], { shell: true });
      dev.stdout.on('data', d => console.log(`[ADB DEVICES] ${d.toString()}`));
    }, 1000);
  });

  setTimeout(() => {
    try {
      child.stdin.write(`${code}\n`);
    } catch (e) {}
  }, 400);
}
