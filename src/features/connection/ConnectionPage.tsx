import { useEffect, useState, useSyncExternalStore } from 'react'
import { authorize, loadIdentity, type OAuth } from '../../integrations/google-drive/identity'
import { CloudSession } from '../../integrations/google-drive/session'

const session = new CloudSession()
export function ConnectionPage({ controller = session, clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '' }: { controller?: CloudSession; clientId?: string }) {
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot)
  const [oauth, setOAuth] = useState<OAuth>()
  const [loadError, setLoadError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!clientId) return
    let active = true
    loadIdentity().then(value => { if (active) { setOAuth(value); setLoadError('') } }, () => { if (active) setLoadError('Não foi possível carregar o Google. Confira a rede e tente novamente.') })
    return () => { active = false }
  }, [clientId, attempt])
  const busy = ['authorizing', 'loading', 'saving'].includes(state.phase)
  const probe = state.snapshot?.document.diagnostics.probe
  return <section className="connection-page">
    <p className="eyebrow">ARMAZENAMENTO PESSOAL</p><h1>Conexão</h1>
    <p className="page-description">Conecte sua conta para guardar uma amostra privada no Google Drive. Nenhum arquivo é criado até você escolher gravar.</p>
    {!clientId && <p className="connection-notice">A conexão Google ainda precisa ser configurada pelo responsável por este hub.</p>}
    {loadError && <p role="alert">{loadError} <button onClick={() => setAttempt(value => value + 1)}>Tentar carregar Google</button></p>}
    <div className="connection-card">
      <h2>{state.account ? `Conta: ${state.account.name}` : 'Sua conta Google'}</h2>
      <p role="status" aria-live="polite">{state.message}</p>
      <div className="connection-actions">
        <button disabled={!oauth || !clientId || busy} onClick={() => void controller.connect(() => authorize(oauth!, clientId))}>{state.account ? 'Reconectar / trocar conta' : 'Conectar Google Drive'}</button>
        {state.phase !== 'disconnected' && <button onClick={() => controller.disconnect()}>Desconectar</button>}
      </div>
      {state.account && <>
        <div className="connection-actions">
          <button disabled={!state.canWrite || busy} onClick={() => void controller.saveProbe()}>{state.pending ? 'Repetir tentativa pendente' : 'Gravar amostra'}</button>
          <button disabled={busy || state.phase === 'expired' || state.phase === 'authorizing'} onClick={() => { if (!state.pending || window.confirm('Recarregar e descartar a tentativa local pendente?')) void controller.reload() }}>Reler do Drive{state.pending ? ' e descartar tentativa' : ''}</button>
        </div>
        {state.snapshot === null && <p>Ainda não existe documento. A primeira gravação criará my-hub.json.</p>}
        {probe != null && <div><h3>Amostra retornada pelo Drive</h3><pre>{JSON.stringify(probe, null, 2)}</pre></div>}
        {state.pending && <p>Uma tentativa permanece somente na memória desta aba. Reconecte para conferir e repetir, ou releia para descartá-la.</p>}
      </>}
    </div>
    <p className="page-description">Use um dispositivo por vez. Alterações simultâneas podem se sobrepor; não há edição offline. Fechar a aba encerra a sessão e descarta tentativas pendentes.</p>
    <p className="page-description"><a href="https://myaccount.google.com/connections" target="_blank" rel="noreferrer">Gerenciar e revogar consentimento no Google</a></p>
  </section>
}
