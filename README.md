# RodSpot

A transparent grid overlay for **Tibia fishing** - helps you maintain spatial awareness and click accuracy during repetitive fishing sessions.

## Features

### Grid System
- **15x11 tile grid** overlay that can be positioned over any game window
- Grid automatically resizes with the window
- **Green border highlight** on click with 10-second fade-out animation

### Two Modes

#### Setup Mode (Default)
- Grid visible, can resize/move freely
- Can calibrate viewport bounds
- Menu and controls accessible

#### Fishing Mode
- Menu and drag handle hidden
- Window ignores mouse events (passthrough)
- Native global mouse tracker captures clicks through to the game
- Tile clicks are highlighted visually

### UI Controls
- **Calibrate** button: Start calibration mode
- **Start Fishing** button: Enter fishing mode
- **Exit** button: Close the application

### System Tray
- App runs in the system tray (bottom-right corner)
- **Double-click** tray icon to show window
- **Right-click** for menu (Show Window, Exit)

### Window Management
- **Drag handle**: Move the overlay window
- Always-on-top window
- Transparent, frameless overlay
- Saves window position and size between sessions

### Keyboard Shortcuts
- `C` - Start calibration
- `ESC` - Exit fishing mode (works globally)

## Building

### Prerequisites

**All Platforms:**
- Node.js and npm

**Platform-specific:**

- **macOS**: Xcode Command Line Tools (`xcode-select --install`)
- **Windows**: MinGW or Visual Studio with C compiler
- **Linux**: GCC and X11 development libraries (`sudo apt install libx11-dev`)

### Build Commands

```bash
# Install dependencies
npm install

# Build native mouse tracker (auto-detects platform)
npm run build-native

# Run in development
npm run dev

# Build for distribution
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

### Build Output

After building, the output is located in `dist/`:

| Platform | Folder | ZIP |
|----------|--------|-----|
| Windows | `dist/win/` | `dist/RodSpot-win64.zip` |
| macOS | `dist/macos/` | `dist/RodSpot-macos.zip` |
| Linux | `dist/linux/` | `dist/RodSpot-linux.zip` |

### Running the Built App

**Windows:**
```bash
dist/win/RodSpot.exe
```

**macOS:**
```bash
dist/macos/RodSpot.app/Contents/MacOS/RodSpot
```

**Linux:**
```bash
dist/linux/RodSpot.AppImage
```

## Usage

### Running the App

```bash
npm start
```

This automatically builds the native mouse tracker and launches the app.

### Setup Mode

1. **Position the overlay**: Drag using the top handle to position over your game
2. **Resize**: Drag edges to adjust grid size
3. **Calibrate**: Click "Calibrate" then click top-left and bottom-right corners of your game viewport

### Fishing Mode

1. Click **Start Fishing** button
2. Menu and drag handle disappear - the window is now transparent to mouse
3. Click anywhere on the grid - tiles will highlight with a green border
4. Clicks pass through to your game naturally
5. Press **ESC** anywhere to exit fishing mode and return to setup mode

## Architecture

### How It Works

1. **Normal Mode**: Electron window handles clicks directly for setup/resize
2. **Fishing Mode**: 
   - Window uses `setIgnoreMouseEvents(true)` for passthrough
   - Native C process monitors global mouse events
   - Calculates which tile was clicked based on screen coordinates
   - Sends tile info to renderer for highlighting

### Components

- **Electron Main Process** (`src/main.js`): Window management, native process management, IPC
- **Renderer Process** (`src/renderer.js`): Grid rendering, tile highlighting, UI updates
- **Preload Script** (`src/preload.js`): Secure IPC bridge
- **Native Mouse Tracker**: Platform-specific global mouse event capture

### Native Trackers
- `native/global_mouse_tracker.c` - macOS (CoreGraphics)
- `native/global_mouse_tracker_win.c` - Windows (Win32 API)
- `native/global_mouse_tracker_linux.c` - Linux (X11)

## License

MIT
