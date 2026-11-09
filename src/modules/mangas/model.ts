import type { Json } from '../../shared/storage/library'
import { localDay, validDay } from './dates'

export interface Manga { [key: string]: Json; id: string; title: string; lastChapter: string; lastReadOn: string; updatedAt: string }
export interface MangaSection { [key: string]: Json; items: Manga[] }
export type Fields = Pick<Manga, 'title' | 'lastChapter' | 'lastReadOn'>
export type Errors = Partial<Record<keyof Fields, string>>
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
export function validateFields(fields: Fields, today = localDay()): Errors {
  const errors: Errors = {}
  if (!fields.title.trim()) errors.title = 'Informe o título.'
  if (!fields.lastChapter.trim()) errors.lastChapter = 'Informe o último capítulo lido.'
  if (!validDay(fields.lastReadOn)) errors.lastReadOn = 'Informe uma data de leitura válida.'
  else if (fields.lastReadOn > today) errors.lastReadOn = 'A data de leitura não pode estar no futuro.'
  return errors
}
export function readSection(value: Json | undefined): MangaSection {
  if (value === undefined) return { items: [] }
  if (!object(value) || !Array.isArray(value.items)) throw new Error('A seção de mangás é incompatível. Nada foi substituído.')
  const ids = new Set<string>()
  for (const item of value.items) {
    if (!object(item) || typeof item.id !== 'string' || !uuid.test(item.id) || ids.has(item.id) || typeof item.title !== 'string' || !item.title.trim() || typeof item.lastChapter !== 'string' || !item.lastChapter.trim() || typeof item.lastReadOn !== 'string' || !validDay(item.lastReadOn) || typeof item.updatedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(item.updatedAt) || !Number.isFinite(Date.parse(item.updatedAt))) {
      throw new Error('Há um registro de mangá inválido. Nada foi substituído.')
    }
    ids.add(item.id)
  }
  return structuredClone(value) as MangaSection
}
export function updateReading(section: MangaSection, record: Manga, today = localDay()): MangaSection {
  if (Object.keys(validateFields(record, today)).length) throw new Error('Confira os campos da leitura.')
  const current = section.items.find(item => item.id === record.id)
  const next: Manga = { ...current, id: record.id, title: record.title.trim(), lastChapter: record.lastChapter.trim(), lastReadOn: record.lastReadOn, updatedAt: record.updatedAt }
  const result = { ...section, items: current ? section.items.map(item => item.id === next.id ? next : item) : [...section.items, next] }
  return readSection(result)
}
