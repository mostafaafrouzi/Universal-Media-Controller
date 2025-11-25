# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- Enhanced content security policy

## [Unreleased]

### Planned Features
- Site-specific settings
- Playback position memory
- Playlist navigation support
- Quality selection shortcuts
- Video size controls
- Reverse playback support
- Language selection shortcuts
- Cloud sync for settings
- Theme customization