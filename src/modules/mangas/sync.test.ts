import { expect, it } from 'vitest'
import { mergeMangas } from './sync'
import { readSection, removeReading, type Manga } from './model'

const a: Manga = { id: 'a30bb95b-a749-4366-8e68-ec1e3f7bc5f3', title: 'One Piece', lastChapter: '10', lastReadOn: '2026-11-01', updatedAt: '2026-11-08T12:00:00Z' }
const b: Manga = { ...a, id: 'b30bb95b-a749-4366-8e68-ec1e3f7bc5f3', title: 'Outra obra' }
it('une exclusivos de cada lado e resolve repetidos pela data individual, sem mutação', () => {
  const local = { extension: 1, items: [a, b] }
  const remote = { future: true, items: [{ ...a, lastChapter: '11', updatedAt: '2026-11-09T12:00:00Z' }] }
  expect(mergeMangas(local, remote)).toEqual({ extension: 1, future: true, items: [remote.items[0], b] })
  expect(a.lastChapter).toBe('10'); expect(local.items).toHaveLength(2)
})
it('normaliza título com espaços e caixa sem depender de UUID e respeita remoção de campos opcionais', () => {
  const old = { ...a, coverUrl: 'https://example.com/a.jpg' }
  const newest = { ...b, title: '  ONE   PIECE ', updatedAt: '2026-11-10T00:00:00Z' }
  expect(mergeMangas({ items: [newest] }, { items: [old] }).items).toEqual([newest])
})
it('preserva identidade por UUID após renomeação e desfaz duplicata ligada pelo título antigo', () => {
  const renamed = { ...a, title: 'Nome corrigido', updatedAt: '2026-11-10T00:00:00Z' }
  expect(mergeMangas({ items: [renamed] }, { items: [a, { ...b, title: a.title }] }).items).toEqual([renamed])
})
it('favorece o registro remoto no empate e não aproxima títulos diferentes', () => {
  const remote = { ...a, lastChapter: 'Extra' }
  expect(mergeMangas({ items: [a, { ...b, title: 'One Piece Extra' }] }, { items: [remote] }).items).toEqual([remote, { ...b, title: 'One Piece Extra' }])
})
it('não considera ausência em arquivo legado uma exclusão', () => {
  expect(mergeMangas({ items: [a] }, { items: [] }).items).toEqual([a])
  expect(mergeMangas(undefined, { items: [a] }).items).toEqual([a])
})
it('propaga exclusões datadas nos dois sentidos, preserva marcadores e permite edição posterior', () => {
  const deleted = removeReading({ items: [a, b] }, a.id, '2026-11-09T00:00:00Z')
  for (const result of [mergeMangas(deleted, { items: [a] }), mergeMangas({ items: [a] }, deleted)]) {
    expect(result.items).toEqual([b]); expect(result.deletedItems).toEqual(deleted.deletedItems)
  }
  const newer = { ...a, updatedAt: '2026-11-10T00:00:00Z' }
  expect(mergeMangas(deleted, { items: [newer] }).items).toEqual([newer, b])
})
it('exclusão vence empate e também reconhece cópia importada com outro UUID', () => {
  const deleted = { items: [], deletedItems: [{ id: a.id, title: a.title, updatedAt: a.updatedAt }] }
  expect(mergeMangas({ items: [{ ...b, title: a.title }] }, deleted).items).toEqual([])
})
it('mantém exclusão posterior mesmo quando o relógio local está atrasado', () => {
  const deleted = removeReading({ items: [a] }, a.id, '2020-01-01T00:00:00Z')
  expect(mergeMangas(deleted, { items: [a] }).items).toEqual([])
})
it('bloqueia dados ou marcadores inválidos sem tratá-los como biblioteca vazia', () => {
  expect(() => mergeMangas({ items: [a] }, { items: ['broken'] })).toThrow()
  expect(() => readSection({ items: [a], deletedItems: [{ id: a.id, title: a.title, updatedAt: 'invalid' }] })).toThrow(/exclusão inválido/)
})
it('mesclar resultado novamente não altera conteúdo nem duplica marcadores', () => {
  const deleted = removeReading({ items: [a, b] }, a.id, '2026-11-09T00:00:00Z')
  const merged = mergeMangas(deleted, { items: [a] })
  expect(mergeMangas(merged, merged)).toEqual(merged)
})
