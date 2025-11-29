const { BrowserWindow } = require('electron');

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
      const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
      return { handle: win ? win.id : 0 };
   },
   focusWindow: (handle) => {
      let id = typeof handle === 'object' ? handle?.handle : handle;
      if (typeof id !== 'number' || id <= 0) {
         const win = BrowserWindow.getAllWindows().find(w => !w.isDestroyed());
         if (win) { win.show(); win.focus(); }
         return;
      }
      try {
         const win = BrowserWindow.fromId(id);
         if (win && !win.isDestroyed()) {
            win.show();
            if (win.isMinimized()) win.restore();
            win.focus();
         }
      } catch {
         const win = BrowserWindow.getAllWindows().find(w => !w.isDestroyed());
         if (win) { win.show(); win.focus(); }
      }
   },
   KeyboardKey,
   AuthRequest
};
