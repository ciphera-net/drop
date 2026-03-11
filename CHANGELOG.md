# Changelog

All notable changes to Drop (frontend and product) are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and Drop uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html) with a **0.x.y** version scheme while in initial development. The leading `0` indicates that the public API and behaviour may change until we release **1.0.0**.

## [Unreleased]

### Improved

- **Smarter bot protection during uploads.** The security check before uploading files now uses an action-specific token tied to the "upload" action, so it can't be reused on other pages. The captcha is also automatically disabled while an upload is in progress, preventing accidental double-submits.

### Added

- **Request ID tracing for debugging.** All API requests now include a unique Request ID header (`X-Request-ID`) that helps trace requests across frontend and backend services. When errors occur, the Request ID is included in the response, making it easy to find the exact request in server logs for debugging. This helps the support team quickly diagnose issues when users report problems.
- **Unified Settings Experience.** The Settings page has been completely redesigned with a clear separation between Drop-specific settings and your Ciphera Account settings. The left sidebar now shows "Drop Settings" (Profile, Notifications, Organization) and "Ciphera Account" sections. A new "Manage Account" panel provides direct links to your Ciphera Account settings for profile, security/2FA, and active sessions — no more confusion about where to find different settings. When you're in an organization, the Organization Settings are now accessible directly from the Settings page with members, billing, and general management all in one place.
- **Offline Banner.** When you lose your internet connection while signed in, a yellow banner now appears at the top of the page warning "You are currently offline. Changes may not be saved." This helps you understand why file uploads or other actions might fail. The banner automatically disappears when your connection comes back.
- **Notification Center.** A bell icon now appears in the header when you're signed in. Click it to see your recent notifications — things like when someone downloads your shared file, when you receive a new file, or when a shared link is accessed. Notifications show timestamps (like "2 hours ago") and unread ones are highlighted in orange. Click "Mark all read" to clear the badge, or "View all" to see your full notification history on a dedicated page.
- **App Switcher in User Menu.** Click your profile in the top right and you'll now see a "Ciphera Apps" section. Expand it to quickly jump between Drop, Pulse (analytics), and your Ciphera Account settings. This makes it easier to discover and navigate between Ciphera products without signing in again.

### Changed

- **App Switcher now shows consistent order.** The Ciphera Apps menu now always displays apps in the same order: Pulse, Drop, Auth — regardless of which app you're currently using. Previously, the current app was shown first, causing the order to change depending on context. This creates a more predictable navigation experience.

### Security

- **Cleaned up legacy token handling code.** Removed old migration code that was clearing legacy tokens from localStorage. Drop now exclusively uses secure httpOnly cookies for authentication tokens, making your session more secure against XSS attacks. Tokens are never stored in JavaScript-accessible storage.
- **Session synchronization across tabs.** When you sign out in one browser tab, you're now automatically signed out in all other tabs of the same app. This prevents situations where you might still appear signed in on another tab after logging out. The same applies to signing in — when you sign in on one tab, other tabs will update to reflect your authenticated state.
- **Session expiration warning.** You'll now see a heads-up banner 3 minutes before your session expires, giving you time to click "Stay signed in" to extend your session. If you ignore it or dismiss it, your session will end naturally after the 15-minute timeout for security. If you interact with the app (click, type, scroll) while the warning is showing, it automatically extends your session.

---

## [0.1.0-alpha] - 2026-02-27

### Added

- Initial changelog and release process.

---

[Unreleased]: https://github.com/ciphera-net/drop/compare/v0.1.0-alpha...HEAD
[0.1.0-alpha]: https://github.com/ciphera-net/drop/releases/tag/v0.1.0-alpha
