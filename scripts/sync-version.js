const fs = require('fs');
const path = require('path');

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const version = pkg.version;

const files = [
   { path: 'aur/miro-electron/PKGBUILD', pattern: /^pkgver=.*/m, replacement: `pkgver=${version}` },
   { path: 'aur/notion-electron/PKGBUILD', pattern: /^pkgver=.*/m, replacement: `pkgver=${version}` },
   { path: 'aur/claude-desktop-electron/PKGBUILD', pattern: /^pkgver=.*/m, replacement: `pkgver=${version}` },
   { path: 'specs/miro.spec', pattern: /^Version:\s+.*/m, replacement: `Version:        ${version}` },
   { path: 'specs/notion.spec', pattern: /^Version:\s+.*/m, replacement: `Version:        ${version}` },
   { path: 'specs/claude-desktop.spec', pattern: /^Version:\s+.*/m, replacement: `Version:        ${version}` },
];

for (const { path: rel, pattern, replacement } of files) {
   const file = path.join(__dirname, '..', rel);
   if (!fs.existsSync(file)) continue;
   let content = fs.readFileSync(file, 'utf8');
   content = content.replace(pattern, replacement);
   fs.writeFileSync(file, content);
   console.log(`Updated ${rel} to ${version}`);
}
