/**
 * Encryption-related types
 */

export interface EncryptionKey {
  key: CryptoKey
  raw: Uint8Array
}

export interface EncryptedData {
  data: ArrayBuffer
  iv: Uint8Array
  salt?: Uint8Array // For password-protected keys
}

export interface EncryptionResult {
  encrypted: ArrayBuffer
  iv: Uint8Array
  key: EncryptionKey
}

export interface DecryptionResult {
  decrypted: ArrayBuffer
}
