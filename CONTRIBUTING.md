# Contributing

## Development Setup

```bash
git clone https://github.com/can1357/electron-hacks.git
cd electron-hacks
npm install
```

Run an app in development mode:
```bash
npm run start:miro
npm run start:notion
npm run start:claude
```

## Adding a New App

Use the CLI generator:
```bash
npm run new-app -- <name> <url> [--dark]

# Examples
npm run new-app -- slack https://slack.com
npm run new-app -- figma https://figma.com --dark
```

Or manually:

1. Create a directory for the app:
   ```
   myapp/
   ├── main.js
   └── icon.png
   ```

2. Copy `notion/main.js` as a starting point and modify:
   - `TARGET_URL` - the web app URL
   - `APP_HOST` - hostname for internal link detection
   - Window dimensions and background color

3. Add an `icon.png` (256x256 recommended)

4. Add build configuration in `electron-builder.myapp.json`

5. Add npm scripts to `package.json`

6. For RPM support, add `specs/myapp.spec`

7. For AUR support, add `aur/myapp/PKGBUILD`

## Adding Dark Mode

See `miro/dark.css` for an example. The pattern:
1. Create `myapp/dark.css` with CSS variable overrides
2. Inject it via `webContents.insertCSS()` in main.js
3. Store preference in `config.json` using electron's `app.getPath('userData')`

## Code Style

- Plain JavaScript (no TypeScript)
- Security defaults: `contextIsolation: true`, `nodeIntegration: false`
- External links open in system browser
- Spoof User-Agent to avoid Electron detection

## Submitting Changes

1. Fork the repo
2. Create a branch: `git checkout -b feat/my-new-app`
3. Commit using conventional commits: `feat:`, `fix:`, `refactor:`
4. Open a pull request
