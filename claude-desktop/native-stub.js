let BrowserWindow = null;
const getBrowserWindow = () => {
   if (!BrowserWindow) BrowserWindow = require('electron').BrowserWindow;
   return BrowserWindow;
};

const KeyboardKey = {
   Backspace: 43, Tab: 280, Enter: 261, Shift: 272, Control: 61,
   Alt: 40, CapsLock: 56, Escape: 85, Space: 276, PageUp: 251,
   PageDown: 250, End: 83, Home: 154, LeftArrow: 175, UpArrow: 282,
   RightArrow: 262, DownArrow: 81, Delete: 79, Meta: 187
};
Object.freeze(KeyboardKey);

class AuthRequest {
   static isAvailable() { return false; }
   async start() { throw new Error('AuthRequest not available on Linux'); }
   cancel() {}
}

module.exports = {
   getWindowsVersion: () => '10.0.0',
   setWindowEffect: () => {},
   removeWindowEffect: () => {},
   getIsMaximized: () => false,
   flashFrame: () => {},
   clearFlashFrame: () => {},
   showNotification: () => {},
   setProgressBar: () => {},
   clearProgressBar: () => {},
   setOverlayIcon: () => {},
   clearOverlayIcon: () => {},
   readRegistryValues: () => ({}),
   writeRegistryValue: () => {},
   readPlistValue: () => null,
   readCfPrefValue: () => null,
   getAppInfoForFile: () => null,
   getActiveWindowHandle: () => {
      // Use KWin DBus to get the actual focused window (works with non-Electron windows)
      try {
         const { execSync } = require('child_process');
         const uuid = execSync('qdbus-qt6 org.kde.KWin /KWin org.kde.KWin.activeWindow 2>/dev/null', { encoding: 'utf8' }).trim();
         if (uuid) return { handle: uuid, isKwin: true };
      } catch {}
      // Fallback to Electron window
      const BW = getBrowserWindow();
      const win = BW.getFocusedWindow() || BW.getAllWindows()[0];
      return { handle: win ? win.id : 0 };
   },
   focusWindow: (handle) => {
      if (!handle) return;
      let id = typeof handle === 'object' ? handle?.handle : handle;
      // KWin UUID - restore via DBus
      if (typeof handle === 'object' && handle?.isKwin && typeof id === 'string') {
         try {
            const { execSync } = require('child_process');
            execSync(`qdbus-qt6 org.kde.KWin /KWin org.kde.KWin.activateWindowByUuid "${id}" 2>/dev/null`);
            return;
         } catch {}
      }
      // Fallback: Electron window ID
      if (typeof id !== 'number' || id <= 0) return;
      const BW = getBrowserWindow();
      try {
         const win = BW.fromId(id);
         if (win && !win.isDestroyed()) {
            win.show();
            win.restore();
            win.focus();
         }
      } catch {}
   },
   KeyboardKey,
   AuthRequest
};
