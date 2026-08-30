const { execSync, spawn } = require('child_process');
const adbPath = 'C:\\Users\\Jwalant\\AppData\\Local\\Android\\platform-tools\\adb.exe';

console.log('1. Starting persistent ADB server...');
try {
  execSync(`"${adbPath}" start-server`);
} catch (e) {}

console.log('2. Pairing with 192.168.29.159:40677...');
const proc = spawn(adbPath, ['pair', '192.168.29.159:40677', '243245'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

proc.stdout.on('data', (d) => {
  console.log('OUT:', d.toString());
});

proc.stderr.on('data', (d) => {
  console.log('ERR:', d.toString());
});

proc.on('close', (code) => {
  console.log('Pair process exited with code:', code);
  // Check devices
  try {
    const devs = execSync(`"${adbPath}" devices`).toString();
    console.log('CURRENT ADB DEVICES:\n', devs);
  } catch (e) {}
});
