import { expect, it } from 'vitest'
import { visibleReadings } from './view'
import type { Manga } from './model'
const records: Manga[] = [
  { id: 'b', title: 'Zebra', lastReadOn: '2026-01-01', lastChapter: '1', updatedAt: '' },
  { id: 'a', title: 'Árvore', lastReadOn: '2026-06-01', lastChapter: 'Extra', updatedAt: '' },
  { id: 'c', title: 'Boruto', lastReadOn: '2026-06-01', lastChapter: '2', updatedAt: '' },
]
it('filtra por título sem caixa/acentos e distingue busca vazia de sem resultado', () => {
  expect(visibleReadings(records, ' ARVORE ', 'title-asc').map(item => item.title)).toEqual(['Árvore'])
  expect(visibleReadings(records, 'ausente', 'title-asc')).toEqual([])
  expect(visibleReadings(records, ' ', 'title-asc')).toHaveLength(3)
})
it('ordena nas quatro direções sem alterar dados, com desempate estável', () => {
  const original = structuredClone(records)
  expect(visibleReadings(records, '', 'title-asc').map(item => item.id)).toEqual(['a', 'c', 'b'])
  expect(visibleReadings(records, '', 'title-desc').map(item => item.id)).toEqual(['b', 'c', 'a'])
  expect(visibleReadings(records, '', 'date-asc').map(item => item.id)).toEqual(['b', 'a', 'c'])
  expect(visibleReadings(records, '', 'date-desc').map(item => item.id)).toEqual(['a', 'c', 'b'])
  expect(visibleReadings([{ ...records[1], id: '2' }, { ...records[1], id: '1' }], '', 'title-asc').map(item => item.id)).toEqual(['1', '2'])
  expect(records).toEqual(original)
})
