import { describe, expect, it } from 'vitest'
import { applyOperation, canonical, emptyEnvelope, validate } from './library'
describe('envelope v1', () => {
  it('valida e preserva campos desconhecidos, diagnóstico e módulos', () => {
    const base = validate({ ...emptyEnvelope(), future: { enabled: true }, modules: { manga: ['private'] }, diagnostics: { other: 7 } })
    const changed = applyOperation(base, { id: 'revision-2', target: 'diagnostics', key: 'probe', value: { id: 'probe' } })
    expect(changed).toEqual({ ...base, revision: 'revision-2', diagnostics: { other: 7, probe: { id: 'probe' } } })
    expect(base.diagnostics).toEqual({ other: 7 })
    expect(canonical({ a: 1, b: 2 })).toBe(canonical({ b: 2, a: 1 }))
  })
  it.each([null, {}, { ...emptyEnvelope(), schemaVersion: 2 }, { ...emptyEnvelope(), modules: [] }])('recusa formato incompatível %j', value => expect(() => validate(value)).toThrow(/inválido/))
})
