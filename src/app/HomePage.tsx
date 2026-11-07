export function HomePage() {
  return (
    <>
      <div className="page-heading"><p className="eyebrow">VISÃO GERAL</p><h1>Seu espaço, aos poucos.</h1>
        <p className="page-description">Um lugar para reunir suas ferramentas pessoais e dar espaço ao que importa para você.</p>
      </div>
      <section className="welcome-panel" aria-labelledby="welcome-title">
        <div><span className="status-pill"><span aria-hidden="true" />VERSÃO INICIAL</span>
          <h2 id="welcome-title">Bem-vindo ao My Hub.</h2>
          <p>A base está pronta para crescer com você. Novos módulos serão adicionados gradualmente.</p>
        </div>
        <div className="hub-art" aria-hidden="true"><span className="art-orbit orbit-one" /><span className="art-orbit orbit-two" /><span className="art-core">mh<span>.</span></span></div>
      </section>
      <section className="modules-section" aria-labelledby="modules-title">
        <div className="section-heading"><h2 id="modules-title">Seus módulos</h2><span>Um passo de cada vez</span></div>
        <div className="empty-state">
          <span className="empty-icon" aria-hidden="true">+</span>
          <h3>O próximo espaço ainda está por vir.</h3>
          <p>Conforme novas ferramentas chegarem, você poderá acessá-las por aqui e pelo menu.</p>
        </div>
      </section>
    </>
  )
}
