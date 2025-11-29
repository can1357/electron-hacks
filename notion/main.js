const { app, BrowserWindow, shell, Menu, nativeTheme, nativeImage, globalShortcut } = require('electron');
const path = require('path');

app.setName('Notion');
app.name = 'Notion';
nativeTheme.themeSource = 'dark';

const NOTION_URL = 'https://notion.so';

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
      backgroundColor: '#191919',
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
