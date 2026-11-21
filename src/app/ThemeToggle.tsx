import { useState } from 'react'
import { Icon } from '../shared/components/Icon'

export function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.dataset.theme === 'dark')
  return <button className="theme-toggle" aria-label={dark ? 'Usar tema claro' : 'Usar tema escuro'} onClick={() => {
    const next = !dark
    setDark(next)
    document.documentElement.dataset.theme = next ? 'dark' : 'light'
    try { localStorage.setItem('my-hub.theme', next ? 'dark' : 'light') } catch { /* Preference remains usable in memory. */ }
  }}>{<Icon name={dark ? 'sun' : 'moon'} />}</button>
}
