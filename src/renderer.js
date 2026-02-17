const GRID_COLS = 15;
const GRID_ROWS = 11;

const container = document.getElementById('grid-container');
const statusEl = document.getElementById('status');

let tiles = [];
let calibrationMode = null; // null, 'topleft', 'bottomright'

function createGrid() {
  container.innerHTML = '';
  tiles = [];

  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.dataset.row = row;
      tile.dataset.col = col;
      container.appendChild(tile);
      tiles.push(tile);
    }
  }

  updateTilePositions();
}

function updateTilePositions() {
  const containerRect = container.getBoundingClientRect();
  const tileWidth = containerRect.width / GRID_COLS;
  const tileHeight = containerRect.height / GRID_ROWS;
  
  tiles.forEach((tile, index) => {
    const row = Math.floor(index / GRID_COLS);
    const col = index % GRID_COLS;
    
    tile.style.width = `${tileWidth}px`;
    tile.style.height = `${tileHeight}px`;
    tile.style.left = `${col * tileWidth}px`;
    tile.style.top = `${row * tileHeight}px`;
  });
}

const dragHandle = document.getElementById('drag-handle');
const controls = document.getElementById('controls');
let statusHideTimeout = null;

function updateStatus(message) {
  statusEl.textContent = message;
  statusEl.classList.remove('hidden');
  
  if (statusHideTimeout) {
    clearTimeout(statusHideTimeout);
  }
  
  statusHideTimeout = setTimeout(() => {
    statusEl.classList.add('hidden');
  }, 15000);
}

function toggleMenu() {
  controls.classList.toggle('hidden');
  if (controls.classList.contains('hidden')) {
    dragHandle.classList.add('hidden');
  } else {
    dragHandle.classList.remove('hidden');
  }
}

let calibrationPoints = { topLeft: null, bottomRight: null };

function startCalibration() {
  calibrationMode = 'topleft';
  calibrationPoints = { topLeft: null, bottomRight: null };
  updateStatus('Click TOP-LEFT corner of viewport');
  container.style.cursor = 'crosshair';
  container.style.background = 'rgba(0, 255, 0, 0.1)';
  container.style.pointerEvents = 'all';
  console.log('Calibration started');

  // Expand window to fullscreen for calibration
  window.electronAPI.setFullscreen(true);
}

function handleCalibrationClick(e) {
  console.log('Click received', e.clientX, e.clientY);
  const rect = container.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  console.log('Container-relative click:', x, y);
  
  if (calibrationMode === 'topleft') {
    calibrationPoints.topLeft = { x, y };
    calibrationMode = 'bottomright';
    statusEl.textContent = 'Click BOTTOM-RIGHT corner of viewport';
  } else if (calibrationMode === 'bottomright') {
    calibrationPoints.bottomRight = { x, y };
    
    // Calculate actual viewport bounds
    const x1 = Math.min(calibrationPoints.topLeft.x, calibrationPoints.bottomRight.x);
    const y1 = Math.min(calibrationPoints.topLeft.y, calibrationPoints.bottomRight.y);
    const x2 = Math.max(calibrationPoints.topLeft.x, calibrationPoints.bottomRight.x);
    const y2 = Math.max(calibrationPoints.topLeft.y, calibrationPoints.bottomRight.y);
    
    const width = x2 - x1;
    const height = y2 - y1;
    
    // Get overlay window position
    const overlayBounds = container.getBoundingClientRect();
    
    // Convert to screen coordinates
    const screenX = overlayBounds.left + x1;
    const screenY = overlayBounds.top + y1;
    
    // Apply the bounds
    const newBounds = {
      x: Math.round(screenX),
      y: Math.round(screenY),
      width: Math.round(width),
      height: Math.round(height)
    };
    window.electronAPI.setOverlayBounds(newBounds);
    
    // Restore normal size
    window.electronAPI.setFullscreen(false);
    
    calibrationMode = null;
    container.style.cursor = 'default';
    statusEl.textContent = `Calibrated: ${Math.round(width)}x${Math.round(height)} at (${Math.round(screenX)}, ${Math.round(screenY)})`;
    
    // Update grid
    setTimeout(() => {
      updateTilePositions();
    }, 500);
  }
}

document.addEventListener('click', (e) => {
  console.log('Document click, mode:', calibrationMode);
  if (!calibrationMode) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  console.log('Processing calibration click at', e.clientX, e.clientY);
  
  const x = e.clientX;
  const y = e.clientY;
  
  if (calibrationMode === 'topleft') {
    calibrationPoints.topLeft = { x, y };
    calibrationMode = 'bottomright';
    updateStatus('Click BOTTOM-RIGHT corner of viewport');
    console.log('Saved topLeft:', x, y);
  } else if (calibrationMode === 'bottomright') {
    calibrationPoints.bottomRight = { x, y };
    console.log('Saved bottomRight:', x, y);

    // Calculate bounds
    const x1 = Math.min(calibrationPoints.topLeft.x, x);
    const y1 = Math.min(calibrationPoints.topLeft.y, y);
    const x2 = Math.max(calibrationPoints.topLeft.x, x);
    const y2 = Math.max(calibrationPoints.topLeft.y, y);
    const width = x2 - x1;
    const height = y2 - y1;

    console.log('Final bounds:', { x: x1, y: y1, width, height });

    // Apply bounds
    window.electronAPI.setOverlayBounds({
      x: Math.round(x1),
      y: Math.round(y1),
      width: Math.round(width),
      height: Math.round(height)
    });

    container.style.background = 'transparent';
    container.style.cursor = 'default';
    container.style.pointerEvents = '';
    calibrationMode = null;
    updateStatus(`Calibrated: ${Math.round(width)}x${Math.round(height)}`);
  }
});

document.getElementById('btn-calibrate').addEventListener('click', (e) => {
  e.stopPropagation();
  startCalibration();
});

let fishingMode = false;

document.getElementById('btn-start-fishing').addEventListener('click', (e) => {
  e.stopPropagation();
  startFishing();
});

document.getElementById('btn-exit').addEventListener('click', (e) => {
  e.stopPropagation();
  window.electronAPI.exit();
});

function startFishing() {
  fishingMode = true;
  document.getElementById('controls').classList.add('hidden');
  document.getElementById('drag-handle').classList.add('hidden');
  window.electronAPI.startFishing();
  updateStatus('Fishing mode - Press ESC to exit');
}

function stopFishing() {
  fishingMode = false;
  document.getElementById('controls').classList.remove('hidden');
  document.getElementById('drag-handle').classList.remove('hidden');
  window.electronAPI.stopFishing();
  updateStatus('Ready');
}

// Store timeout IDs for each tile to allow canceling
const tileTimeouts = new Map();

function highlightTile(tile) {
  // Clear existing timeout for this tile if any
  if (tileTimeouts.has(tile)) {
    clearTimeout(tileTimeouts.get(tile));
  }

  tile.classList.remove('highlight');
  void tile.offsetWidth;
  tile.classList.add('highlight');

  // Set new timeout and store it
  const timeoutId = setTimeout(() => {
    tile.classList.remove('highlight');
    tileTimeouts.delete(tile);
  }, 10000);

  tileTimeouts.set(tile, timeoutId);
}

window.electronAPI.onTileClicked(({ col, row, x, y }) => {
  if (!fishingMode) return;
  
  console.log('Tile clicked:', col, row, 'at', x, y);
  
  if (col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS) {
    const index = row * GRID_COLS + col;
    if (tiles[index]) {
      highlightTile(tiles[index]);
    }
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'c' || e.key === 'C') {
    startCalibration();
  }
});

window.electronAPI.onExitFishing(() => {
  stopFishing();
});

window.addEventListener('resize', () => {
  updateTilePositions();
});

window.electronAPI.onBoundsChanged((bounds) => {
  console.log('Window bounds:', bounds);
});

createGrid();

// Load saved bounds on startup
window.electronAPI.getSavedBounds().then(bounds => {
  if (bounds && bounds.x && bounds.y && bounds.width && bounds.height) {
    console.log('Loading saved bounds:', bounds);
    window.electronAPI.setOverlayBounds(bounds);
    updateStatus(`Loaded: ${bounds.width}x${bounds.height}`);
  }
});
