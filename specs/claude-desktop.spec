Name:           claude-desktop
Version:        1.6.0
Release:        1%{?dist}
Summary:        Claude AI desktop app for Linux
License:        MIT
URL:            https://claude.ai

AutoReqProv:    no
%global _binaries_in_noarch_packages_terminate_build 0
%global debug_package %{nil}
%define _binary_payload w3.zstdio

%description
Claude AI assistant desktop application for Linux.

%install
mkdir -p %{buildroot}/opt/claude-desktop
mkdir -p %{buildroot}/usr/bin
mkdir -p %{buildroot}/usr/share/applications
mkdir -p %{buildroot}/usr/share/icons/hicolor/512x512/apps

# Copy entire Electron runtime (follow symlinks)
cp -rL %{_sourcedir}/claude-desktop/linux-unpacked/. %{buildroot}/opt/claude-desktop/

# Remove the nested app structure created by electron-builder
rm -rf %{buildroot}/opt/claude-desktop/resources/app
rm -f %{buildroot}/opt/claude-desktop/resources/app.asar

# Create flat resources/app with our patches + Claude app
mkdir -p %{buildroot}/opt/claude-desktop/resources/app
cp %{_sourcedir}/claude-desktop/main.js %{buildroot}/opt/claude-desktop/resources/app/
cp %{_sourcedir}/claude-desktop/native-stub.js %{buildroot}/opt/claude-desktop/resources/app/
cp %{_sourcedir}/claude-desktop/auto-approve.js %{buildroot}/opt/claude-desktop/resources/app/
cp %{_sourcedir}/claude-desktop/breeze.css %{buildroot}/opt/claude-desktop/resources/app/
cp %{_sourcedir}/claude-desktop/icon.png %{buildroot}/opt/claude-desktop/resources/app/

# Copy Claude app (.vite, node_modules, etc) from the nested location
cp -r %{_sourcedir}/claude-desktop/linux-unpacked/resources/app/claude-desktop/resources/app/.vite %{buildroot}/opt/claude-desktop/resources/app/
cp -r %{_sourcedir}/claude-desktop/linux-unpacked/resources/app/claude-desktop/resources/app/node_modules %{buildroot}/opt/claude-desktop/resources/app/

# Copy i18n files to resources/ (for process.resourcesPath lookup)
cp %{_sourcedir}/claude-desktop/linux-unpacked/resources/app/claude-desktop/resources/*.json %{buildroot}/opt/claude-desktop/resources/

# Copy tray icons
cp %{_sourcedir}/claude-desktop/linux-unpacked/resources/app/claude-desktop/resources/TrayIcon*.png %{buildroot}/opt/claude-desktop/resources/ 2>/dev/null || true

# Create package.json for flat structure
cat > %{buildroot}/opt/claude-desktop/resources/app/package.json << PKGJSON
{
  "name": "claude-desktop",
  "version": "%{version}",
  "main": "main.js"
}
PKGJSON

# Fix permissions (source files may have restrictive modes)
chmod -R a+rX %{buildroot}/opt/claude-desktop

cp %{_sourcedir}/claude-desktop/icon.png %{buildroot}/usr/share/icons/hicolor/512x512/apps/claude.png

cat > %{buildroot}/usr/bin/claude-desktop << 'EOF'
#!/bin/bash
/opt/claude-desktop/claude-desktop "$@"
EOF
chmod +x %{buildroot}/usr/bin/claude-desktop

cp %{_sourcedir}/claude-desktop/claude-quick %{buildroot}/usr/bin/claude-quick
chmod +x %{buildroot}/usr/bin/claude-quick

cat > %{buildroot}/usr/share/applications/claude-desktop.desktop << 'EOF'
[Desktop Entry]
Name=Claude
Comment=Claude AI Assistant
Exec=claude-desktop %U
Icon=claude
Type=Application
Categories=Office;
StartupWMClass=claude-desktop
EOF

%files
/opt/claude-desktop
/usr/bin/claude-desktop
/usr/bin/claude-quick
/usr/share/applications/claude-desktop.desktop
/usr/share/icons/hicolor/512x512/apps/claude.png

%changelog
