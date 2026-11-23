import { useState, useSyncExternalStore } from 'react'
import { useDriveActions } from '../session/useDriveActions'
import googleConfig from '../../integrations/google-drive/config.json'
import { Icon } from './Icon'
import { DriveNotice } from './DriveNotice'
import { DriveFileLink } from './DriveFileLink'
import { useHub } from '../session/hooks'

export function DrivePanel({ diagnostics = false, clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || googleConfig.clientId }: { diagnostics?: boolean; clientId?: string }) {
  const [copied, setCopied] = useState(false)
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
      <div className="connection-card-header"><span className="connection-icon"><Icon name="link" /></span><div><p className="eyebrow">Google Drive</p><h2>{state.account ? `Drive: ${state.account.name}` : 'Seu Google Drive'}</h2></div></div>
      <DriveNotice state={state} />
      <div className="connection-actions connection-management">
        <button disabled={!actions.ready || !clientId || busy} onClick={() => void actions.run(false)}><Icon name="refresh" />{state.account ? 'Reconectar Drive' : 'Conectar Google Drive'}</button>
        {state.phase !== 'disconnected' && <button onClick={() => { controller.disconnect() }}><Icon name="unplug" />Desconectar Drive</button>}
      </div>
      <div className="connection-actions">
        <button disabled={!actions.ready || busy} onClick={() => void actions.run(false, true)}><Icon name="refresh" />Escolher conta do Drive</button>
        {diagnostics && <button onClick={() => { if (hub.auth.isValid()) controller.stageProbe() }}><Icon name="flask" />Preparar amostra</button>}
        <button className="connection-primary" disabled={busy || (!state.canWrite && (!actions.ready || !clientId))} onClick={() => { if (!hub.auth.isValid()) return; if (state.canWrite) void controller.sync(); else void actions.run() }}><Icon name="upload" />Sincronizar</button>
        <button disabled={busy || !state.account || state.phase === 'expired'} onClick={() => { if (!hub.auth.isValid()) return; void controller.reload() }}><Icon name="download" />Reler do Drive</button>
      </div>
      <label className="automatic-control"><input type="checkbox" checked={state.automatic} disabled={busy || (!state.canWrite && !state.automatic)} onChange={event => controller.setAutomatic(event.target.checked)} /> Sincronizar automaticamente nesta sessão</label>
      {state.snapshot === null && <p>Ainda não existe documento. Somente uma sincronização com alteração pendente criará my-hub.json.</p>}
      {state.snapshot && <DriveFileLink fileId={state.snapshot.fileId} webViewLink={state.snapshot.webViewLink} />}
      {diagnostics && probe != null && <details className="connection-probe"><summary><h3>Amostra retornada pelo Drive</h3><Icon name="chevron" /></summary><div className="probe-body"><pre>{JSON.stringify(probe, null, 2)}</pre><button className="copy-probe" aria-label="Copiar amostra" onClick={() => { void navigator.clipboard?.writeText(JSON.stringify(probe, null, 2)).then(() => setCopied(true), () => setCopied(false)) }}><Icon name={copied ? 'check' : 'copy'} /></button></div></details>}
      {state.lastSynced && <p>Última sincronização confirmada: <time dateTime={state.lastSynced}>{new Date(state.lastSynced).toLocaleString('pt-BR')}</time></p>}
    </div>
    <p className="page-description">O login pode ser restaurado por até 30 dias. Após refresh, reconecte o Drive para sincronizar. A biblioteca fica no cache deste navegador por conta, inclusive após refresh. Só a sincronização envia edições ao Drive. Títulos diferentes são mesclados. Obras repetidas usam a alteração mais recente de cada obra; em empate, prevalece o Drive. Use um dispositivo por vez.</p>
    <p className="page-description">A sincronização automática funciona com esta página aberta e autorização válida; ela pausa em falhas, conflitos ou expiração.</p>
    <p className="page-description"><a href="https://myaccount.google.com/connections" target="_blank" rel="noreferrer">Gerenciar e revogar consentimento no Google</a></p>
  </section>
}
