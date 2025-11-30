#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
if (args.length < 2) {
   console.error('Usage: npm run new-app -- <name> <url> [--dark]');
   console.error('Example: npm run new-app -- slack https://slack.com');
   process.exit(1);
}

const name = args[0].toLowerCase();
const url = args[1];
const enableDark = args.includes('--dark');
const Name = name.charAt(0).toUpperCase() + name.slice(1);

const rootDir = path.join(__dirname, '..');
const appDir = path.join(rootDir, name);

if (fs.existsSync(appDir)) {
   console.error(`Error: ${name}/ already exists`);
   process.exit(1);
}

fs.mkdirSync(appDir, { recursive: true });

const mainJs = enableDark ? `const { app, BrowserWindow, shell, Menu, nativeTheme, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

app.setName('${Name}');
app.name = '${Name}';
nativeTheme.themeSource = 'dark';

const APP_URL = '${url}';
const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json');

let mainWindow;
let darkModeEnabled = true;
let darkCss;

function loadConfig() {
   try {
      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      darkModeEnabled = config.darkMode ?? true;
   } catch {
      darkModeEnabled = true;
   }
}

function saveConfig() {
   fs.writeFileSync(CONFIG_PATH, JSON.stringify({ darkMode: darkModeEnabled }));
}

function loadDarkCss() {
   const cssPath = path.join(__dirname, 'dark.css');
   darkCss = fs.readFileSync(cssPath, 'utf8');
}

async function injectDarkMode() {
   if (!mainWindow || !darkCss) return;
   if (darkModeEnabled) {
      await mainWindow.webContents.insertCSS(darkCss, { cssOrigin: 'user' });
   }
}

function toggleDarkMode() {
   darkModeEnabled = !darkModeEnabled;
   saveConfig();
   mainWindow.webContents.reload();
}

function createMenu() {
   return Menu.buildFromTemplate([
      {
         label: 'File',
         submenu: [{ role: 'quit' }]
      },
      {
         label: 'Edit',
         submenu: [
            { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
            { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }
         ]
      },
      {
         label: 'View',
         submenu: [
            { label: 'Dark Mode', type: 'checkbox', checked: darkModeEnabled, accelerator: 'CmdOrCtrl+D', click: toggleDarkMode },
            { type: 'separator' },
            { role: 'reload' }, { role: 'forceReload' }, { type: 'separator' },
            { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { type: 'separator' },
            { role: 'togglefullscreen' }
         ]
      },
      {
         label: 'Window',
         submenu: [{ role: 'minimize' }, { role: 'close' }]
      }
   ]);
}

function createWindow() {
   const urlObj = new URL(APP_URL);
   mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      backgroundColor: '#1a1a1a',
      icon: nativeImage.createFromPath(path.join(__dirname, 'icon.png')),
      webPreferences: {
         nodeIntegration: false,
         contextIsolation: true,
         spellcheck: true,
      },
      autoHideMenuBar: true,
   });

   mainWindow.webContents.setUserAgent(
      mainWindow.webContents.getUserAgent().replace(/Electron\\/\\S+\\s/, '')
   );

   mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith(urlObj.origin)) {
         return { action: 'allow' };
      }
      shell.openExternal(url);
      return { action: 'deny' };
   });

   mainWindow.webContents.on('did-finish-load', injectDarkMode);
   mainWindow.webContents.on('did-navigate-in-page', injectDarkMode);
   mainWindow.loadURL(APP_URL);
   mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
   loadConfig();
   loadDarkCss();
   Menu.setApplicationMenu(createMenu());
   createWindow();
   app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
   });
});

app.on('window-all-closed', () => { app.quit(); });
` : `const { app, BrowserWindow, shell, Menu, nativeTheme, nativeImage } = require('electron');
const path = require('path');

app.setName('${Name}');
app.name = '${Name}';
nativeTheme.themeSource = 'dark';

const APP_URL = '${url}';

let mainWindow;

function createMenu() {
   return Menu.buildFromTemplate([
      {
         label: 'File',
         submenu: [{ role: 'quit' }]
      },
      {
         label: 'Edit',
         submenu: [
            { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
            { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }
         ]
      },
      {
         label: 'View',
         submenu: [
            { role: 'reload' }, { role: 'forceReload' }, { type: 'separator' },
            { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { type: 'separator' },
            { role: 'togglefullscreen' }
         ]
      },
      {
         label: 'Window',
         submenu: [{ role: 'minimize' }, { role: 'close' }]
      }
   ]);
}

function createWindow() {
   const urlObj = new URL(APP_URL);
   mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      backgroundColor: '#1a1a1a',
      icon: nativeImage.createFromPath(path.join(__dirname, 'icon.png')),
      webPreferences: {
         nodeIntegration: false,
         contextIsolation: true,
         spellcheck: true,
      },
      autoHideMenuBar: true,
   });

   mainWindow.webContents.setUserAgent(
      mainWindow.webContents.getUserAgent().replace(/Electron\\/\\S+\\s/, '')
   );

   mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith(urlObj.origin)) {
         return { action: 'allow' };
      }
      shell.openExternal(url);
      return { action: 'deny' };
   });

   mainWindow.loadURL(APP_URL);
   mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
   Menu.setApplicationMenu(createMenu());
   createWindow();
   app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
   });
});

app.on('window-all-closed', () => { app.quit(); });
`;

fs.writeFileSync(path.join(appDir, 'main.js'), mainJs);

if (enableDark) {
   fs.writeFileSync(path.join(appDir, 'dark.css'), `/* Dark mode CSS for ${Name} - customize as needed */
:root {
   color-scheme: dark;
}

body {
   background-color: #1a1a1a !important;
}
`);
}

const builderConfig = {
   appId: `com.${name}.desktop`,
   productName: Name,
   directories: { output: `dist/${name}` },
   files: [`${name}/**/*`],
   asar: false,
   extraMetadata: {
      name: `${name}`,
      main: `${name}/main.js`
   },
   linux: {
      target: ['AppImage', 'deb'],
      category: 'Office',
      icon: `${name}/icon.png`,
      executableName: name
   }
};

fs.writeFileSync(
   path.join(rootDir, `electron-builder.${name}.json`),
   JSON.stringify(builderConfig, null, 2) + '\n'
);

const urlObj = new URL(url);
const specContent = `Name:           ${name}
Version:        1.0.0
Release:        1%{?dist}
Summary:        ${Name} desktop app for Linux
License:        MIT
URL:            ${url}

AutoReqProv:    no
%global _binaries_in_noarch_packages_terminate_build 0
%global debug_package %{nil}
%define _binary_payload w3.zstdio

%description
${Name} desktop application for Linux.

%install
mkdir -p %{buildroot}/opt/${name}
mkdir -p %{buildroot}/usr/bin
mkdir -p %{buildroot}/usr/share/applications
mkdir -p %{buildroot}/usr/share/icons/hicolor/512x512/apps

cp -r %{_sourcedir}/${name}/linux-unpacked/* %{buildroot}/opt/${name}/
rm -f %{buildroot}/opt/${name}/resources/app.asar
cp %{_sourcedir}/${name}/icon.png %{buildroot}/usr/share/icons/hicolor/512x512/apps/${name}.png

cat > %{buildroot}/usr/bin/${name} << 'EOF'
#!/bin/bash
/opt/${name}/${name} "$@"
EOF
chmod +x %{buildroot}/usr/bin/${name}

cat > %{buildroot}/usr/share/applications/${name}.desktop << 'EOF'
[Desktop Entry]
Name=${Name}
Comment=${Name} desktop application
Exec=/opt/${name}/${name} %U
Icon=${name}
Type=Application
Categories=Office;
StartupWMClass=${Name}
EOF

%files
/opt/${name}
/usr/bin/${name}
/usr/share/applications/${name}.desktop
/usr/share/icons/hicolor/512x512/apps/${name}.png

%changelog
`;

fs.mkdirSync(path.join(rootDir, 'specs'), { recursive: true });
fs.writeFileSync(path.join(rootDir, 'specs', `${name}.spec`), specContent);

const pkgJsonPath = path.join(rootDir, 'package.json');
const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));

pkgJson.scripts[`start:${name}`] = `electron ${name}/main.js`;
pkgJson.scripts[`build:${name}`] = `electron-builder --config electron-builder.${name}.json --linux`;
pkgJson.scripts[`build:${name}:deb`] = `electron-builder --config electron-builder.${name}.json --linux deb`;
pkgJson.scripts[`build:${name}:rpm`] = `electron-builder --config electron-builder.${name}.json --linux dir && node build-rpm.js ${name}`;
pkgJson.scripts[`build:${name}:appimage`] = `electron-builder --config electron-builder.${name}.json --linux AppImage`;

fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n');

console.log(`
Created ${name}/ app:
  ${name}/main.js${enableDark ? `\n  ${name}/dark.css` : ''}
  electron-builder.${name}.json
  specs/${name}.spec

Updated package.json with scripts:
  npm run start:${name}
  npm run build:${name}
  npm run build:${name}:deb
  npm run build:${name}:rpm
  npm run build:${name}:appimage

Next steps:
  1. Add ${name}/icon.png (512x512 recommended)
  2. Run: npm run start:${name}
`);
