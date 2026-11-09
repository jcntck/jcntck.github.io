import { useEffect, useRef } from 'react'
import { HubProvider } from '../shared/session/HubProvider'
import { useAuth, useHub } from '../shared/session/hooks'
import { AccountMenu } from '../shared/session/AccountMenu'
import type { Hub } from '../shared/session/hub'
import { Navigate, useLocation, useNavigate, NavLink, Route, Routes } from 'react-router-dom'
import { ConnectionPage } from '../features/connection/ConnectionPage'
import { HomePage } from './HomePage'
import type { HubModule } from './navigation'
import { MangasPage } from '../modules/mangas/MangasPage'

const defaultModules: readonly HubModule[] = [
  { id: 'mangas', label: 'Mangás', path: '/mangas', element: <MangasPage /> },
  { id: 'connection', label: 'Conexão', path: '/connection', element: <ConnectionPage /> },
]

function NotFound() {
  return <section className="page-heading"><p className="eyebrow">PÁGINA NÃO ENCONTRADA</p><h1>Vamos voltar ao início?</h1><p className="page-description">Este espaço ainda não existe no seu hub.</p><NavLink className="return-link" to="/">Voltar ao início <span aria-hidden="true">→</span></NavLink></section>
}

function Shell({ modules = defaultModules }: { modules?: readonly HubModule[] }) {
  const auth = useAuth()
  const hub = useHub()
  const location = useLocation()
  const navigate = useNavigate()
  const destination = useRef<string | null>(null)
  const personal = modules.some(module => module.path === location.pathname && module.access !== 'public')
  const signedIn = auth.phase === 'signed-in' && hub.auth.isValid()
  const restoring = ['restoring', 'signing-in'].includes(auth.phase)
  useEffect(() => {
    if (personal && !signedIn) destination.current = location.pathname
    if (signedIn && destination.current) {
      const next = destination.current
      destination.current = null
      if (modules.some(module => module.path === next) && next.startsWith('/') && !next.startsWith('//') && !next.includes(':')) navigate(next, { replace: true })
    }
  }, [personal, signedIn, location.pathname, navigate, modules])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content" onClick={(event) => { event.preventDefault(); document.getElementById('main-content')?.focus() }}>Pular para o conteúdo</a>
      <aside className="sidebar">
        <NavLink to="/" className="brand" aria-label="My Hub — início"><span className="brand-mark" aria-hidden="true">m<span>.</span></span><span>My Hub</span></NavLink>
        <div className="navigation-group"><p className="navigation-label">SEU ESPAÇO</p><nav aria-label="Navegação principal">
          <NavLink to="/" end><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" /></svg>Início</NavLink>
          {modules.filter(module => module.access === 'public' || signedIn).map((module) => <NavLink key={module.id} to={module.path}>{module.label}</NavLink>)}
        </nav></div>
        <p className="sidebar-note">Um lugar para<br /><strong>seus próximos passos.</strong></p>
      </aside>
      <div className="workspace">
        <header className="topbar"><span>Meu espaço pessoal</span><AccountMenu /></header>
        <main id="main-content" tabIndex={-1}>
          <div className="auth-status" role="status" aria-live="polite">{!signedIn && auth.message}{signedIn && !auth.persistent && 'Login temporário: o armazenamento do navegador está bloqueado. Recarregar encerra a sessão.'}</div>
          <Routes><Route path="/" element={<HomePage mangasAvailable={modules.some(module => module.id === 'mangas')} />} />{modules.map((module) => <Route key={module.id} path={module.path} element={module.access === 'public' || signedIn ? module.element : restoring || auth.phase === 'error' ? <p className="page-description">{auth.message}</p> : <Navigate to="/" replace />} />)}<Route path="*" element={<NotFound />} /></Routes>
        </main>
        <footer className="footer"><span>My Hub <span className="footer-dot" aria-hidden="true">·</span> Feito para o seu ritmo.</span><span className="release-info" aria-label="Versão da aplicação">v{__APP_VERSION__}<span aria-hidden="true"> / </span><span title={__COMMIT_SHA__}>{__COMMIT_SHA__ === 'development' ? 'desenvolvimento' : __COMMIT_SHA__.slice(0, 7)}</span></span></footer>
      </div>
    </div>
  )
}

export function App({ hub, modules }: { hub?: Hub; modules?: readonly HubModule[] }) {
  return <HubProvider hub={hub}><Shell modules={modules} /></HubProvider>
}
