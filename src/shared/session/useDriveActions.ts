import { useEffect, useState } from 'react'
import { authorize, loadIdentity, type OAuth } from '../../integrations/google-drive/identity'
import config from '../../integrations/google-drive/config.json'
import { useHub } from './hooks'

export function useDriveActions(clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || config.clientId) {
  const hub = useHub()
  const [oauth, setOAuth] = useState<OAuth>()
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    loadIdentity().then(value => { if (active) { setOAuth(value); setError('') } }, () => { if (active) setError('Não foi possível carregar o Google. Tente novamente.') })
    return () => { active = false }
  }, [attempt])
  const run = async (sync = true, chooseAccount = false) => {
    if (!hub.auth.isValid() || ['authorizing', 'loading', 'saving'].includes(hub.cloud.getSnapshot().phase)) return
    const identity = hub.auth.getSnapshot().identity
    if (!hub.acquireDrive()) return
    try {
      if (!hub.cloud.getSnapshot().canWrite || !sync || chooseAccount) {
        if (!oauth || !clientId) return
        await hub.cloud.connect(() => authorize(oauth, clientId, identity?.googleId, chooseAccount))
        if (!hub.auth.isValid() || hub.auth.getSnapshot().identity !== identity || hub.cloud.getSnapshot().phase !== 'ready') return
        if (!hub.cloud.getSnapshot().pending) return
      }
      if (sync) await hub.cloud.sync()
    } finally { hub.releaseDrive() }
  }
  return { run, ready: !!oauth && !!clientId, error, retry: () => setAttempt(value => value + 1) }
}
