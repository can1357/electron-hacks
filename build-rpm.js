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
const specSrc = path.join(__dirname, 'specs', `${app}.spec`);
const specDst = path.join(specsDir, `${app}.spec`);

fs.mkdirSync(specsDir, { recursive: true });
fs.rmSync(sourcesDir, { recursive: true, force: true });
fs.mkdirSync(sourcesDir, { recursive: true });

// Clean old RPMs for this app
const rpmsDir = path.join(topdir, 'RPMS');
if (fs.existsSync(rpmsDir)) {
   for (const arch of fs.readdirSync(rpmsDir)) {
      const archDir = path.join(rpmsDir, arch);
      if (fs.statSync(archDir).isDirectory()) {
         for (const rpm of fs.readdirSync(archDir)) {
            if (rpm.startsWith(`${app}-`)) {
               fs.unlinkSync(path.join(archDir, rpm));
            }
         }
      }
   }
}

fs.copyFileSync(specSrc, specDst);

const unpackedSrc = path.resolve(__dirname, `dist/${app}/linux-unpacked`);
const unpackedDst = path.join(sourcesDir, 'linux-unpacked');

if (!fs.existsSync(unpackedSrc)) {
   console.error(`Error: ${unpackedSrc} not found`);
   console.error(`Run: npm run build:${app}:appimage  (or build:${app} for all formats)`);
   process.exit(1);
}

fs.symlinkSync(unpackedSrc, unpackedDst);

// Symlink app files needed by spec
const appFiles = ['main.js', 'native-stub.js', 'auto-approve.js', 'force-thinking.js', 'celestial.css', 'icon.png', 'claude-quick'];
for (const file of appFiles) {
   const src = path.resolve(__dirname, `${app}/${file}`);
   if (fs.existsSync(src)) {
      fs.symlinkSync(src, path.join(sourcesDir, file));
   }
}

// Debug: print structure before rpmbuild
console.log('=== linux-unpacked/resources/app structure ===');
try {
   const appPath = path.join(sourcesDir, 'linux-unpacked', 'resources', 'app');
   execSync(`find ${appPath} -maxdepth 5`, { stdio: 'inherit' });
} catch (e) {
   console.log('Could not list app directory');
}
console.log('==============================================');

execSync(`rpmbuild --define "_topdir ${topdir}" -bb ${specDst}`, { stdio: 'inherit' });

// Copy built RPM to dist/{app}/
const distDir = path.join(__dirname, 'dist', app);
for (const arch of fs.readdirSync(rpmsDir)) {
   const archDir = path.join(rpmsDir, arch);
   if (!fs.statSync(archDir).isDirectory()) continue;
   for (const rpm of fs.readdirSync(archDir)) {
      if (rpm.startsWith(`${app}-`) && rpm.endsWith('.rpm')) {
         fs.copyFileSync(path.join(archDir, rpm), path.join(distDir, rpm));
         console.log(`Copied: ${rpm} -> dist/${app}/`);
      }
   }
}
