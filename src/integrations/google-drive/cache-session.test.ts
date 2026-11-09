import { afterEach, expect, it, vi } from 'vitest'
import { CloudSession, type AccountStorage } from './session'
import { BrowserLibraryCache, type CachePort } from '../../shared/storage/cache'
import { applyOperation, emptyEnvelope, type Snapshot } from '../../shared/storage/library'

const grant = { access_token: 'never-persist-this-token', expires_in: 60, scope: 'drive.file' }
afterEach(() => vi.useRealTimers())
function fixture(cacheOverride?: CachePort) {
  let owner: string | undefined = 'A'
  let remote: Snapshot | null = { fileId: 'a', document: { ...emptyEnvelope(), updatedAt: '2026-11-08T12:00:00.000Z', modules: { mangas: { items: ['original'] } } } }
  const entries = new Map<string, string>()
  const cache = cacheOverride ?? new BrowserLibraryCache(() => ({ getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => entries.set(key, value) }))
  const load = vi.fn(async () => structuredClone(remote))
  const save = vi.fn(async (base, op) => { remote = { fileId: 'a', document: applyOperation(base?.document ?? emptyEnvelope(), op) }; return structuredClone(remote) })
  const factory = (): AccountStorage => ({ subject: async () => owner!, account: async () => ({ id: owner!, name: owner! }), load, save })
  const create = () => new CloudSession(factory, () => owner, cache)
  return { create, load, save, entries, owner: (value?: string) => { owner = value }, remote: (value: Snapshot) => { remote = value } }
}
it('restaura consulta e pendência após refresh sem Drive, preserva IDs e política manual', async () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-09T12:00:00Z'))
  const f = fixture(); const first = f.create()
  await first.connect(async () => grant)
  first.stageSection('modules', 'mangas', { items: ['local'] }, { manual: true })
  const id = first.getSnapshot().pending?.id
  first.clearLocalSession()
  const restored = f.create(); restored.restoreCache()
  expect(restored.getSnapshot()).toMatchObject({ phase: 'disconnected', canEdit: true, canWrite: false, cached: true, pending: { id } })
  expect(restored.pendingSection('modules', 'mangas')).toEqual({ items: ['local'] })
  expect(f.load).toHaveBeenCalledTimes(1); expect(f.save).not.toHaveBeenCalled()
  expect([...f.entries.values()].join('')).not.toContain(grant.access_token)
  await restored.connect(async () => grant)
  restored.setAutomatic(true); await vi.advanceTimersByTimeAsync(1000)
  expect(f.save).not.toHaveBeenCalled()
  await restored.sync()
  expect(f.save.mock.calls[0][1].id).toBe(id)
  restored.clearLocalSession()
  const again = f.create(); again.restoreCache()
  expect(again.getSnapshot().snapshot?.document.modules.mangas).toEqual({ items: ['local'] })
  expect(again.getSnapshot().pending).toBeUndefined(); again.clearLocalSession()
})
it.each(['2026-11-09T12:00:00.000Z', '2026-11-09T13:00:00.000Z'])('prefere remoto mais recente ou empatado %s sem gravar', async updatedAt => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-09T12:00:00Z'))
  const f = fixture(); const session = f.create(); await session.connect(async () => grant)
  session.stageSection('modules', 'mangas', { items: ['local'] }, { manual: true })
  session.disconnect()
  f.remote({ fileId: 'a', document: { ...emptyEnvelope(), updatedAt, modules: { mangas: { items: ['remote'] }, extra: 'keep' } } })
  await session.connect(async () => grant)
  expect(session.getSnapshot().pending).toBeUndefined()
  expect(session.getSnapshot().snapshot?.document.modules.mangas).toEqual({ items: ['remote'] })
  expect(f.save).not.toHaveBeenCalled(); session.clearLocalSession()
  const next = f.create(); next.restoreCache()
  expect(next.getSnapshot().snapshot?.document.modules.extra).toBe('keep'); next.clearLocalSession()
})
it('separa contas e limpa dados visíveis ao sair sem apagar o cache de A', async () => {
  const f = fixture(); const session = f.create(); await session.connect(async () => grant)
  session.clearLocalSession(); f.owner('B'); session.restoreCache()
  expect(session.getSnapshot().snapshot).toBeUndefined()
  expect(session.getSnapshot().pending).toBeUndefined()
  f.owner('A'); session.restoreCache()
  expect(session.getSnapshot().snapshot?.fileId).toBe('a')
  f.owner(); session.clearLocalSession()
  expect(session.getSnapshot().snapshot).toBeUndefined()
  expect(f.entries.size).toBe(1)
})
it('cache bloqueado ou sem espaço mantém biblioteca e avisa que pendências são voláteis', async () => {
  const f = fixture({ read: () => { throw new Error('blocked') }, write: () => { throw new Error('quota') } })
  const session = f.create(); session.restoreCache()
  expect(session.getSnapshot().cacheError).toMatch(/ler o cache/)
  await session.connect(async () => grant)
  session.stageSection('modules', 'mangas', { items: ['local'] }, { manual: true })
  expect(session.getSnapshot()).toMatchObject({ cached: false, canEdit: true, syncPhase: 'pending' })
  expect(session.getSnapshot().cacheError).toMatch(/somente nesta aba/)
  expect(session.pendingSection('modules', 'mangas')).toEqual({ items: ['local'] })
  session.clearLocalSession()
})

it('mantém cache confirmado mais recente mesmo sem edições pendentes e só envia por ação', async () => {
  const f = fixture(); const session = f.create(); await session.connect(async () => grant)
  session.disconnect()
  f.remote({ fileId: 'a', document: { ...emptyEnvelope(), updatedAt: '2026-11-07T12:00:00.000Z', modules: { mangas: { items: ['older'] }, another: 'keep remote' } } })
  await session.connect(async () => grant)
  expect(session.pendingSection('modules', 'mangas')).toEqual({ items: ['original'] })
  expect(session.getSnapshot().pending?.updatedAt).toBe('2026-11-08T12:00:00.000Z')
  expect(f.save).not.toHaveBeenCalled()
  await session.sync()
  expect(session.getSnapshot().snapshot?.document.modules).toEqual({ mangas: { items: ['original'] }, another: 'keep remote' })
  session.clearLocalSession()
})

it('recupera gravação com resposta perdida depois de refresh sem duplicar o envio', async () => {
  const f = fixture(); const session = f.create(); await session.connect(async () => grant)
  session.stageSection('modules', 'mangas', { items: ['saved despite network error'] }, { manual: true })
  const operation = session.getSnapshot().pending!
  const confirmed = { fileId: 'a', document: applyOperation(session.getSnapshot().snapshot!.document, operation) }
  f.remote(confirmed)
  f.save.mockRejectedValueOnce(new Error('lost response'))
  await session.sync()
  expect(session.getSnapshot().syncPhase).toBe('error')
  session.clearLocalSession()
  const restored = f.create(); restored.restoreCache()
  expect(restored.getSnapshot().pending?.id).toBe(operation.id)
  await restored.connect(async () => grant)
  expect(restored.getSnapshot().pending).toBeUndefined()
  expect(restored.getSnapshot().snapshot?.document.revision).toBe(operation.id)
  expect(f.save).toHaveBeenCalledTimes(1)
  restored.clearLocalSession()
})
