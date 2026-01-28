# Security Architecture

## Overview

Drop is designed with privacy and security as core principles. This document outlines the security architecture and measures implemented.

## Authentication & Identity

### Identity Provider (IdP)
We utilize a centralized Identity Provider, `auth.ciphera.net`, which implements the **OpenID Connect (OIDC)** and **OAuth 2.0** protocols. This ensures:
- **Centralized Security**: Authentication policies (MFA, rate limiting, lockout) are enforced globally.
- **Session Management**: Single Sign-On (SSO) capabilities across the Ciphera ecosystem.
- **Attack Surface Reduction**: Applications (like Drop) never handle user credentials directly, only temporary Access Tokens.

### Zero-Knowledge Password Architecture (Double Hashing)
To ensure the server never sees or stores a user's raw password, we implement a "Hash-then-Hash" protocol during the login process on `auth.ciphera.net`:

1.  **Client-Side Derivation**:
    *   The client derives an `Auth Key` using `PBKDF2-HMAC-SHA256` (100,000 iterations).
    *   Input: `User Password` + `Email` (as salt).
    *   Output: 32-byte key (encoded as 64-char Hex string).
    *   **Only this derived key** is sent to the Auth Server.

2.  **Server-Side Hashing**:
    *   The Auth Server receives the `Auth Key`.
    *   The server hashes it again using `Argon2id` (memory-hard function).
    *   The database stores: `$argon2id$...` (Hash of the Auth Key).

This ensures that even if the TLS connection is stripped or the Auth Server logs are compromised, the attacker only sees the derived key, which cannot be used to decrypt user files (as file encryption keys will be derived separately).

### Authentication & Sessions

- **Access Tokens**: Short-lived (15 minutes) JWTs used for API access.
- **Refresh Tokens**: Long-lived (30 days) opaque tokens used to obtain new Access Tokens.
  - Stored in database with hash (SHA-256).
  - Rotated on every use (Reuse Detection).
  - Revoked on logout or password change.
- **Email Verification**: Required for new accounts before login is permitted.

### Zero-Knowledge File Architecture

### Client-Side Encryption

- All files are encrypted **before** upload using AES-256-GCM
- Encryption keys are generated client-side and never sent to the server
- Server only stores encrypted blobs and cannot decrypt them

### Key Management

- Each file has a unique encryption key (256-bit)
- Keys are embedded in share URLs (URL-safe base64)
- Keys are never stored on the server
- Optional password protection adds an additional layer

## Server Security

### Infrastructure

- **Frontend**: Hosted on Swiss infrastructure
- **Backend API**: Hosted on Swiss infrastructure (encapsulated container environment)
- **Auth Service**: Hosted on Swiss infrastructure (isolated service)
- **Database**: PostgreSQL on Swiss infrastructure (encrypted at rest)
- **Storage**: Cloudflare R2 Storage (S3-compatible, encrypted at rest)
- **DNS & CDN**: Cloudflare (DDoS protection, WAF, SSL termination)
- **HTTPS**: All communications encrypted in transit (TLS 1.3, Strict SSL)

### Security Headers

The backend sets the following security headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Content-Security-Policy: default-src 'self'`
- `Referrer-Policy: no-referrer`

### Rate Limiting

- Rate limiting applied per IP address
- Default: 60 requests per minute
- Prevents abuse and DoS attacks

### Input Validation

- All API inputs are validated
- SQL injection prevention via parameterized queries
- XSS prevention through proper encoding
- PKCE verification for OAuth flows

## Privacy

### Data Minimization

- Only essential metadata is stored:
  - Encrypted filename
  - File size (encrypted)
  - Expiration date
  - Download count
- No IP logging
- No tracking cookies
  - No analytics

### Data Retention & Cleanup

- **Automatic Purging**: A background worker runs every hour to identify and permanently delete expired files from both the database and physical storage.
- **Immediate Revocation**: Users can manually delete files before expiration, which triggers immediate removal from storage.
- **One-Time Downloads**: Files marked for "One-Time Download" are atomically deleted immediately after the first successful download.

### GDPR Compliance

- Users control their data
- Files automatically expire
- One-time download option available
- No personal data collection

## Threat Model

### Protected Against

- Server compromise (files remain encrypted)
- Auth Server compromise (passwords remain secure due to double-hashing)
- Network interception (HTTPS + PKCE)
- Unauthorized access (encryption keys required)
- Replay attacks (unique IVs per file)

### Limitations

- Browser compromise (keys may be exposed)
- URL logging (encryption keys in URLs may be logged)
- Password attacks (depends on password strength)

## Security Best Practices

### For Users

- Use strong passwords when password protection is enabled
- Keep share links private
- Delete files after use
- Be aware that URLs may be logged

### For Developers

- Regular security audits
- Keep dependencies updated
- Monitor for vulnerabilities
- Follow secure coding practices

## Reporting Security Issues

If you discover a security vulnerability, please report it responsibly:

1. Do not open a public issue
2. Email security@ciphera.net
3. Provide detailed information about the vulnerability
4. Allow time for the issue to be addressed before disclosure

## Security Updates

Security updates will be published as needed. Users are encouraged to:

- Keep the application updated
- Monitor security advisories
- Report any security concerns
