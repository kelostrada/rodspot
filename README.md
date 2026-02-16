# RodSpot

A transparent grid overlay for gaming applications, designed to help with spatial awareness and clicking accuracy.

## Features

### Implemented ✓

#### Grid System
- **15x11 tile grid** overlay that can be positioned over any game window
- Each tile can be highlighted when clicked
- Grid automatically resizes with the window
- **Green border highlight** on click with 10-second fade-out animation

#### Global Mouse Tracking
- **Separate native process** (`global_mouse_tracker`) monitors all mouse clicks on macOS
- **Always-on passthrough mode** - overlay window never intercepts clicks
- Clicks pass naturally through to underlying applications (games)
- Automatic tile detection based on overlay bounds

#### Calibration
- Set custom viewport bounds by clicking **top-left** and **bottom-right** corners
- Grid automatically adjusts to calibrated area
- Saves calibration settings between sessions

#### UI Controls
- **Calibrate** button: Start calibration mode
- **Hide Menu** button: Hide/show the control panel
- **Status panel**: Shows current state, auto-hides after 15 seconds

#### Window Management
- **Drag handle**: Move the overlay window
- Always-on-top window
- Transparent, frameless overlay
- Saves window position and size between sessions

#### Keyboard Shortcuts
- `C` - Start calibration
- `M` - Toggle menu visibility

### Not Implemented / Future Ideas 💡

- **Custom grid sizes**: Currently hardcoded to 15x11
- **Color customization**: Highlight color is fixed (green)
- **Audio feedback**: Click sounds on tile selection
- **Game auto-detection**: Would automatically find game viewport

## Architecture

### How It Works

1. **Electron Overlay Window**: Displays the transparent grid, but is set to ignore all mouse events (`setIgnoreMouseEvents(true)`)
2. **Global Mouse Tracker**: Native C process that monitors ALL mouse clicks across the entire macOS system using Core Graphics event taps
3. **Tile Detection**: When a click occurs within the overlay bounds, the tracker calculates which tile was clicked and notifies the Electron app
4. **Highlighting**: Electron app receives the tile coordinates and highlights the appropriate tile

This design allows:
- ✅ **Natural mouse usage** - dragging, right-clicking, fishing, etc. work normally
- ✅ **No focus issues** - you never lose focus on your game
- ✅ **Accurate tracking** - clicks are detected globally, not just within the window

## Technical Implementation

### Components

- **Electron Main Process** (`src/main.js`): Window management, launches mouse tracker, handles IPC
- **Renderer Process** (`src/renderer.js`): Grid rendering, tile highlighting, UI updates
- **Global Mouse Tracker** (`global_mouse_tracker.c`): Native macOS process monitoring global mouse events
- **Preload Script** (`src/preload.js`): Secure IPC bridge between main and renderer

### Key Files
- `src/main.js` - Electron main process, window management
- `src/renderer.js` - Grid rendering, UI logic
- `src/preload.js` - IPC bridge
- `src/index.html` - UI layout and styles
- `native/global_mouse_tracker.c` - Native C mouse tracking source
- `build/global_mouse_tracker` - Compiled native tracker (generated)

## Prerequisites

**macOS only**

### 1. Compile the Global Mouse Tracker

The native mouse tracker lives in `native/` and compiles to `build/`:

```bash
npm run build-native
```

This compiles `native/global_mouse_tracker.c` to `build/global_mouse_tracker`.

### 2. Grant Accessibility Permissions

The global mouse tracker requires accessibility permissions to monitor system-wide mouse events:

1. Go to **System Preferences > Security & Privacy > Privacy > Accessibility**
2. Click the lock and enter your password
3. Add **Terminal** (or iTerm, or whichever terminal you use) to the list
4. Check the box to enable it

**Note**: You must grant permissions to your terminal application, not the Electron app itself.

## Usage

1. **Compile the mouse tracker**:
   ```bash
   npm run build-native
   ```

2. **Grant accessibility permissions** (see Prerequisites above)

3. **Start the app**:
   ```bash
   npm start
   ```

4. **Position the overlay**: Drag using the top handle to position over your game

5. **Calibrate**: Click "Calibrate" then click top-left and bottom-right of your game viewport

6. **Click tiles**: Click any grid tile - it will highlight with a green border AND the click passes through to your game naturally

**You can now**: drag items, right-click, fish, use all game features normally while seeing which tiles you click!

## Development Notes

### Design Philosophy
The key insight was that trying to intercept and forward clicks creates too many issues (focus, loops, drag operations). Instead, we:
1. Make the overlay completely ignore mouse events
2. Monitor clicks globally via a separate process
3. Calculate which tile was clicked based on screen coordinates

This gives us the best of both worlds: a visual grid overlay that doesn't interfere with gameplay.

### Challenges Encountered
- **Click interception issues**: Initial attempts to intercept and forward clicks caused focus problems and broken drag operations
- **Solution**: Use `setIgnoreMouseEvents(true)` on the Electron window and monitor clicks via a global event tap instead

- **Accessibility permissions**: macOS requires explicit user permission to monitor global input events
- **Solution**: Document the permission requirement clearly

### Current Limitations
- **macOS only** - Uses Core Graphics APIs specific to macOS
- **Requires compilation** - Native tracker needs to be compiled from C source
- **Grid size is fixed** (15x11)
- **No auto-calibration** - Manual calibration required

## License

MIT
