'use client'

import { useState } from 'react'
import { Button, toast } from '@ciphera-net/ui'
import apiRequest from '../lib/api/client'
import { CreateRequestResponse, CreateRequestParams } from '../lib/types/api'
import { generateEncryptionKey, encodeKeyForSharing, generateIV } from '../lib/crypto/key-management'
import { encryptString, arrayBufferToBase64 } from '../lib/crypto/encryption'

interface FileRequestProps {
  onRequestCreated?: (shareUrl: string) => void
}

export default function FileRequest({ onRequestCreated }: FileRequestProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [expirationMinutes, setExpirationMinutes] = useState(10080) // 7 Days default
  const [maxUploads, setMaxUploads] = useState<number | undefined>(undefined)

  const EXPIRATION_OPTIONS = [
    { label: '1 Day', value: 1440 },
    { label: '7 Days', value: 10080 },
    { label: '30 Days', value: 43200 },
  ]

  const handleCreateRequest = async () => {
    if (!title.trim()) {
      setError('Please provide a title for your request')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // * Generate the encryption key that will be embedded in the URL
      const keyPair = await generateEncryptionKey()
      const iv = generateIV()
      const encodedKey = encodeKeyForSharing(keyPair.raw)

      // * Encrypt Title & Description
      const encryptedTitleBuffer = await encryptString(title, keyPair.key, iv)
      const encryptedTitle = arrayBufferToBase64(encryptedTitleBuffer)
      
      let encryptedDescription = undefined
      if (description) {
          const encDescBuffer = await encryptString(description, keyPair.key, iv)
          encryptedDescription = arrayBufferToBase64(encDescBuffer)
      }

      const requestBody: CreateRequestParams = {
        encryptedTitle,
        encryptedDescription,
        iv: arrayBufferToBase64(iv),
        expirationMinutes,
        maxUploads
      }

      const response = await apiRequest<CreateRequestResponse>('/requests', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const fullUrl = `${window.location.origin}/request/${response.requestId}#${encodedKey}`

      if (onRequestCreated) {
        onRequestCreated(fullUrl)
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create request'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto h-full flex flex-col justify-between">
      <div className="space-y-3">
        {/* Header Icon */}
        <div className="flex justify-center mb-1">
          <div className="w-12 h-12 bg-brand-orange/5 dark:bg-brand-orange/10 rounded-full flex items-center justify-center text-brand-orange shadow-sm border border-brand-orange/10">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
        
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Request Files</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Create a secure link to receive encrypted files</p>
        </div>

        {/* Title Input */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Request Title <span className="text-brand-orange">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Project Documents"
            className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all outline-none"
            disabled={loading}
          />
        </div>

        {/* Description Input */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Description <span className="text-neutral-400 font-normal">(Optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Instructions for the uploader..."
            rows={2}
            className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all outline-none resize-none"
            disabled={loading}
          />
        </div>

        {/* Expiration Options */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Link Expiration
          </label>
          <div className="grid grid-cols-3 gap-2">
            {EXPIRATION_OPTIONS.map((option) => (
              <button
                key={option.label}
                onClick={() => setExpirationMinutes(option.value)}
                disabled={loading}
                className={`px-3 py-2 text-sm font-medium rounded-xl border transition-all duration-200 ${
                  expirationMinutes === option.value
                    ? 'bg-brand-orange text-white border-brand-orange shadow-md shadow-brand-orange/20'
                    : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-brand-orange/50 hover:bg-brand-orange/5 dark:hover:bg-brand-orange/10'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Create Button */}
      <div className="pt-4 mt-auto">
        <Button
          onClick={handleCreateRequest}
          disabled={loading}
          isLoading={loading}
          variant="primary"
          className="w-full py-3.5"
        >
          Create Request Link
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}
    </div>
  )
}
