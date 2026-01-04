'use client'

import { useState, useEffect } from 'react'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'

interface CipherRevealProps {
  text: string
  delay?: number
  speed?: number
  onComplete?: () => void
  className?: string
}

export default function CipherReveal({ 
  text, 
  delay = 0, 
  speed = 50,
  onComplete,
  className 
}: CipherRevealProps) {
  const [display, setDisplay] = useState('')
  const [started, setStarted] = useState(false)

  useEffect(() => {
    // Reset state when text changes
    setDisplay('')
    setStarted(false)
    
    let startTimeout: NodeJS.Timeout
    let interval: NodeJS.Timeout

    startTimeout = setTimeout(() => {
      setStarted(true)
      let iteration = 0
      
      interval = setInterval(() => {
        setDisplay(
          text
            .split('')
            .map((letter, index) => {
              if (index < iteration) {
                return text[index]
              }
              return CHARS[Math.floor(Math.random() * CHARS.length)]
            })
            .join('')
        )

        if (iteration >= text.length) {
          clearInterval(interval)
          if (onComplete) onComplete()
        }

        iteration += 1 / 2 // Adjust this for smoothness vs speed
      }, speed)
    }, delay)

    return () => {
      clearTimeout(startTimeout)
      clearInterval(interval)
    }
  }, [text, delay, speed, onComplete])

  return (
    <span className={className || ''}>
      {display || (started ? '' : CHARS.slice(0, text.length))}
    </span>
  )
}
