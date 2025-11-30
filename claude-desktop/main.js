// Unified entry point for Claude Desktop on Linux
// Works with both system electron (AUR/dev) and bundled electron (RPM/AppImage)
const { app, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Detect environment by checking where Claude app exists
const baseDir = __dirname;

// Bundled: main.js is in resources/app/, Claude is in .vite/build/
// Dev/AUR: main.js is in app dir, Claude is in resources/app/.vite/build/
const bundledPath = path.join(baseDir, '.vite', 'build', 'index.js');
const devPath = path.join(baseDir, 'resources', 'app', '.vite', 'build', 'index.js');

const isBundled = fs.existsSync(bundledPath);
const claudeEntry = isBundled ? bundledPath : devPath;
const resourcesDir = isBundled ? path.dirname(baseDir) : path.join(baseDir, 'resources');

// Set resourcesPath for Claude's native module resolution (dev/AUR only)
if (!isBundled) {
   Object.defineProperty(process, 'resourcesPath', {
      get: () => resourcesDir,
      configurable: true
   });
}

// Set app path to where Claude's renderer files are
const appPath = isBundled ? baseDir : path.join(baseDir, 'resources', 'app');
app.setAppPath(appPath);

// Validate Claude app exists
if (!fs.existsSync(claudeEntry)) {
   console.error('[main] Claude Desktop resources not found at:', claudeEntry);
   console.error('[main] Run: npm run update-claude -- <installer>');
   process.exit(1);
}

// Set app identity before anything else
app.setName('Claude');
app.setPath('userData', path.join(os.homedir(), '.config', 'Claude'));
if (process.platform === 'linux') {
   app.setDesktopName('claude-desktop.desktop');
}

// Load supporting files relative to main.js location
const themePath = path.join(baseDir, 'breeze.css');
const iconPath = path.join(baseDir, 'icon.png');
const yoloPath = path.join(baseDir, 'auto-approve.js');

// Theme CSS
let themeCSS = '';
if (fs.existsSync(themePath)) {
   themeCSS = fs.readFileSync(themePath, 'utf8');
   console.log('[Theme] Loaded CSS:', themeCSS.length, 'bytes');
}

// YOLO mode: auto-approve all MCP tool requests (enabled by default)
const yoloDisabled = process.env.CLAUDE_NO_YOLO === '1' ||
   fs.existsSync(path.join(os.homedir(), '.config', 'Claude', 'no-yolo'));
let yoloScript = '';
if (!yoloDisabled && fs.existsSync(yoloPath)) {
   yoloScript = fs.readFileSync(yoloPath, 'utf8');
   console.log('[YOLO] Mode enabled');
}

// CSS to hide custom titlebar in shell windows
const hideTitlebarCSS = `.nc-drag { display: none !important; height: 0 !important; min-height: 0 !important; padding: 0 !important; margin: 0 !important; }`;

// Register F12 for DevTools (detached)
app.on('web-contents-created', (event, webContents) => {
   webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F12' && input.type === 'keyDown') {
         webContents.openDevTools({ mode: 'detach' });
      }
   });
});

// Inject CSS and scripts into webContents
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
         webContents.insertCSS(themeCSS).catch(() => {});
      }

      // YOLO auto-approve
      if (yoloScript) {
         webContents.executeJavaScript(yoloScript).catch(() => {});
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

// Load Claude
console.log('[main] Loading Claude from:', claudeEntry);
require(claudeEntry);
