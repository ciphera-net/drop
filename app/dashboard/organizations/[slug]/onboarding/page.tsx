'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckIcon, PlusIcon, XIcon, ArrowRightIcon } from '@ciphera-net/ui'
import { getUserOrganizations, sendInvitation, OrganizationMember } from '@/lib/api/organization'
import { toast } from '@ciphera-net/ui'
import { Button, Input } from '@ciphera-net/ui'
import React from 'react'

export default function OnboardingPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [org, setOrg] = useState<OrganizationMember | null>(null)
  const [loading, setLoading] = useState(true)
  const [invites, setInvites] = useState<string[]>([''])
  const [sending, setSending] = useState(false)
  const [slug, setSlug] = useState<string>('')

  // Unwrap params
  React.useEffect(() => {
    params.then(unwrapped => setSlug(unwrapped.slug))
  }, [params])

  useEffect(() => {
    if (!slug) return

    const fetchOrg = async () => {
      try {
        const orgs = await getUserOrganizations()
        const currentOrg = orgs.find(o => o.organization_slug === slug)
        if (currentOrg) {
          setOrg(currentOrg)
        } else {
          // Redirect if org not found or no access
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Failed to fetch org', error)
      } finally {
        setLoading(false)
      }
    }
    fetchOrg()
  }, [slug, router])

  const handleAddEmail = () => {
    setInvites([...invites, ''])
  }

  const handleEmailChange = (index: number, value: string) => {
    const newInvites = [...invites]
    newInvites[index] = value
    setInvites(newInvites)
  }

  const handleRemoveEmail = (index: number) => {
    const newInvites = invites.filter((_, i) => i !== index)
    setInvites(newInvites)
  }

  const handleSendInvites = async () => {
    if (!org) return
    setSending(true)
    
    // Filter empty emails
    const validEmails = invites.filter(email => email.trim() !== '')

    if (validEmails.length === 0) {
      setStep(3) // Skip if no emails
      return
    }

    try {
      // Send invites in parallel
      await Promise.all(validEmails.map(email => sendInvitation(org.organization_id, email)))
      toast.success(`Sent ${validEmails.length} invitations`)
      setStep(3)
    } catch (error: any) {
      toast.error('Failed to send some invitations. Please try again.')
    } finally {
      setSending(false)
    }
  }

  if (loading || !slug) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!org) return null

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <nav aria-label="Progress">
          <ol role="list" className="flex items-center">
            {[1, 2, 3].map((s, sIdx) => (
              <li key={s} className={`relative ${sIdx !== 2 ? 'pr-8 sm:pr-20' : ''}`}>
                <div className="flex items-center">
                  <div
                    className={`${
                      step >= s ? 'bg-blue-600' : 'bg-neutral-200 dark:bg-neutral-700'
                    } h-8 w-8 rounded-full flex items-center justify-center transition-colors duration-200`}
                  >
                    {step > s ? (
                      <CheckIcon className="h-5 w-5 text-white" aria-hidden="true" />
                    ) : (
                      <span className={`${step === s ? 'text-white' : 'text-neutral-500'} font-medium`}>{s}</span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-8"
          >
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 mb-6">
                <CheckIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4">
                {org.organization_name} is ready!
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 mb-8 max-w-lg mx-auto">
                Your organization has been created. You can now start sharing files securely and managing your organization's access.
              </p>
              <Button
                onClick={() => setStep(2)}
                className="w-full sm:w-auto px-8 py-3 text-lg"
              >
                Continue to Setup
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-8"
          >
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Invite your organization members</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Collaborate securely by inviting your organization members. They'll receive an email to join <strong>{org.organization_name}</strong>.
            </p>

            <div className="space-y-3 mb-6">
              {invites.map((email, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="colleague@company.com"
                    value={email}
                    onChange={(e) => handleEmailChange(index, e.target.value)}
                    className="flex-1"
                  />
                  {invites.length > 1 && (
                    <button
                      onClick={() => handleRemoveEmail(index)}
                      className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
                    >
                      <XIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={handleAddEmail}
                className="flex items-center text-sm text-blue-600 hover:text-blue-500 font-medium mt-2"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add another
              </button>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-neutral-100 dark:border-neutral-800">
              <button
                onClick={() => setStep(3)}
                className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white text-sm font-medium"
              >
                Skip for now
              </button>
              <Button
                onClick={handleSendInvites}
                disabled={sending}
                isLoading={sending}
              >
                Send Invitations
              </Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-8 text-center"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
              <CheckIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4">
              All set!
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-8">
              Your organization is set up and ready to go.
            </p>
            <Button
              onClick={() => router.push(`/dashboard`)}
              className="w-full sm:w-auto px-8 py-3 text-lg flex items-center justify-center gap-2"
            >
              Go to Dashboard
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
