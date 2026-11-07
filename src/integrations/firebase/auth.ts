import { initializeApp } from 'firebase/app'
import { initializeAuth, browserPopupRedirectResolver, getIdTokenResult, GoogleAuthProvider, indexedDBLocalPersistence, browserLocalPersistence, inMemoryPersistence, onAuthStateChanged, setPersistence, signInWithPopup, signOut } from 'firebase/auth'
import type { User } from 'firebase/auth'
import type { AuthPort } from '../../shared/session/auth-session'
import defaults from './config.json'

export function firebaseConfig() {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || defaults.apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || defaults.authDomain,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || defaults.projectId,
    appId: import.meta.env.VITE_FIREBASE_APP_ID || defaults.appId,
  }
}
async function indexedDBAvailable(): Promise<boolean> {
  try {
    return await new Promise<boolean>(resolve => {
      const request = indexedDB.open('my-hub-auth-storage-check')
      request.onerror = () => resolve(false)
      request.onblocked = () => resolve(false)
      request.onsuccess = () => { request.result.close(); indexedDB.deleteDatabase('my-hub-auth-storage-check'); resolve(true) }
    })
  } catch { return false }
}
function localStorageAvailable() {
  try { const key = 'my-hub-auth-storage-check'; localStorage.setItem(key, '1'); localStorage.removeItem(key); return true } catch { return false }
}
export function createFirebaseAuth(): AuthPort {
  const config = firebaseConfig()
  let auth: ReturnType<typeof initializeAuth> | undefined
  let popup: { cancelled: boolean; user?: User; done: Promise<unknown> } | undefined
  const configured = Object.values(config).every(Boolean)
  const requireAuth = () => { if (!auth) throw Object.assign(new Error(), { code: 'auth/configuration-not-found' }); return auth }
  return {
    configured,
    async initialize() {
      const durable = []
      if (await indexedDBAvailable()) durable.push(indexedDBLocalPersistence)
      if (localStorageAvailable()) durable.push(browserLocalPersistence)
      // Select persistence before initialization: starting in memory and migrating
      // later would overwrite an existing stored login with an anonymous session.
      auth ??= initializeAuth(initializeApp(config), { persistence: [...durable, inMemoryPersistence] })
      auth.useDeviceLanguage()
      await auth.authStateReady()
      for (const persistence of durable) {
        try { await setPersistence(auth, persistence); return true } catch { /* Try the next supported mode. */ }
      }
      await setPersistence(auth, inMemoryPersistence)
      return false
    },
    observe(listener) {
      return onAuthStateChanged(requireAuth(), user => {
        const request = popup
        listener(user ? { uid: user.uid, verify: async () => {
          if (request) {
            await request.done
            if (request.cancelled && request.user === user) throw Object.assign(new Error(), { code: 'auth/cancelled-popup-request' })
          }
          // Force the SDK to contact its trusted service on restoration, rather
          // than accepting a cached profile or a decoded token as authentication.
          const token = await getIdTokenResult(user, true)
          const google = user.providerData.find(provider => provider.providerId === 'google.com')
          if (!google?.uid || token.signInProvider !== 'google.com') throw Object.assign(new Error(), { code: 'identity/invalid' })
          return { uid: user.uid, googleId: google.uid, name: user.displayName || 'Conta Google', authTime: Date.parse(token.authTime), issuedAt: Date.parse(token.issuedAtTime) }
        } } : null)
      })
    },
    async login() {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      const auth = requireAuth()
      const request: NonNullable<typeof popup> = { cancelled: false, done: Promise.resolve() }
      popup = request
      request.done = signInWithPopup(auth, provider, browserPopupRedirectResolver).then(async result => {
        request.user = result.user
        if (request.cancelled && auth.currentUser === result.user) await signOut(auth)
      })
      try { await request.done } finally { if (popup === request) popup = undefined }
    },
    async logout() { if (popup) popup.cancelled = true; await signOut(requireAuth()) },
  }
}
