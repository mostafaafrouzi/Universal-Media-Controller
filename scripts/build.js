#!/usr/bin/env node
/**
 * Cross-platform zip build for Chrome Web Store / manual install.
 * Usage: npm run build
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const outDir = path.join(root, 'releases');
const outFile = path.join(outDir, 'universal-media-controller.zip');

const entries = [
  'manifest.json',
  'src',
  'css',
  'js',
  'icons',
  '_locales',
  'LICENSE',
  'README.md',
  'CHANGELOG.md',
  'PRIVACY.md'
];

for (const entry of entries) {
  const full = path.join(root, entry);
  if (!fs.existsSync(full)) {
    console.error(`Missing required path: ${entry}`);
    process.exit(1);
  }
}

fs.mkdirSync(outDir, { recursive: true });
if (fs.existsSync(outFile)) fs.unlinkSync(outFile);

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: options.shell ?? false
  });
  return result.status === 0;
};

let ok = false;

if (process.platform === 'win32') {
  // Prefer tar (Windows 10+), then PowerShell Compress-Archive
  ok = run('tar', ['-a', '-cf', outFile, ...entries]);
  if (!ok) {
    const ps = `Compress-Archive -Path ${entries.join(',')} -DestinationPath '${outFile.replace(/'/g, "''")}' -Force`;
    ok = run('powershell', ['-NoProfile', '-Command', ps]);
  }
} else {
  ok = run('zip', ['-r', outFile, ...entries]);
}

if (!ok || !fs.existsSync(outFile)) {
  console.error('Build failed: could not create zip archive.');
  process.exit(1);
}

const sizeKb = (fs.statSync(outFile).size / 1024).toFixed(1);
console.log(`Created ${path.relative(root, outFile)} (${sizeKb} KB)`);
