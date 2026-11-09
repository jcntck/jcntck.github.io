import { describe, expect, it } from 'vitest'
import { applyOperation, emptyEnvelope, type Json } from '../../shared/storage/library'
import { readSection, updateReading, validateFields, type Manga } from './model'

const record: Manga = { id: 'a30bb95b-a749-4366-8e68-ec1e3f7bc5f3', title: ' One Piece ', lastChapter: ' Extra 1 ', lastReadOn: '2026-04-06', updatedAt: '2026-11-09T12:00:00.000Z' }
describe('biblioteca de leituras', () => {
  it('aceita leitura retroativa, capítulo textual e normaliza somente campos editáveis', () => {
    expect(updateReading(readSection(undefined), record, '2026-11-09').items).toEqual([{ ...record, title: 'One Piece', lastChapter: 'Extra 1' }])
    expect(validateFields({ ...record, lastChapter: '12.5' }, '2026-11-09')).toEqual({})
  })
  it.each([
    [{ title: '  ' }, 'title'], [{ lastChapter: '\t' }, 'lastChapter'], [{ lastReadOn: '2026-02-29' }, 'lastReadOn'], [{ lastReadOn: '2026-11-10' }, 'lastReadOn'], [{ lastReadOn: '' }, 'lastReadOn'],
  ])('rejeita campos inválidos %j', (fields, error) => {
    expect(validateFields({ ...record, ...fields }, '2026-11-09')).toHaveProperty(error)
    expect(() => updateReading({ items: [] }, { ...record, ...fields }, '2026-11-09')).toThrow()
  })
  it('corrige sem trocar UUID/data e preserva propriedades extras do documento, seção e registro', () => {
    const base = { ...emptyEnvelope(), extra: { preserved: true }, diagnostics: { probe: 'keep' }, modules: { another: { value: 7 }, mangas: { extension: 'keep', items: [{ ...record, extra: 'keep' }] } } }
    const section = updateReading(readSection(base.modules.mangas), { ...record, title: 'Novo título', lastChapter: '12.5' }, '2026-11-09')
    const saved = applyOperation(base, { id: crypto.randomUUID(), target: 'modules', key: 'mangas', value: section })
    expect(saved.diagnostics).toEqual(base.diagnostics)
    expect(saved.extra).toEqual(base.extra)
    expect(saved.modules.another).toEqual(base.modules.another)
    expect(section.extension).toBe('keep')
    expect(section.items).toEqual([{ ...record, title: 'Novo título', lastChapter: '12.5', extra: 'keep' }])
    expect(base.modules.mangas.items[0].title).toBe(record.title)
  })
  it('não confunde seção inválida com biblioteca vazia nem corrige datas futuras remotas', () => {
    for (const value of [null, [], {}, { items: [{}] }, { items: [record, record] }, { items: [{ ...record, id: 'bad' }] }] as Json[]) expect(() => readSection(value)).toThrow()
    const future = { ...record, lastReadOn: '2027-01-01' }
    expect(readSection({ items: [future] }).items[0].lastReadOn).toBe('2027-01-01')
  })
  it('inclui, corrige e remove link opcional sem perder identidade ou campos extras', () => {
    const original = readSection({ extension: 'keep', items: [{ ...record, future: 'keep' }] })
    expect(original.items[0].scanUrl).toBeUndefined()
    const added = updateReading(original, { ...record, scanUrl: ' https://scan.example/obra ' }, '2026-11-09')
    expect(added.items[0]).toMatchObject({ id: record.id, lastReadOn: record.lastReadOn, scanUrl: 'https://scan.example/obra', future: 'keep' })
    const edited = updateReading(added, { ...added.items[0], title: 'Título corrigido' }, '2026-11-09')
    expect(edited.items[0].scanUrl).toBe('https://scan.example/obra')
    expect(updateReading(edited, { ...edited.items[0], scanUrl: '' }, '2026-11-09').items[0]).not.toHaveProperty('scanUrl')
    expect(original.items[0]).not.toHaveProperty('scanUrl')
  })
  it.each(['javascript:alert(1)', 'data:text/html,hi', '/obra', 'https://user:password@scan.example', 'texto sem URL'])('recusa link inseguro/inválido %s', scanUrl => {
    expect(validateFields({ ...record, scanUrl }, '2026-11-09')).toHaveProperty('scanUrl')
    expect(() => readSection({ items: [{ ...record, scanUrl }] })).toThrow(/scan inválido/)
  })
})
