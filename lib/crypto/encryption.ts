/**
 * Client-side encryption/decryption using AES-256-GCM
 */

import {
  generateEncryptionKey,
  generateIV,
  importEncryptionKey,
} from './key-management'
import type { EncryptionResult, DecryptionResult, EncryptionKey } from '../types/encryption'

/**
 * Encrypt a file using AES-256-GCM
 */
export async function encryptFile(
  file: File,
  existingKey?: EncryptionKey
): Promise<EncryptionResult> {
  // * Generate encryption key and IV
  const key = existingKey || await generateEncryptionKey()
  const iv = generateIV()

  // * Read file as ArrayBuffer
  const fileData = await file.arrayBuffer()

  // * Encrypt the file
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource, // Explicit cast for TS compatibility
    },
    key.key,
    fileData
  )

  return {
    encrypted,
    iv,
    key,
  }
}

/**
 * Decrypt a file using AES-256-GCM
 */
export async function decryptFile(
  encryptedData: ArrayBuffer,
  key: Uint8Array,
  iv: Uint8Array
): Promise<DecryptionResult> {
  // * Import the key
  const cryptoKey = await importEncryptionKey(key)

  // * Decrypt the data
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
    },
    cryptoKey,
    encryptedData
  )

  return {
    decrypted,
  }
}

/**
 * Encrypt a string (e.g., filename) using AES-256-GCM
 */
export async function encryptString(
  text: string,
  key: CryptoKey,
  iv: Uint8Array
): Promise<ArrayBuffer> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)

  return crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
    },
    key,
    data
  )
}

/**
 * Decrypt a string (e.g., filename) using AES-256-GCM
 */
export async function decryptString(
  encryptedData: ArrayBuffer,
  key: CryptoKey,
  iv: Uint8Array
): Promise<string> {
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
    },
    key,
    encryptedData
  )

  const decoder = new TextDecoder()
  return decoder.decode(decrypted)
}

/**
 * Convert ArrayBuffer to base64 string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Convert base64 string to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}
