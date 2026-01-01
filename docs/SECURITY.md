# Security Architecture

## Overview

Drop is designed with privacy and security as core principles. This document outlines the security architecture and measures implemented.

## Zero-Knowledge Architecture

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

- **Database**: Supabase PostgreSQL (encrypted at rest)
- **Storage**: Supabase Storage (S3-compatible, encrypted at rest)
- **HTTPS**: All communications encrypted in transit (TLS 1.3)

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

### GDPR Compliance

- Users control their data
- Files automatically expire
- One-time download option available
- No personal data collection

## Threat Model

### Protected Against

- Server compromise (files remain encrypted)
- Network interception (HTTPS)
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
