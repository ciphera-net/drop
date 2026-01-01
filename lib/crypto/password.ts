/**
 * Password protection utilities using PBKDF2
 */

/**
 * Derive a key from password using PBKDF2
 * This is used to encrypt the file encryption key when password protection is enabled
 */
export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  // * Import password as key material
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )

  // * Derive key using PBKDF2
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000, // * High iteration count for security
      hash: 'SHA-256',
    },
    passwordKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false, // not extractable
    ['encrypt', 'decrypt']
  )
}

/**
 * Generate a random salt for PBKDF2
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16))
}

/**
 * Encrypt a key with a password-derived key
 */
export async function encryptKeyWithPassword(
  key: Uint8Array,
  password: string
): Promise<{ encrypted: ArrayBuffer; iv: Uint8Array; salt: Uint8Array }> {
  const salt = generateSalt()
  const derivedKey = await deriveKeyFromPassword(password, salt)
  const iv = crypto.getRandomValues(new Uint8Array(12))

  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    derivedKey,
    key
  )

  return {
    encrypted,
    iv,
    salt,
  }
}

/**
 * Decrypt a key using a password
 */
export async function decryptKeyWithPassword(
  encrypted: ArrayBuffer,
  iv: Uint8Array,
  salt: Uint8Array,
  password: string
): Promise<Uint8Array> {
  const derivedKey = await deriveKeyFromPassword(password, salt)

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    derivedKey,
    encrypted
  )

  return new Uint8Array(decrypted)
}
