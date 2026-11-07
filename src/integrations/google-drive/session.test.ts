import { afterEach, describe, expect, it, vi } from 'vitest'
import { CloudSession, type AccountStorage } from './session'
import { applyOperation, emptyEnvelope, LibraryError, type Snapshot } from '../../shared/storage/library'
const grant = { access_token: 'temporary', expires_in: 60, scope: 'drive.file' }
function fixture() {
  let account = 'A'
  const documents: Record<string, Snapshot | null> = { A: { fileId: 'a', document: emptyEnvelope() }, B: null }
  let expired = false
  const writes: string[] = []
  const factory = (token: () => string): AccountStorage => {
    let owner = ''
    return {
      account: async () => { token(); owner = account; return { id: owner, name: owner } },
      load: async () => { token(); return structuredClone(documents[owner]) },
      save: async (base, operation) => {
        token()
        if (expired) throw new LibraryError('expired', 'Reconecte')
        writes.push(owner)
        documents[owner] = { fileId: owner, document: applyOperation(base?.document ?? emptyEnvelope(), operation) }
        return structuredClone(documents[owner])!
      },
    }
  }
  const session = new CloudSession(factory)
  return { session, writes, documents, switch: () => { account = 'B' }, expire: (value: boolean) => { expired = value } }
}
afterEach(() => vi.useRealTimers())
describe('sessão isolada', () => {
  it('preserva operação na expiração e só retoma após identificar a mesma conta e reler', async () => {
    const f = fixture(); await f.session.connect(async () => grant)
    f.expire(true); await f.session.saveProbe()
    const pending = f.session.getSnapshot().pending
    expect(pending).toBeDefined(); expect(f.session.getSnapshot().phase).toBe('expired')
    f.expire(false); await f.session.connect(async () => grant)
    expect(f.session.getSnapshot().pending).toEqual(pending)
    await f.session.saveProbe()
    expect(f.documents.A?.document.revision).toBe(pending?.id)
    expect(f.writes).toEqual(['A']); expect(f.session.getSnapshot().pending).toBeUndefined()
    f.session.disconnect()
  })
  it('descarta dados e operação de A ao trocar para B', async () => {
    const f = fixture(); await f.session.connect(async () => grant)
    f.expire(true); await f.session.saveProbe()
    f.switch(); f.expire(false); await f.session.connect(async () => grant)
    expect(f.session.getSnapshot()).toMatchObject({ account: { id: 'B' }, snapshot: null })
    expect(f.session.getSnapshot().pending).toBeUndefined()
    await f.session.saveProbe(); expect(f.writes).toEqual(['B'])
    f.session.disconnect(); expect(f.session.getSnapshot().account).toBeUndefined()
  })
  it('não restaura estado quando autorização termina depois de desconectar', async () => {
    const f = fixture(); let resolve!: (value: typeof grant) => void
    const connecting = f.session.connect(() => new Promise(done => { resolve = done }))
    f.session.disconnect(); resolve(grant); await connecting
    expect(f.session.getSnapshot().phase).toBe('disconnected')
  })
  it('expira em memória e bloqueia gravação até reconexão', async () => {
    vi.useFakeTimers(); const f = fixture(); await f.session.connect(async () => grant)
    await vi.advanceTimersByTimeAsync(60_001)
    expect(f.session.getSnapshot().phase).toBe('expired')
    await f.session.saveProbe(); expect(f.writes).toEqual([]); f.session.disconnect()
  })
  it('serializa operações e descarta tentativa somente após releitura bem sucedida', async () => {
    const f = fixture(); await f.session.connect(async () => grant)
    await Promise.all([f.session.saveProbe(), f.session.saveProbe()])
    expect(f.writes).toEqual(['A'])
    await f.session.reload(); expect(f.session.getSnapshot().message).toContain('Nova leitura')
    f.session.disconnect()
  })
})
