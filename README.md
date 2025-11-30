# electron-hacks

Lightweight Electron wrappers for web applications on Linux.

## Supported Apps

| App | Type | Dark Mode | Notes |
|-----|------|-----------|-------|
| **Miro** | Web wrapper | Yes (`Ctrl+D`) | Custom dark mode with persistence |
| **Notion** | Web wrapper | System | Uses Notion's built-in theme |
| **Claude Desktop** | Native port | System | Full desktop app with KDE Breeze theming |

## Features

- Native Linux packages (AppImage, deb, rpm)
- Auto-hidden menu bar
- External links open in system browser
- Spellcheck enabled
- CLI to scaffold new app wrappers
- Automatic resource extraction for Claude Desktop

## Quick Start

```bash
npm install

# Run apps
npm run start:miro
npm run start:notion
npm run start:claude-desktop

# Build
npm run build:miro
npm run build:notion
npm run build:claude-desktop
```

## Claude Desktop (Native App)

The Claude Desktop variant uses the official app's resources with patched native modules for Linux compatibility.

### Setup

1. Download the official Claude installer (Windows .exe or macOS .dmg)
2. Extract and patch resources:

```bash
npm run update-claude -- ~/Downloads/Claude-Setup.exe
# or
npm run update-claude -- ~/Downloads/Claude.dmg
```

3. Run or build:

```bash
npm run start:claude-desktop        # Test
npm run build:claude-desktop        # Build AppImage
```

### How it works

The update script:
1. Extracts `app.asar` from the official installer
2. Patches `@ant/claude-native` with Linux stubs
3. Removes Windows/macOS native binaries
4. Copies resources to `claude-desktop/resources/`

Native module stubs provide no-op implementations for:
- Window effects (taskbar progress, flash, overlay icons)
- Registry/plist access
- Platform-specific auth flows

### YOLO Mode (Auto-approve MCP tools)

YOLO mode is **enabled by default** - all MCP tool requests are auto-approved without prompts.

To disable and restore confirmation dialogs:

```bash
# Option 1: Environment variable
CLAUDE_NO_YOLO=1 claude-desktop

# Option 2: Create marker file (persistent)
touch ~/.config/Claude/no-yolo
```

## Build Targets

```bash
npm run build:<app>           # AppImage + deb
npm run build:<app>:appimage  # AppImage only
npm run build:<app>:deb       # deb only
npm run build:<app>:rpm       # rpm only
```

## Adding New Apps

```bash
npm run new-app -- <name> <url> [--dark]

# Examples
npm run new-app -- slack https://slack.com
npm run new-app -- figma https://figma.com --dark
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+D` | Toggle dark mode (Miro) |
| `Ctrl+R` | Reload |
| `Ctrl+Shift+R` | Force reload |
| `Ctrl++/-/0` | Zoom in/out/reset |
| `F11` | Toggle fullscreen |
| `F12` | Toggle DevTools |

## Arch Linux (AUR)

PKGBUILDs available in `aur/`:

```bash
cd aur/miro && makepkg -si
cd aur/notion && makepkg -si
cd aur/claude-desktop && makepkg -si
```

## Credits

Claude Desktop Linux port includes patches from [aaddrick/claude-desktop-debian](https://github.com/aaddrick/claude-desktop-debian).

## License

MIT
