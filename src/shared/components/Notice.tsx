import { useEffect, useState } from 'react'
import { Icon } from './Icon'

export type NoticeTone = 'success' | 'warning' | 'error' | 'info'

export function Notice({ message, tone, eventKey = message }: { message: string; tone: NoticeTone; eventKey?: unknown }) {
  const [dismissed, setDismissed] = useState<unknown>()
  useEffect(() => {
    if (!message || tone !== 'success') return
    const timer = setTimeout(() => setDismissed(() => eventKey), 3000)
    return () => clearTimeout(timer)
  }, [message, tone, eventKey])
  if (!message || (tone === 'success' && dismissed === eventKey)) return null
  return <p className={`hub-notice hub-notice-${tone}`} role={tone === 'error' ? 'alert' : 'status'} aria-live={tone === 'error' ? 'assertive' : 'polite'}><Icon name={tone === 'success' ? 'check' : tone === 'info' ? 'info' : 'alert'} /><span>{message}</span></p>
}
