# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.1] - 2026-07-26

### Fixed
- Service worker no longer throws `Duplicate script ID 'umc-hotkeys'` when content scripts sync races (install/reload/permission grant)

## [0.3.0] - 2026-07-26

### Added
- **Optional host access** — no broad site permission at install; choose *this site* or *all sites* from the popup
- Dynamic content-script registration (`chrome.scripting`) after permission is granted
- Temporary inject on the active tab (via `activeTab`) so you can try hotkeys before granting permanent access
- **Site profiles** — optional built-in presets for Twitch, Netflix, and YouTube (all off by default; enable in Options)
- Custom per-domain profiles in Options (pick which actions to disable)
- Revoke previously granted site access from the popup
- Disable individual shortcuts from the Options page (per user Store feedback)
- Toggle for number-key percentage seeking (`0–9`)
- Cross-platform `npm run build` via `scripts/build.js`

### Changed
- Removed required `host_permissions` / static `content_scripts` (fixes scary install-time “read all data” warning)
- Version jump to 0.3.0 because the permission model is a breaking change for existing installs (re-allow sites once)
- Improved media target selection (prefer playing element)
- Ignore shortcuts while typing in inputs / contenteditable fields
- README, PRIVACY, and SECURITY aligned with actual behavior

### Fixed
- Playback speed no longer gets stuck off the 0.25× grid (e.g. `0.10x` → `1.10x` instead of `1.00x`)
- Safer media operations to reduce errors on restrictive players (e.g. Twitch live)
- Enable toggle now applies to **all open tabs**, not only the active one
- Blacklist updates apply via storage sync without requiring a full extension reload
- Seeking skipped on live streams without a finite duration
- Removed remote Bulma CDN from the popup (privacy / offline consistency)
- Clearer privacy messaging aligned with optional permissions
- Release workflow changelog extraction (header line no longer matches as end pattern)

## [0.2.0] - 2025-01-25

### Added
- Custom keyboard shortcuts configuration via Options page
- Shadow DOM support for better compatibility with modern websites
- Functional blacklist feature to disable hotkeys on specific sites
- Real-time hotkey updates when changing shortcuts in Options
- Built-in notification system (replaced Toastr)
- Improved media element detection with MutationObserver

### Changed
- **BREAKING**: Removed jQuery dependency - now 100% vanilla JavaScript
- Modernized codebase with ES6+ features
- Improved popup UI with better encoding (UTF-8) and cleaner design
- Enhanced media detection performance using MutationObserver instead of polling
- Updated build script to use `tar` for cross-platform compatibility

### Fixed
- Blacklist feature now works correctly
- Popup toggle switch properly enables/disables extension
- Build script error (`npm run build` now works on Windows)
- Duplicate content issue in popup UI
- Character encoding issues in popup

### Removed
- jQuery (replaced with vanilla JavaScript)
- Toastr (replaced with custom notification system)
- Dead code in background script (unused click handler)

## [0.1.2] - 2024-03-17

### Changed
- Updated extension icon with a new modern design
- Added promotional images for Chrome Web Store
- Enhanced README.md with feature showcase image

## [0.1.1] - 2024-03-17

### Added
- Picture-in-Picture toggle with 'P' key
- Volume control with '+' and '-' keys
- Subtitle navigation with '[' and ']' keys
- Support for YouTube and other popular video players
- Visual feedback for all new features

### Enhanced
- Improved subtitle detection and navigation
- Better error handling and user feedback
- Added support for multiple video player types
- Enhanced YouTube compatibility

## [0.1.0] - 2024-03-17

### Added
- Initial release
- Based on the original work by [@jiangts](https://github.com/jiangts/media-hotkeys)
- YouTube-style keyboard shortcuts for any media element
- Play/Pause control (K key)
- Skip forward/backward controls (J/L keys)
- Quick navigation (Left/Right arrows)
- Playback speed control (< / > keys)
- Percentage-based seeking (0-9 keys)
- Mute toggle (M key)
- Fullscreen support (F key)
- Picture-in-Picture toggle (P key)
- Volume control (+ / - keys)
- Subtitle navigation ([ / ] keys)
- Visual notifications for actions
- Settings persistence
- Toggle on/off with extension icon click

### Changed
- Updated to Manifest V3 for better security and performance
- Improved code structure and organization
- Enhanced user interface and notifications

### Fixed
- Various bug fixes and performance improvements

### Security
- Implemented secure storage for settings
- Added proper permission handling

## [Unreleased]

### Planned
- Playback position memory
- Host access request chip (Chrome 133+) for quieter per-site prompts
