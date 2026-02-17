const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const platform = process.platform;
const buildDir = path.join(__dirname, '..', 'build');

if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

if (platform === 'darwin') {
  console.log('Building for macOS...');
  execSync('gcc -framework ApplicationServices -o build/global_mouse_tracker native/global_mouse_tracker.c', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });
  console.log('Built: build/global_mouse_tracker');
} else if (platform === 'win32') {
  console.log('Building for Windows...');
  try {
    execSync('gcc -o build/global_mouse_tracker.exe native/global_mouse_tracker_win.c -luser32 -lgdi32', {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    console.log('Built: build/global_mouse_tracker.exe');
  } catch (e) {
    console.log('GCC not found, trying MinGW...');
    execSync('mingw32-gcc -o build/global_mouse_tracker.exe native/global_mouse_tracker_win.c -luser32 -lgdi32', {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    console.log('Built: build/global_mouse_tracker.exe');
  }
} else if (platform === 'linux') {
  console.log('Building for Linux...');
  execSync('gcc -o build/global_mouse_tracker native/global_mouse_tracker_linux.c $(pkg-config --cflags --libs x11)', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });
  console.log('Built: build/global_mouse_tracker');
} else {
  console.log('Unsupported platform:', platform);
  process.exit(1);
}
