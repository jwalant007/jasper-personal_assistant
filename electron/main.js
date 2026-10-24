const { app, BrowserWindow, Tray, Menu, globalShortcut, nativeImage, ipcMain, screen } = require('electron');
const path = require('path');
const net = require('net');
const { spawn } = require('child_process');
const settingsManager = require('./settingsManager');
const WakeWordManager = require('./wakeWordManager');

// Prevent duplicate background processes via Single-Instance Lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  console.log('[Electron] Another JASPER instance is already active. Terminating duplicate launcher.');
  app.quit();
  process.exit(0);
}

const CLOUD_URL = process.env.JASPER_SERVER_URL || 'https://jasper-personal-assistant.onrender.com';
const USE_LOCAL_SERVER = process.env.JASPER_LOCAL_SERVER !== 'false';

let mainWindow = null;
let floatingBarWindow = null;
let tray = null;
let serverProcess = null;
let wakeWordManager = null;
let isQuitting = false;
let pauseTimer = null;

// Handle second instance launch (e.g. user clicked shortcut while running in background)
app.on('second-instance', () => {
  console.log('[Electron] Second instance launch attempt detected. Focusing active JASPER instance.');
  if (floatingBarWindow) {
    if (!floatingBarWindow.isVisible()) floatingBarWindow.show();
    floatingBarWindow.focus();
  }
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
  }
});

function isPortActive(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function startBackendServer() {
  const alreadyRunning = await isPortActive(3001);
  if (alreadyRunning) {
    console.log('[Electron] JASPER backend server is already active on port 3001. Skipping spawn.');
    return;
  }

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
    stdio: 'pipe',
    cwd: app.isPackaged ? process.resourcesPath : path.dirname(serverPath)
  };

  serverProcess = spawn(process.execPath, [serverPath], spawnOptions);

  serverProcess.on('error', (err) => {
    console.error('[Electron] Failed to spawn backend server process:', err);
  });

  serverProcess.stdout.on('data', (data) => {
    const msg = data.toString().trim();
    if (msg) console.log(`[JASPER SERVER]: ${msg}`);
  });

  serverProcess.stderr.on('data', (data) => {
    const err = data.toString().trim();
    if (err) console.error(`[JASPER SERVER ERROR]: ${err}`);
  });

  serverProcess.on('close', (code) => {
    console.log(`[Electron] Backend server exited with code ${code}`);
  });
}

function initWakeWordEngine() {
  const isEnabled = settingsManager.get('backgroundListening') && settingsManager.get('wakeWordEnabled');
  const sensitivity = settingsManager.get('wakeWordSensitivity');
  const micDevice = settingsManager.get('microphoneDevice');

  wakeWordManager = new WakeWordManager({
    threshold: sensitivity,
    micDevice
  });

  wakeWordManager.on('wake', (data) => {
    console.log('[Electron] Wake phrase received! Activating Floating Function Bar and dispatching to windows.');
    
    // 1. Ensure floating bar is visible and above other windows
    if (floatingBarWindow && !floatingBarWindow.isDestroyed()) {
      if (!floatingBarWindow.isVisible()) {
        floatingBarWindow.showInactive();
      }
      floatingBarWindow.webContents.send('jasper:wake-detected', data);
    }

    // 2. Also notify main HUD if open
    if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()) {
      mainWindow.webContents.send('jasper:wake-detected', data);
    }
  });

  wakeWordManager.on('status', () => {
    updateTrayMenu();
  });

  if (isEnabled) {
    wakeWordManager.start();
  }
}

function updateTrayMenu() {
  if (!tray || tray.isDestroyed()) return;

  const isListening = wakeWordManager ? wakeWordManager.isListening : false;
  const isPaused = settingsManager.get('pauseUntil') && Date.now() < settingsManager.get('pauseUntil');
  const barVisible = floatingBarWindow && !floatingBarWindow.isDestroyed() && floatingBarWindow.isVisible();

  let statusText = 'Listening Active';
  if (isPaused) {
    const minsLeft = Math.max(1, Math.round((settingsManager.get('pauseUntil') - Date.now()) / 60000));
    statusText = `Paused (${minsLeft}m remaining)`;
  } else if (!isListening) {
    statusText = 'Mic Muted / Disabled';
  }

  tray.setToolTip(`J.A.S.P.E.R. AI Assistant — [${statusText}]`);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open J.A.S.P.E.R. Full HUD (Ctrl+Alt+J)',
      click: () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createMainWindow();
        }
      }
    },
    {
      label: barVisible ? 'Hide Floating Bar' : 'Show Floating Bar',
      click: () => {
        if (floatingBarWindow && !floatingBarWindow.isDestroyed()) {
          if (barVisible) {
            floatingBarWindow.hide();
          } else {
            floatingBarWindow.show();
          }
          settingsManager.set('floatingBarVisible', !barVisible);
          updateTrayMenu();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Always-On Voice Listening',
      type: 'checkbox',
      checked: isListening,
      click: (item) => {
        const nextState = item.checked;
        settingsManager.set('backgroundListening', nextState);
        if (nextState) {
          settingsManager.set('pauseUntil', null);
          if (pauseTimer) clearTimeout(pauseTimer);
          if (wakeWordManager) wakeWordManager.resume();
        } else {
          if (wakeWordManager) wakeWordManager.mute();
        }
        updateTrayMenu();
        broadcastListeningStatus();
      }
    },
    {
      label: 'Pause Listening for 1 Hour',
      enabled: isListening,
      click: () => {
        pauseListeningForDuration(60 * 60 * 1000);
      }
    },
    {
      label: 'Assistant Settings',
      click: () => {
        if (floatingBarWindow && !floatingBarWindow.isDestroyed()) {
          floatingBarWindow.show();
          floatingBarWindow.webContents.send('jasper:open-settings');
        } else if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.show();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit J.A.S.P.E.R.',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

function pauseListeningForDuration(durationMs = 3600000) {
  const pauseUntil = Date.now() + durationMs;
  settingsManager.set('pauseUntil', pauseUntil);
  if (wakeWordManager) wakeWordManager.mute();

  if (pauseTimer) clearTimeout(pauseTimer);
  pauseTimer = setTimeout(() => {
    console.log('[Electron] Pause duration expired. Resuming background voice listening...');
    settingsManager.set('pauseUntil', null);
    if (settingsManager.get('backgroundListening') && wakeWordManager) {
      wakeWordManager.resume();
    }
    updateTrayMenu();
    broadcastListeningStatus();
  }, durationMs);

  updateTrayMenu();
  broadcastListeningStatus();
}

function broadcastListeningStatus() {
  const isListening = wakeWordManager ? wakeWordManager.isListening : false;
  const isPaused = settingsManager.get('pauseUntil') && Date.now() < settingsManager.get('pauseUntil');
  const payload = {
    isListening,
    isPaused,
    pauseUntil: settingsManager.get('pauseUntil')
  };

  if (floatingBarWindow && !floatingBarWindow.isDestroyed()) {
    floatingBarWindow.webContents.send('jasper:listening-changed', payload);
  }
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('jasper:listening-changed', payload);
  }
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
  updateTrayMenu();

  tray.on('double-click', () => {
    if (floatingBarWindow && !floatingBarWindow.isDestroyed()) {
      if (floatingBarWindow.isVisible()) {
        floatingBarWindow.hide();
      } else {
        floatingBarWindow.show();
      }
      updateTrayMenu();
    }
  });
}

function createFloatingBarWindow() {
  const isSiriOrb = settingsManager.get('desktopWidgetStyle') !== 'classic_bar';
  const pos = settingsManager.get('floatingBarPosition');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  const defaultWidth = isSiriOrb ? 84 : 480;
  const defaultHeight = isSiriOrb ? 84 : 72;
  const defaultX = isSiriOrb ? screenWidth - 110 : Math.round((screenWidth - defaultWidth) / 2);
  const defaultY = isSiriOrb ? screenHeight - 140 : 32;

  const barX = (pos && typeof pos.x === 'number') ? pos.x : defaultX;
  const barY = (pos && typeof pos.y === 'number') ? pos.y : defaultY;

  floatingBarWindow = new BrowserWindow({
    width: defaultWidth,
    height: defaultHeight,
    x: barX,
    y: barY,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    focusable: true,
    show: false, // will show after ready-to-show
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  floatingBarWindow.setAlwaysOnTop(true, 'screen-saver');

  const mode = isSiriOrb ? 'siri_widget' : 'floating_bar';
  const distPath = path.join(__dirname, '..', 'client', 'dist', 'index.html');

  if (app.isPackaged || require('fs').existsSync(distPath)) {
    floatingBarWindow.loadFile(distPath, {
      query: { mode }
    });
  } else {
    floatingBarWindow.loadURL(`http://localhost:5173/?mode=${mode}`);
  }

  floatingBarWindow.once('ready-to-show', () => {
    if (settingsManager.get('floatingBarVisible') !== false) {
      floatingBarWindow.showInactive();
    }
  });

  // Track and persist drag position
  floatingBarWindow.on('moved', () => {
    if (floatingBarWindow && !floatingBarWindow.isDestroyed()) {
      const [x, y] = floatingBarWindow.getPosition();
      settingsManager.set('floatingBarPosition', { x, y });
    }
  });

  floatingBarWindow.on('closed', () => {
    floatingBarWindow = null;
  });
}

function createMainWindow() {
  const iconPath = process.platform === 'win32'
    ? path.join(__dirname, 'assets', 'icon.ico')
    : path.join(__dirname, 'assets', 'icon.png');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    icon: iconPath,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Native Web Bluetooth support for Fitbands & Smart Devices in Electron
  mainWindow.webContents.on('select-bluetooth-device', (event, deviceList, callback) => {
    event.preventDefault();
    console.log(`[Electron Bluetooth] Discovery event received. Found ${deviceList ? deviceList.length : 0} device(s).`);
    if (deviceList && deviceList.length > 0) {
      callback(deviceList[0].deviceId);
    } else {
      callback('');
    }
  });

  try {
    mainWindow.webContents.session.setBluetoothPairingHandler((details, callback) => {
      console.log(`[Electron Bluetooth] Pairing request (${details.pairingKind}) for device: ${details.deviceId}`);
      callback({ response: true });
    });
  } catch (_) {}

  const distPath = path.join(__dirname, '..', 'client', 'dist', 'index.html');
  if (app.isPackaged || require('fs').existsSync(distPath)) {
    mainWindow.loadFile(distPath);
  } else {
    mainWindow.loadURL('http://localhost:5173');
  }

  mainWindow.once('ready-to-show', () => {
    // Show on start unless launched with --hidden or --widget-only
    if (!process.argv.includes('--hidden') && !process.argv.includes('--widget-only')) {
      mainWindow.show();
    }
  });

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
    globalShortcut.unregisterAll();
    const hotkey = settingsManager.get('globalShortcut') || 'CommandOrControl+Alt+J';
    
    const triggerAssistant = () => {
      console.log(`[Electron] Global assistant hotkey triggered!`);
      if (floatingBarWindow && !floatingBarWindow.isDestroyed()) {
        if (!floatingBarWindow.isVisible()) {
          floatingBarWindow.show();
        }
        floatingBarWindow.focus();
        floatingBarWindow.webContents.send('jasper:toggle-command-bar');
      } else if (mainWindow && !mainWindow.isDestroyed()) {
        if (mainWindow.isVisible() && mainWindow.isFocused()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    };

    const ret = globalShortcut.register(hotkey, triggerAssistant);
    try {
      globalShortcut.register('CommandOrControl+Space', triggerAssistant);
    } catch (_) {}

    if (ret) {
      console.log(`[Electron] Global shortcut ${hotkey} registered successfully.`);
    } else {
      console.warn(`[Electron] Global shortcut ${hotkey} registration failed.`);
    }
  } catch (e) {
    console.error('[Electron] Hotkey registration error:', e);
  }
}

// =========================================================================
// IPC HANDLERS FOR RENDERER WINDOWS
// =========================================================================

ipcMain.on('jasper:focus', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (!mainWindow.isVisible()) mainWindow.show();
    mainWindow.focus();
  }
});
ipcMain.on('jasper:minimize', () => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.minimize();
});
ipcMain.on('jasper:maximize', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  }
});
ipcMain.on('jasper:close', () => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close();
});

// Floating Bar Controls
ipcMain.on('jasper:open-main-window', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
  } else {
    createMainWindow();
  }
});
ipcMain.on('jasper:hide-main-window', () => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.hide();
});
ipcMain.on('jasper:show-bar', () => {
  if (floatingBarWindow && !floatingBarWindow.isDestroyed()) {
    floatingBarWindow.show();
    settingsManager.set('floatingBarVisible', true);
    updateTrayMenu();
  }
});
ipcMain.on('jasper:hide-bar', () => {
  if (floatingBarWindow && !floatingBarWindow.isDestroyed()) {
    floatingBarWindow.hide();
    settingsManager.set('floatingBarVisible', false);
    updateTrayMenu();
  }
});
ipcMain.on('jasper:toggle-bar', () => {
  if (floatingBarWindow && !floatingBarWindow.isDestroyed()) {
    const isVis = floatingBarWindow.isVisible();
    if (isVis) floatingBarWindow.hide();
    else floatingBarWindow.show();
    settingsManager.set('floatingBarVisible', !isVis);
    updateTrayMenu();
  }
});
ipcMain.on('jasper:resize-bar', (event, { width, height, x, y }) => {
  if (floatingBarWindow && !floatingBarWindow.isDestroyed() && width && height) {
    if (typeof x === 'number' && typeof y === 'number') {
      floatingBarWindow.setBounds({
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(width),
        height: Math.round(height)
      }, true);
    } else {
      floatingBarWindow.setSize(Math.round(width), Math.round(height), true);
    }
  }
});
ipcMain.on('jasper:move-bar-by', (event, { dx, dy }) => {
  if (floatingBarWindow && !floatingBarWindow.isDestroyed() && (dx || dy)) {
    const [curX, curY] = floatingBarWindow.getPosition();
    floatingBarWindow.setPosition(Math.round(curX + dx), Math.round(curY + dy));
  }
});
ipcMain.on('jasper:save-bar-position', (event, pos) => {
  if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
    settingsManager.set('floatingBarPosition', pos);
  }
});

// Listening & Speech Controls
ipcMain.handle('jasper:toggle-listening', () => {
  if (!wakeWordManager) return { isListening: false };
  if (wakeWordManager.isListening) {
    wakeWordManager.mute();
    settingsManager.set('backgroundListening', false);
  } else {
    settingsManager.set('backgroundListening', true);
    settingsManager.set('pauseUntil', null);
    if (pauseTimer) clearTimeout(pauseTimer);
    wakeWordManager.resume();
  }
  updateTrayMenu();
  broadcastListeningStatus();
  return { isListening: wakeWordManager.isListening };
});

ipcMain.handle('jasper:set-listening', (event, enabled) => {
  settingsManager.set('backgroundListening', !!enabled);
  if (enabled) {
    settingsManager.set('pauseUntil', null);
    if (pauseTimer) clearTimeout(pauseTimer);
    if (wakeWordManager) wakeWordManager.resume();
  } else {
    if (wakeWordManager) wakeWordManager.mute();
  }
  updateTrayMenu();
  broadcastListeningStatus();
  return { isListening: wakeWordManager ? wakeWordManager.isListening : false };
});

ipcMain.handle('jasper:pause-listening', (event, durationMs = 3600000) => {
  pauseListeningForDuration(durationMs);
  return { paused: true, pauseUntil: settingsManager.get('pauseUntil') };
});

ipcMain.handle('jasper:get-listening-status', () => {
  return {
    isListening: wakeWordManager ? wakeWordManager.isListening : false,
    isPaused: settingsManager.get('pauseUntil') && Date.now() < settingsManager.get('pauseUntil'),
    pauseUntil: settingsManager.get('pauseUntil'),
    wakeWordEnabled: settingsManager.get('wakeWordEnabled'),
    wakePhrase: settingsManager.get('wakePhrase')
  };
});

ipcMain.on('jasper:stop-speech', () => {
  console.log('[Electron] Stop speech requested.');
  if (floatingBarWindow && !floatingBarWindow.isDestroyed()) {
    floatingBarWindow.webContents.send('jasper:stop-speech');
  }
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('jasper:stop-speech');
  }
});

// Settings Management IPC
ipcMain.handle('jasper:get-settings', () => {
  return settingsManager.getAll();
});

ipcMain.handle('jasper:save-settings', (event, newSettings) => {
  const updated = settingsManager.update(newSettings);
  if (newSettings.startWithWindows !== undefined) {
    try {
      app.setLoginItemSettings({
        openAtLogin: !!newSettings.startWithWindows,
        path: process.execPath,
        args: ['--hidden']
      });
    } catch (_) {}
  }
  if (newSettings.globalShortcut) {
    registerGlobalHotkeys();
  }
  if (newSettings.wakeWordSensitivity !== undefined && wakeWordManager) {
    wakeWordManager.setThreshold(newSettings.wakeWordSensitivity);
  }
  updateTrayMenu();
  return updated;
});

// App Startup Lifecycle
app.whenReady().then(() => {
  if (USE_LOCAL_SERVER) {
    startBackendServer();
  } else {
    console.log('[Electron] Running in 24/7 Cloud mode connecting to:', CLOUD_URL);
  }

  // Windows startup registration sync
  try {
    app.setLoginItemSettings({
      openAtLogin: settingsManager.get('startWithWindows'),
      path: process.execPath,
      args: ['--hidden']
    });
  } catch (_) {}

  createTray();
  registerGlobalHotkeys();
  initWakeWordEngine();

  // Create floating bar and main window
  createFloatingBarWindow();
  if (!process.argv.includes('--widget-only')) {
    setTimeout(createMainWindow, 600);
  } else {
    console.log('[Electron] Running in Standalone Siri Desktop Widget mode (--widget-only). Main HUD will open on demand.');
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createFloatingBarWindow();
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Jasper stays running in background tray even when all windows close
  if (process.platform !== 'darwin' && isQuitting) {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('before-quit', () => {
  isQuitting = true;
  console.log('[Electron] Clean shutdown initiated...');

  if (wakeWordManager) {
    wakeWordManager.stop();
  }

  if (serverProcess && serverProcess.pid) {
    console.log('[Electron] Terminating backend server process tree...');
    if (process.platform === 'win32') {
      try {
        require('child_process').execSync(`taskkill /F /T /PID ${serverProcess.pid}`, { stdio: 'ignore' });
      } catch (e) {}
    } else {
      serverProcess.kill();
    }
  }
});
