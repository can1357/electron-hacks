// Theme injection and frame fix for Claude Desktop on Linux
console.log('[main-desktop] Starting...');
const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Set app identity before anything else
app.setName('Claude');
app.setPath('userData', path.join(os.homedir(), '.config', 'Claude'));
if (process.platform === 'linux') {
   app.setDesktopName('claude-desktop.desktop');
}

// Frame fix must load early
console.log('[main-desktop] Loading frame-fix...');
require('./frame-fix');
console.log('[main-desktop] frame-fix loaded');

// Load and inject theme CSS into claude.ai webContents
const themePath = path.join(__dirname, 'breeze.css');
let themeCSS = '';
if (fs.existsSync(themePath)) {
   themeCSS = fs.readFileSync(themePath, 'utf8');
   console.log('[Theme] Loaded CSS:', themeCSS.length, 'bytes');
} else {
   console.error('[Theme] CSS file not found:', themePath);
}

// YOLO mode: auto-approve all MCP tool requests (enabled by default)
const yoloDisabled = process.env.CLAUDE_NO_YOLO === '1' ||
   fs.existsSync(path.join(os.homedir(), '.config', 'Claude', 'no-yolo'));
const yoloScript = yoloDisabled ? '' : fs.readFileSync(path.join(__dirname, 'auto-approve.js'), 'utf8');
if (!yoloDisabled) console.log('[YOLO] Mode enabled - auto-approving all MCP tools');

app.on('web-contents-created', (event, webContents) => {
   webContents.on('did-finish-load', () => {
      const url = webContents.getURL();
      if (!url.includes('claude.ai')) return;

      if (themeCSS) {
         webContents.insertCSS(themeCSS)
            .then(() => console.log('[Theme] Injected into:', url.slice(0, 50)))
            .catch(e => console.error('[Theme] Failed:', e));
      }

      if (yoloScript) {
         webContents.executeJavaScript(yoloScript)
            .catch(e => console.error('[YOLO] Inject failed:', e));
      }
   });
});

const resourcesDir = path.join(__dirname, 'resources');
const appDir = path.join(resourcesDir, 'app');
const asarPath = path.join(resourcesDir, 'app.asar');

// Prefer unpacked app folder (patched) over app.asar
const appEntry = fs.existsSync(appDir) ? appDir : asarPath;

if (!fs.existsSync(appEntry)) {
   console.error('Claude Desktop resources not found.');
   console.error('Run: npm run update-claude -- <installer>');
   process.exit(1);
}

console.log('[main-desktop] Loading from:', appEntry);

Object.defineProperty(process, 'resourcesPath', {
   get: () => resourcesDir,
   configurable: true
});

require(appEntry);
