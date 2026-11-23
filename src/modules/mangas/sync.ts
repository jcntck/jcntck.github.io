import { readSection, type DeletedManga, type Manga, type MangaSection } from './model'
import type { Json } from '../../shared/storage/library'

const titleKey = (title: string) => title.normalize('NFKC').trim().replace(/\s+/gu, ' ').toLowerCase()

// UUID preserves identity across renames; normalized title deduplicates independent imports.
// Connected groups also handle a rename bridging two older copies of the same work.
export function mergeMangas(localValue: Json | undefined, remoteValue: Json | undefined): MangaSection {
  const local = readSection(localValue)
  const remote = readSection(remoteValue)
  const entries: { record: Manga | DeletedManga; deleted: boolean }[] = []
  for (const section of [local, remote]) {
    entries.push(...section.items.map(record => ({ record, deleted: false })))
    entries.push(...((section.deletedItems as DeletedManga[] | undefined) ?? []).map(record => ({ record, deleted: true })))
  }
  const roots = entries.map((_, index) => index)
  const root = (index: number): number => roots[index] === index ? index : (roots[index] = root(roots[index]))
  const identities = new Map<string, number>()
  entries.forEach(({ record }, index) => {
    for (const key of [`id:${record.id}`, `title:${titleKey(record.title)}`]) {
      const previous = identities.get(key)
      if (previous !== undefined) roots[root(index)] = root(previous)
      identities.set(key, index)
    }
  })
  const winners = new Map<number, typeof entries[number]>()
  entries.forEach((entry, index) => {
    const group = root(index)
    const previous = winners.get(group)
    const delta = previous ? Date.parse(entry.record.updatedAt) - Date.parse(previous.record.updatedAt) : 1
    // Remote entries occur last. A deletion wins an exact timestamp tie.
    if (!previous || delta > 0 || (delta === 0 && (entry.deleted || !previous.deleted))) winners.set(group, entry)
  })
  const order = new Map([...remote.items, ...local.items].map((item, index) => [item.id, index]))
  // Preserve remote order when no content changed.
  remote.items.forEach((item, index) => order.set(item.id, index))
  const items = [...winners.values()].filter(entry => !entry.deleted).map(entry => entry.record as Manga).sort((a, b) => order.get(a.id)! - order.get(b.id)!)
  const deletedItems = [...new Map(entries.filter(entry => entry.deleted).map(entry => [JSON.stringify(entry.record), entry.record])).values()].sort((a, b) => a.id.localeCompare(b.id) || a.updatedAt.localeCompare(b.updatedAt))
  return readSection({ ...local, ...remote, items, ...(deletedItems.length ? { deletedItems } : {}) })
}
