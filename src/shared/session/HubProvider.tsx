import { useEffect, type ReactNode } from 'react'
import { getDefaultHub, type Hub } from './hub'
import { HubContext } from './hooks'
export function HubProvider({ children, hub = getDefaultHub() }: { children: ReactNode; hub?: Hub }) {
  useEffect(() => {
    void hub.auth.start()
    const resume = () => { if (document.visibilityState !== 'hidden') { void hub.auth.refresh().then(() => hub.cloud.resumeAutomatic()) } }
    const warn = (event: BeforeUnloadEvent) => { if (hub.cloud.getSnapshot().pending && !hub.cloud.getSnapshot().cached) event.preventDefault() }
    window.addEventListener('focus', resume)
    document.addEventListener('visibilitychange', resume)
    window.addEventListener('beforeunload', warn)
    return () => {
      hub.auth.dispose()
      window.removeEventListener('focus', resume)
      document.removeEventListener('visibilitychange', resume)
      window.removeEventListener('beforeunload', warn)
    }
  }, [hub])
  return <HubContext.Provider value={hub}>{children}</HubContext.Provider>
}
