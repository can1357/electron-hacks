# Build Commands

```bash
npm install

# Run apps in development
npm run start:miro
npm run start:notion
npm run start:claude-desktop

# Build all formats (AppImage, deb, rpm)
npm run build:miro
npm run build:notion
npm run build:claude-desktop

# Build specific format
npm run build:<app>:appimage
npm run build:<app>:deb
npm run build:<app>:rpm
```

# Claude Desktop Setup

Requires extracting resources from official installer:
```bash
npm run update-claude -- <path-to-installer.exe>
```

# Adding New Apps

```bash
npm run new-app -- <name> <url> [--dark]
```

Creates: `<name>/main.js`, `electron-builder.<name>.json`, `specs/<name>.spec`, and updates `package.json` scripts.

# Architecture

## App Types

1. **Web wrappers** (Miro, Notion): Simple Electron shells loading a URL with CSS injection for theming
2. **Native port** (Claude Desktop): Patches the official app's extracted resources with Linux compatibility stubs

## Directory Structure

- `<app>/main.js` - Electron entry point
- `<app>/celestial.css` - Celestial theme CSS injected at runtime
- `electron-builder.<app>.json` - Build configuration
- `specs/<app>.spec` - RPM spec file
- `aur/<app>/PKGBUILD` - Arch Linux package
- `scripts/` - CLI tools (new-app, update-claude, sync-version)

## Claude Desktop Specifics

- `claude-desktop/main.js` - Unified entry point detecting bundled vs dev/AUR environment
- `claude-desktop/native-stub.js` - No-op implementations of `@ant/claude-native` for Linux (window effects, registry, auth)
- `claude-desktop/auto-approve.js` - YOLO mode script injected into renderer to auto-click MCP tool approval dialogs
- `scripts/update-claude.js` - Extracts `.exe`/`.dmg`, patches native modules, forces native frame, enables `c2claude` from PATH

## Key Patterns

- User-agent spoofed to remove `Electron/` string (prevents web app detection)
- External links open in system browser via `setWindowOpenHandler`
- Security defaults: `contextIsolation: true`, `nodeIntegration: false`
- Celestial theming via CSS variable overrides (deep dark with #25B0BC teal accents)
- Config persistence in `app.getPath('userData')/config.json`

# Commit Style

Use conventional commits: `feat:`, `fix:`, `refactor:`. Example: `feat(notion): added Celestial theme`

# Version Management

`npm version <patch|minor|major>` runs `scripts/sync-version.js` which propagates version to AUR PKGBUILDs and RPM specs.
