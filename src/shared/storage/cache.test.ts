import { describe, expect, it } from 'vitest'
import { BrowserLibraryCache } from './cache'
import { emptyEnvelope } from './library'

describe('cache local por conta', () => {
  it('isola cópias e restaura dados e política manual sem credenciais', () => {
    const storage = new Map<string, string>()
    const port = { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) }
    const cache = new BrowserLibraryCache(() => port)
    const copy = { version: 1 as const, snapshot: { fileId: 'file', document: emptyEnvelope() }, operations: [{ id: 'op', target: 'modules' as const, key: 'mangas', value: { items: [] }, updatedAt: '2026-11-09T12:00:00.000Z', manual: true }] }
    cache.write('A', copy)
    expect(cache.read('B')).toBeUndefined()
    expect(new BrowserLibraryCache(() => port).read('A')).toEqual(copy)
    expect([...storage.values()].join('')).not.toMatch(/access_token|refresh_token/)
  })
  it.each(['broken', '{"version":2}', '{"version":1,"snapshot":null,"operations":[{}]}', '{"version":1,"snapshot":{"fileId":"a","document":{}},"operations":[]}'])('recusa cache inválido %s', raw => {
    expect(() => new BrowserLibraryCache(() => ({ getItem: () => raw, setItem: () => {} })).read('A')).toThrow()
  })
})
