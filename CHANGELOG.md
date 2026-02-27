# Changelog

All notable changes to Drop (frontend and product) are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and Drop uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html) with a **0.x.y** version scheme while in initial development. The leading `0` indicates that the public API and behaviour may change until we release **1.0.0**.

## [Unreleased]

### Added

- **App Switcher in User Menu.** Click your profile in the top right and you'll now see a "Ciphera Apps" section. Expand it to quickly jump between Drop, Pulse (analytics), and your Ciphera Account settings. This makes it easier to discover and navigate between Ciphera products without signing in again.

### Security

- **Cleaned up legacy token handling code.** Removed old migration code that was clearing legacy tokens from localStorage. Drop now exclusively uses secure httpOnly cookies for authentication tokens, making your session more secure against XSS attacks. Tokens are never stored in JavaScript-accessible storage.
- **Session synchronization across tabs.** When you sign out in one browser tab, you're now automatically signed out in all other tabs of the same app. This prevents situations where you might still appear signed in on another tab after logging out. The same applies to signing in — when you sign in on one tab, other tabs will update to reflect your authenticated state.

---

## [0.1.0-alpha] - 2026-02-27

### Added

- Initial changelog and release process.

---

[Unreleased]: https://github.com/ciphera-net/drop/compare/v0.1.0-alpha...HEAD
[0.1.0-alpha]: https://github.com/ciphera-net/drop/releases/tag/v0.1.0-alpha
