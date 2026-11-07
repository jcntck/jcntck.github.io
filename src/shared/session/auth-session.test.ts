import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthSession, SESSION_LIFETIME, type AuthCandidate, type AuthPort, type Identity } from './auth-session'
const identity = (): Identity => ({ uid: 'firebase-A', googleId: 'google-A', name: 'Conta A', authTime: Date.now(), issuedAt: Date.now() })
export function authFixture(initial: Identity | null = null) {
  let listener: (user: AuthCandidate | null) => void = () => {}
  let current = initial
  let fail: unknown
  const verify = vi.fn(async () => { if (fail) throw fail; return current! })
  const emit = () => listener(current ? { uid: current.uid, verify } : null)
  const clear = vi.fn()
  const port: AuthPort = {
    configured: true, initialize: vi.fn(async () => true),
    observe: fn => { listener = fn; emit(); return () => { listener = () => {} } },
    login: vi.fn(async () => { current = identity(); emit() }),
    logout: vi.fn(async () => { current = null; emit() }),
  }
  const auth = new AuthSession(port, clear)
  return { auth, port, clear, verify, set(value: Identity | null) { current = value; emit() }, failure(error?: unknown) { fail = error } }
}
const settle = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve() }
afterEach(() => vi.useRealTimers())
describe('login persistente e prazo', () => {
  it('restaura somente após verificação do serviço e não chama login', async () => {
    const f = authFixture(identity()); await f.auth.start(); await settle()
    expect(f.auth.getSnapshot()).toMatchObject({ phase: 'signed-in', persistent: true })
    expect(f.verify).toHaveBeenCalledTimes(1); expect(f.port.login).not.toHaveBeenCalled()
    f.auth.dispose()
  })
  it('refresh reusa authTime e não reinicia os trinta dias', async () => {
    vi.useFakeTimers(); const user = identity(); const f = authFixture(user)
    await f.auth.start(); await settle()
    await vi.advanceTimersByTimeAsync(SESSION_LIFETIME - 1)
    expect(f.auth.isValid()).toBe(true)
    await f.auth.refresh(); expect(f.auth.getSnapshot().identity?.authTime).toBe(user.authTime)
    await vi.advanceTimersByTimeAsync(1)
    expect(f.auth.getSnapshot().phase).toBe('anonymous'); expect(f.port.logout).toHaveBeenCalled()
    f.auth.dispose()
  })
  it('reabertura depois do prazo sai mesmo com token novo', async () => {
    const now = Date.now(); const f = authFixture({ ...identity(), authTime: now - SESSION_LIFETIME, issuedAt: now })
    await f.auth.start(); await settle()
    expect(f.auth.isValid()).toBe(false); expect(f.port.logout).toHaveBeenCalled()
    f.auth.dispose()
  })
  it('instante fornecido pelo serviço evita prolongar sessão com relógio local atrasado', async () => {
    const f = authFixture({ ...identity(), authTime: Date.now(), issuedAt: Date.now() + SESSION_LIFETIME })
    await f.auth.start(); await settle(); expect(f.port.logout).toHaveBeenCalled(); f.auth.dispose()
  })
  it('erro transitório preserva credencial para tentar verificar novamente', async () => {
    const f = authFixture(identity()); f.failure({ code: 'auth/network-request-failed' })
    await f.auth.start(); await settle()
    expect(f.auth.getSnapshot().phase).toBe('error'); expect(f.port.logout).not.toHaveBeenCalled()
    f.failure(); await f.auth.retry(); expect(f.auth.isValid()).toBe(true); f.auth.dispose()
  })
  it.each(['auth/user-disabled','auth/invalid-user-token','auth/user-token-expired','identity/invalid'])('rejeita sessão inválida %s', async code => {
    const f = authFixture(identity()); f.failure({ code }); await f.auth.start(); await settle()
    expect(f.auth.isValid()).toBe(false); expect(f.port.logout).toHaveBeenCalled(); f.auth.dispose()
  })
  it('limpa estado privado em saída/troca observadas em outra aba', async () => {
    const f = authFixture(identity()); await f.auth.start(); await settle(); f.clear.mockClear()
    f.set({ ...identity(), uid: 'firebase-B', googleId: 'google-B' }); await settle()
    expect(f.clear).toHaveBeenCalled(); expect(f.auth.getSnapshot().identity?.googleId).toBe('google-B')
    f.set(null); expect(f.auth.getSnapshot().phase).toBe('anonymous'); f.auth.dispose()
  })
  it('ignora verificação atrasada e aceita uma nova entrada legítima em outra aba', async () => {
    const f = authFixture(identity()); let resolve!: (value: Identity) => void
    f.verify.mockImplementationOnce(() => new Promise(done => { resolve = done }))
    await f.auth.start(); await f.auth.logout(); resolve(identity()); await settle()
    expect(f.auth.isValid()).toBe(false)
    f.set(identity()); await settle(); expect(f.auth.isValid()).toBe(true); f.auth.dispose()
  })
  it('inicializa uma vez no ciclo de montagem dupla e informa persistência temporária', async () => {
    const f = authFixture(identity()); vi.mocked(f.port.initialize).mockResolvedValue(false)
    const first = f.auth.start(); f.auth.dispose(); const second = f.auth.start()
    await Promise.all([first, second]); await settle()
    expect(f.port.initialize).toHaveBeenCalledTimes(1); expect(f.auth.getSnapshot()).toMatchObject({ phase: 'signed-in', persistent: false })
    f.auth.dispose()
  })
  it.each(['auth/popup-closed-by-user', 'auth/quota-exceeded'])('erro de entrada recuperável %s', async code => {
    const f = authFixture(); vi.mocked(f.port.login).mockRejectedValueOnce({ code }); await f.auth.start(); await f.auth.login()
    expect(f.auth.getSnapshot().phase).toBe('anonymous'); expect(f.auth.isValid()).toBe(false); f.auth.dispose()
  })
})

it('conserva sessão válida durante verificação de foco para não interromper consentimento Drive', async () => {
  const f = authFixture(identity()); await f.auth.start(); await Promise.resolve()
  let finish!: (value: Identity) => void
  f.verify.mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
  const refreshing = f.auth.refresh()
  expect(f.auth.isValid()).toBe(true)
  finish(identity()); await refreshing
  expect(f.auth.isValid()).toBe(true); f.auth.dispose()
})
