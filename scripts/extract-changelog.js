const fs = require('fs');
const ver = process.argv[2] || '0.3.0';
const md = fs.readFileSync('CHANGELOG.md', 'utf8');
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
  console.error('No changelog section for', ver);
  process.exit(1);
}
fs.writeFileSync('release_notes.md', notes);
console.log(notes);
