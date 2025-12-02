// Unified entry point for Claude Desktop on Linux
// Works with both system electron (AUR/dev) and bundled electron (RPM/AppImage)
const { app, nativeImage, session } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Feature flags (set env var to '1' to disable)
const flags = {
   noYolo: process.env.CLAUDE_NO_YOLO === '1',
   noTheme: process.env.CLAUDE_NO_THEME === '1',
   noThinking: process.env.CLAUDE_NO_THINKING === '1',
   noDevtools: process.env.CLAUDE_NO_DEVTOOLS === '1',
   noUaSpoof: process.env.CLAUDE_NO_UA_SPOOF === '1',
   noSentryBlock: process.env.CLAUDE_NO_SENTRY_BLOCK === '1',
};

console.log('[main] Feature flags:', flags);

// Spoof User-Agent to standard Chrome (unless disabled)
if (!flags.noUaSpoof) {
   const chromeUA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
   app.userAgentFallback = chromeUA;
   app.on('session-created', (sess) => {
      sess.setUserAgent(chromeUA);
   });
   console.log('[main] UA spoofing enabled');
}

// Block telemetry via webRequest API (Sentry + Anthropic analytics)
if (!flags.noSentryBlock) {
   const telemetryUrls = [
      '*://*.sentry.io/*',
      '*://claude.ai/sentry*',
      '*://a-api.anthropic.com/*',
   ];
   const blockTelemetry = (sess) => {
      sess.webRequest.onBeforeRequest({ urls: telemetryUrls }, (details, callback) => {
         callback({ redirectURL: 'data:application/json,{}' });
      });
   };
   app.on('session-created', blockTelemetry);
   app.whenReady().then(() => blockTelemetry(session.defaultSession));
   console.log('[main] Telemetry blocking enabled');
}

// Register preload script
const preloadPath = path.join(__dirname, 'preload.js');
if (fs.existsSync(preloadPath)) {
   app.on('session-created', (sess) => {
      sess.registerPreloadScript({ id: 'patches', type: 'frame', filePath: preloadPath });
   });
   console.log('[main] Preload script registered');
}

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
const themePath = path.join(baseDir, 'celestial.css');
const iconPath = path.join(baseDir, 'icon.png');
// Theme CSS
let themeCSS = '';
if (!flags.noTheme && fs.existsSync(themePath)) {
   themeCSS = fs.readFileSync(themePath, 'utf8');
   console.log('[Theme] Loaded CSS:', themeCSS.length, 'bytes');
}

// CSS to hide custom titlebar in shell windows
const hideTitlebarCSS = `.nc-drag { display: none !important; height: 0 !important; min-height: 0 !important; padding: 0 !important; margin: 0 !important; }`;

// Register F12 for DevTools (detached)
if (!flags.noDevtools) {
   app.on('web-contents-created', (event, webContents) => {
      webContents.on('before-input-event', (event, input) => {
         if (input.key === 'F12' && input.type === 'keyDown') {
            webContents.openDevTools({ mode: 'detach' });
         }
      });
   });
}

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
