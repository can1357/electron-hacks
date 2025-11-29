Name:           claude-desktop
Version:        1.0.0
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

cp -r %{_sourcedir}/claude-desktop/linux-unpacked/* %{buildroot}/opt/claude-desktop/
rm -f %{buildroot}/opt/claude-desktop/resources/app.asar
cp %{_sourcedir}/claude/icon.png %{buildroot}/usr/share/icons/hicolor/512x512/apps/claude.png

cat > %{buildroot}/usr/bin/claude-desktop << 'EOF'
#!/bin/bash
/opt/claude-desktop/claude-desktop "$@"
EOF
chmod +x %{buildroot}/usr/bin/claude-desktop

cat > %{buildroot}/usr/share/applications/claude-desktop.desktop << 'EOF'
[Desktop Entry]
Name=Claude
Comment=Claude AI Assistant
Exec=claude-desktop %U
Icon=claude
Type=Application
Categories=Office;
StartupWMClass=Claude
EOF

%files
/opt/claude-desktop
/usr/bin/claude-desktop
/usr/share/applications/claude-desktop.desktop
/usr/share/icons/hicolor/512x512/apps/claude.png

%changelog
