// Entry point for built packages - just sets up paths and loads the app
const path = require('path');
const fs = require('fs');

const resourcesDir = path.join(__dirname, 'resources');
const appDir = path.join(resourcesDir, 'app');
const asarPath = path.join(resourcesDir, 'app.asar');

const appEntry = fs.existsSync(appDir) ? appDir : asarPath;

if (!fs.existsSync(appEntry)) {
   console.error('Claude Desktop resources not found.');
   console.error('Run: npm run update-claude -- <installer>');
   process.exit(1);
}

Object.defineProperty(process, 'resourcesPath', {
   get: () => resourcesDir,
   configurable: true
});

require(appEntry);
