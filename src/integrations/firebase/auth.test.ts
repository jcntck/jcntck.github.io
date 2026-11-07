import { beforeEach, expect, it, vi } from 'vitest'
const sdk = vi.hoisted(() => ({
  initializeApp: vi.fn(() => ({})),
  initializeAuth: vi.fn(() => ({ useDeviceLanguage: vi.fn(), authStateReady: async () => {} })),
  setPersistence: vi.fn(async () => {}),
  onAuthStateChanged: vi.fn(), getIdTokenResult: vi.fn(),
  signInWithPopup: vi.fn(async () => ({ user: {} })), signOut: vi.fn(async () => {}),
  GoogleAuthProvider: class { setCustomParameters = vi.fn() },
}))
vi.mock('firebase/app', () => ({ initializeApp: sdk.initializeApp }))
vi.mock('firebase/auth', () => ({ ...sdk, indexedDBLocalPersistence: 'indexed', browserLocalPersistence: 'local', inMemoryPersistence: 'memory', browserPopupRedirectResolver: 'popup-resolver' }))
import { createFirebaseAuth } from './auth'
import type { AuthCandidate } from '../../shared/session/auth-session'
beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })
it('inicia sem iframe OAuth e usa persistência local suportada', async () => {
  const port = createFirebaseAuth()
  expect(await port.initialize()).toBe(true)
  expect(sdk.initializeAuth).toHaveBeenCalledWith({}, { persistence: ['local', 'memory'] })
  expect(sdk.setPersistence).toHaveBeenCalledWith(expect.anything(), 'local')
  expect(sdk.signInWithPopup).not.toHaveBeenCalled()
  await port.login()
  expect(sdk.signInWithPopup).toHaveBeenCalledWith(expect.anything(), expect.anything(), 'popup-resolver')
})
it('usa modo temporário se armazenamento for bloqueado', async () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('blocked') })
  const port = createFirebaseAuth()
  expect(await port.initialize()).toBe(false)
  expect(sdk.setPersistence).toHaveBeenLastCalledWith(expect.anything(), 'memory')
})
it('verifica com o serviço e usa identidade google.com, distinta do UID Firebase', async () => {
  const user = { uid: 'firebase-uid', displayName: 'Conta', providerData: [{ providerId: 'google.com', uid: 'google-sub' }] }
  sdk.onAuthStateChanged.mockImplementation((_, listener) => { listener(user); return vi.fn() })
  sdk.getIdTokenResult.mockResolvedValue({ signInProvider: 'google.com', authTime: '2026-11-07T12:00:00Z', issuedAtTime: '2026-11-07T13:00:00Z' })
  const port = createFirebaseAuth(); await port.initialize()
  let candidate: AuthCandidate | null = null
  port.observe(value => { candidate = value })
  const verified = await (candidate as unknown as AuthCandidate).verify()
  expect(sdk.getIdTokenResult).toHaveBeenCalledWith(user, true)
  expect(verified).toMatchObject({ uid: 'firebase-uid', googleId: 'google-sub', authTime: Date.parse('2026-11-07T12:00:00Z') })
})
