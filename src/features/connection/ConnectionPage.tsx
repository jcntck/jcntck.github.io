import { useEffect, useState, useSyncExternalStore } from 'react'
import { authorize, loadIdentity, type OAuth } from '../../integrations/google-drive/identity'
import googleConfig from '../../integrations/google-drive/config.json'
import { DriveFileLink } from '../../shared/components/DriveFileLink'
import { useHub } from '../../shared/session/hooks'

export function ConnectionPage({ clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || googleConfig.clientId }: { clientId?: string }) {
  const hub = useHub()
  const controller = hub.cloud
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
  const connect = async (sync = false) => {
    if (!hub.auth.isValid() || !oauth) return
    await controller.connect(() => authorize(oauth, clientId))
    if (sync && hub.auth.isValid()) await controller.sync()
  }
  return <section className="connection-page">
    <p className="eyebrow">ARMAZENAMENTO PESSOAL</p><h1>Conexão</h1>
    <p className="page-description">Seu login e seu Drive são independentes. Prepare uma amostra e escolha quando sincronizá-la com sua conta.</p>
    {!clientId && <p className="connection-notice">A conexão Google precisa ser configurada pelo responsável por este hub.</p>}
    {loadError && <p role="alert">{loadError} <button onClick={() => setAttempt(value => value + 1)}>Tentar carregar Google</button></p>}
    <div className="connection-card">
      <h2>{state.account ? `Drive: ${state.account.name}` : 'Seu Google Drive'}</h2>
      <p role="status" aria-live="polite">{state.message}</p>
      <div className="connection-actions">
        <button disabled={!oauth || !clientId || busy} onClick={() => void connect()}>{state.account ? 'Reconectar Drive' : 'Conectar Google Drive'}</button>
        {state.phase !== 'disconnected' && <button onClick={() => controller.disconnect()}>Desconectar Drive</button>}
      </div>
      <div className="connection-actions">
        <button onClick={() => { if (hub.auth.isValid()) controller.stageProbe() }}>Preparar amostra</button>
        <button disabled={busy || (!state.canWrite && (!oauth || !clientId))} onClick={() => { if (!hub.auth.isValid()) return; if (state.canWrite) void controller.sync(); else void connect(true) }}>Sincronizar</button>
        <button disabled={busy || !state.account || state.phase === 'expired'} onClick={() => { if (!hub.auth.isValid()) return; if (!state.pending || window.confirm('Reler e descartar as alterações locais pendentes?')) void controller.reload() }}>Reler do Drive</button>
      </div>
      <label className="automatic-control"><input type="checkbox" checked={state.automatic} disabled={busy || (!state.canWrite && !state.automatic)} onChange={event => controller.setAutomatic(event.target.checked)} /> Sincronizar automaticamente nesta sessão</label>
      {state.syncPhase === 'conflict' && <p role="alert">Há uma divergência com o Drive. Releia para decidir sobre as alterações locais antes de tentar outro envio.</p>}
      {state.syncPhase === 'error' && <p>Sincronização pausada. Confira a conexão e reconecte o Drive antes de repetir.</p>}
      {state.snapshot === null && <p>Ainda não existe documento. Somente uma sincronização com alteração pendente criará my-hub.json.</p>}
      {state.snapshot && <DriveFileLink fileId={state.snapshot.fileId} webViewLink={state.snapshot.webViewLink} />}
      {probe != null && <div><h3>Amostra retornada pelo Drive</h3><pre>{JSON.stringify(probe, null, 2)}</pre></div>}
      {state.pending && <p>Há uma alteração pendente nesta aba{state.queued ? ' e novas alterações aguardando o envio anterior' : ''}. Ela ainda não está confirmada no Drive.</p>}
      {state.lastSynced && <p>Última sincronização confirmada: <time dateTime={state.lastSynced}>{new Date(state.lastSynced).toLocaleString('pt-BR')}</time></p>}
    </div>
    <p className="page-description">O login pode ser restaurado por até 30 dias. Após refresh, reconecte o Drive para sincronizar. Alterações pendentes existem somente nesta aba e são descartadas ao recarregar ou sair. Use um dispositivo por vez.</p>
    <p className="page-description">A sincronização automática funciona com esta página aberta e autorização válida; ela pausa em falhas, conflitos ou expiração.</p>
    <p className="page-description"><a href="https://myaccount.google.com/connections" target="_blank" rel="noreferrer">Gerenciar e revogar consentimento no Google</a></p>
  </section>
}
