const { app, BrowserWindow, shell, Menu, nativeTheme, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

app.setName('Miro');
app.name = 'Miro';
nativeTheme.themeSource = 'dark';

const MIRO_URL = 'https://miro.com';
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
            {
               label: 'Dark Mode',
               type: 'checkbox',
               checked: darkModeEnabled,
               accelerator: 'CmdOrCtrl+D',
               click: toggleDarkMode
            },
            { type: 'separator' },
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

   mainWindow.webContents.setUserAgent(
      mainWindow.webContents.getUserAgent().replace(/Electron\/\S+\s/, '')
   );

   mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('https://miro.com')) {
         return { action: 'allow' };
      }
      shell.openExternal(url);
      return { action: 'deny' };
   });

   mainWindow.webContents.on('did-finish-load', injectDarkMode);
   mainWindow.webContents.on('did-navigate-in-page', injectDarkMode);

   mainWindow.loadURL(MIRO_URL);

   mainWindow.on('closed', () => {
      mainWindow = null;
   });
}

app.whenReady().then(() => {
   loadConfig();
   loadDarkCss();
   Menu.setApplicationMenu(createMenu());
   createWindow();

   app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
         createWindow();
      }
   });
});

app.on('window-all-closed', () => {
   app.quit();
});
