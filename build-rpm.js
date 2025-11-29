const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = process.argv[2];
if (!app) {
   console.error('Usage: node build-rpm.js <app>');
   process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const version = pkg.version;

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

// Copy spec with version from package.json
let specContent = fs.readFileSync(specSrc, 'utf8');
specContent = specContent.replace(/^Version:\s+.*/m, `Version:        ${version}`);
fs.writeFileSync(specDst, specContent);

const unpackedSrc = path.resolve(__dirname, `dist/${app}/linux-unpacked`);
const unpackedDst = path.join(sourcesDir, 'linux-unpacked');

const iconSrc = path.resolve(__dirname, `${app}/icon.png`);
const iconDst = path.join(sourcesDir, 'icon.png');

fs.symlinkSync(unpackedSrc, unpackedDst);
fs.symlinkSync(iconSrc, iconDst);

execSync(`rpmbuild --define "_topdir ${topdir}" -bb ${specDst}`, { stdio: 'inherit' });
