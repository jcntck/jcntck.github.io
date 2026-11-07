import { describe, expect, it, vi } from 'vitest'
import { DriveStorage } from './drive'
import { applyOperation, emptyEnvelope, type Envelope } from '../../shared/storage/library'
const operation = { id: 'operation-1', target: 'diagnostics' as const, key: 'probe', value: { id: 'sample' } }
function fixture(initial: Envelope | null = null) {
  let document = initial
  let writes = 0
  let loseResponse = false
  const request = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const address = String(url)
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer memory-only' })
    expect(address).not.toContain('memory-only')
    if (init?.method === 'PATCH' || init?.method === 'POST') {
      writes++
      const body = String(init.body)
      document = init.method === 'PATCH' ? JSON.parse(body) : JSON.parse(body.split('Content-Type: application/json\r\n\r\n')[1].split('\r\n--')[0])
      if (loseResponse) throw new TypeError('lost response')
      return Response.json({ id: 'file-1' })
    }
    if (address.includes('alt=media')) return Response.json(document)
    return Response.json({ files: document ? [{ id: 'file-1' }] : [] })
  })
  return { drive: new DriveStorage(() => 'memory-only', request as typeof fetch), request, writes: () => writes, document: () => document, lose: () => { loseResponse = true } }
}
describe('Drive storage', () => {
  it('ausência não cria arquivo; grava e confirma somente por ação', async () => {
    const f = fixture()
    expect(await f.drive.load()).toBeNull(); expect(f.writes()).toBe(0)
    const saved = await f.drive.save(null, operation)
    expect(saved.document.diagnostics.probe).toEqual(operation.value)
    expect(f.writes()).toBe(1)
    expect(await f.drive.load()).toEqual(saved)
  })
  it('preserva módulos e reconhece resposta perdida sem repetir a gravação', async () => {
    const f = fixture({ ...emptyEnvelope(), modules: { future: { keep: true } }, custom: 4 })
    const base = await f.drive.load(); f.lose()
    await expect(f.drive.save(base, operation)).rejects.toMatchObject({ code: 'network' })
    const saved = await f.drive.save(base, operation)
    expect(saved.document.modules).toEqual({ future: { keep: true } }); expect(saved.document.custom).toBe(4)
    expect(f.writes()).toBe(1)
  })
  it('recupera primeira criação após resposta perdida', async () => {
    const f = fixture(); f.lose()
    await expect(f.drive.save(null, operation)).rejects.toMatchObject({ code: 'network' })
    expect((await f.drive.save(null, operation)).document.revision).toBe(operation.id)
    expect(f.writes()).toBe(1)
  })
  it('bloqueia conteúdo ou revisão alterados, inclusive remoção remota', async () => {
    const original = emptyEnvelope(); const f = fixture(original)
    await expect(f.drive.save({ fileId: 'file-1', document: { ...original, modules: { changed: true } } }, operation)).rejects.toMatchObject({ code: 'conflict' })
    await expect(f.drive.save({ fileId: 'file-1', document: { ...original, revision: 'old' } }, operation)).rejects.toMatchObject({ code: 'conflict' })
    const absent = fixture()
    await expect(absent.drive.save({ fileId: 'file-1', document: original }, operation)).rejects.toMatchObject({ code: 'conflict' })
    expect(f.writes()).toBe(0); expect(absent.writes()).toBe(0)
  })
  it.each([
    [Response.json({ files: [{ id: 'a' }, { id: 'b' }] }), 'ambiguous'],
    [Response.json({ files: [], incompleteSearch: true }), 'ambiguous'],
    [new Response('', { status: 403 }), 'remote'],
    [new Response('', { status: 401 }), 'expired'],
  ])('recusa ambiguidade e falhas sem criar substituto', async (response, code) => {
    const request = vi.fn().mockResolvedValue(response)
    const drive = new DriveStorage(() => 'token', request)
    await expect(drive.load()).rejects.toMatchObject({ code }); expect(request).toHaveBeenCalledTimes(1)
  })
  it('recusa JSON inválido e schema desconhecido', async () => {
    for (const response of [new Response('broken'), Response.json({ schemaVersion: 99 })]) {
      const request = vi.fn().mockResolvedValueOnce(Response.json({ files: [{ id: 'a' }] })).mockResolvedValueOnce(response)
      await expect(new DriveStorage(() => 'token', request).load()).rejects.toMatchObject({ code: 'invalid' })
      expect(request).toHaveBeenCalledTimes(2)
    }
  })
  it('exige conteúdo e identidade iguais para reconhecer operação', async () => {
    const document = applyOperation(emptyEnvelope(), operation)
    const f = fixture({ ...document, diagnostics: { probe: 'different' } })
    await expect(f.drive.save(null, operation)).rejects.toMatchObject({ code: 'conflict' })
    expect(f.writes()).toBe(0)
  })
})
