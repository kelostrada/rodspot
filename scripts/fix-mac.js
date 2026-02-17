const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const distPath = path.join(__dirname, '..', 'dist');

function build() {
  let macDir = path.join(distPath, 'mac');
  let armDir = path.join(distPath, 'mac-arm64');
  
  let sourceDir = null;
  let outputName = 'RodSpot-macos';
  
  if (fs.existsSync(armDir)) {
    sourceDir = armDir;
    outputName = 'RodSpot-macos-arm64';
  } else if (fs.existsSync(macDir)) {
    sourceDir = macDir;
  } else {
    console.log('No mac build found, skipping');
    return;
  }
  
  const newDir = path.join(distPath, 'macos');
  
  if (fs.existsSync(newDir)) {
    fs.rmSync(newDir, { recursive: true });
  }
  
  fs.renameSync(sourceDir, newDir);
  console.log('Renamed to dist/macos');
  
  const dsStore = path.join(newDir, '.DS_Store');
  if (fs.existsSync(dsStore)) {
    fs.unlinkSync(dsStore);
  }
  
  const zipPath = path.join(distPath, `${outputName}.zip`);
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }
  
  console.log('Creating ZIP...');
  execSync(`ditto -c -k --sequesterRsrc --keepParent "${path.join(distPath, 'macos')}" "${zipPath}"`);
  console.log('Created:', zipPath);
}

build();
