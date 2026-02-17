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
  const gccPaths = [
    'gcc',
    'mingw32-gcc',
    'C:/msys64/ucrt64/bin/gcc.exe',
    '/c/msys64/ucrt64/bin/gcc.exe'
  ];
  
  let success = false;
  for (const gcc of gccPaths) {
    try {
      execSync(`${gcc} -o build/global_mouse_tracker.exe native/global_mouse_tracker_win.c -luser32 -lgdi32`, {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
      });
      console.log('Built: build/global_mouse_tracker.exe');
      success = true;
      break;
    } catch (e) {
      continue;
    }
  }
  
  if (!success) {
    console.error('No GCC found. Please install MinGW from https://www.msys2.org/');
    process.exit(1);
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
