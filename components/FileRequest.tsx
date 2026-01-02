'use client'

import { useState } from 'react'
import apiRequest from '../lib/api/client'
import { CreateRequestResponse, CreateRequestParams } from '../lib/types/api'
import { generateEncryptionKey, encodeKeyForSharing } from '../lib/crypto/key-management'

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
      const encodedKey = encodeKeyForSharing(keyPair.raw)

      const requestBody: CreateRequestParams = {
        title,
        description,
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
      setError(err instanceof Error ? err.message : 'Failed to create request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto h-full flex flex-col justify-between">
      <div className="space-y-4">
        {/* Header Icon */}
        <div className="flex justify-center mb-2">
          <div className="w-16 h-16 bg-brand-orange/5 rounded-full flex items-center justify-center text-brand-orange shadow-sm border border-brand-orange/10">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
        
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-neutral-900">Request Files</h3>
          <p className="text-sm text-neutral-500 mt-1">Create a secure link to receive encrypted files</p>
        </div>

        {/* Title Input */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Request Title <span className="text-brand-orange">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Project Documents"
            className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl bg-white focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all outline-none"
            disabled={loading}
          />
        </div>

        {/* Description Input */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Description <span className="text-neutral-400 font-normal">(Optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Instructions for the uploader..."
            rows={3}
            className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl bg-white focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all outline-none resize-none"
            disabled={loading}
          />
        </div>

        {/* Expiration Options */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-700">
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
                    : 'bg-white text-neutral-600 border-neutral-200 hover:border-brand-orange/50 hover:bg-brand-orange/5'
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
        <button
          onClick={handleCreateRequest}
          disabled={loading}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 py-3.5"
        >
          {loading ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Link...
            </>
          ) : (
            'Create Request Link'
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  )
}
