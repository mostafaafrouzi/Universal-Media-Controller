# Universal Media Controller

A Chrome extension that enables you to run Youtube-style hotkeys on audio and video elements on any website.

## Features

### Hotkeys include:

- `k` - Toggle play/pause
- `j` / `l` - Skip backward/forward 10 seconds
- `left` / `right` - Skip backward/forward 5 seconds
- `<` / `>` - Decrease/Increase playback rate by 0.25
- `0-9` - Skip to percentage of media, 0% to 90%
- `m` - Toggle mute
- `f` - Toggle fullscreen

To toggle these media hotkeys on/off, click the extension icon in your browser toolbar.

## Installation

You can install this extension from the [Chrome Web Store](https://chrome.google.com/webstore/category/extensions) (coming soon).

For development or manual installation:
1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Development

### Building the Extension

```bash
VER=1.0.0 npm run package
```

This will create a zip file in the `releases` directory.

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on how to submit pull requests, report issues, and contribute to the project.

## Security

For security concerns, please read our [Security Policy](SECURITY.md).

## Privacy

For information about how we handle user data, please read our [Privacy Policy](PRIVACY.md).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Special thanks to [@jiangts](https://github.com/jiangts) for creating the original [media-hotkeys](https://github.com/jiangts/media-hotkeys) extension that inspired this project.
- Thanks to all contributors who help improve this extension.

## 📞 Support

If you encounter any issues or have suggestions, please [open an issue](https://github.com/mostafaafrouzi/Universal-Media-Controller/issues).

## 🔄 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes and version history.

