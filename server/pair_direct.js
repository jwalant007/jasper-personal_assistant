const { spawn } = require('child_process');

const ip = '192.168.29.133';
const port = '33577';
const code = '243149';

console.log(`Executing adb pair ${ip}:${port} with pairing code ${code}...`);

const child = spawn('adb', ['pair', `${ip}:${port}`, code], { shell: true });

child.stdout.on('data', data => {
  console.log(`[ADB OUT] ${data.toString()}`);
});

child.stderr.on('data', data => {
  console.log(`[ADB ERR] ${data.toString()}`);
});

child.on('exit', exitCode => {
  console.log(`[ADB EXIT] Code: ${exitCode}`);
  
  // Now check adb devices and attempt connection
  setTimeout(() => {
    console.log('Checking adb devices...');
    const dev = spawn('adb', ['devices'], { shell: true });
    dev.stdout.on('data', d => console.log(`[ADB DEVICES]\n${d.toString()}`));
  }, 1000);
});
