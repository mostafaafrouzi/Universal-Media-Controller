#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get version from command line argument
const newVersion = process.argv[2];

if (!newVersion) {
    console.error('❌ Error: Please provide a version number');
    console.log('Usage: node scripts/bump-version.js <version>');
    console.log('Example: node scripts/bump-version.js 0.2.0');
    process.exit(1);
}

// Validate version format (semver)
const versionRegex = /^\d+\.\d+\.\d+$/;
if (!versionRegex.test(newVersion)) {
    console.error('❌ Error: Invalid version format. Use semantic versioning (e.g., 0.2.0)');
    process.exit(1);
}

console.log(`🔄 Bumping version to ${newVersion}...`);

// Update manifest.json
const manifestPath = path.join(__dirname, '..', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const oldVersion = manifest.version;
manifest.version = newVersion;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`✅ Updated manifest.json: ${oldVersion} → ${newVersion}`);

// Update package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
packageJson.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
console.log(`✅ Updated package.json: ${oldVersion} → ${newVersion}`);

console.log('\n📝 Next steps:');
console.log('1. Update CHANGELOG.md with release notes');
console.log('2. Commit changes: git add -A && git commit -m "chore: bump version to v' + newVersion + '"');
console.log('3. Create tag: git tag v' + newVersion);
console.log('4. Push changes: git push && git push --tags');
console.log('\n✨ Done!');
