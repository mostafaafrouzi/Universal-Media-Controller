# Privacy Policy

Last updated: July 26, 2026

## Overview

Universal Media Controller runs entirely in your browser. It does not collect, sell, or transmit personal information.

## Data collection

We collect **no** analytics, accounts, or browsing profiles. The extension:

- Does not track your browsing history
- Does not collect personal information
- Does not send page content or media metadata to any server
- Does not use advertising or analytics SDKs

## Local storage

Data stays in Chrome’s extension storage on your device:

| Key | Purpose |
|-----|---------|
| `activate` | Whether hotkeys are enabled |
| `blacklist` | Sites where hotkeys should not run |
| `customHotkeys` | Remapped or disabled shortcuts |
| `siteProfiles` | Built-in / custom per-site shortcut rules |
| `needsPermissionSetup` / `siteProfilesInitialized` | Local UI/setup flags |

Playback speed and volume are **not** persisted by the extension.

## Permissions

| Permission | Why |
|------------|-----|
| `storage` | Save the preferences above |
| `activeTab` | Temporarily access the tab you open the popup on |
| `scripting` | Inject hotkey scripts into pages you allow |
| Optional host access (`*://*/*`, etc.) | Only after you click **Allow this site** or **Allow all sites** |

The extension does **not** require broad website access at install time. If you grant “all sites,” Chrome will show its standard warning — that is initiated by your choice in the popup, not by a silent install grant.

Host access is used only to detect media elements and handle keyboard shortcuts. Page content is not scraped or uploaded.

## Third-party services

Popup and options UI use local CSS only. Vendored libraries (`mousetrap`, `screenfull`) ship inside the package. Core features do not call external network APIs.

## Contact

Privacy questions: [GitHub Issues](https://github.com/mostafaafrouzi/Universal-Media-Controller/issues) or **mostafa.afrouzi@gmail.com**.

## Changes

If data practices change, this file will be updated and the “Last updated” date revised.
