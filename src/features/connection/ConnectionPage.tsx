import { DrivePanel } from '../../shared/components/DrivePanel'

export function ConnectionPage({ clientId }: { clientId?: string }) {
  return <section className="connection-page">
    <p className="eyebrow">ARMAZENAMENTO PESSOAL</p><h1>Conexão</h1>
    <p className="page-description">Seu login e seu Drive são independentes. Prepare uma amostra e escolha quando sincronizá-la com sua conta.</p>
    <DrivePanel diagnostics clientId={clientId} />
  </section>
}
