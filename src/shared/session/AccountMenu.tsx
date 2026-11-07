import { useState } from 'react'
import { useAuth, useHub } from './hooks'
function AccountAvatar({ name, photoURL }: { name: string; photoURL?: string }) {
  const [failed, setFailed] = useState(false)
  let image: string | undefined
  try {
    const url = new URL(photoURL || '')
    if (url.protocol === 'https:' && !url.username && !url.password) image = url.href
  } catch { /* Profiles without a photo use initials. */ }
  const words = name.trim().split(/\s+/)
  const initials = [words[0]?.[0], words.length > 1 ? words.at(-1)?.[0] : ''].join('').toLocaleUpperCase('pt-BR') || 'G'
  return image && !failed
    ? <img className="personal-mark account-avatar" src={image} alt={`Foto de ${name}`} width={32} height={32} referrerPolicy="no-referrer" onError={() => setFailed(true)} />
    : <span className="personal-mark account-avatar" aria-hidden="true">{initials}</span>
}

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
      <span className="account-identity">
        <AccountAvatar key={`${auth.identity?.googleId}:${auth.identity?.photoURL || ''}`} name={auth.identity?.name || 'Conta Google'} photoURL={auth.identity?.photoURL} />
        <span className="account-name" title={auth.identity?.name}>{auth.identity?.name}</span>
      </span>
      <button onClick={() => leave(true)}>Trocar conta</button>
      <button onClick={() => leave()}>Sair</button>
    </> : <>
      <button disabled={!auth.configured || busy} onClick={() => void hub.auth.login()}>{busy ? 'Verificando sessão…' : 'Entrar com Google'}</button>
      {busy && <button onClick={() => void hub.auth.logout('Entrada cancelada. Você pode tentar novamente.')}>Cancelar entrada</button>}
      {auth.phase === 'error' && <><button onClick={() => void hub.auth.retry()}>Tentar verificar novamente</button><button onClick={() => leave()}>Sair</button></>}
    </>}
  </div>
}
