import { useAuth, useHub } from './hooks'
export function AccountMenu() {
  const hub = useHub()
  const auth = useAuth()
  const busy = ['restoring', 'signing-in'].includes(auth.phase)
  const leave = (switchAccount = false) => {
    if (hub.cloud.getSnapshot().pending && !window.confirm('Sair e descartar as alterações ainda não sincronizadas?')) return
    void hub.auth.logout().then(() => { if (switchAccount && hub.auth.getSnapshot().phase === 'anonymous') void hub.auth.login() })
  }
  return <div className="account-menu">
    {auth.phase === 'signed-in' ? <>
      <span>{auth.identity?.name}</span>
      <button onClick={() => leave(true)}>Trocar conta</button>
      <button onClick={() => leave()}>Sair</button>
    </> : <>
      <button disabled={!auth.configured || busy} onClick={() => void hub.auth.login()}>{busy ? 'Verificando sessão…' : 'Entrar com Google'}</button>
      {busy && <button onClick={() => void hub.auth.logout('Entrada cancelada. Você pode tentar novamente.')}>Cancelar entrada</button>}
      {auth.phase === 'error' && <><button onClick={() => void hub.auth.retry()}>Tentar verificar novamente</button><button onClick={() => leave()}>Sair</button></>}
    </>}
  </div>
}
