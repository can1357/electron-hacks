Name:           notion
Version:        1.6.2
Release:        1%{?dist}
Summary:        Notion desktop app for Linux
License:        MIT
URL:            https://notion.so

AutoReqProv:    no
%global _binaries_in_noarch_packages_terminate_build 0
%global debug_package %{nil}
%define _binary_payload w3.zstdio

%description
Notion workspace desktop application for Linux.

%install
mkdir -p %{buildroot}/opt/notion
mkdir -p %{buildroot}/usr/bin
mkdir -p %{buildroot}/usr/share/applications
mkdir -p %{buildroot}/usr/share/icons/hicolor/512x512/apps

cp -r %{_sourcedir}/notion/linux-unpacked/* %{buildroot}/opt/notion/
rm -f %{buildroot}/opt/notion/resources/app.asar
cp %{_sourcedir}/notion/icon.png %{buildroot}/usr/share/icons/hicolor/512x512/apps/notion.png

cat > %{buildroot}/usr/bin/notion << 'EOF'
#!/bin/bash
/opt/notion/notion "$@"
EOF
chmod +x %{buildroot}/usr/bin/notion

cat > %{buildroot}/usr/share/applications/notion.desktop << 'EOF'
[Desktop Entry]
Name=Notion
Comment=Notion workspace
Exec=notion %U
Icon=notion
Type=Application
Categories=Office;
StartupWMClass=notion
EOF

%files
/opt/notion
/usr/bin/notion
/usr/share/applications/notion.desktop
/usr/share/icons/hicolor/512x512/apps/notion.png

%changelog
* Sat Nov 29 2025 Can <me@can.ac> - 1.0.0-1
- Initial package
