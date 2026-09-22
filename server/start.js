const { spawn } = require('child_process');
const path = require('path');

// Automatically detect cloud environment (Render, Railway, Heroku, Docker) vs local development
const isCloud = Boolean(process.env.PORT || process.env.RENDER || process.env.RAILWAY_STATIC_URL || process.env.NODE_ENV === 'production');

if (isCloud) {
  console.log('[JASPER Cloud Runner] Cloud production environment detected.');
  console.log(`[JASPER Cloud Runner] Binding to cloud port: ${process.env.PORT || 3001}`);
  const child = spawn('node', [path.join(__dirname, 'server.js')], { stdio: 'inherit' });
  child.on('exit', (code) => process.exit(code || 0));
} else {
  console.log('[JASPER Dev Runner] Local environment detected. Starting server and Vite dev client...');
  const isWin = process.platform === 'win32';
  const cmd = isWin ? 'npx.cmd' : 'npx';
  const child = spawn(cmd, ['concurrently', '--kill-others', '"npm run server"', '"npm run client"'], {
    stdio: 'inherit',
    shell: true
  });
  child.on('exit', (code) => process.exit(code || 0));
}
