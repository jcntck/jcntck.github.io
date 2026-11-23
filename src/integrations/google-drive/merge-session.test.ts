import { afterEach, expect, it } from 'vitest'
import { DriveStorage } from './drive'
import { CloudSession } from './session'
import { emptyEnvelope, type Envelope } from '../../shared/storage/library'
import { BrowserLibraryCache } from '../../shared/storage/cache'
import { removeReading, type Manga } from '../../modules/mangas/model'
const a: Manga = { id: 'a30bb95b-a749-4366-8e68-ec1e3f7bc5f3', title: 'Obra A', lastChapter: '10', lastReadOn: '2026-11-01', updatedAt: '2026-11-08T12:00:00Z' }
const b: Manga = { ...a, id: 'b30bb95b-a749-4366-8e68-ec1e3f7bc5f3', title: 'Obra B' }
const c: Manga = { ...a, id: 'c30bb95b-a749-4366-8e68-ec1e3f7bc5f3', title: 'Obra C' }
const grant = { access_token: 'synthetic', expires_in: 60, scope: 'drive.file' }
const sessions: CloudSession[] = []
afterEach(() => sessions.splice(0).forEach(session => session.clearLocalSession()))
function fixture() {
  let remote: Envelope = { ...emptyEnvelope(), updatedAt: '2026-11-08T12:00:00Z', modules: { mangas: { items: [a] }, another: 'preserve' }, extension: true }
  let writes = 0; let lose = false
  let waitWrite: (() => Promise<void>) | undefined
  const drive = new DriveStorage(() => 'synthetic', (async (_input, init) => {
    if (init?.method === 'PATCH') {
      if (waitWrite) await waitWrite()
      remote = JSON.parse(String(init.body)); writes++
      if (lose) { lose = false; throw new Error('lost response') }
      return Response.json({ id: 'file' })
    }
    return String(_input).includes('alt=media') ? Response.json(remote) : Response.json({ files: [{ id: 'file' }] })
  }) as typeof fetch)
  const entries = new Map<string, string>()
  const cache = new BrowserLibraryCache(() => ({ getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value) }))
  const create = () => {
    const session = new CloudSession(() => ({ subject: async () => 'owner', account: async () => ({ id: 'owner', name: 'Test' }), load: () => drive.load(), save: (base, op) => drive.save(base, op) }), () => 'owner', cache)
    sessions.push(session); return session
  }
  return { create, remote: () => remote, set: (value: Envelope) => { remote = value }, writes: () => writes, lose: () => { lose = true }, wait: (callback: () => Promise<void>) => { waitWrite = callback } }
}
it('reconecta com remoto global mais novo e preserva exclusivo local após refresh até envio explícito', async () => {
  const f = fixture(); const session = f.create(); await session.connect(async () => grant)
  session.stageSection('modules', 'mangas', { items: [a, b] }, { manual: true }); session.clearLocalSession()
  const newerA = { ...a, lastChapter: '20', updatedAt: '2026-11-10T00:00:00Z' }
  f.set({ ...f.remote(), updatedAt: '2099-01-01T00:00:00Z', modules: { mangas: { items: [newerA, c] }, another: 'remote extra' } })
  const restored = f.create(); restored.restoreCache(); await restored.connect(async () => grant)
  expect(restored.pendingSection('modules', 'mangas')).toMatchObject({ items: [newerA, c, b] })
  expect(f.writes()).toBe(0)
  await restored.sync()
  expect(restored.getSnapshot()).toMatchObject({ syncPhase: 'synced', pending: undefined })
  expect(f.remote().modules).toEqual({ mangas: { items: [newerA, c, b] }, another: 'remote extra' })
  expect(f.remote().updatedAt).toBe('2099-01-01T00:00:00.000Z'); expect(f.remote().extension).toBe(true)
})
it('relê e mescla cache confirmado mesmo sem pendência anterior', async () => {
  const f = fixture(); const session = f.create(); await session.connect(async () => grant)
  f.set({ ...f.remote(), updatedAt: '2099-01-01T00:00:00Z', modules: { mangas: { items: [b] } } })
  await session.reload()
  expect(session.pendingSection('modules', 'mangas')).toMatchObject({ items: [b, a] }); expect(f.writes()).toBe(0)
  await session.sync(); expect(f.remote().modules.mangas).toEqual({ items: [b, a] })
})
it('relê imediatamente antes do envio e mescla alteração remota posterior à conexão', async () => {
  const f = fixture(); const session = f.create(); await session.connect(async () => grant)
  session.stageSection('modules', 'mangas', { items: [a, b] }, { manual: true })
  f.set({ ...f.remote(), updatedAt: '2099-01-01T00:00:00Z', modules: { mangas: { items: [a, c] } } })
  await session.sync()
  expect(f.remote().modules.mangas).toEqual({ items: [a, c, b] }); expect(session.getSnapshot().pending).toBeUndefined()
})
it('recupera resposta perdida de mescla com conteúdo diferente da operação original sem segunda escrita', async () => {
  const f = fixture(); const session = f.create(); await session.connect(async () => grant)
  session.stageSection('modules', 'mangas', { items: [a, b] }, { manual: true })
  f.set({ ...f.remote(), modules: { mangas: { items: [a, c] } } }); f.lose()
  await session.sync(); expect(session.getSnapshot().syncPhase).toBe('error')
  session.clearLocalSession()
  const restored = f.create(); await restored.connect(async () => grant)
  expect(restored.getSnapshot().pending).toBeUndefined(); expect(f.writes()).toBe(1)
  await restored.sync(); expect(f.writes()).toBe(1)
  expect(f.remote().modules.mangas).toEqual({ items: [a, c, b] })
})
it('envia exclusão datada sem restaurar obra e preserva obra remota exclusiva', async () => {
  const f = fixture(); const session = f.create(); await session.connect(async () => grant)
  session.stageSection('modules', 'mangas', removeReading({ items: [a] }, a.id), { manual: true })
  f.set({ ...f.remote(), modules: { mangas: { items: [a, c] } } })
  await session.sync()
  expect(f.remote().modules.mangas).toMatchObject({ items: [c], deletedItems: [{ id: a.id }] })
  expect(session.getSnapshot().pending).toBeUndefined()
})
it('rebasa edição em fila durante envio sem perder obra remota independente', async () => {
  const f = fixture(); const session = f.create(); await session.connect(async () => grant)
  session.stageSection('modules', 'mangas', { items: [a, b] }, { manual: true })
  f.set({ ...f.remote(), modules: { mangas: { items: [a, c] } } })
  let release!: () => void; let started!: () => void
  const writing = new Promise<void>(resolve => { started = resolve })
  const gate = new Promise<void>(resolve => { release = resolve })
  f.wait(async () => { started(); await gate })
  const sending = session.sync(); await writing
  const edited = { ...b, lastChapter: '99', updatedAt: '2026-12-01T00:00:00Z' }
  session.stageSection('modules', 'mangas', { items: [a, edited] }, { manual: true })
  release(); await sending
  expect(session.pendingSection('modules', 'mangas')).toMatchObject({ items: [a, c, edited] })
  await session.sync(); expect(f.remote().modules.mangas).toEqual({ items: [a, c, edited] })
})
it('remoto inválido bloqueia reconexão sem sobrescrever cache ou pendência', async () => {
  const f = fixture(); const session = f.create(); await session.connect(async () => grant)
  session.stageSection('modules', 'mangas', { items: [a, b] }, { manual: true })
  const before = session.getSnapshot().pending
  f.set({ ...f.remote(), modules: { mangas: { items: ['broken'] } } })
  await session.reload()
  expect(session.getSnapshot().phase).toBe('error'); expect(session.getSnapshot().pending).toEqual(before)
  expect(f.writes()).toBe(0)
})
