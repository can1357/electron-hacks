// Linux fixes for Claude Desktop
const { app, nativeImage, globalShortcut, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// Register F12 for DevTools (detached)
app.whenReady().then(() => {
   globalShortcut.register('F12', () => {
      BrowserWindow.getFocusedWindow()?.webContents.openDevTools({ mode: 'detach' });
   });
});

// Theme CSS
const themePath = path.join(__dirname, 'breeze.css');
let themeCSS = '';
if (fs.existsSync(themePath)) {
   themeCSS = fs.readFileSync(themePath, 'utf8');
   console.log('[Linux] Loaded theme CSS:', themeCSS.length, 'bytes');
}

// Icon
const iconPath = path.join(__dirname, 'icon.png');

// CSS to hide custom titlebar in shell windows
const hideTitlebarCSS = `.nc-drag { display: none !important; height: 0 !important; min-height: 0 !important; padding: 0 !important; margin: 0 !important; }`;

// Inject CSS into webContents
app.on('web-contents-created', (event, webContents) => {
   webContents.on('did-finish-load', () => {
      const url = webContents.getURL();
      // Hide custom titlebar in shell windows (file:// URLs)
      if (url.startsWith('file://')) {
         webContents.insertCSS(hideTitlebarCSS)
            .then(() => console.log('[Linux] Titlebar CSS injected'))
            .catch(() => {});
      }
      // Inject theme CSS into claude.ai
      if (themeCSS && url.includes('claude.ai')) {
         webContents.insertCSS(themeCSS)
            .then(() => console.log('[Linux] Theme injected'))
            .catch(() => {});
      }
   });
});

// Set icon on windows
app.on('browser-window-created', (event, window) => {
   if (process.platform === 'linux' && fs.existsSync(iconPath)) {
      const icon = nativeImage.createFromPath(iconPath);
      if (!icon.isEmpty()) window.setIcon(icon);
   }
});

// Load patched entry point
require('./.vite/build/index.js');
