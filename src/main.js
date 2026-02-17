const { app, BrowserWindow, screen, ipcMain, globalShortcut, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const os = require('os');

let overlayWindow;
let mouseTracker = null;
let tray = null;

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

function validateBounds(bounds) {
  if (!bounds || !bounds.x || !bounds.y || !bounds.width || !bounds.height) {
    return null;
  }

  const displays = screen.getAllDisplays();
  let isVisible = false;

  for (const display of displays) {
    const { x, y, width, height } = display.bounds;
    const windowCenterX = bounds.x + bounds.width / 2;
    const windowCenterY = bounds.y + bounds.height / 2;

    if (windowCenterX >= x && windowCenterX <= x + width &&
        windowCenterY >= y && windowCenterY <= y + height) {
      isVisible = true;
      break;
    }
  }

  if (isVisible) {
    return bounds;
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  const adjustedWidth = Math.min(bounds.width, screenWidth - 100);
  const adjustedHeight = Math.min(bounds.height, screenHeight - 100);

  return {
    x: 100,
    y: 100,
    width: adjustedWidth,
    height: adjustedHeight
  };
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
    roundedCorners: false,
    movable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  overlayWindow.loadFile('src/index.html');
  
  overlayWindow.on('moved', () => {
    const bounds = overlayWindow.getBounds();
    sendBoundsToRenderer();
    saveBounds(bounds);
    restartMouseTracker();
  });
  
  overlayWindow.on('resized', () => {
    const bounds = overlayWindow.getBounds();
    sendBoundsToRenderer();
    saveBounds(bounds);
    restartMouseTracker();
  });

  console.log('RodSpot overlay created');
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
    return { success: true };
  }
  return { error: 'Window not available' };
});

ipcMain.handle('get-saved-bounds', () => {
  const savedBounds = loadSavedBounds();
  const validatedBounds = validateBounds(savedBounds);
  if (validatedBounds && JSON.stringify(validatedBounds) !== JSON.stringify(savedBounds)) {
    console.log('Adjusted out-of-screen bounds:', savedBounds, '->', validatedBounds);
    saveBounds(validatedBounds);
  }
  return validatedBounds;
});

function sendBoundsToRenderer() {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    const bounds = overlayWindow.getBounds();
    overlayWindow.webContents.send('bounds-changed', bounds);
  }
}

function startMouseTracker() {
  if (mouseTracker) {
    mouseTracker.kill();
    mouseTracker = null;
  }
  
  if (!overlayWindow || overlayWindow.isDestroyed()) return;
  
  const bounds = overlayWindow.getBounds();
  const ext = os.platform() === 'win32' ? '.exe' : '';
  
  let trackerPath;
  if (process.resourcesPath && fs.existsSync(path.join(process.resourcesPath, 'app.asar.unpacked', 'build', `global_mouse_tracker${ext}`))) {
    trackerPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'build', `global_mouse_tracker${ext}`);
  } else {
    trackerPath = path.join(__dirname, '..', 'build', `global_mouse_tracker${ext}`);
  }
  
  console.log('Starting mouse tracker:', trackerPath);
  console.log('Bounds:', bounds);
  
  mouseTracker = spawn(trackerPath, [
    bounds.x.toString(),
    bounds.y.toString(),
    bounds.width.toString(),
    bounds.height.toString()
  ]);
  
  mouseTracker.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      console.log('Tracker:', line);
      
      if (line.startsWith('TILE_CLICKED')) {
        const parts = line.split(' ');
        if (parts.length >= 5) {
          const col = parseInt(parts[1]);
          const row = parseInt(parts[2]);
          const x = parseInt(parts[3]);
          const y = parseInt(parts[4]);
          
          if (overlayWindow && !overlayWindow.isDestroyed()) {
            overlayWindow.webContents.send('tile-clicked', { col, row, x, y });
          }
        }
      }
    });
  });
  
  mouseTracker.on('close', (code) => {
    console.log('Mouse tracker exited with code:', code);
    mouseTracker = null;
  });
  
  mouseTracker.on('error', (err) => {
    console.error('Failed to start mouse tracker:', err.message);
  });
}

function stopMouseTracker() {
  if (mouseTracker) {
    mouseTracker.kill();
    mouseTracker = null;
    console.log('Mouse tracker stopped');
  }
}

function restartMouseTracker() {
  if (mouseTracker) {
    stopMouseTracker();
    setTimeout(startMouseTracker, 100);
  }
}

ipcMain.on('start-fishing', (event) => {
  console.log('Starting fishing mode - enabling passthrough');
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.setIgnoreMouseEvents(true);
    startMouseTracker();
  }
  
  // Register global shortcut for ESC to exit fishing mode
  globalShortcut.register('Escape', () => {
    console.log('ESC pressed - exiting fishing mode');
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.setIgnoreMouseEvents(false);
      overlayWindow.webContents.send('exit-fishing');
    }
    stopMouseTracker();
  });
});

ipcMain.on('stop-fishing', (event) => {
  console.log('Stopping fishing mode - disabling passthrough');
  globalShortcut.unregister('Escape');
  stopMouseTracker();
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.setIgnoreMouseEvents(false);
  }
});

ipcMain.on('exit-app', () => {
  app.quit();
});

function getIconPath() {
  let iconPath = path.join(__dirname, '..', 'assets', 'icon.png');
  if (!fs.existsSync(iconPath)) {
    iconPath = path.join(process.resourcesPath, 'assets', 'icon.png');
  }
  return iconPath;
}

function createTray() {
  const icon = nativeImage.createFromPath(getIconPath());
  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show Window', click: () => {
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.show();
        overlayWindow.focus();
      }
    }},
    { type: 'separator' },
    { label: 'Exit', click: () => app.quit() }
  ]);
  
  tray.setToolTip('RodSpot');
  tray.setContextMenu(contextMenu);
  
  tray.on('double-click', () => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.show();
      overlayWindow.focus();
    }
  });
}

app.whenReady().then(() => {
  console.log('App ready...');
  createTray();
  createOverlay();
  
  // Focus the window to enable keyboard input
  if (overlayWindow) {
    overlayWindow.focus();
  }
});

app.on('window-all-closed', () => {
  // Don't quit - keep running in system tray
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  stopMouseTracker();
});
