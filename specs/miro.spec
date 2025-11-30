Name:           miro
Version:        1.4.2
Release:        1%{?dist}
Summary:        Miro desktop app for Linux
License:        MIT
URL:            https://miro.com

AutoReqProv:    no
%global _binaries_in_noarch_packages_terminate_build 0
%global debug_package %{nil}
%define _binary_payload w3.zstdio

%description
Miro online whiteboard desktop application for Linux.

%install
mkdir -p %{buildroot}/opt/miro
mkdir -p %{buildroot}/usr/bin
mkdir -p %{buildroot}/usr/share/applications
mkdir -p %{buildroot}/usr/share/icons/hicolor/512x512/apps

cp -r %{_sourcedir}/miro/linux-unpacked/* %{buildroot}/opt/miro/
rm -f %{buildroot}/opt/miro/resources/app.asar
cp %{_sourcedir}/miro/icon.png %{buildroot}/usr/share/icons/hicolor/512x512/apps/miro.png

cat > %{buildroot}/usr/bin/miro << 'EOF'
#!/bin/bash
/opt/miro/miro "$@"
EOF
chmod +x %{buildroot}/usr/bin/miro

cat > %{buildroot}/usr/share/applications/miro.desktop << 'EOF'
[Desktop Entry]
Name=Miro
Comment=Online collaborative whiteboard
Exec=miro %U
Icon=miro
Type=Application
Categories=Office;ProjectManagement;
StartupWMClass=Miro
EOF

%files
/opt/miro
/usr/bin/miro
/usr/share/applications/miro.desktop
/usr/share/icons/hicolor/512x512/apps/miro.png

%changelog
* Sat Nov 29 2025 Can <me@can.ac> - 1.0.0-1
- Initial package
