const rcedit = require('rcedit').rcedit;
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const distPath = path.join(__dirname, '..', 'dist');
const exePath = path.join(distPath, 'win-unpacked', 'RodSpot.exe');
const iconPath = path.join(__dirname, '..', 'assets', 'icon.ico');

async function build() {
  console.log('Setting icon...');
  await rcedit(exePath, { icon: iconPath });
  console.log('Icon set successfully');
  
  const oldDir = path.join(distPath, 'win-unpacked');
  const newDir = path.join(distPath, 'win');
  
  if (fs.existsSync(newDir)) {
    fs.rmSync(newDir, { recursive: true });
  }
  
  fs.renameSync(oldDir, newDir);
  console.log('Renamed to dist/win');
  
  const zipPath = path.join(distPath, 'RodSpot-win64.zip');
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }
  
  console.log('Creating ZIP...');
  execSync(`powershell -command "Compress-Archive -Path '${newDir}/*' -DestinationPath '${zipPath}'"`, {
    cwd: distPath
  });
  console.log('Created:', zipPath);
}

build().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
