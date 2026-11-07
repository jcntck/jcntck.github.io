import { NavLink, Route, Routes } from 'react-router-dom'
import { HomePage } from './HomePage'
import type { HubModule } from './navigation'

function NotFound() {
  return <section className="page-heading"><p className="eyebrow">PÁGINA NÃO ENCONTRADA</p><h1>Vamos voltar ao início?</h1><p className="page-description">Este espaço ainda não existe no seu hub.</p><NavLink className="return-link" to="/">Voltar ao início <span aria-hidden="true">→</span></NavLink></section>
}

export function App({ modules = [] }: { modules?: readonly HubModule[] }) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content" onClick={(event) => { event.preventDefault(); document.getElementById('main-content')?.focus() }}>Pular para o conteúdo</a>
      <aside className="sidebar">
        <NavLink to="/" className="brand" aria-label="My Hub — início"><span className="brand-mark" aria-hidden="true">m<span>.</span></span><span>My Hub</span></NavLink>
        <div className="navigation-group"><p className="navigation-label">SEU ESPAÇO</p><nav aria-label="Navegação principal">
          <NavLink to="/" end><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" /></svg>Início</NavLink>
          {modules.map((module) => <NavLink key={module.id} to={module.path}>{module.label}</NavLink>)}
        </nav></div>
        <p className="sidebar-note">Um lugar para<br /><strong>seus próximos passos.</strong></p>
      </aside>
      <div className="workspace">
        <header className="topbar"><span>Meu espaço pessoal</span><span className="personal-mark" aria-hidden="true">mh.</span></header>
        <main id="main-content" tabIndex={-1}>
          <Routes><Route path="/" element={<HomePage />} />{modules.map((module) => <Route key={module.id} path={module.path} element={module.element} />)}<Route path="*" element={<NotFound />} /></Routes>
        </main>
        <footer className="footer"><span>My Hub <span className="footer-dot" aria-hidden="true">·</span> Feito para o seu ritmo.</span><span className="release-info" aria-label="Versão da aplicação">v{__APP_VERSION__}<span aria-hidden="true"> / </span><span title={__COMMIT_SHA__}>{__COMMIT_SHA__ === 'development' ? 'desenvolvimento' : __COMMIT_SHA__.slice(0, 7)}</span></span></footer>
      </div>
    </div>
  )
}
