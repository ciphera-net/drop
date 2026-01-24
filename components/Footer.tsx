'use client'

import { Footer as UIFooter, FeedbackModal } from '@ciphera-net/ui'
import Link from 'next/link'
import { useState } from 'react'

export default function Footer() {
  const [showFeedback, setShowFeedback] = useState(false)

  return (
    <>
      <UIFooter 
        LinkComponent={Link}
        onFeedbackClick={() => setShowFeedback(true)}
        appName="Ciphera Drop"
      />
      <FeedbackModal 
        isOpen={showFeedback} 
        onClose={() => setShowFeedback(false)} 
      />
    </>
  )
}
