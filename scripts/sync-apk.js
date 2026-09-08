import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function syncApk() {
  console.log('🔄 Checking for latest Android APK build...');

  const possibleSources = [
    path.join(rootDir, 'ExpenseApp', 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk'),
    path.join(rootDir, 'ExpenseApp', 'rupeetrack.apk'),
    path.join(rootDir, 'public', 'rupeetrack.apk')
  ];

  let latestApkPath = null;
  let latestMtime = 0;

  for (const src of possibleSources) {
    if (fs.existsSync(src)) {
      const stats = fs.statSync(src);
      if (stats.mtimeMs > latestMtime && stats.size > 1000000) { // must be a valid APK > 1MB
        latestMtime = stats.mtimeMs;
        latestApkPath = src;
      }
    }
  }

  if (!latestApkPath) {
    console.warn('⚠️ No compiled Android APK found in standard locations.');
    return;
  }

  const apkStats = fs.statSync(latestApkPath);
  const sizeFormatted = formatBytes(apkStats.size);
  console.log(`📦 Found latest APK: ${latestApkPath} (${sizeFormatted}, modified ${new Date(apkStats.mtime).toLocaleString()})`);

  // Target destinations for web hosting and release storage
  const targets = [
    path.join(rootDir, 'public', 'rupeetrack.apk'),
    path.join(rootDir, 'ExpenseApp', 'rupeetrack.apk')
  ];

  const distDir = path.join(rootDir, 'dist');
  if (fs.existsSync(distDir)) {
    targets.push(path.join(distDir, 'rupeetrack.apk'));
  }

  for (const target of targets) {
    const targetDir = path.dirname(target);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    if (path.resolve(latestApkPath) !== path.resolve(target)) {
      fs.copyFileSync(latestApkPath, target);
      console.log(`  ✅ Synced -> ${path.relative(rootDir, target)}`);
    }
  }

  // Generate metadata JSON for website
  const info = {
    version: '1.0.0',
    filename: 'rupeetrack.apk',
    sizeBytes: apkStats.size,
    sizeFormatted,
    buildTime: new Date(apkStats.mtime).toISOString(),
    downloadUrl: '/rupeetrack.apk'
  };

  const infoTargets = [
    path.join(rootDir, 'public', 'apk-info.json')
  ];

  if (fs.existsSync(distDir)) {
    infoTargets.push(path.join(distDir, 'apk-info.json'));
  }

  for (const infoPath of infoTargets) {
    const infoDir = path.dirname(infoPath);
    if (!fs.existsSync(infoDir)) {
      fs.mkdirSync(infoDir, { recursive: true });
    }
    fs.writeFileSync(infoPath, JSON.stringify(info, null, 2), 'utf8');
    console.log(`  📝 Updated info -> ${path.relative(rootDir, infoPath)}`);
  }

  console.log('✨ APK synchronization complete.');
}

syncApk();
