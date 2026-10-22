const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('jasperElectron', {
  isElectron: true,
  platform: process.platform,

  // Window Management
  focusWindow: () => ipcRenderer.send('jasper:focus'),
  minimizeWindow: () => ipcRenderer.send('jasper:minimize'),
  maximizeWindow: () => ipcRenderer.send('jasper:maximize'),
  closeWindow: () => ipcRenderer.send('jasper:close'),

  // Desktop Floating Bar Actions
  openMainWindow: () => ipcRenderer.send('jasper:open-main-window'),
  hideMainWindow: () => ipcRenderer.send('jasper:hide-main-window'),
  showFloatingBar: () => ipcRenderer.send('jasper:show-bar'),
  hideFloatingBar: () => ipcRenderer.send('jasper:hide-bar'),
  toggleFloatingBar: () => ipcRenderer.send('jasper:toggle-bar'),
  resizeFloatingBar: (dims) => ipcRenderer.send('jasper:resize-bar', dims),
  saveBarPosition: (pos) => ipcRenderer.send('jasper:save-bar-position', pos),

  // Listening & Speech Controls
  toggleListening: () => ipcRenderer.invoke('jasper:toggle-listening'),
  setListening: (enabled) => ipcRenderer.invoke('jasper:set-listening', enabled),
  pauseListening: (durationMs) => ipcRenderer.invoke('jasper:pause-listening', durationMs),
  getListeningStatus: () => ipcRenderer.invoke('jasper:get-listening-status'),
  stopSpeech: () => ipcRenderer.send('jasper:stop-speech'),

  // Settings Management
  getSettings: () => ipcRenderer.invoke('jasper:get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('jasper:save-settings', settings),

  // Event Subscriptions from Main Process
  onWakeDetected: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('jasper:wake-detected', handler);
    return () => ipcRenderer.removeListener('jasper:wake-detected', handler);
  },
  onListeningChanged: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('jasper:listening-changed', handler);
    return () => ipcRenderer.removeListener('jasper:listening-changed', handler);
  },
  onOpenSettings: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('jasper:open-settings', handler);
    return () => ipcRenderer.removeListener('jasper:open-settings', handler);
  },
  onToggleCommandBar: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('jasper:toggle-command-bar', handler);
    return () => ipcRenderer.removeListener('jasper:toggle-command-bar', handler);
  }
});
