import { useRef, useState, useSyncExternalStore, type FormEvent } from 'react'
import { DrivePanel } from '../../shared/components/DrivePanel'
import { useHub } from '../../shared/session/hooks'
import { canonical } from '../../shared/storage/library'
import { absoluteDay, elapsed } from './dates'
import { readSection, updateReading, validateFields, type Errors, type Manga, type MangaSection } from './model'
import { useLocalDay } from './useLocalDay'
import { ScanLink } from './ScanLink'
import { visibleReadings, type ReadingOrder } from './view'
import './mangas.css'

export function MangasPage() {
  const hub = useHub()
  const cloud = hub.cloud
  const state = useSyncExternalStore(cloud.subscribe, cloud.getSnapshot)
  const today = useLocalDay()
  const [draft, setDraft] = useState<Manga | null>(null)
  const [errors, setErrors] = useState<Errors>({})
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [order, setOrder] = useState<ReadingOrder>('title-asc')
  const formTitle = useRef<HTMLInputElement>(null)
  const pending = cloud.pendingSection('modules', 'mangas')
  const loaded = state.snapshot !== undefined || pending !== undefined
  let section: MangaSection = { items: [] }
  let problem = ''
  try { if (loaded) section = readSection(pending !== undefined ? pending : state.snapshot?.document.modules.mangas) }
  catch (error) { problem = (error as Error).message }
  const canEdit = state.canWrite && !problem
  let confirmed: Manga[] = []
  try { if (state.snapshot !== undefined) confirmed = readSection(state.snapshot?.document.modules.mangas).items } catch { /* Domain errors disable editing above. */ }
  const draftSaved = draft && confirmed.some(item => item.id === draft.id && item.title === draft.title.trim() && item.lastChapter === draft.lastChapter.trim() && item.lastReadOn === draft.lastReadOn && (item.scanUrl ?? '') === (draft.scanUrl?.trim() ?? ''))
  const visible = visibleReadings(section.items, query, order)
  const open = (item?: Manga) => {
    setDraft(item ? structuredClone(item) : { id: crypto.randomUUID(), title: '', lastChapter: '', lastReadOn: today, updatedAt: new Date().toISOString() })
    setErrors({}); setNotice('')
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
    setDraft(next.items.find(item => item.id === record.id)!)
    setNotice('Leitura preparada nesta aba. Sincronize para salvar no Drive.')
  }
  return <section className="mangas-page" aria-labelledby="mangas-title">
    <div className="mangas-heading"><div><p className="eyebrow">SUAS LEITURAS</p><h1 id="mangas-title">Mangás</h1>
      <p className="page-description">Guarde onde parou. Retome no seu ritmo.</p></div>
      <button className="manga-primary" disabled={!canEdit} onClick={() => open()}>Cadastrar mangá</button>
    </div>
    <div className="reading-reference"><span aria-hidden="true">↗</span><p>Há seis meses ou um ano sem ler? O tempo é uma referência sua para decidir quando retomar.</p></div>
    {!loaded && <p className="manga-notice">Conecte o Drive abaixo para carregar sua biblioteca antes de cadastrar ou editar. Seus registros ainda não foram consultados.</p>}
    {problem && <p className="manga-notice" role="alert">{problem} Confira o arquivo ou releia o Drive antes de editar.</p>}
    {draft && <form className="manga-form" onSubmit={submit} noValidate aria-labelledby="reading-form-title">
      <div className="section-heading"><h2 id="reading-form-title">{section.items.some(item => item.id === draft.id) ? 'Corrigir leitura' : 'Nova leitura'}</h2>
        <button type="button" className="manga-text-button" onClick={() => { setDraft(null); setNotice('') }}>Fechar formulário</button></div>
      <p className="manga-help">A data é o dia em que você leu, mesmo que esteja cadastrando depois. Corrigir título ou capítulo mantém essa data.</p>
      <div className="manga-fields">
        <div className="manga-title-field"><label htmlFor="manga-title">Título</label><input ref={formTitle} id="manga-title" value={draft.title} required aria-invalid={!!errors.title} aria-describedby={errors.title ? 'title-error' : undefined} onChange={event => setDraft({ ...draft, title: event.target.value })} />{errors.title && <span id="title-error" className="field-error">{errors.title}</span>}</div>
        <div><label htmlFor="manga-chapter">Último capítulo lido</label><input id="manga-chapter" value={draft.lastChapter} required placeholder="Ex.: 1130, 12.5 ou Extra 1" aria-invalid={!!errors.lastChapter} aria-describedby={errors.lastChapter ? 'chapter-error' : undefined} onChange={event => setDraft({ ...draft, lastChapter: event.target.value })} />{errors.lastChapter && <span id="chapter-error" className="field-error">{errors.lastChapter}</span>}</div>
        <div><label htmlFor="manga-date">Data da leitura</label><input id="manga-date" type="date" min="0001-01-01" max={today} value={draft.lastReadOn} required aria-invalid={!!errors.lastReadOn} aria-describedby={errors.lastReadOn ? 'date-error' : undefined} onChange={event => setDraft({ ...draft, lastReadOn: event.target.value })} />{errors.lastReadOn && <span id="date-error" className="field-error">{errors.lastReadOn}</span>}</div>
        <div className="manga-title-field"><label htmlFor="manga-scan">Link da scan (opcional)</label><input id="manga-scan" type="url" placeholder="https://scan.exemplo/obra" value={draft.scanUrl ?? ''} aria-invalid={!!errors.scanUrl} aria-describedby={errors.scanUrl ? 'scan-help scan-error' : 'scan-help'} onChange={event => setDraft({ ...draft, scanUrl: event.target.value })} /><span id="scan-help" className="manga-help">Cole o endereço onde você lê. Deixe vazio para remover o link.</span>{errors.scanUrl && <span id="scan-error" className="field-error">{errors.scanUrl}</span>}</div>
      </div>
      {Object.keys(errors).length > 0 && <p role="alert">Confira os campos indicados antes de preparar a leitura.</p>}
      <div><button className="manga-primary" disabled={!canEdit} type="submit">Preparar leitura</button></div>
      {notice && (pending !== undefined || draftSaved) && <p role="status">{pending !== undefined ? notice : 'Leitura confirmada no Drive.'}</p>}
    </form>}
    {loaded && !problem && <section className="manga-library" aria-labelledby="reading-list-title">
      <div className="section-heading"><h2 id="reading-list-title">Sua biblioteca</h2><span>{query.trim() ? `${visible.length} de ${section.items.length} obras` : `${section.items.length} ${section.items.length === 1 ? 'obra' : 'obras'}`}</span></div>
      {section.items.length > 0 && <div className="manga-toolbar">
        <div><label htmlFor="manga-search">Buscar mangá</label><input id="manga-search" type="search" placeholder="Busque pelo título" value={query} onChange={event => setQuery(event.target.value)} /></div>
        <div><label htmlFor="manga-order">Ordenar por</label><select id="manga-order" value={order} onChange={event => setOrder(event.target.value as ReadingOrder)}><option value="title-asc">Nome (A–Z)</option><option value="title-desc">Nome (Z–A)</option><option value="date-asc">Leitura mais antiga</option><option value="date-desc">Leitura mais recente</option></select></div>
      </div>}
      {section.items.length === 0 ? <div className="empty-state"><span className="empty-icon" aria-hidden="true">＋</span><h3>A próxima leitura começa aqui.</h3><p>Ainda não há mangás cadastrados. Registre o capítulo e a data da sua última leitura.</p><button className="manga-text-button" disabled={!canEdit} onClick={() => open()}>Cadastrar o primeiro mangá</button></div> :
        visible.length === 0 ? <div className="empty-state"><h3>Nenhuma obra encontrada.</h3><p>Tente outro título ou limpe a busca para ver sua biblioteca.</p><button className="manga-text-button" onClick={() => setQuery('')}>Limpar busca</button></div> : <ul className="manga-list">{visible.map(item => {
          const saved = confirmed.find(record => record.id === item.id)
          const isPending = !saved || canonical(saved) !== canonical(item)
          return <li key={item.id} className="manga-card"><div className="manga-card-main"><h3>{item.title}</h3><p className="manga-chapter">Capítulo <strong>{item.lastChapter}</strong></p><p className="manga-date">Última leitura em <time dateTime={item.lastReadOn}>{absoluteDay(item.lastReadOn)}</time></p></div>
            {item.scanUrl && <ScanLink key={item.scanUrl} url={item.scanUrl} title={item.title} />}
            <div className="manga-card-detail"><p className="manga-elapsed">{elapsed(item.lastReadOn, today)}</p><span className={isPending ? 'manga-pending' : 'manga-saved'}>{isPending ? 'Pendente de sincronização' : 'Confirmado no Drive'}</span><button className="manga-text-button" disabled={!canEdit} onClick={() => open(item)} aria-label={`Corrigir leitura de ${item.title}`}>Corrigir leitura <span aria-hidden="true">↗</span></button></div></li>
        })}</ul>}
    </section>}
    <DrivePanel manualOnly />
  </section>
}
