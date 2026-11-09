import { useRef, useState, useSyncExternalStore, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useHub } from '../../shared/session/hooks'
import { canonical } from '../../shared/storage/library'
import { absoluteDay, elapsed, readingEmphasis } from './dates'
import { readSection, updateReading, validateFields, type Errors, type Manga, type MangaSection } from './model'
import { useLocalDay } from './useLocalDay'
import { ScanLink } from './ScanLink'
import { PAGE_SIZE, readingPage, visibleReadings, type ReadingOrder } from './view'
import { MangaCover } from './MangaCover'
import './mangas.css'

export function MangasPage() {
  const hub = useHub()
  const cloud = hub.cloud
  const state = useSyncExternalStore(cloud.subscribe, cloud.getSnapshot)
  const today = useLocalDay()
  const [draft, setDraft] = useState<Manga | null>(null)
  const [errors, setErrors] = useState<Errors>({})
  const [feedback, setFeedback] = useState<{ id: string; record: Manga } | null>(null)
  const [query, setQuery] = useState('')
  const [order, setOrder] = useState<ReadingOrder>('title-asc')
  const [requestedPage, setRequestedPage] = useState(1)
  const formTitle = useRef<HTMLInputElement>(null)
  const createButton = useRef<HTMLButtonElement>(null)
  const libraryHeading = useRef<HTMLHeadingElement>(null)
  const pending = cloud.pendingSection('modules', 'mangas')
  const loaded = state.snapshot !== undefined || pending !== undefined
  let section: MangaSection = { items: [] }
  let problem = ''
  try { if (loaded) section = readSection(pending !== undefined ? pending : state.snapshot?.document.modules.mangas) }
  catch (error) { problem = (error as Error).message }
  const canEdit = state.canWrite && !problem
  let confirmed: Manga[] = []
  try { if (state.snapshot !== undefined) confirmed = readSection(state.snapshot?.document.modules.mangas).items } catch { /* Domain errors disable editing above. */ }
  const unavailable = ['disconnected', 'expired', 'error'].includes(state.phase)
  const syncing = state.phase === 'saving'
  const feedbackVisible = feedback && section.items.some(item => item.id === feedback.record.id && canonical(item) === canonical(feedback.record))
  const feedbackConfirmed = feedback && confirmed.some(item => item.id === feedback.record.id && canonical(item) === canonical(feedback.record))
  const visible = visibleReadings(section.items, query, order)
  const page = readingPage(visible, requestedPage)
  const changePage = (next: number) => {
    setRequestedPage(next)
    requestAnimationFrame(() => libraryHeading.current?.focus())
  }
  const open = (item?: Manga) => {
    setDraft(item ? structuredClone(item) : { id: crypto.randomUUID(), title: '', lastChapter: '', lastReadOn: today, updatedAt: new Date().toISOString() })
    setErrors({}); setFeedback(null)
    requestAnimationFrame(() => formTitle.current?.focus())
  }
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!draft || !canEdit || !hub.auth.isValid()) return
    const nextErrors = validateFields(draft, today)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    const record = { ...draft, updatedAt: new Date().toISOString() }
    const next = updateReading(section, record, today)
    cloud.stageSection('modules', 'mangas', next, { manual: true })
    setFeedback({ id: crypto.randomUUID(), record: next.items.find(item => item.id === record.id)! })
    setDraft(null); setQuery('')
    const position = visibleReadings(next.items, '', order).findIndex(item => item.id === record.id)
    setRequestedPage(Math.floor(position / PAGE_SIZE) + 1)
    requestAnimationFrame(() => document.getElementById(`reading-${record.id}`)?.focus())
  }
  return <section className="mangas-page" aria-labelledby="mangas-title">
    <div className="mangas-heading"><div><p className="eyebrow">SUAS LEITURAS</p><h1 id="mangas-title">Mangás</h1>
      <p className="page-description">Guarde onde parou. Retome no seu ritmo.</p></div>
      <button ref={createButton} className="manga-primary" disabled={!canEdit} onClick={() => open()}>Cadastrar mangá</button>
    </div>
    <div className="reading-reference"><span aria-hidden="true">↗</span><p>Há seis meses ou um ano sem ler? O tempo é uma referência sua para decidir quando retomar.</p></div>
    <div className="manga-sync-bar">
      <p role="status" key={`${state.phase}-${state.syncPhase}`} className="manga-sync-status">{unavailable ? 'Sincronização indisponível.' : ['loading', 'authorizing'].includes(state.phase) ? 'Carregando a biblioteca…' : syncing ? 'Sincronizando com o Drive…' : state.pending ? 'Alterações salvas nesta aba, pendentes de sincronização.' : state.syncPhase === 'synced' ? 'Gravação confirmada no Drive.' : 'Drive conectado. Biblioteca carregada.'}</p>
      <button className="manga-secondary" aria-busy={syncing} disabled={!state.canWrite || !state.pending} onClick={() => { if (hub.auth.isValid()) void cloud.sync() }}>{syncing ? 'Sincronizando…' : 'Sincronizar'}</button>
    </div>
    {unavailable && <div className="manga-connection-alert" role="alert"><p>{state.phase === 'disconnected' ? 'Drive desconectado. Abra Conexão para carregar sua biblioteca antes de cadastrar ou editar.' : state.message}</p><Link to="/connection">Abrir Conexão <span aria-hidden="true">→</span></Link></div>}
    {!loaded && !unavailable && <p className="manga-notice">Aguarde a leitura do Drive para consultar seus registros.</p>}
    {problem && <div className="manga-connection-alert" role="alert"><p>{problem} Confira ou releia o arquivo pela página Conexão antes de editar.</p><Link to="/connection">Abrir Conexão →</Link></div>}
    {draft && <form className="manga-form" onSubmit={submit} noValidate aria-labelledby="reading-form-title">
      <div className="section-heading"><h2 id="reading-form-title">{section.items.some(item => item.id === draft.id) ? 'Corrigir leitura' : 'Nova leitura'}</h2>
        <button type="button" className="manga-text-button" onClick={() => { setDraft(null); createButton.current?.focus() }}>Fechar formulário</button></div>
      <p className="manga-help">A data é o dia em que você leu, mesmo que esteja cadastrando depois. Corrigir título ou capítulo mantém essa data.</p>
      <div className="manga-fields">
        <div className="manga-title-field"><label htmlFor="manga-title">Título</label><input ref={formTitle} id="manga-title" value={draft.title} required aria-invalid={!!errors.title} aria-describedby={errors.title ? 'title-error' : undefined} onChange={event => setDraft({ ...draft, title: event.target.value })} />{errors.title && <span id="title-error" className="field-error">{errors.title}</span>}</div>
        <div><label htmlFor="manga-chapter">Último capítulo lido</label><input id="manga-chapter" value={draft.lastChapter} required placeholder="Ex.: 1130, 12.5 ou Extra 1" aria-invalid={!!errors.lastChapter} aria-describedby={errors.lastChapter ? 'chapter-error' : undefined} onChange={event => setDraft({ ...draft, lastChapter: event.target.value })} />{errors.lastChapter && <span id="chapter-error" className="field-error">{errors.lastChapter}</span>}</div>
        <div><label htmlFor="manga-date">Data da leitura</label><input id="manga-date" type="date" min="0001-01-01" max={today} value={draft.lastReadOn} required aria-invalid={!!errors.lastReadOn} aria-describedby={errors.lastReadOn ? 'date-error' : undefined} onChange={event => setDraft({ ...draft, lastReadOn: event.target.value })} />{errors.lastReadOn && <span id="date-error" className="field-error">{errors.lastReadOn}</span>}</div>
        <div className="manga-title-field"><label htmlFor="manga-scan">Link da scan (opcional)</label><input id="manga-scan" type="url" placeholder="https://scan.exemplo/obra" value={draft.scanUrl ?? ''} aria-invalid={!!errors.scanUrl} aria-describedby={errors.scanUrl ? 'scan-help scan-error' : 'scan-help'} onChange={event => setDraft({ ...draft, scanUrl: event.target.value })} /><span id="scan-help" className="manga-help">Cole o endereço onde você lê. Deixe vazio para remover o link.</span>{errors.scanUrl && <span id="scan-error" className="field-error">{errors.scanUrl}</span>}</div>
        <div className="manga-title-field"><label htmlFor="manga-scan-name">Nome da scan (opcional)</label><input id="manga-scan-name" value={draft.scanName ?? ''} placeholder="Ex.: Minha scan favorita" disabled={!draft.scanUrl?.trim()} aria-describedby="scan-name-help" onChange={event => setDraft({ ...draft, scanName: event.target.value })} /><span id="scan-name-help" className="manga-help">Esse nome identifica o link na biblioteca. Se vazio, aparece o domínio do site.</span></div>
        <div className="manga-title-field"><label htmlFor="manga-cover-url">Link da capa (opcional)</label><input id="manga-cover-url" type="url" value={draft.coverUrl ?? ''} placeholder="https://imagens.exemplo/capa.jpg" aria-invalid={!!errors.coverUrl} aria-describedby={errors.coverUrl ? 'cover-help cover-error' : 'cover-help'} onChange={event => setDraft({ ...draft, coverUrl: event.target.value })} /><span id="cover-help" className="manga-help">Use o link direto HTTPS de uma imagem pública. A capa aparece na lista após salvar; deixe vazio para removê-la.</span>{errors.coverUrl && <span id="cover-error" className="field-error">{errors.coverUrl}</span>}</div>
      </div>
      {Object.keys(errors).length > 0 && <p role="alert">Confira os campos indicados antes de salvar a leitura.</p>}
      <div><button className="manga-primary" disabled={!canEdit} type="submit">Salvar leitura</button></div>
      <p className="manga-help">Salva nesta aba. Quando terminar suas edições, use Sincronizar para enviar ao Drive.</p>
    </form>}
    {feedbackVisible && <p key={feedback.id} className="manga-feedback" role="status"><span aria-hidden="true">✓</span> {feedback.record.title}: {feedbackConfirmed ? 'gravação confirmada no Drive.' : 'leitura salva nesta aba. Pendente de sincronização.'}</p>}
    {loaded && !problem && <section className="manga-library" aria-labelledby="reading-list-title">
      <div className="section-heading"><h2 id="reading-list-title" ref={libraryHeading} tabIndex={-1}>Sua biblioteca</h2><span>{query.trim() ? `${visible.length} de ${section.items.length} obras` : `${section.items.length} ${section.items.length === 1 ? 'obra' : 'obras'}`}</span></div>
      {section.items.length > 0 && <div className="manga-toolbar">
        <div><label htmlFor="manga-search">Buscar mangá</label><input id="manga-search" type="search" placeholder="Busque pelo título" value={query} onChange={event => { setQuery(event.target.value); setRequestedPage(1) }} /></div>
        <div><label htmlFor="manga-order">Ordenar por</label><select id="manga-order" value={order} onChange={event => { setOrder(event.target.value as ReadingOrder); setRequestedPage(1) }}><option value="title-asc">Nome (A–Z)</option><option value="title-desc">Nome (Z–A)</option><option value="date-asc">Leitura mais antiga</option><option value="date-desc">Leitura mais recente</option></select></div>
      </div>}
      {visible.length > 0 && <><p className="manga-page-count" role="status">Exibindo {page.first}–{page.last} de {visible.length} {visible.length === 1 ? 'obra' : 'obras'}</p>
        <ul className="manga-age-legend" aria-label="Destaques do tempo de leitura"><li>Menos de 6 meses</li><li>6 a 11 meses</li><li>1 ano ou mais</li></ul></>}
      {section.items.length === 0 ? <div className="empty-state"><span className="empty-icon" aria-hidden="true">＋</span><h3>A próxima leitura começa aqui.</h3><p>Ainda não há mangás cadastrados. Registre o capítulo e a data da sua última leitura.</p><button className="manga-text-button" disabled={!canEdit} onClick={() => open()}>Cadastrar o primeiro mangá</button></div> :
        visible.length === 0 ? <div className="empty-state"><h3>Nenhuma obra encontrada.</h3><p>Tente outro título ou limpe a busca para ver sua biblioteca.</p><button className="manga-text-button" onClick={() => { setQuery(''); setRequestedPage(1) }}>Limpar busca</button></div> : <ul className="manga-list">{page.items.map(item => {
          const saved = confirmed.find(record => record.id === item.id)
          const isPending = !saved || canonical(saved) !== canonical(item)
          return <li key={`${item.id}-${item.updatedAt}`} className={`manga-card${feedback?.record.id === item.id ? ' manga-card-updated' : ''}`}><div className="manga-card-main"><MangaCover key={item.coverUrl ?? ''} url={item.coverUrl} title={item.title} /><div className="manga-card-reading"><h3 id={`reading-${item.id}`} tabIndex={-1}>{item.title}</h3><p className="manga-chapter">Capítulo <strong>{item.lastChapter}</strong></p><p className="manga-date">Última leitura em <time dateTime={item.lastReadOn}>{absoluteDay(item.lastReadOn)}</time></p></div></div>
            {item.scanUrl && <ScanLink url={item.scanUrl} name={item.scanName} title={item.title} />}
            <div className="manga-card-detail"><p className={`manga-elapsed manga-elapsed-${readingEmphasis(item.lastReadOn, today)}`}>{elapsed(item.lastReadOn, today)}</p><span className={isPending ? 'manga-pending' : 'manga-saved'}>{isPending ? 'Pendente de sincronização' : 'Confirmado no Drive'}</span><button className="manga-text-button" disabled={!canEdit} onClick={() => open(item)} aria-label={`Corrigir leitura de ${item.title}`}>Corrigir leitura <span aria-hidden="true">↗</span></button></div></li>
        })}</ul>}
      {visible.length > PAGE_SIZE && <nav className="manga-pagination" aria-label="Paginação da biblioteca">
        <button className="manga-secondary" aria-label="Página anterior" disabled={page.current === 1} onClick={() => changePage(page.current - 1)}>Anterior</button>
        {page.controls.map((number, index) => number === 'gap' ? <span key={`gap-${index}`} aria-hidden="true">…</span> : <button key={number} className="manga-secondary" aria-label={`Página ${number}`} aria-current={number === page.current ? 'page' : undefined} disabled={number === page.current} onClick={() => changePage(number)}>{number}</button>)}
        <button className="manga-secondary" aria-label="Próxima página" disabled={page.current === page.total} onClick={() => changePage(page.current + 1)}>Próxima</button>
        <p role="status">Página {page.current} de {page.total}</p>
      </nav>}
    </section>}
    <p className="manga-help manga-storage-note">Alterações pendentes existem somente nesta aba e são descartadas ao recarregar ou sair. Sincronize antes de trocar de dispositivo.</p>
  </section>
}
