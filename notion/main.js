const { app, BrowserWindow, shell, Menu, nativeTheme, nativeImage, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

app.setName('Notion');
app.name = 'Notion';
if (process.platform === 'linux') {
   app.setDesktopName('notion.desktop');
}
nativeTheme.themeSource = 'dark';

// Spoof User-Agent to standard Chrome
const chromeUA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
app.userAgentFallback = chromeUA;
app.on('session-created', (sess) => {
   sess.setUserAgent(chromeUA);
});

const NOTION_URL = 'https://notion.so';

const themePath = path.join(__dirname, 'breeze.css');
let themeCSS = '';
if (fs.existsSync(themePath)) {
   themeCSS = fs.readFileSync(themePath, 'utf8');
   console.log('[Theme] Loaded Breeze CSS:', themeCSS.length, 'bytes');
}

let mainWindow;

function createMenu() {
   return Menu.buildFromTemplate([
      {
         label: 'File',
         submenu: [
            { role: 'quit' }
         ]
      },
      {
         label: 'Edit',
         submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            { role: 'selectAll' }
         ]
      },
      {
         label: 'View',
         submenu: [
            { role: 'reload' },
            { role: 'forceReload' },
            { type: 'separator' },
            { role: 'resetZoom' },
            { role: 'zoomIn' },
            { role: 'zoomOut' },
            { type: 'separator' },
            { role: 'togglefullscreen' }
         ]
      },
      {
         label: 'Window',
         submenu: [
            { role: 'minimize' },
            { role: 'close' }
         ]
      }
   ]);
}

function createWindow() {
   mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      backgroundColor: '#26292e',
      icon: nativeImage.createFromPath(path.join(__dirname, 'icon.png')),
      webPreferences: {
         nodeIntegration: false,
         contextIsolation: true,
         spellcheck: true,
      },
      autoHideMenuBar: true,
   });

   mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('https://notion.so') || url.startsWith('https://www.notion.so')) {
         return { action: 'allow' };
      }
      shell.openExternal(url);
      return { action: 'deny' };
   });

   mainWindow.loadURL(NOTION_URL);

   mainWindow.on('closed', () => {
      mainWindow = null;
   });
}

app.on('web-contents-created', (event, webContents) => {
   webContents.on('did-finish-load', () => {
      const url = webContents.getURL();
      if (!url.includes('notion.so')) return;
      if (themeCSS) {
         webContents.insertCSS(themeCSS).catch(() => {});
      }
   });
});

app.whenReady().then(() => {
   Menu.setApplicationMenu(createMenu());
   createWindow();

   globalShortcut.register('F12', () => {
      BrowserWindow.getFocusedWindow()?.webContents.toggleDevTools();
   });

   app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
         createWindow();
      }
   });
});

app.on('window-all-closed', () => {
   app.quit();
});
