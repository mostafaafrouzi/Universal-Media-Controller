# Release Process

This document describes how to create a new release for the Universal Media Controller extension.

## Prerequisites

- Node.js installed
- Git configured with GitHub credentials
- Write access to the repository

## Release Steps

### 1. Prepare the Release

First, ensure all changes are committed and the main branch is up to date:

```bash
git checkout main
git pull origin main
```

### 2. Update Version

Use the automated version bump script:

```bash
node scripts/bump-version.js <version>
```

Example:
```bash
node scripts/bump-version.js 0.3.0
```

This will automatically update:
- `manifest.json`
- `package.json`

### 3. Update CHANGELOG.md

Add a new section at the top of `CHANGELOG.md` following this format:

```markdown
## [0.3.0] - 2025-01-25

### Added
- New feature descriptions

### Changed
- Changes to existing features

### Fixed
- Bug fixes

### Removed
- Removed features
```

### 4. Commit Changes

```bash
git add -A
git commit -m "chore: bump version to v0.3.0"
```

### 5. Create and Push Tag

```bash
git tag v0.3.0
git push origin main
git push origin v0.3.0
```

**Important:** The tag MUST start with `v` (e.g., `v0.3.0`) to trigger the release workflow.

### 6. Monitor GitHub Actions

1. Go to the [Actions tab](https://github.com/mostafaafrouzi/Universal-Media-Controller/actions)
2. Watch the "Create Release" workflow
3. Verify it completes successfully

### 7. Verify Release

1. Go to the [Releases page](https://github.com/mostafaafrouzi/Universal-Media-Controller/releases)
2. Verify the new release is created
3. Check that the zip file is attached
4. Verify the changelog is correctly extracted

## Troubleshooting

### Workflow doesn't trigger

**Problem:** Pushed code but no workflow ran.

**Solution:** Make sure you pushed a **tag**, not just a commit:
```bash
git push origin v0.3.0
```

### Version mismatch error

**Problem:** Workflow fails with "version doesn't match tag version".

**Solution:** Ensure `manifest.json` version matches the tag:
- Tag: `v0.3.0`
- manifest.json: `"version": "0.3.0"`

### Build fails

**Problem:** `npm run build` fails in the workflow.

**Solution:** 
1. Test the build locally: `npm run build`
2. Fix any errors
3. Commit and push fixes
4. Delete and recreate the tag:
   ```bash
   git tag -d v0.3.0
   git push origin :refs/tags/v0.3.0
   git tag v0.3.0
   git push origin v0.3.0
   ```

## Quick Reference

```bash
# Complete release process
node scripts/bump-version.js 0.3.0
# Edit CHANGELOG.md
git add -A
git commit -m "chore: bump version to v0.3.0"
git tag v0.3.0
git push origin main --tags
```

## Notes

- Always test the extension locally before releasing
- Keep CHANGELOG.md up to date
- Use semantic versioning (MAJOR.MINOR.PATCH)
- Tags are immutable - if you need to fix a release, create a new version
