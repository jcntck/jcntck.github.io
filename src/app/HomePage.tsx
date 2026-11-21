import { Icon } from '../shared/components/Icon'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../shared/session/hooks'

export function HomePage({ mangasAvailable = true }: { mangasAvailable?: boolean }) {
  const auth = useAuth()
  const showMangas = mangasAvailable && auth.phase === 'signed-in'
  return (
    <>
      <div className="page-heading"><p className="eyebrow">{auth.phase === 'signed-in' ? `${new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() < 18 ? 'Boa tarde' : 'Boa noite'}, ${auth.identity?.name.split(' ')[0] || 'leitor'}` : 'Seu espaço pessoal'}</p><h1>Seu espaço, aos poucos.</h1>
        <p className="page-description">Um lugar para reunir suas ferramentas pessoais e dar espaço ao que importa para você.</p>
      </div>
      <section className="welcome-panel" aria-labelledby="welcome-title">
        <div><span className="status-pill"><Icon name="sparkle" />Versão inicial</span>
          <h2 id="welcome-title">Bem-vindo ao My Hub.</h2>
          <p>A base está pronta para crescer com você. Novos módulos serão adicionados gradualmente.</p>
        </div>
        <div className="hub-art" aria-hidden="true"><span className="art-core">mh<span>.</span></span></div>
      </section>
      <section className="modules-section" aria-labelledby="modules-title">
        <div className="section-heading"><h2 id="modules-title">Seus módulos</h2><span>Um passo de cada vez</span></div>
        <div className="module-grid">{showMangas ? <NavLink className="module-card" to="/mangas"><div className="module-card-heading"><span className="module-icon"><Icon name="book" /></span><Icon name="arrow" /></div><h3>Mangás</h3><p>Seu último capítulo, a data da leitura e o tempo para decidir quando retomar.</p><span>Abrir biblioteca <Icon name="arrow" /></span></NavLink> : <div className="empty-state">
          <Icon name="plus" />
          <h3>O próximo espaço ainda está por vir.</h3>
          <p>Conforme novas ferramentas chegarem, você poderá acessá-las por aqui e pelo menu.</p>
        </div>}<div className="module-placeholder"><div><Icon name="plus" /><p>Em breve</p><small>Novos módulos chegam por aqui.</small></div></div></div>
      </section>
    </>
  )
}
