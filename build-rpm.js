const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = process.argv[2];
if (!app) {
   console.error('Usage: node build-rpm.js <app>');
   process.exit(1);
}

const topdir = path.join(__dirname, 'rpmbuild');
const specsDir = path.join(topdir, 'SPECS');
const sourcesDir = path.join(topdir, 'SOURCES', app);
const spec = path.join(__dirname, 'specs', `${app}.spec`);

fs.mkdirSync(specsDir, { recursive: true });
fs.rmSync(sourcesDir, { recursive: true, force: true });
fs.mkdirSync(sourcesDir, { recursive: true });

const unpackedSrc = path.resolve(__dirname, `dist/${app}/linux-unpacked`);
const unpackedDst = path.join(sourcesDir, 'linux-unpacked');
const iconSrc = path.resolve(__dirname, `${app}/icon.png`);
const iconDst = path.join(sourcesDir, 'icon.png');

fs.symlinkSync(unpackedSrc, unpackedDst);
fs.symlinkSync(iconSrc, iconDst);

execSync(`rpmbuild --define "_topdir ${topdir}" -bb ${spec}`, { stdio: 'inherit' });
