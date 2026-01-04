# Encryption Specification

## Overview

Drop uses client-side encryption to ensure zero-knowledge file sharing. All encryption and decryption happens in the user's browser before any data is sent to the server.

## Encryption Algorithm

- **Algorithm**: AES-256-GCM (Advanced Encryption Standard with Galois/Counter Mode)
- **Key Size**: 256 bits (32 bytes)
- **IV Size**: 12 bytes (96 bits) - standard for AES-GCM
- **Key Derivation**: PBKDF2 with SHA-256 (for password protection)

## Encryption Flow

### File Encryption

1. **Key Generation**: A random 256-bit key is generated using Web Crypto API
2. **IV Generation**: A random 12-byte IV is generated for each file
3. **File Encryption**: The file is encrypted using AES-256-GCM with the generated key and IV
4. **Filename Encryption**: The filename is encrypted using the same key and IV
5. **Upload**: Only the encrypted data, encrypted filename, and IV are sent to the server

### Key Management

- **Storage**: Encryption keys are never stored on the server
- **Sharing**: Keys are embedded in share URLs as URL-safe base64 (fragment identifier `#`)
- **Password Protection**: Optional password protection uses PBKDF2 to derive a key that encrypts the file encryption key

### Decryption Flow

1. **Download**: Encrypted file data is downloaded from the server
2. **Key Extraction**: Encryption key is extracted from the share URL hash
3. **Decryption**: File and filename are decrypted using the key and IV
4. **Download**: Decrypted file is made available for download

## File Request Encryption

Drop allows users to create secure "File Requests" where others can upload files to them.

1. **Request Creation**:
   - Requester generates a random **Request Key** (AES-256).
   - Requester encrypts the *Request Title* and *Description* with this key.
   - The key is embedded in the **Request URL** (e.g., `https://drop.ciphera.net/request/xyz#<RequestKey>`).
   - The server stores only the encrypted metadata and IV.

2. **Uploading to Request**:
   - The uploader visits the Request URL.
   - The browser extracts the **Request Key** from the URL hash to decrypt and display the Title/Description.
   - When the uploader selects a file, it is **encrypted using the Request Key**.
   - The encrypted file is uploaded to the server.

3. **Retrieving Requested Files**:
   - Files uploaded to a request are encrypted with the **Request Key**.
   - **Important**: The Requester MUST retain the Request URL (containing the key) to decrypt these files.
   - Since the server does not know the Request Key, it cannot decrypt these files for the user on the dashboard.

## Security Properties

- **Zero-Knowledge**: Server cannot decrypt files even if compromised
- **Authenticated Encryption**: AES-GCM provides both confidentiality and authenticity
- **Unique IVs**: Each file uses a unique IV, preventing pattern analysis
- **Key Isolation**: Each file has its own encryption key
- **Metadata Protection**: Filenames and Request Titles are encrypted

## Implementation Details

### Web Crypto API

All encryption operations use the browser's native Web Crypto API:

```typescript
// Key generation
const key = await crypto.subtle.generateKey(
  { name: 'AES-GCM', length: 256 },
  true, // extractable
  ['encrypt', 'decrypt']
)

// Encryption
const encrypted = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv: iv },
  key,
  data
)
```

### Password Protection

When password protection is enabled:

1. A random salt is generated (16 bytes)
2. PBKDF2 derives a key from the password (100,000 iterations)
3. The file encryption key is encrypted with the password-derived key
4. Salt and encrypted key are stored (encrypted key in URL, salt on server)

## Threat Model

- **Server Compromise**: Files remain encrypted, keys not on server
- **Network Interception**: HTTPS protects data in transit
- **Browser Compromise**: If browser is compromised, encryption keys may be exposed
- **Password Attacks**: PBKDF2 with 100,000 iterations provides protection against brute force

## Best Practices

- Always use HTTPS
- Keep share links private
- Use strong passwords when password protection is enabled
- Delete share links after use
- Be aware that encryption keys in URLs may be logged by browsers or proxies
