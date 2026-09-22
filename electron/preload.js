const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('jasperElectron', {
  isElectron: true,
  platform: process.platform,
  focusWindow: () => ipcRenderer.send('jasper:focus'),
  minimizeWindow: () => ipcRenderer.send('jasper:minimize'),
  maximizeWindow: () => ipcRenderer.send('jasper:maximize'),
  closeWindow: () => ipcRenderer.send('jasper:close')
});
