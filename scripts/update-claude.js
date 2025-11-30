#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const asar = require('asar');

const args = process.argv.slice(2);
if (args.length < 1) {
   console.error('Usage: npm run update-claude -- <path-to-installer>');
   console.error('');
   console.error('Supported formats:');
   console.error('  Windows: .exe (Squirrel installer)');
   console.error('  macOS:   .dmg');
   console.error('');
   console.error('Example: npm run update-claude -- ~/Downloads/Claude-Setup.exe');
   process.exit(1);
}

const installerPath = path.resolve(args[0]);
if (!fs.existsSync(installerPath)) {
   console.error(`File not found: ${installerPath}`);
   process.exit(1);
}

const rootDir = path.join(__dirname, '..');
const claudeDir = path.join(rootDir, 'claude-desktop');
const resourcesDir = path.join(claudeDir, 'resources');
const appDir = path.join(resourcesDir, 'app');
const tmpDir = path.join(rootDir, '.tmp-claude-extract');

function run(cmd, opts = {}) {
   console.log(`  > ${cmd.slice(0, 80)}${cmd.length > 80 ? '...' : ''}`);
   return execSync(cmd, { stdio: 'pipe', ...opts });
}

function cleanup() {
   if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
   }
}

function extractExe(exePath) {
   console.log('\n📦 Extracting Windows installer...');
   fs.mkdirSync(tmpDir, { recursive: true });

   run(`7z x "${exePath}" -o"${tmpDir}/stage1" -y`);

   const nupkg = fs.readdirSync(`${tmpDir}/stage1`).find(f => f.endsWith('.nupkg'));
   if (!nupkg) throw new Error('No .nupkg found in installer');

   run(`7z x "${tmpDir}/stage1/${nupkg}" -o"${tmpDir}/stage2" -y`);

   const resourcesSrc = `${tmpDir}/stage2/lib/net45/resources`;
   if (!fs.existsSync(resourcesSrc)) throw new Error('Resources not found in nupkg');

   return resourcesSrc;
}

function extractDmg(dmgPath) {
   console.log('\n📦 Extracting macOS DMG...');
   fs.mkdirSync(tmpDir, { recursive: true });

   run(`7z x "${dmgPath}" -o"${tmpDir}/stage1" -y`);

   const hfs = fs.readdirSync(`${tmpDir}/stage1`).find(f => f.endsWith('.hfs'));
   if (hfs) {
      run(`7z x "${tmpDir}/stage1/${hfs}" -o"${tmpDir}/stage2" -y`);
   }

   const findResult = execSync(`find "${tmpDir}" -type d -name "Resources" -path "*.app/*" | head -1`, { encoding: 'utf8' }).trim();
   if (!findResult || !fs.existsSync(findResult)) throw new Error('Resources not found in DMG');

   return findResult;
}

function extractAsar(resourcesSrc) {
   console.log('\n📦 Extracting app.asar...');

   const asarSrc = path.join(resourcesSrc, 'app.asar');

   if (fs.existsSync(appDir)) {
      fs.rmSync(appDir, { recursive: true });
   }
   fs.mkdirSync(appDir, { recursive: true });

   asar.extractAll(asarSrc, appDir);
   console.log(`  Extracted to: ${appDir}`);

   // Copy i18n files to both locations:
   // 1. resourcesDir (for process.resourcesPath lookup)
   // 2. appDir/resources/i18n (for bundled app lookup)
   const i18nDir = path.join(appDir, 'resources', 'i18n');
   fs.mkdirSync(i18nDir, { recursive: true });

   const jsonFiles = fs.readdirSync(resourcesSrc).filter(f => f.endsWith('.json'));
   for (const file of jsonFiles) {
      fs.copyFileSync(path.join(resourcesSrc, file), path.join(resourcesDir, file));
      fs.copyFileSync(path.join(resourcesSrc, file), path.join(i18nDir, file));
      console.log(`  Added: ${file}`);
   }

   // Copy and fix tray icons to both locations
   const appResourcesDir = path.join(appDir, 'resources');
   const trayIcons = fs.readdirSync(resourcesSrc).filter(f => f.startsWith('TrayIcon') && f.endsWith('.png'));
   for (const icon of trayIcons) {
      const src = path.join(resourcesSrc, icon);
      const dstApp = path.join(appResourcesDir, icon);
      const dstRes = path.join(resourcesDir, icon);

      fs.copyFileSync(src, dstApp);
      fs.copyFileSync(src, dstRes);

      const bg = icon.includes('-Dark') ? 'white' : 'black';
      for (const dst of [dstApp, dstRes]) {
         try {
            execSync(`magick "${dst}" -background ${bg} -alpha shape -define png:color-type=6 "${dst}"`, { stdio: 'pipe' });
         } catch {
            try {
               execSync(`convert "${dst}" -background ${bg} -alpha shape -define png:color-type=6 "${dst}"`, { stdio: 'pipe' });
            } catch {}
         }
      }
      console.log(`  Added: ${icon}`);
   }

   return appDir;
}

function patchNativeModule() {
   console.log('\n🔧 Patching native modules...');

   const stubContent = fs.readFileSync(path.join(claudeDir, 'native-stub.js'), 'utf8');

   const nativeTargets = [
      'node_modules/claude-native/index.js',
      'node_modules/@ant/claude-native/index.js',
   ];

   for (const target of nativeTargets) {
      const fullPath = path.join(appDir, target);
      const dir = path.dirname(fullPath);
      if (fs.existsSync(dir)) {
         fs.writeFileSync(fullPath, stubContent);
         console.log(`  Patched: ${target}`);
      }
   }

   const swiftIndex = path.join(appDir, 'node_modules/@ant/claude-swift/js/index.js');
   if (fs.existsSync(path.dirname(swiftIndex))) {
      fs.writeFileSync(swiftIndex, `
if (process.platform === 'darwin') {
   throw new Error('claude-swift not available');
}
module.exports = {};
`);
      console.log('  Patched: @ant/claude-swift');
   }
}

function patchCode() {
   console.log('\n🔧 Patching code...');

   const indexJs = path.join(appDir, '.vite/build/index.js');
   if (fs.existsSync(indexJs)) {
      let code = fs.readFileSync(indexJs, 'utf8');

      // Force frame:true for native title bar on Linux (but keep frameless for transparent popups)
      code = code.replace(/frame\s*:\s*false/g, 'frame:true');
      code = code.replace(/frame\s*:\s*!1/g, 'frame:true');
      code = code.replace(/frame\s*:\s*!0/g, 'frame:true');
      code = code.replace(/titleBarStyle\s*:\s*"[^"]*"/g, 'titleBarStyle:""');
      code = code.replace(/titleBarStyle\s*:\s*'[^']*'/g, "titleBarStyle:''");
      // Revert frame for transparent windows (quick window popup)
      code = code.replace(/transparent:!0,frame:true/g, 'transparent:!0,frame:!1');
      console.log('  Patched: Force native frame (except transparent popups)');

      // Set BrowserView y-offset to 0 (GA=Jr?0:36 -> GA=0)
      code = code.replace(/GA=\w+\?0:36/g, 'GA=0');
      console.log('  Patched: BrowserView offset 0');

      // Allow file:// origins for IPC (local shell windows)
      code = code.replace(/e\.hostname==="localhost"\)/g, 'e.hostname==="localhost"||e.protocol==="file:")');
      // Remove isPackaged check from file:// (allow in dev mode too)
      code = code.replace(/e\.protocol==="file:"&&de\.app\.isPackaged===!0/g, 'e.protocol==="file:"');
      console.log('  Patched: Allow file:// IPC origins');

      // Extract tray function name from: on("menuBarEnabled",()=>{FUNC()})
      const trayFuncMatch = code.match(/on\("menuBarEnabled",\(\)=>\{(\w+)\(\)\}/);
      if (trayFuncMatch) {
         const trayFunc = trayFuncMatch[1];
         const trayVarMatch = code.match(new RegExp(`\\}\\);let (\\w+)=null;function ${trayFunc}`));
         if (trayVarMatch) {
            const trayVar = trayVarMatch[1];

            code = code.replace(
               new RegExp(`function ${trayFunc}\\(\\)\\{`),
               `async function ${trayFunc}(){`
            );

            if (!code.includes(`${trayFunc}._running`)) {
               code = code.replace(
                  new RegExp(`async function ${trayFunc}\\(\\)\\{const`),
                  `async function ${trayFunc}(){if(${trayFunc}._running)return;${trayFunc}._running=true;setTimeout(()=>${trayFunc}._running=false,500);const`
               );
            }

            code = code.replace(
               new RegExp(`${trayVar}&&\\(${trayVar}\\.destroy\\(\\),${trayVar}=null\\)`),
               `${trayVar}&&(${trayVar}.destroy(),${trayVar}=null,await new Promise(r=>setTimeout(r,50)))`
            );
            console.log(`  Patched: Tray async + mutex + delay (func=${trayFunc}, var=${trayVar})`);
         }
      }

      // Add Linux claude-code binary support
      if (!code.includes('linux-arm64":"linux-x64"')) {
         code = code.replace(
            'if(process.platform==="win32")return"win32-x64";',
            'if(process.platform==="win32")return"win32-x64";if(process.platform==="linux")return process.arch==="arm64"?"linux-arm64":"linux-x64";'
         );
         console.log('  Patched: Linux claude-code binary support');
      }

      // Replace claude/claude.exe binary name with c2claude
      code = code.replace(/process\.platform==="win32"\?"claude\.exe":"claude"/g, '"c2claude"');
      console.log('  Patched: claude binary name -> c2claude');

      // Use c2claude from PATH instead of managed binary in storageDir
      code = code.replace(
         /async getBinaryPathIfReady\(\)\{return await this\.binaryExists\(this\.requiredVersion\)\?this\.getBinaryPath\(this\.requiredVersion\):null\}/,
         'async getBinaryPathIfReady(){return"c2claude"}'
      );
      console.log('  Patched: getBinaryPathIfReady -> use c2claude from PATH');

      // Bypass permissions mode (for Claude Code)
      code = code.replace(/permissionMode:"default"/g, 'permissionMode:"bypassPermissions"');
      code = code.replace(/permissionMode:(\w+)="default"/g, 'permissionMode:$1="bypassPermissions"');
      console.log('  Patched: permissionMode -> bypassPermissions');

      // Auto-allow MCP tool permissions (bypass the permission dialog)
      code = code.replace(
         /async handleToolPermission\((\w+),(\w+),(\w+),(\w+)\)\{/,
         'async handleToolPermission($1,$2,$3,$4){return{behavior:"allow",updatedInput:$3};'
      );
      console.log('  Patched: MCP tool permissions auto-allow');

      fs.writeFileSync(indexJs, code);
   }

   // Patch renderer main.js to set titlebar height to 0 (we use native frame on Linux)
   const rendererDir = path.join(appDir, '.vite/renderer/main_window/assets');
   if (fs.existsSync(rendererDir)) {
      const mainFiles = fs.readdirSync(rendererDir).filter(f => f.startsWith('main-') && f.endsWith('.js'));
      for (const file of mainFiles) {
         const filePath = path.join(rendererDir, file);
         let content = fs.readFileSync(filePath, 'utf8');
         // Hardcode titlebar heights to 0: Yu?0:36 -> 0, Yu?28:36 -> 0
         const before = content;
         content = content.replace(/\w+\?0:36/g, '0');
         content = content.replace(/\w+\?28:36/g, '0');
         if (content !== before) {
            fs.writeFileSync(filePath, content);
            console.log(`  Patched: ${file} - titlebar height 0`);
         }
      }

      // Also patch MainWindowPage to not render titlebar component
      const pageFiles = fs.readdirSync(rendererDir).filter(f => f.startsWith('MainWindowPage-') && f.endsWith('.js'));
      for (const file of pageFiles) {
         const filePath = path.join(rendererDir, file);
         let content = fs.readFileSync(filePath, 'utf8');
         content = content.replace(/if\(!?[a-zA-Z]+&&([a-zA-Z]+)\)return null/g, 'if($1)return null');
         fs.writeFileSync(filePath, content);
         console.log(`  Patched: ${file} - hide custom titlebar`);
      }
   }

   // Patch quick window HTML with Breeze theme
   const quickWindowHtml = path.join(appDir, '.vite/renderer/quick_window/quick-window.html');
   if (fs.existsSync(quickWindowHtml)) {
      let html = fs.readFileSync(quickWindowHtml, 'utf8');
      const breezeCSS = '<style id="breeze-theme">/* Breeze */ .darkTheme { --claude-accent-clay: #3daee9 !important; } * { --claude-accent-clay: #3daee9 !important; } :root:not(.darkTheme) * { --claude-accent-clay: #2980b9 !important; } .darkTheme .container { background: linear-gradient(to bottom, rgba(44, 47, 52, 0.95), rgba(38, 41, 46, 1)) !important; }</style>';
      html = html.replace('<head>', '<head>\n    ' + breezeCSS);
      fs.writeFileSync(quickWindowHtml, html);
      console.log('  Patched: quick-window.html - Breeze theme');
   }

   // Replace Claude orange accent with Breeze blue in all JS files
   function findJsFiles(dir) {
      let results = [];
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
         const fullPath = path.join(dir, entry.name);
         if (entry.isDirectory()) {
            results = results.concat(findJsFiles(fullPath));
         } else if (entry.name.endsWith('.js')) {
            results.push(fullPath);
         }
      }
      return results;
   }
   let replacedCount = 0;
   for (const jsFile of findJsFiles(appDir)) {
      let content = fs.readFileSync(jsFile, 'utf8');
      if (content.includes('#D97757') || content.includes('#d97757')) {
         content = content.replace(/#D97757/gi, '#0e588a');
         fs.writeFileSync(jsFile, content);
         replacedCount++;
      }
   }
   if (replacedCount > 0) {
      console.log(`  Patched: ${replacedCount} JS files - #D97757 -> #0e588a`);
   }
}

function installMain() {
   console.log('\n🎨 Installing main entry point...');

   // Copy supporting files
   const filesToCopy = ['main.js', 'native-stub.js', 'auto-approve.js', 'breeze.css', 'icon.png'];
   for (const file of filesToCopy) {
      const src = path.join(claudeDir, file);
      if (fs.existsSync(src)) {
         fs.copyFileSync(src, path.join(appDir, file));
         console.log(`  Copied: ${file}`);
      }
   }

   // Update package.json entry point
   const pkgPath = path.join(appDir, 'package.json');
   const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
   pkg.main = 'main.js';
   fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
   console.log('  Updated: package.json main -> main.js');
}

function copyUnpacked(resourcesSrc) {
   console.log('\n📁 Copying unpacked resources...');

   const unpackedSrc = path.join(resourcesSrc, 'app.asar.unpacked');
   const unpackedDst = path.join(resourcesDir, 'app.asar.unpacked');

   if (fs.existsSync(unpackedSrc)) {
      if (fs.existsSync(unpackedDst)) {
         fs.rmSync(unpackedDst, { recursive: true });
      }
      run(`cp -r "${unpackedSrc}" "${unpackedDst}"`);

      const bindingFiles = execSync(`find "${unpackedDst}" -name "*.node" 2>/dev/null || true`, { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
      for (const binding of bindingFiles) {
         fs.unlinkSync(binding);
         console.log(`  Removed: ${path.relative(unpackedDst, binding)}`);
      }
   }
}

function getVersion() {
   try {
      const pkg = JSON.parse(fs.readFileSync(path.join(appDir, 'package.json'), 'utf8'));
      return pkg.version;
   } catch {
      return 'unknown';
   }
}

async function main() {
   console.log('🚀 Claude Desktop Resource Updater\n');

   cleanup();

   try {
      let resourcesSrc;
      const ext = path.extname(installerPath).toLowerCase();

      if (ext === '.exe') {
         resourcesSrc = extractExe(installerPath);
      } else if (ext === '.dmg') {
         resourcesSrc = extractDmg(installerPath);
      } else {
         throw new Error(`Unsupported format: ${ext}`);
      }

      extractAsar(resourcesSrc);
      patchNativeModule();
      patchCode();
      installMain();
      copyUnpacked(resourcesSrc);

      const version = getVersion();

      console.log(`\n✅ Successfully updated Claude resources (v${version})`);
      console.log('\nNext steps:');
      console.log('  npm run start:claude-desktop   # Test the app');
      console.log('  npm run build:claude-desktop   # Build packages');

   } finally {
      cleanup();
   }
}

main().catch(err => {
   console.error(`\n❌ Error: ${err.message}`);
   cleanup();
   process.exit(1);
});
