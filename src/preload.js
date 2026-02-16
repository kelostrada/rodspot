const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getScreenSize: () => ipcRenderer.sendSync('get-screen-size'),
  onBoundsChanged: (callback) => ipcRenderer.on('bounds-changed', (event, bounds) => callback(bounds)),
  onScreenSize: (callback) => ipcRenderer.on('screen-size', (event, size) => callback(size)),
  onTileClicked: (callback) => ipcRenderer.on('tile-clicked', (event, data) => callback(data)),
  setOverlayBounds: (bounds) => ipcRenderer.invoke('set-overlay-bounds', bounds),
  getSavedBounds: () => ipcRenderer.invoke('get-saved-bounds'),
  setFullscreen: (enabled) => ipcRenderer.send('set-fullscreen', enabled),
  setNormalSize: (bounds) => ipcRenderer.send('set-normal-size', bounds)
});
