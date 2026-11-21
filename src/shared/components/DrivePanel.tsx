import { useSyncExternalStore } from 'react'
import { useDriveActions } from '../session/useDriveActions'
import googleConfig from '../../integrations/google-drive/config.json'
import { DriveFileLink } from './DriveFileLink'
import { useHub } from '../session/hooks'

export function DrivePanel({ diagnostics = false, clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || googleConfig.clientId }: { diagnostics?: boolean; clientId?: string }) {
  const hub = useHub()
  const controller = hub.cloud
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot)
  const actions = useDriveActions(clientId)
  const busy = ['authorizing', 'loading', 'saving'].includes(state.phase)
  const probe = state.snapshot?.document.diagnostics.probe
  return <section className="connection-page" aria-label="Sincronização com o Drive">
    {!clientId && <p className="connection-notice">A conexão Google precisa ser configurada pelo responsável por este hub.</p>}
    {actions.error && <p role="alert">{actions.error} <button onClick={() => actions.retry()}>Tentar carregar Google</button></p>}
    <div className="connection-card">
      <h2>{state.account ? `Drive: ${state.account.name}` : 'Seu Google Drive'}</h2>
      <p role="status" aria-live="polite">{state.message}</p>
      <div className="connection-actions">
        <button disabled={!actions.ready || !clientId || busy} onClick={() => void actions.run(false)}>{state.account ? 'Reconectar Drive' : 'Conectar Google Drive'}</button>
        {state.phase !== 'disconnected' && <button onClick={() => { controller.disconnect() }}>Desconectar Drive</button>}
      </div>
      <div className="connection-actions">
        <button disabled={!actions.ready || busy} onClick={() => void actions.run(false, true)}>Escolher conta do Drive</button>
        {diagnostics && <button onClick={() => { if (hub.auth.isValid()) controller.stageProbe() }}>Preparar amostra</button>}
        <button disabled={busy || (!state.canWrite && (!actions.ready || !clientId))} onClick={() => { if (!hub.auth.isValid()) return; if (state.canWrite) void controller.sync(); else void actions.run() }}>Sincronizar</button>
        <button disabled={busy || !state.account || state.phase === 'expired'} onClick={() => { if (!hub.auth.isValid()) return; void controller.reload() }}>Reler do Drive</button>
      </div>
      <label className="automatic-control"><input type="checkbox" checked={state.automatic} disabled={busy || (!state.canWrite && !state.automatic)} onChange={event => controller.setAutomatic(event.target.checked)} /> Sincronizar automaticamente nesta sessão</label>
      {state.syncPhase === 'conflict' && <p role="alert">Há uma divergência com o Drive. Releia para decidir sobre as alterações locais antes de tentar outro envio.</p>}
      {state.syncPhase === 'error' && <p>Sincronização pausada. Confira a conexão e reconecte o Drive antes de repetir.</p>}
      {state.snapshot === null && <p>Ainda não existe documento. Somente uma sincronização com alteração pendente criará my-hub.json.</p>}
      {state.snapshot && <DriveFileLink fileId={state.snapshot.fileId} webViewLink={state.snapshot.webViewLink} />}
      {diagnostics && probe != null && <div><h3>Amostra retornada pelo Drive</h3><pre>{JSON.stringify(probe, null, 2)}</pre></div>}
      {state.cacheError && <p role="alert">{state.cacheError}</p>}
      {state.pending && <p>Há uma alteração local pendente{state.queued ? ' e novas alterações aguardando o envio anterior' : ''}. Ela ainda não está confirmada no Drive.</p>}
      {state.lastSynced && <p>Última sincronização confirmada: <time dateTime={state.lastSynced}>{new Date(state.lastSynced).toLocaleString('pt-BR')}</time></p>}
    </div>
    <p className="page-description">O login pode ser restaurado por até 30 dias. Após refresh, reconecte o Drive para sincronizar. A biblioteca fica no cache deste navegador por conta, inclusive após refresh. Só a sincronização envia edições ao Drive. A cópia com data de atualização mais recente prevalece; em empate, o Drive. Use um dispositivo por vez.</p>
    <p className="page-description">A sincronização automática funciona com esta página aberta e autorização válida; ela pausa em falhas, conflitos ou expiração.</p>
    <p className="page-description"><a href="https://myaccount.google.com/connections" target="_blank" rel="noreferrer">Gerenciar e revogar consentimento no Google</a></p>
  </section>
}
