import { useRef, useState } from 'react'
import { Icon } from '../../shared/components/Icon'
import { MangaCover } from './MangaCover'
import type { Manga } from './model'

export function ReadingCard({ item, pending, canEdit, highlighted, onEdit, onDelete }: {
  item: Manga; pending: boolean; canEdit: boolean; highlighted: boolean
  onEdit: () => void; onDelete: (trigger: HTMLButtonElement) => void
}) {
  const [open, setOpen] = useState(false)
  const toggle = useRef<HTMLButtonElement>(null)
  return <li className={`manga-card reading-card${highlighted ? ' manga-card-updated' : ''}`} data-menu-open={open} onMouseEnter={() => { if (window.matchMedia?.('(hover: hover)').matches) setOpen(true) }} onMouseLeave={event => { if (!event.currentTarget.contains(document.activeElement)) setOpen(false) }} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
  }} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); setOpen(false); toggle.current?.focus() } }}>
    <div className="cover-wrap">
      <MangaCover url={item.coverUrl} title={item.title} />
      <button ref={toggle} className="card-menu-toggle" aria-label={`Ações de ${item.title}`} aria-expanded={open} aria-controls={`actions-${item.id}`} onFocus={event => { if (event.currentTarget.matches(':focus-visible')) setOpen(true) }} onClick={() => setOpen(true)} />
      <span className={`card-sync-icon ${pending ? 'card-sync-pending' : 'card-sync-saved'}`} role="img" aria-label={`${pending ? 'Pendente de sincronização' : 'Confirmado no Drive'}: ${item.title}`} title={pending ? 'Pendente de sincronização' : 'Confirmado no Drive'}><Icon name={pending ? 'upload' : 'check'} /></span>
      <div className="card-actions" id={`actions-${item.id}`}>
        <button className="card-action" disabled={!canEdit} aria-label={`Editar ${item.title}`} title="Editar" onClick={() => { setOpen(false); onEdit() }}><Icon name="edit" /></button>
        <button className="card-action card-action-delete" disabled={!canEdit} aria-label={`Excluir ${item.title}`} title="Excluir" onClick={event => onDelete(event.currentTarget)}><Icon name="trash" /></button>
        {item.scanUrl && <a className="card-action" href={item.scanUrl} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" aria-label={`Ler ${item.title} em ${item.scanName?.trim() || new URL(item.scanUrl).hostname} (abre em nova aba)`} title="Abrir scan"><Icon name="external" /></a>}
      </div>
    </div>
    <h3 id={`reading-${item.id}`} tabIndex={-1} title={item.title}>{item.title}</h3>
  </li>
}
