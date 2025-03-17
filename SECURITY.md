# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Here are the versions that are currently being supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of Universal Media Controller seriously. If you believe you have found a security vulnerability, please report it to us as described below.

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to [your-email@example.com]. You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include the requested information listed below (as much as you can provide) to help us better understand the nature and scope of the possible issue:

* Type of issue (e.g. buffer overflow, SQL injection, cross-site scripting, etc.)
* Full paths of source file(s) related to the manifestation of the issue
* The location of the affected source code (tag/branch/commit or direct URL)
* Any special configuration required to reproduce the issue
* Step-by-step instructions to reproduce the issue
* Proof-of-concept or exploit code (if possible)
* Impact of the issue, including how an attacker might exploit the issue

This information will help us triage your report more quickly.

## Security Measures

Universal Media Controller implements several security measures:

1. **Manifest V3 Compliance**
   - Uses the latest Chrome extension security model
   - Implements strict Content Security Policy
   - Uses service workers instead of background pages

2. **Minimal Permissions**
   - Only requests necessary permissions
   - Uses host permissions instead of broad permissions
   - Implements least privilege principle

3. **Data Security**
   - No data collection or transmission
   - Local storage only for essential settings
   - No third-party services or analytics

4. **Code Security**
   - Regular security audits
   - Dependency updates
   - Code review process

## Best Practices

When using Universal Media Controller:

1. Always install from official sources:
   - Chrome Web Store (when available)
   - Official GitHub releases

2. Keep the extension updated to the latest version

3. Report any security concerns immediately

## Security Updates

We regularly:
- Update dependencies
- Perform security audits
- Review and update security policies
- Monitor for reported vulnerabilities

## Contact

For security-related inquiries, please contact:
- Email: [your-email@example.com]
- GitHub Issues: [Security Issues](https://github.com/mostafaafrouzi/Universal-Media-Controller/issues) 