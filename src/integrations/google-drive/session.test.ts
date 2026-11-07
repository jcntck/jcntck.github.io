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

describe('sincronização compartilhada', () => {
  it('prepara sem gravar e sincroniza somente por ação, sem criar documento na leitura vazia', async () => {
    const f = fixture(); await f.session.connect(async () => grant)
    f.session.stageProbe(); expect(f.writes).toEqual([])
    expect(f.session.getSnapshot().syncPhase).toBe('pending')
    await f.session.sync(); expect(f.writes).toEqual(['A'])
    expect(f.session.getSnapshot().syncPhase).toBe('synced'); f.session.disconnect()
  })
  it('confere a mesma identidade antes de about ou qualquer leitura de Drive', async () => {
    const load = vi.fn(); const account = vi.fn(); const subject = vi.fn(async () => 'B')
    const session = new CloudSession(() => ({ subject, account, load, save: vi.fn() }), () => 'A')
    await session.connect(async () => grant)
    expect(session.getSnapshot().message).toContain('diferente'); expect(account).not.toHaveBeenCalled(); expect(load).not.toHaveBeenCalled()
    session.disconnect()
  })
  it('preserva edição durante envio e seções diferentes na fila', async () => {
    let finish!: (value: Snapshot) => void
    const save = vi.fn().mockImplementationOnce(() => new Promise(resolve => { finish = resolve })).mockImplementation(async (base, op) => ({ fileId: 'a', document: applyOperation(base?.document ?? emptyEnvelope(), op) }))
    const session = new CloudSession(() => ({ account: async () => ({ id: 'A', name: 'A' }), load: async () => null, save }))
    await session.connect(async () => grant); session.stageSection('modules', 'first', 1)
    const sending = session.sync(); const first = session.getSnapshot().pending!
    session.stageSection('modules', 'first', 2); session.stageSection('modules', 'second', 3)
    finish({ fileId: 'a', document: applyOperation(emptyEnvelope(), first) }); await sending
    expect(session.getSnapshot().pending?.value).toBe(2)
    await session.sync(); expect(session.getSnapshot().pending?.key).toBe('second')
    await session.sync(); expect(session.getSnapshot().snapshot?.document.modules).toEqual({ first: 2, second: 3 }); session.disconnect()
  })
  it('automação é opt-in, serializada e pausa sem abrir popup ao expirar ou falhar', async () => {
    vi.useFakeTimers(); const f = fixture(); await f.session.connect(async () => grant)
    f.session.stageProbe(); await vi.advanceTimersByTimeAsync(1000); expect(f.writes).toEqual([])
    f.session.setAutomatic(true); await vi.advanceTimersByTimeAsync(750); expect(f.writes).toEqual(['A'])
    f.expire(true); f.session.stageProbe(); await vi.advanceTimersByTimeAsync(750)
    expect(f.session.getSnapshot().phase).toBe('expired')
    await vi.advanceTimersByTimeAsync(10_000); expect(f.writes).toEqual(['A']); f.session.disconnect()
  })
  it('cancelar a sessão cancela o envio automático agendado', async () => {
    vi.useFakeTimers(); const f = fixture(); await f.session.connect(async () => grant)
    f.session.setAutomatic(true); f.session.stageProbe(); f.session.disconnect(); await vi.advanceTimersByTimeAsync(1000)
    expect(f.writes).toEqual([]); expect(f.session.getSnapshot().automatic).toBe(false)
  })
})

it('ancora uma alteração preparada antes de conectar na primeira leitura remota', async () => {
  const f = fixture(); f.documents.A!.document.modules = { future: { keep: true } }
  f.session.stageProbe(); const operation = f.session.getSnapshot().pending!
  await f.session.connect(async () => grant); await f.session.sync()
  expect(f.documents.A?.document.revision).toBe(operation.id)
  expect(f.documents.A?.document.modules).toEqual({ future: { keep: true } }); f.session.disconnect()
})
it('automação espera a aba ficar ativa e só então envia a pendência', async () => {
  vi.useFakeTimers(); const visible = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
  const f = fixture(); await f.session.connect(async () => grant); f.session.setAutomatic(true); f.session.stageProbe()
  await vi.advanceTimersByTimeAsync(1000); expect(f.writes).toEqual([])
  visible.mockReturnValue('visible'); f.session.resumeAutomatic(); await vi.advanceTimersByTimeAsync(750)
  expect(f.writes).toEqual(['A']); f.session.disconnect(); visible.mockRestore(); vi.useRealTimers()
})
