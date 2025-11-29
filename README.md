# electron-hacks

Lightweight Electron wrappers for web applications on Linux.

Both Miro and Notion lack proper native Linux apps - their official offerings are either web-only or poorly maintained. These wrappers provide a clean native experience with extras like dark mode for Miro.

## Supported Apps

| App | Dark Mode | Notes |
|-----|-----------|-------|
| **Miro** | Yes (`Ctrl+D`) | Persistent dark mode preference |
| **Notion** | System | Uses Notion's built-in theme |

## Features

- Native Linux packages (AppImage, deb, rpm)
- Auto-hidden menu bar
- External links open in system browser
- Spellcheck enabled

## Quick Start

```bash
npm install

# Run
npm run start:miro
npm run start:notion

# Build
npm run build:miro
npm run build:notion
```

Build outputs: `dist/miro/` and `dist/notion/`

## Build Targets

```bash
npm run build:<app>           # AppImage + deb
npm run build:<app>:appimage  # AppImage only
npm run build:<app>:deb       # deb only
npm run build:<app>:rpm       # rpm only
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+D` | Toggle dark mode (Miro) |
| `Ctrl+R` | Reload |
| `Ctrl+Shift+R` | Force reload |
| `Ctrl++/-/0` | Zoom in/out/reset |
| `F11` | Toggle fullscreen |

## License

MIT
