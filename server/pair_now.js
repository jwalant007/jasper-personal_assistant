const { execSync } = require('child_process');
const adbPath = 'C:\\Users\\Jwalant\\AppData\\Local\\Android\\platform-tools\\adb.exe';

console.log('Pairing with 192.168.29.159:34437 code: 968017');
try {
  const pairOut = execSync(`"${adbPath}" pair 192.168.29.159:34437 968017`, { encoding: 'utf8', timeout: 10000 });
  console.log('PAIR RESULT:\n', pairOut);
} catch (e) {
  console.log('PAIR ERROR/OUTPUT:\n', e.stdout ? e.stdout.toString() : '', e.stderr ? e.stderr.toString() : '', e.message);
}

try {
  const devs = execSync(`"${adbPath}" devices`, { encoding: 'utf8' });
  console.log('DEVICES:\n', devs);
} catch (e) {}
