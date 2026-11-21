import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useHub } from '../../shared/session/hooks'
import { canonical } from '../../shared/storage/library'
import { absoluteDay, elapsed, readingEmphasis } from './dates'
import { readSection, removeReading, updateReading, validateFields, type Errors, type Manga, type MangaSection } from './model'
import { useLocalDay } from './useLocalDay'
import { ReadingCard } from './ReadingCard'
import { PAGE_SIZE, readingPage, visibleReadings, type ReadingOrder } from './view'
import './mangas.css'
import { DriveNotice } from '../../shared/components/DriveNotice'
import { Notice } from '../../shared/components/Notice'
import { Icon } from '../../shared/components/Icon'
import { useDriveActions } from '../../shared/session/useDriveActions'

export function MangasPage() {
  const hub = useHub()
  const actions = useDriveActions()
  const deletionDialog = useRef<HTMLDialogElement>(null)
  const deletionTrigger = useRef<HTMLButtonElement | null>(null)
  const [deleting, setDeleting] = useState<Manga | null>(null)
  const [removed, setRemoved] = useState<{ id: string; title: string } | null>(null)
  useEffect(() => { if (deleting) deletionDialog.current?.showModal() }, [deleting])
  const cloud = hub.cloud
  const state = useSyncExternalStore(cloud.subscribe, cloud.getSnapshot)
  const today = useLocalDay()
  const [draft, setDraft] = useState<Manga | null>(null)
  const editorDialog = useRef<HTMLDialogElement>(null)
  const editorTrigger = useRef<HTMLElement | null>(null)
  useEffect(() => { if (draft) editorDialog.current?.showModal() }, [draft])
  const closeEditor = () => {
    setDraft(null)
    requestAnimationFrame(() => { const target = editorTrigger.current; if (target?.isConnected) target.focus(); else createButton.current?.focus() })
  }
  const [errors, setErrors] = useState<Errors>({})
  const [feedback, setFeedback] = useState<{ id: string; record: Manga } | null>(null)
  const [query, setQuery] = useState('')
  const [order, setOrder] = useState<ReadingOrder>('date-desc')
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
  const canEdit = state.canEdit && !problem
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
    editorTrigger.current = document.activeElement as HTMLElement | null
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
      <button ref={createButton} className="manga-primary" disabled={!canEdit} onClick={() => open()}><Icon name="plus" />Cadastrar mangá</button>
    </div>
    {actions.error && <p role="alert">{actions.error} <button onClick={actions.retry}>Tentar carregar Google</button></p>}
    {removed && <Notice tone={state.pending || section.items.some(item => item.id === removed.id) ? 'warning' : 'success'} eventKey={`${removed.id}:${state.syncPhase}:${!!state.pending}`} message={`${removed.title}: ${section.items.some(item => item.id === removed.id) ? 'a versão do Drive foi adotada.' : confirmed.some(item => item.id === removed.id) || state.pending ? 'removida localmente; pendente de sincronização.' : state.syncPhase === 'synced' ? 'remoção confirmada no Drive.' : 'removida da biblioteca local.'}`} />}
    {deleting && <dialog ref={deletionDialog} className="delete-dialog" aria-labelledby="delete-title" onCancel={() => { setDeleting(null); deletionTrigger.current?.focus() }} onClose={() => { setDeleting(null); deletionTrigger.current?.focus() }}>
      <h2 id="delete-title">Excluir {deleting.title}?</h2><p>A remoção fica salva localmente e pendente de sincronização com o Drive.</p>
      <div className="connection-actions"><button autoFocus className="manga-secondary" onClick={() => deletionDialog.current?.close()}>Cancelar</button><button className="manga-primary" disabled={!canEdit} onClick={() => {
        if (!hub.auth.isValid() || !canEdit) return
        const value = cloud.pendingSection('modules', 'mangas') ?? cloud.getSnapshot().snapshot?.document.modules.mangas
        const current = readSection(value)
        if (current.items.some(item => item.id === deleting.id)) {
          const next = removeReading(current, deleting.id)
          cloud.stageSection('modules', 'mangas', next, { manual: true })
          setRemoved({ id: deleting.id, title: deleting.title }); setFeedback(null)
          if (draft?.id === deleting.id) setDraft(null)
        }
        deletionDialog.current?.close()
        requestAnimationFrame(() => libraryHeading.current?.focus())
      }}>Confirmar exclusão</button></div>
    </dialog>}

    {loaded && !problem && <div className="manga-stats" aria-label="Resumo das leituras"><div><strong>{section.items.length}</strong><span>obras</span></div><div><strong>{section.items.filter(item => readingEmphasis(item.lastReadOn, today) === 'recent').length}</strong><span>menos de 6 meses</span></div><div><strong>{section.items.filter(item => readingEmphasis(item.lastReadOn, today) === 'long').length}</strong><span>há 1 ano ou mais</span></div></div>}
    <div className="manga-sync-bar">
      {!problem && <DriveNotice state={state} successMessage={state.syncPhase === 'synced' ? undefined : 'Drive conectado. Biblioteca carregada.'} />}
      <button className="manga-secondary" aria-busy={syncing} disabled={syncing || (!state.canWrite && !actions.ready)} onClick={() => void actions.run()}><Icon name="upload" />{syncing ? 'Sincronizando…' : 'Sincronizar'}</button>
    </div>
    {!loaded && !unavailable && <p className="manga-notice">Aguarde a leitura do Drive para consultar seus registros.</p>}
    {problem && <div className="manga-connection-alert" role="alert"><p>{problem} Confira ou releia o arquivo pela página Conexão antes de editar.</p><Link to="/connection">Abrir Conexão <Icon name="arrow" /></Link></div>}
    {draft && <dialog ref={editorDialog} className="reading-dialog" aria-labelledby="reading-form-title" onCancel={event => { event.preventDefault(); closeEditor() }} onKeyDown={event => { if (event.key === 'Escape') event.stopPropagation() }}><form className="manga-form" onSubmit={submit} noValidate aria-labelledby="reading-form-title">
      <div className="section-heading"><h2 id="reading-form-title">{section.items.some(item => item.id === draft.id) ? 'Editar leitura' : 'Nova leitura'}</h2>
        <button type="button" className="manga-text-button" onClick={closeEditor}>Fechar formulário</button></div>
      {section.items.some(item => item.id === draft.id) && <div className="reading-details"><p>Última leitura em <time dateTime={draft.lastReadOn}>{absoluteDay(draft.lastReadOn)}</time></p><p className={`manga-elapsed manga-elapsed-${readingEmphasis(draft.lastReadOn, today)}`}>{elapsed(draft.lastReadOn, today)}</p></div>}
      <p className="manga-help">A data é o dia em que você leu, mesmo que esteja cadastrando depois. Corrigir título ou capítulo mantém essa data.</p>
      <div className="manga-fields">
        <div className="manga-title-field"><label htmlFor="manga-title">Título</label><input ref={formTitle} id="manga-title" value={draft.title} required aria-invalid={!!errors.title} aria-describedby={errors.title ? 'title-error' : undefined} onChange={event => setDraft({ ...draft, title: event.target.value })} />{errors.title && <span id="title-error" className="field-error">{errors.title}</span>}</div>
        <div className="manga-title-field"><label htmlFor="manga-english-title">Nome em inglês (opcional)</label><input id="manga-english-title" value={draft.englishTitle ?? ''} placeholder="Ex.: The Beginning After the End" aria-describedby="english-title-help" onChange={event => setDraft({ ...draft, englishTitle: event.target.value })} /><span id="english-title-help" className="manga-help">Aparece como nome secundário e também pode ser usado na busca.</span></div>
        <div><label htmlFor="manga-chapter">Último capítulo lido</label><input id="manga-chapter" value={draft.lastChapter} required placeholder="Ex.: 1130, 12.5 ou Extra 1" aria-invalid={!!errors.lastChapter} aria-describedby={errors.lastChapter ? 'chapter-error' : undefined} onChange={event => setDraft({ ...draft, lastChapter: event.target.value })} />{errors.lastChapter && <span id="chapter-error" className="field-error">{errors.lastChapter}</span>}</div>
        <div><label htmlFor="manga-date">Data da leitura</label><input id="manga-date" type="date" min="0001-01-01" max={today} value={draft.lastReadOn} required aria-invalid={!!errors.lastReadOn} aria-describedby={errors.lastReadOn ? 'date-error' : undefined} onChange={event => setDraft({ ...draft, lastReadOn: event.target.value })} />{errors.lastReadOn && <span id="date-error" className="field-error">{errors.lastReadOn}</span>}</div>
        <div className="manga-title-field"><label htmlFor="manga-scan">Link da scan (opcional)</label><input id="manga-scan" type="url" placeholder="https://scan.exemplo/obra" value={draft.scanUrl ?? ''} aria-invalid={!!errors.scanUrl} aria-describedby={errors.scanUrl ? 'scan-help scan-error' : 'scan-help'} onChange={event => setDraft({ ...draft, scanUrl: event.target.value })} /><span id="scan-help" className="manga-help">Cole o endereço onde você lê. Deixe vazio para remover o link.</span>{errors.scanUrl && <span id="scan-error" className="field-error">{errors.scanUrl}</span>}</div>
        <div className="manga-title-field"><label htmlFor="manga-scan-name">Nome da scan (opcional)</label><input id="manga-scan-name" value={draft.scanName ?? ''} placeholder="Ex.: Minha scan favorita" disabled={!draft.scanUrl?.trim()} aria-describedby="scan-name-help" onChange={event => setDraft({ ...draft, scanName: event.target.value })} /><span id="scan-name-help" className="manga-help">Esse nome identifica o link na biblioteca. Se vazio, aparece o domínio do site.</span></div>
        <div className="manga-title-field"><label htmlFor="manga-cover-url">Link da capa (opcional)</label><input id="manga-cover-url" type="url" value={draft.coverUrl ?? ''} placeholder="https://imagens.exemplo/capa.jpg" aria-invalid={!!errors.coverUrl} aria-describedby={errors.coverUrl ? 'cover-help cover-error' : 'cover-help'} onChange={event => setDraft({ ...draft, coverUrl: event.target.value })} /><span id="cover-help" className="manga-help">Use o link direto HTTPS de uma imagem pública. A capa aparece na lista após salvar; deixe vazio para removê-la.</span>{errors.coverUrl && <span id="cover-error" className="field-error">{errors.coverUrl}</span>}</div>
      </div>
      {Object.keys(errors).length > 0 && <p role="alert">Confira os campos indicados antes de salvar a leitura.</p>}
      <div className="reading-form-actions"><button className="manga-primary" disabled={!canEdit} type="submit">Salvar leitura</button>{section.items.some(item => item.id === draft.id) && <button type="button" className="manga-secondary reading-delete" disabled={!canEdit} onClick={event => { deletionTrigger.current = event.currentTarget; setDeleting(draft) }}><Icon name="trash" />Excluir obra</button>}</div>
      <p className="manga-help">{state.cached ? 'Salva no navegador.' : 'Salva nesta aba.'} Quando terminar suas edições, use Sincronizar para enviar ao Drive.</p>
    </form></dialog>}
    {feedbackVisible && <Notice tone={feedbackConfirmed ? 'success' : 'warning'} eventKey={`${feedback.id}:${!!feedbackConfirmed}`} message={`${feedback.record.title}: ${feedbackConfirmed ? 'gravação confirmada no Drive.' : state.cached ? 'leitura salva no navegador. Pendente de sincronização.' : 'leitura salva nesta aba. Pendente de sincronização.'}`} />}
    {loaded && !problem && <section className="manga-library" aria-labelledby="reading-list-title">
      <div className="section-heading"><h2 id="reading-list-title" ref={libraryHeading} tabIndex={-1}>Sua biblioteca</h2><span>{query.trim() ? `${visible.length} de ${section.items.length} obras` : `${section.items.length} ${section.items.length === 1 ? 'obra' : 'obras'}`}</span></div>
      {section.items.length > 0 && <div className="manga-toolbar">
        <div className="search-field"><label className="sr-only" htmlFor="manga-search">Buscar mangá</label><Icon name="search" /><input id="manga-search" type="search" placeholder="Título ou nome em inglês" value={query} onChange={event => { setQuery(event.target.value); setRequestedPage(1) }} /></div>
        <div className="order-field"><span className="sr-only">Ordenar por última leitura</span><button className="manga-secondary" aria-label={`Ordem: ${order === 'date-desc' ? 'Mais recente' : 'Mais antiga'}. Alternar ordem por última leitura`} onClick={() => { setOrder(order === 'date-desc' ? 'date-asc' : 'date-desc'); setRequestedPage(1) }}><Icon name="order" />{order === 'date-desc' ? 'Mais recente' : 'Mais antiga'}</button></div>
      </div>}
      {visible.length > 0 && <><p className="manga-page-count" role="status">Exibindo {page.first}–{page.last} de {visible.length} {visible.length === 1 ? 'obra' : 'obras'}</p>
        <ul className="manga-age-legend" aria-label="Destaques do tempo de leitura"><li>Menos de 6 meses</li><li>6 a 11 meses</li><li>1 ano ou mais</li></ul></>}
      {section.items.length === 0 ? <div className="empty-state"><Icon name="plus" /><h3>A próxima leitura começa aqui.</h3><p>Ainda não há mangás cadastrados. Registre o capítulo e a data da sua última leitura.</p><button className="manga-text-button" disabled={!canEdit} onClick={() => open()}>Cadastrar o primeiro mangá</button></div> :
        visible.length === 0 ? <div className="empty-state"><Icon name="empty" /><h3>Nenhuma obra encontrada.</h3><p>Tente outro título ou limpe a busca para ver sua biblioteca.</p><button className="manga-text-button" onClick={() => { setQuery(''); setRequestedPage(1) }}>Limpar busca</button></div> : <ul className="manga-list">{page.items.map(item => {
          const saved = confirmed.find(record => record.id === item.id)
          const isPending = !saved || canonical(saved) !== canonical(item)
          return <ReadingCard today={today} key={`${item.id}-${item.updatedAt}`} item={item} pending={isPending} canEdit={!!canEdit} highlighted={feedback?.record.id === item.id} onEdit={() => open(item)} onDelete={trigger => { deletionTrigger.current = trigger; setDeleting(item) }} />
        })}</ul>}
      {visible.length > PAGE_SIZE && <nav className="manga-pagination" aria-label="Paginação da biblioteca">
        <button className="manga-secondary" aria-label="Página anterior" disabled={page.current === 1} onClick={() => changePage(page.current - 1)}>Anterior</button>
        {page.controls.map((number, index) => number === 'gap' ? <span key={`gap-${index}`} aria-hidden="true">…</span> : <button key={number} className="manga-secondary" aria-label={`Página ${number}`} aria-current={number === page.current ? 'page' : undefined} disabled={number === page.current} onClick={() => changePage(number)}>{number}</button>)}
        <button className="manga-secondary" aria-label="Próxima página" disabled={page.current === page.total} onClick={() => changePage(page.current + 1)}>Próxima</button>
        <p role="status">Página {page.current} de {page.total}</p>
      </nav>}
    </section>}
    <p className="manga-help manga-storage-note">{state.cached ? 'A biblioteca e as edições ficam salvas neste navegador para sua conta. Ao sincronizar, a cópia com a atualização mais recente prevalece; em empate, prevalece o Drive. Sincronize antes de trocar de dispositivo.' : 'Sem cache local disponível, as alterações ficam somente nesta aba. Sincronize antes de recarregar ou sair.'}</p>
  </section>
}
