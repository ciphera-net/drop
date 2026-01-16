'use client'

import { Footer as UIFooter } from '@ciphera-net/ui'
import Link from 'next/link'
import { useState } from 'react'
import FeedbackModal from './FeedbackModal'

export default function Footer() {
  const [showFeedback, setShowFeedback] = useState(false)

  return (
    <>
      <UIFooter 
        LinkComponent={Link}
        onFeedbackClick={() => setShowFeedback(true)}
        appName="Ciphera Drop"
        aboutText="Why Drop"
      />
      <FeedbackModal 
        isOpen={showFeedback} 
        onClose={() => setShowFeedback(false)} 
      />
    </>
  )
}
