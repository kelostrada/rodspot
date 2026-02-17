const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const distPath = path.join(__dirname, '..', 'dist');

function build() {
  const appImage = path.join(distPath, 'RodSpot.AppImage');
  
  if (!fs.existsSync(appImage)) {
    console.log('No AppImage build found, skipping');
    return;
  }
  
  const newDir = path.join(distPath, 'linux');
  if (fs.existsSync(newDir)) {
    fs.rmSync(newDir, { recursive: true });
  }
  fs.mkdirSync(newDir);
  
  const newAppImage = path.join(newDir, 'RodSpot.AppImage');
  fs.renameSync(appImage, newAppImage);
  console.log('Moved to dist/linux/RodSpot.AppImage');
  
  const zipPath = path.join(distPath, 'RodSpot-linux.zip');
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }
  
  console.log('Creating ZIP...');
  execSync(`cd "${distPath}" && zip -r RodSpot-linux.zip linux`);
  console.log('Created:', zipPath);
}

build();
