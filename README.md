# RodSpot

A transparent grid overlay for gaming applications, designed to help with spatial awareness and clicking accuracy.

## Features

### Implemented ✓

#### Grid System
- **15x11 tile grid** overlay that can be positioned over any game window
- Each tile can be highlighted when clicked
- Grid automatically resizes with the window
- **Green border highlight** on click with 10-second fade-out animation
- Click directly on tiles to highlight them

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

1. **Electron Overlay Window**: Displays the transparent grid with click handling enabled
2. **Tile Detection**: When you click on the grid, the renderer calculates which tile was clicked based on click position
3. **Highlighting**: The clicked tile is highlighted with a green border for 10 seconds

This design allows:
- ✅ **Interactive grid** - click tiles directly to highlight them
- ✅ **Easy menu access** - menu items and controls are clickable
- ✅ **Simple resizing/moving** - window can be resized and moved without issues

## Technical Implementation

### Components

- **Electron Main Process** (`src/main.js`): Window management, handles IPC
- **Renderer Process** (`src/renderer.js`): Grid rendering, tile detection on click, tile highlighting, UI updates
- **Preload Script** (`src/preload.js`): Secure IPC bridge between main and renderer

### Key Files
- `src/main.js` - Electron main process, window management
- `src/renderer.js` - Grid rendering, tile detection, UI logic
- `src/preload.js` - IPC bridge
- `src/index.html` - UI layout and styles

## Prerequisites

**macOS only**

No additional setup required - just run the app!

## Usage

1. **Start the app**:
   ```bash
   npm start
   ```

2. **Position the overlay**: Drag using the top handle to position over your game

3. **Calibrate**: Click "Calibrate" then click top-left and bottom-right of your game viewport

4. **Click tiles**: Click any grid tile - it will highlight with a green border

## Development Notes

### Design Philosophy
The overlay window handles clicks directly, making it simple and reliable:
1. Clicks on the grid are detected by the renderer
2. Tile position is calculated based on click coordinates relative to the container
3. The clicked tile is highlighted

This approach is simple and avoids the complexity of global mouse tracking.

### Current Limitations
- **macOS only** - Uses Electron APIs
- **Grid size is fixed** (15x11)
- **No auto-calibration** - Manual calibration required

## License

MIT
