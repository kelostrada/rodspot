const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const distPath = path.join(__dirname, '..', 'dist');

function build() {
  const oldDir = path.join(distPath, 'mac');
  const newDir = path.join(distPath, 'macos');
  
  if (!fs.existsSync(oldDir)) {
    console.log('No mac build found, skipping');
    return;
  }
  
  if (fs.existsSync(newDir)) {
    fs.rmSync(newDir, { recursive: true });
  }
  
  fs.renameSync(oldDir, newDir);
  console.log('Renamed to dist/macos');
  
  const zipPath = path.join(distPath, 'RodSpot-macos.zip');
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }
  
  console.log('Creating ZIP...');
  execSync(`cd "${distPath}" && zip -r RodSpot-macos.zip macos`);
  console.log('Created:', zipPath);
}

build();
