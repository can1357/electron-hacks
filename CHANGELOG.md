# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2025-11-29

### Added
- Claude web wrapper (claude.ai)
- Claude Desktop native port with Linux stubs for `@anthropic-ai/claude-native`
- CLI tool to scaffold new app wrappers (`npm run new-app`)
- Script to extract/patch official Claude Desktop resources
- AUR packages for miro-electron, notion-electron, claude-electron
- GitHub Actions CI for automated releases

### Changed
- Restructured as monorepo supporting multiple apps

## [1.0.0] - 2025-11-29

### Added
- Miro desktop app with dark mode support (Ctrl+D toggle)
- Notion desktop app
- AppImage, deb, and rpm build targets
- Persistent dark mode preference for Miro

### Security
- Context isolation enabled
- Node integration disabled
- External links open in system browser
