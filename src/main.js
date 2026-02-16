const { app, BrowserWindow, screen, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

let overlayWindow;
let mouseTracker = null;

const configPath = path.join(app.getPath('userData'), 'rodspot-config.json');

function loadSavedBounds() {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.log('Could not load saved bounds:', e);
  }
  return null;
}

function saveBounds(bounds) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(bounds));
    console.log('Saved bounds:', bounds);
  } catch (e) {
    console.log('Could not save bounds:', e);
  }
}

function createOverlay() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  overlayWindow = new BrowserWindow({
    width: 600,
    height: 440,
    x: 100,
    y: 100,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    hasShadow: false,
    movable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Set window to ignore mouse events - clicks pass through to underlying apps
  overlayWindow.setIgnoreMouseEvents(true);
  
  overlayWindow.loadFile('src/index.html');
  
  overlayWindow.on('moved', () => {
    const bounds = overlayWindow.getBounds();
    sendBoundsToRenderer();
    saveBounds(bounds);
    restartMouseTracker(); // Restart tracker with new bounds
  });
  
  overlayWindow.on('resized', () => {
    const bounds = overlayWindow.getBounds();
    sendBoundsToRenderer();
    saveBounds(bounds);
    restartMouseTracker(); // Restart tracker with new bounds
  });

  console.log('RodSpot overlay created in passthrough mode');
}

// Start the global mouse tracker
function startMouseTracker() {
  if (mouseTracker) {
    mouseTracker.kill();
    mouseTracker = null;
  }
  
  if (!overlayWindow || overlayWindow.isDestroyed()) return;
  
  const bounds = overlayWindow.getBounds();
  const trackerPath = path.join(__dirname, '..', 'build', 'global_mouse_tracker');
  
  console.log('Starting mouse tracker with bounds:', bounds);
  
  mouseTracker = spawn(trackerPath, [
    bounds.x.toString(),
    bounds.y.toString(),
    bounds.width.toString(),
    bounds.height.toString()
  ]);
  
  mouseTracker.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      console.log('Tracker:', line);
      
      // Parse TILE_CLICKED messages
      if (line.startsWith('TILE_CLICKED')) {
        const parts = line.split(' ');
        if (parts.length >= 5) {
          const col = parseInt(parts[1]);
          const row = parseInt(parts[2]);
          const x = parseInt(parts[3]);
          const y = parseInt(parts[4]);
          
          // Send to renderer to highlight the tile
          if (overlayWindow && !overlayWindow.isDestroyed()) {
            overlayWindow.webContents.send('tile-clicked', { col, row, x, y });
          }
        }
      }
    });
  });
  
  mouseTracker.stderr.on('data', (data) => {
    console.error('Tracker error:', data.toString());
  });
  
  mouseTracker.on('close', (code) => {
    console.log('Mouse tracker exited with code:', code);
    mouseTracker = null;
  });
  
  mouseTracker.on('error', (err) => {
    console.error('Failed to start mouse tracker:', err.message);
    console.error('Make sure global_mouse_tracker is compiled: gcc -framework ApplicationServices -o global_mouse_tracker global_mouse_tracker.c');
  });
}

function restartMouseTracker() {
  if (mouseTracker) {
    mouseTracker.kill();
    setTimeout(startMouseTracker, 100);
  } else {
    startMouseTracker();
  }
}

ipcMain.on('set-fullscreen', (event, fullscreen) => {
  console.log('set-fullscreen called', fullscreen);
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    if (fullscreen) {
      const primaryDisplay = screen.getPrimaryDisplay();
      console.log('Setting fullscreen bounds:', primaryDisplay.bounds);
      overlayWindow.setBounds({
        x: 0,
        y: 0,
        width: primaryDisplay.bounds.width,
        height: primaryDisplay.bounds.height
      });
    }
  }
});

ipcMain.on('set-normal-size', (event, bounds) => {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.setBounds(bounds);
  }
});

ipcMain.handle('set-overlay-bounds', (event, bounds) => {
  console.log('set-overlay-bounds called', bounds);
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.setBounds(bounds);
    overlayWindow.webContents.send('bounds-changed', overlayWindow.getBounds());
    saveBounds(bounds);
    restartMouseTracker();
    return { success: true };
  }
  return { error: 'Window not available' };
});

ipcMain.handle('get-saved-bounds', () => {
  return loadSavedBounds();
});

function sendBoundsToRenderer() {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    const bounds = overlayWindow.getBounds();
    overlayWindow.webContents.send('bounds-changed', bounds);
  }
}

app.whenReady().then(() => {
  console.log('App ready...');
  createOverlay();
  
  // Start the mouse tracker after window is created
  setTimeout(startMouseTracker, 1000);
  
  // Focus the window to enable keyboard input
  if (overlayWindow) {
    overlayWindow.focus();
  }
});

app.on('window-all-closed', () => {
  if (mouseTracker) {
    mouseTracker.kill();
    mouseTracker = null;
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (mouseTracker) {
    mouseTracker.kill();
    mouseTracker = null;
  }
});
