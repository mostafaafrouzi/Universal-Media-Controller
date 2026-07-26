#!/usr/bin/env node
/**
 * Extract a Keep a Changelog section into release_notes.md
 * Usage: node scripts/extract-changelog.js 0.3.0
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const ver = process.argv[2];

if (!ver) {
  console.error('Usage: node scripts/extract-changelog.js <version>');
  process.exit(1);
}

const md = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8');
const lines = md.split(/\r?\n/);
const start = new RegExp('^## \\[' + ver.replace(/\./g, '\\.') + '\\]');
const out = [];
let printing = false;

for (const line of lines) {
  if (start.test(line)) {
    printing = true;
    out.push(line);
    continue;
  }
  if (printing && /^## \[/.test(line)) break;
  if (printing) out.push(line);
}

const notes = out.join('\n').trim() + '\n';
if (!notes.trim()) {
  console.error(`No changelog section found for version ${ver} in CHANGELOG.md`);
  process.exit(1);
}

fs.writeFileSync(path.join(root, 'release_notes.md'), notes);
process.stdout.write(notes);
