import type { Manga } from './model'

export type ReadingOrder = 'title-asc' | 'title-desc' | 'date-asc' | 'date-desc'
const collator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true })
const searchable = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('pt-BR')
export function visibleReadings(items: readonly Manga[], query: string, order: ReadingOrder): Manga[] {
  const term = searchable(query.trim())
  return items.filter(item => searchable(item.title).includes(term)).sort((a, b) => {
    const byTitle = collator.compare(a.title, b.title)
    const primary = order.startsWith('date') ? a.lastReadOn.localeCompare(b.lastReadOn) : byTitle
    return (order.endsWith('desc') ? -primary : primary) || byTitle || a.id.localeCompare(b.id)
  })
}
