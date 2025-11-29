// Frame fix for Claude Desktop on Linux
// Based on aaddrick/claude-desktop-debian
console.log('[frame-fix] Loading...');
const Module = require('module');
const path = require('path');
const { app, nativeImage } = require('electron');

const iconPath = path.join(__dirname, 'icon.png');
let appIcon = null;

app.on('ready', () => {
   appIcon = nativeImage.createFromPath(iconPath);
   if (appIcon.isEmpty()) {
      console.error('[Icon] Failed to load:', iconPath);
   } else {
      console.log('[Icon] Loaded:', iconPath);
   }
});

// Set icon on all browser windows
app.on('browser-window-created', (event, window) => {
   if (process.platform === 'linux') {
      if (appIcon && !appIcon.isEmpty()) {
         window.setIcon(appIcon);
      } else {
         const icon = nativeImage.createFromPath(iconPath);
         if (!icon.isEmpty()) window.setIcon(icon);
      }
   }
});

// Intercept BrowserWindow for frame fix
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
   const module = originalRequire.apply(this, arguments);

   if (id === 'electron' && module.BrowserWindow && !module.BrowserWindow._patched) {
      const OriginalBrowserWindow = module.BrowserWindow;

      module.BrowserWindow = class BrowserWindowWithFrame extends OriginalBrowserWindow {
         constructor(options) {
            if (process.platform === 'linux') {
               options = options || {};
               options.frame = true;
               options.icon = iconPath;
               delete options.titleBarStyle;
               delete options.titleBarOverlay;
            }
            super(options);
         }
      };

      for (const key of Object.getOwnPropertyNames(OriginalBrowserWindow)) {
         if (key !== 'prototype' && key !== 'length' && key !== 'name') {
            try {
               const descriptor = Object.getOwnPropertyDescriptor(OriginalBrowserWindow, key);
               if (descriptor) {
                  Object.defineProperty(module.BrowserWindow, key, descriptor);
               }
            } catch (e) {}
         }
      }
      module.BrowserWindow._patched = true;
   }

   return module;
};
