const fs = require('fs');
const path = require('path');

const staticSrc = path.join('.next', 'static');
const staticDest = path.join('.next', 'standalone', '.next', 'static');
const publicSrc = 'public';
const publicDest = path.join('.next', 'standalone', 'public');

if (fs.existsSync(staticSrc)) {
  fs.cpSync(staticSrc, staticDest, { recursive: true, force: true });
}
if (fs.existsSync(publicSrc)) {
  fs.cpSync(publicSrc, publicDest, { recursive: true, force: true });
}

console.log('✓ Standalone assets copied successfully.');
