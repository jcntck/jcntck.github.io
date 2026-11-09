import { expect, it } from 'vitest'
import { readingPage, visibleReadings } from './view'
import type { Manga } from './model'
const records: Manga[] = [
  { id: 'b', title: 'Zebra', lastReadOn: '2026-01-01', lastChapter: '1', updatedAt: '' },
  { id: 'a', title: 'Árvore', englishTitle: 'World Tree', lastReadOn: '2026-06-01', lastChapter: 'Extra', updatedAt: '' },
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

it('pagina 126 obras em 11 páginas sem perder registros ou alterar a lista', () => {
  const all = Array.from({ length: 126 }, (_, index) => index + 1)
  const original = [...all]
  const pages = Array.from({ length: 11 }, (_, index) => readingPage(all, index + 1))
  expect(pages[0]).toMatchObject({ first: 1, last: 12, current: 1, total: 11 })
  expect(pages[10]).toMatchObject({ first: 121, last: 126, current: 11, total: 11 })
  expect(pages[10].items).toHaveLength(6)
  expect(pages.flatMap(page => page.items)).toEqual(original)
  expect(new Set(pages.flatMap(page => page.items)).size).toBe(126)
  expect(all).toEqual(original)
})
it('limita a página após filtro/redução e trata lista vazia e limites', () => {
  expect(readingPage([1, 2], 11)).toMatchObject({ items: [1, 2], current: 1, total: 1 })
  expect(readingPage([1, 2], -1).current).toBe(1)
  expect(readingPage([], 4)).toMatchObject({ items: [], current: 1, first: 0, last: 0, total: 1 })
  expect(readingPage(visibleReadings(records, 'arvore', 'title-desc'), 11).items.map(item => item.id)).toEqual(['a'])
})

it('busca pelos dois nomes sem duplicar obras e mantém a ordenação pelo título principal', () => {
  expect(visibleReadings(records, 'WORLD TRÉE', 'title-asc').map(item => item.id)).toEqual(['a'])
  expect(visibleReadings(records, 'arvore', 'title-desc').map(item => item.id)).toEqual(['a'])
  const aliases = [{ ...records[0], englishTitle: 'Shared Name' }, { ...records[1], englishTitle: 'Shared Name' }, { ...records[2], title: 'Shared Name', englishTitle: 'Shared Name' }]
  expect(visibleReadings(aliases, 'shared name', 'title-asc').map(item => item.id)).toEqual(['a', 'c', 'b'])
  expect(visibleReadings(records, '', 'title-asc').map(item => item.id)).toEqual(['a', 'c', 'b'])
})
