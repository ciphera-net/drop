/**
 * Key generation and management utilities
 */

import type { EncryptionKey } from '../types/encryption'

/**
 * Generate a random encryption key for AES-256-GCM
 */
export async function generateEncryptionKey(): Promise<EncryptionKey> {
  // * Generate a 256-bit (32-byte) key for AES-256
  const key = await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  )

  // * Export the raw key bytes
  const raw = new Uint8Array(await crypto.subtle.exportKey('raw', key))

  return {
    key,
    raw,
  }
}

/**
 * Import a raw key into a CryptoKey object
 */
export async function importEncryptionKey(
  rawKey: Uint8Array
): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    rawKey as BufferSource,
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  )
}

/**
 * Generate a random IV (Initialization Vector) for AES-GCM
 * IV should be 12 bytes for AES-GCM
 */
export function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(12))
}

/**
 * Encode key to URL-safe base64 for sharing
 */
export function encodeKeyForSharing(key: Uint8Array): string {
  // * Convert to base64 and make URL-safe
  const base64 = btoa(String.fromCharCode(...key))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * Decode URL-safe base64 key
 */
export function decodeKeyFromSharing(encoded: string): Uint8Array {
  // * Make base64-safe again
  let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
  // * Add padding if needed
  while (base64.length % 4) {
    base64 += '='
  }
  const binary = atob(base64)
  return new Uint8Array(binary.split('').map((c) => c.charCodeAt(0)))
}
