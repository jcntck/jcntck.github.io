import type { Manga } from './model'

export type ReadingOrder = 'title-asc' | 'title-desc' | 'date-asc' | 'date-desc'
export const PAGE_SIZE = 12
export function readingPage<T>(items: readonly T[], requested: number) {
  const total = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const current = Math.min(total, Math.max(1, Math.trunc(requested) || 1))
  const start = (current - 1) * PAGE_SIZE
  const numbers = [...new Set([1, current - 1, current, current + 1, total])].filter(value => value >= 1 && value <= total).sort((a, b) => a - b)
  const controls: (number | 'gap')[] = []
  for (const [index, number] of numbers.entries()) {
    if (index > 0 && number - numbers[index - 1] > 1) controls.push('gap')
    controls.push(number)
  }
  return { items: items.slice(start, start + PAGE_SIZE), current, total, first: items.length ? start + 1 : 0, last: Math.min(start + PAGE_SIZE, items.length), controls }
}
const collator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true })
const searchable = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('pt-BR')
export function visibleReadings(items: readonly Manga[], query: string, order: ReadingOrder): Manga[] {
  const term = searchable(query.trim())
  return items.filter(item => searchable(item.title).includes(term) || searchable(item.englishTitle ?? '').includes(term)).sort((a, b) => {
    const byTitle = collator.compare(a.title, b.title)
    const primary = order.startsWith('date') ? a.lastReadOn.localeCompare(b.lastReadOn) : byTitle
    return (order.endsWith('desc') ? -primary : primary) || byTitle || a.id.localeCompare(b.id)
  })
}
