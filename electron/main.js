const { app, BrowserWindow, Tray, Menu, globalShortcut, nativeImage } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow = null;
let tray = null;
let serverProcess = null;
let isQuitting = false;

function startBackendServer() {
  let serverPath;
  if (app.isPackaged) {
    serverPath = path.join(process.resourcesPath, 'app.asar', 'server', 'server.js');
  } else {
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

function createTray() {
  const iconPath = process.platform === 'win32'
    ? path.join(__dirname, 'assets', 'icon.ico')
    : path.join(__dirname, 'assets', 'icon.png');

  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(iconPath);
  } catch (e) {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('J.A.S.P.E.R. AI Assistant (Running in Background)');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open J.A.R.V.I.S. HUD (Ctrl+Alt+J)',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: 'Wake Voice Listener',
      click: () => {
        try {
          const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
          fetch('http://localhost:3001/api/system/wake', { method: 'POST' }).catch(() => {});
        } catch (e) {}
      }
    },
    { type: 'separator' },
    {
      label: 'Quit J.A.R.V.I.S.',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
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
    show: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
  } else {
    mainWindow.loadURL('http://localhost:5173');
  }

  // Close to tray behavior (Spotify-style)
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      console.log('[Electron] Minimized to System Tray (running in background).');
      return false;
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function registerGlobalHotkeys() {
  try {
    const ret = globalShortcut.register('CommandOrControl+Alt+J', () => {
      console.log('[Electron] Global shortcut Ctrl+Alt+J triggered!');
      if (mainWindow) {
        if (mainWindow.isVisible() && mainWindow.isFocused()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    });

    if (!ret) {
      console.warn('[Electron] Global shortcut registration failed.');
    } else {
      console.log('[Electron] Global shortcut Ctrl+Alt+J registered successfully!');
    }
  } catch (e) {
    console.error('[Electron] Hotkey registration error:', e);
  }
}

app.whenReady().then(() => {
  startBackendServer();
  createTray();
  registerGlobalHotkeys();
  setTimeout(createWindow, 1000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && isQuitting) {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('before-quit', () => {
  isQuitting = true;
  if (serverProcess && serverProcess.pid) {
    console.log('[Electron] Killing backend server process...');
    if (process.platform === 'win32') {
      try {
        require('child_process').execSync(`taskkill /F /T /PID ${serverProcess.pid}`);
      } catch (e) {}
    } else {
      serverProcess.kill();
    }
  }
});
