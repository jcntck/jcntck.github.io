// Test-only entry served by Vite dev. Never imported by the production entry.
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { App } from '../../../src/app/App'
import { Hub } from '../../../src/shared/session/hub'
import type { AuthCandidate, AuthPort, Identity } from '../../../src/shared/session/auth-session'
import '../../../src/app/styles.css'
const key = 'test-fixture-login'
let listener: (candidate: AuthCandidate | null) => void = () => {}
const emit = () => {
  const raw = localStorage.getItem(key)
  const identity: Identity | null = raw ? JSON.parse(raw) : null
  listener(identity ? { uid: identity.uid, verify: async () => identity } : null)
}
const port: AuthPort = {
  configured: true, initialize: async () => true,
  observe(fn) { listener = fn; window.addEventListener('storage', emit); emit(); return () => window.removeEventListener('storage', emit) },
  async login() {
    const now = Date.now()
    localStorage.setItem(key, JSON.stringify({ uid: 'test-firebase-A', googleId: 'test-google-A', name: 'Conta simulada', authTime: now, issuedAt: now }))
    emit()
  },
  async logout() { localStorage.removeItem(key); emit() },
}
createRoot(document.getElementById('root')!).render(<HashRouter><App hub={new Hub(port)} /></HashRouter>)
