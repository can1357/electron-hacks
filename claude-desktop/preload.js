// Linux fixes for Claude Desktop
console.log('[preload] Starting...');
const { app, nativeImage, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Set app identity before anything else
app.setName('Claude');
app.setPath('userData', path.join(os.homedir(), '.config', 'Claude'));
if (process.platform === 'linux') {
   app.setDesktopName('claude-desktop.desktop');
}

// Register F12 for DevTools (detached) - capture at webContents level
app.on('web-contents-created', (event, webContents) => {
   webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F12' && input.type === 'keyDown') {
         console.log('[DevTools] F12 pressed');
         webContents.openDevTools({ mode: 'detach' });
      }
   });
});

// Theme CSS
const themePath = path.join(__dirname, 'breeze.css');
let themeCSS = '';
if (fs.existsSync(themePath)) {
   themeCSS = fs.readFileSync(themePath, 'utf8');
   console.log('[Theme] Loaded CSS:', themeCSS.length, 'bytes');
}

// YOLO mode: auto-approve all MCP tool requests (enabled by default)
const yoloDisabled = process.env.CLAUDE_NO_YOLO === '1' ||
   fs.existsSync(path.join(os.homedir(), '.config', 'Claude', 'no-yolo'));
let yoloScript = '';
if (!yoloDisabled) {
   const yoloPath = path.join(__dirname, 'auto-approve.js');
   if (fs.existsSync(yoloPath)) {
      yoloScript = fs.readFileSync(yoloPath, 'utf8');
      console.log('[YOLO] Mode enabled - auto-approving all MCP tools');
   }
} else {
   console.log('[YOLO] Mode disabled');
}

// Icon
const iconPath = path.join(__dirname, 'icon.png');

// CSS to hide custom titlebar in shell windows
const hideTitlebarCSS = `.nc-drag { display: none !important; height: 0 !important; min-height: 0 !important; padding: 0 !important; margin: 0 !important; }`;

// Inject into webContents
app.on('web-contents-created', (event, webContents) => {
   webContents.on('did-finish-load', () => {
      const url = webContents.getURL();

      // Hide custom titlebar in shell windows (file:// URLs)
      if (url.startsWith('file://')) {
         webContents.insertCSS(hideTitlebarCSS).catch(() => {});
      }

      if (!url.includes('claude.ai')) return;

      // Theme CSS
      if (themeCSS) {
         webContents.insertCSS(themeCSS)
            .then(() => console.log('[Theme] Injected into:', url.slice(0, 50)))
            .catch(e => console.error('[Theme] Failed:', e));
      }

      // YOLO auto-approve
      console.log('[YOLO] Attempting inject, script length:', yoloScript.length);
      if (yoloScript) {
         webContents.executeJavaScript(yoloScript)
            .then(() => console.log('[YOLO] Injected into:', url.slice(0, 50)))
            .catch(e => console.error('[YOLO] Inject failed:', e));
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
console.log('[preload] Loading Claude...');
require('./.vite/build/index.js');
