const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

function startBackendServer() {
  // Determine path to server.js
  let serverPath;
  if (app.isPackaged) {
    // In production, server is inside the app.asar
    serverPath = path.join(process.resourcesPath, 'app.asar', 'server', 'server.js');
  } else {
    // In dev
    serverPath = path.join(__dirname, '..', 'server', 'server.js');
  }

  console.log('[Electron] Starting JASPER backend server at:', serverPath);
  
  const env = { 
    ...process.env, 
    ELECTRON_RUN_AS_NODE: '1',
    JASPER_RESOURCES_PATH: app.isPackaged ? process.resourcesPath : ''
  };

  const spawnOptions = {
    env,
    stdio: 'pipe'
  };

  if (app.isPackaged) {
    // In production, cwd must be a physical directory (like process.resourcesPath)
    // because Windows CreateProcess fails if cwd is set to a virtual app.asar path.
    spawnOptions.cwd = process.resourcesPath;
  } else {
    spawnOptions.cwd = path.dirname(serverPath);
  }

  serverProcess = spawn(process.execPath, [serverPath], spawnOptions);

  serverProcess.on('error', (err) => {
    console.error('[Electron] Failed to spawn backend server process:', err);
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`[JASPER SERVER]: ${data.toString()}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`[JASPER SERVER ERROR]: ${data.toString()}`);
  });

  serverProcess.on('close', (code) => {
    console.log(`[Electron] Backend server exited with code ${code}`);
  });
}

function createWindow() {
  const iconPath = process.platform === 'win32'
    ? path.join(__dirname, 'assets', 'icon.ico')
    : path.join(__dirname, 'assets', 'icon.png');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    icon: iconPath,
    // frame: false, // Optional: for custom title bar
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false // Note: For a real production app, use preload script + contextIsolation: true
    }
  });

  // Load UI
  if (app.isPackaged) {
    // Production
    mainWindow.loadFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
  } else {
    // Development
    mainWindow.loadURL('http://localhost:5173');
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Start the Express backend
  startBackendServer();

  // Wait a moment for server to spin up, then create window
  setTimeout(createWindow, 1000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Cleanup processes on quit
app.on('before-quit', () => {
  if (serverProcess && serverProcess.pid) {
    console.log('[Electron] Killing backend server process...');
    if (process.platform === 'win32') {
      try {
        require('child_process').execSync(`taskkill /F /T /PID ${serverProcess.pid}`);
      } catch (e) {
        // Ignore errors if process already exited
      }
    } else {
      serverProcess.kill();
    }
  }
});
