const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT_DIR = __dirname;
const WATCH_DIRS = [
  path.join(ROOT_DIR, 'client', 'src'),
  path.join(ROOT_DIR, 'server')
];

let buildTimeout = null;
let isBuilding = false;

function triggerBuild(changedFile) {
  if (isBuilding) {
    console.log(`[Auto-Watcher] Build already in progress. Queueing re-trigger for: ${changedFile}`);
    return;
  }

  isBuilding = true;
  console.log(`\n[Auto-Watcher] Change detected in: ${changedFile}`);
  console.log(`[Auto-Watcher] Initiating background build (EXE + APK)...`);

  const psScript = path.join(ROOT_DIR, 'server', 'build_all.ps1');
  const buildProc = spawn('powershell.exe', [
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-File', psScript
  ], { stdio: 'inherit' });

  buildProc.on('close', (code) => {
    isBuilding = false;
    if (code === 0) {
      console.log(`\n[Auto-Watcher] ✅ Build completed successfully! EXE & APK updated.`);
    } else {
      console.error(`\n[Auto-Watcher] ❌ Build exited with error code ${code}`);
    }
  });
}

function handleFileChange(event, filename, dirPath) {
  if (!filename) return;

  // Ignore build artifacts, logs, node_modules, temp files
  if (
    filename.includes('node_modules') ||
    filename.includes('dist') ||
    filename.includes('build') ||
    filename.includes('.git') ||
    filename.includes('data') ||
    filename.endsWith('.json') ||
    filename.endsWith('.log') ||
    filename.endsWith('.tmp')
  ) {
    return;
  }

  const fullPath = path.join(dirPath, filename);

  // Debounce rapid typing / edits by 3 seconds
  if (buildTimeout) clearTimeout(buildTimeout);

  buildTimeout = setTimeout(() => {
    triggerBuild(fullPath);
  }, 3000);
}

console.log(`[Auto-Watcher] Starting live automated build daemon...`);
console.log(`[Auto-Watcher] Watching directories for changes:`);

WATCH_DIRS.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(` - ${dir}`);
    fs.watch(dir, { recursive: true }, (event, filename) => {
      handleFileChange(event, filename, dir);
    });
  }
});

console.log(`[Auto-Watcher] Ready! Any edit in client/src or server will automatically trigger an EXE & APK rebuild.\n`);
