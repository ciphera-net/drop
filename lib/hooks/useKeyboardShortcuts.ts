import { useEffect } from 'react'

type KeyHandler = (e: KeyboardEvent) => void

interface ShortcutConfig {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  handler: KeyHandler
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        // Allow Escape to work even in inputs to blur/close
        if (e.key !== 'Escape') return
      }

      shortcuts.forEach((shortcut) => {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase()
        const ctrlMatch = shortcut.ctrlKey ? (e.ctrlKey || e.metaKey) : true // Treat Cmd as Ctrl on Mac
        const shiftMatch = shortcut.shiftKey ? e.shiftKey : true
        const altMatch = shortcut.altKey ? e.altKey : true

        // Strict checking for modifiers if specified as true, otherwise relaxed?
        // Let's do exact matching for modifiers if they are explicitly requested.
        // But for "ctrlKey", we usually mean "Primary Modifier" (Ctrl or Cmd).
        
        // Revised logic:
        const isCtrlPressed = e.ctrlKey || e.metaKey
        const isShiftPressed = e.shiftKey
        const isAltPressed = e.altKey

        const reqCtrl = !!shortcut.ctrlKey
        const reqShift = !!shortcut.shiftKey
        const reqAlt = !!shortcut.altKey

        if (
          keyMatch &&
          isCtrlPressed === reqCtrl &&
          isShiftPressed === reqShift &&
          isAltPressed === reqAlt
        ) {
          e.preventDefault()
          shortcut.handler(e)
        }
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}
