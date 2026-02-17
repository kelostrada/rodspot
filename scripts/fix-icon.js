const rcedit = require('rcedit').rcedit;
const path = require('path');

const exePath = path.join(__dirname, '..', 'dist', 'win-unpacked', 'RodSpot.exe');
const iconPath = path.join(__dirname, '..', 'assets', 'icon.ico');

rcedit(exePath, { icon: iconPath })
  .then(() => console.log('Icon set successfully'))
  .catch((err) => console.error('Error setting icon:', err));
