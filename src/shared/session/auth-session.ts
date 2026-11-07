export const SESSION_LIFETIME = 30 * 24 * 60 * 60 * 1000
export interface Identity { uid: string; googleId: string; name: string; authTime: number; issuedAt: number }
export interface AuthCandidate { uid: string; verify(): Promise<Identity> }
export interface AuthPort {
  configured: boolean
  initialize(): Promise<boolean>
  observe(listener: (user: AuthCandidate | null) => void): () => void
  login(): Promise<void>
  logout(): Promise<void>
}
export interface AuthState {
  phase: 'restoring' | 'anonymous' | 'signing-in' | 'signed-in' | 'error'
  identity?: Identity
  persistent: boolean
  configured: boolean
  message: string
}
const codeOf = (error: unknown) => error && typeof error === 'object' && 'code' in error ? String(error.code) : ''
export function authErrorMessage(error: unknown) {
  switch (codeOf(error)) {
    case 'auth/quota-exceeded': case 'auth/too-many-requests': return 'O limite temporário da autenticação foi atingido. Tente mais tarde; o plano não será alterado.'
    case 'auth/popup-closed-by-user': case 'auth/cancelled-popup-request': return 'Entrada cancelada. Você pode tentar novamente.'
    case 'auth/popup-blocked': return 'O navegador bloqueou a entrada. Permita o popup e tente novamente.'
    case 'auth/unauthorized-domain': return 'Este endereço precisa ser autorizado na configuração do Firebase.'
    case 'auth/invalid-api-key': case 'auth/configuration-not-found': case 'auth/operation-not-allowed': return 'O login precisa ser configurado no Firebase. Consulte o guia do projeto.'
    default: return 'Não foi possível verificar o login. Confira a conexão e tente novamente.'
  }
}
const revoked = (error: unknown) => ['auth/user-disabled', 'auth/user-token-expired', 'auth/invalid-user-token', 'auth/user-not-found', 'identity/invalid'].includes(codeOf(error))
export class AuthSession {
  private state: AuthState
  private listeners = new Set<() => void>()
  private candidate: AuthCandidate | null = null
  private generation = 0
  private timer?: ReturnType<typeof setTimeout>
  private stop?: () => void
  private started = false
  private lifecycle = 0
  private setup?: Promise<boolean>
  private signingOut = false
  private refreshing?: Promise<void>
  private googleId?: string
  constructor(private port: AuthPort, private clearPrivate: () => void) {
    this.state = { phase: port.configured ? 'restoring' : 'anonymous', persistent: false, configured: port.configured, message: port.configured ? 'Verificando sessão…' : 'O login Google aguarda configuração.' }
  }
  getSnapshot = () => this.state
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
  private update(value: Partial<AuthState>) { this.state = { ...this.state, ...value }; this.listeners.forEach(listener => listener()) }
  async start() {
    if (this.started || !this.port.configured) return
    this.started = true
    const lifecycle = ++this.lifecycle
    try {
      this.setup ??= this.port.initialize()
      const persistent = await this.setup
      if (!this.started || lifecycle !== this.lifecycle) return
      this.update({ persistent })
      this.stop = this.port.observe(user => { void this.restore(user) })
    } catch (error) { if (this.started && lifecycle === this.lifecycle) { this.started = false; this.setup = undefined; this.update({ phase: 'error', message: authErrorMessage(error) }) } }
  }
  dispose() { this.started = false; this.lifecycle++; this.generation++; this.stop?.(); this.stop = undefined; clearTimeout(this.timer) }
  private schedule() {
    clearTimeout(this.timer)
    const expires = this.state.identity ? this.state.identity.authTime + SESSION_LIFETIME : 0
    // Browser timers are signed 32-bit milliseconds, less than thirty days.
    if (expires) this.timer = setTimeout(() => { if (!this.isValid()) void this.logout('Seu login completou 30 dias. Entre novamente.'); else this.schedule() }, Math.min(Math.max(1, expires - Date.now()), 2_147_000_000))
  }
  isValid = () => this.state.phase === 'signed-in' && !!this.state.identity && Math.max(Date.now(), this.state.identity.issuedAt) < this.state.identity.authTime + SESSION_LIFETIME
  private async restore(user: AuthCandidate | null, background = false) {
    if (this.signingOut) return
    const generation = ++this.generation
    if (!background) clearTimeout(this.timer)
    if (!user || this.candidate?.uid !== user.uid) this.clearPrivate()
    this.candidate = user
    if (!user) { this.googleId = undefined; this.update({ phase: 'anonymous', identity: undefined, message: 'Entre para acessar seu espaço pessoal.' }); return }
    if (!background || !this.isValid()) this.update({ phase: 'restoring', identity: undefined, message: 'Verificando sessão…' })
    try {
      const identity = await user.verify()
      if (generation !== this.generation || this.signingOut) return
      const now = Math.max(Date.now(), identity.issuedAt)
      if (identity.uid !== user.uid || !identity.googleId || !Number.isFinite(identity.authTime) || !Number.isFinite(identity.issuedAt) || identity.authTime > now + 60_000) throw Object.assign(new Error(), { code: 'identity/invalid' })
      if (now >= identity.authTime + SESSION_LIFETIME) { await this.logout('Seu login completou 30 dias. Entre novamente.'); return }
      if (this.googleId && this.googleId !== identity.googleId) this.clearPrivate()
      this.googleId = identity.googleId
      this.update({ phase: 'signed-in', identity, message: 'Login verificado.' }); this.schedule()
    } catch (error) {
      if (generation !== this.generation) return
      if (revoked(error)) { await this.logout('Sua sessão não é mais válida. Entre novamente.'); return }
      this.update({ phase: 'error', identity: undefined, message: authErrorMessage(error) })
    }
  }
  async retry() { if (!this.started) await this.start(); else await this.restore(this.candidate) }
  async refresh() {
    if (!this.candidate || this.signingOut) return
    if (this.state.phase === 'signed-in' && !this.isValid()) { await this.logout('Seu login completou 30 dias. Entre novamente.'); return }
    this.refreshing ??= this.restore(this.candidate, true).finally(() => { this.refreshing = undefined })
    await this.refreshing
  }
  async login() {
    if (!this.port.configured || ['restoring', 'signing-in'].includes(this.state.phase)) return
    this.update({ phase: 'signing-in', message: 'Aguardando entrada com Google…' })
    const generation = this.generation
    try { await this.port.login() }
    catch (error) { if (generation === this.generation) this.update({ phase: 'anonymous', identity: undefined, message: authErrorMessage(error) }) }
  }
  async logout(message = 'Você saiu do hub. O consentimento Google não foi revogado.') {
    this.generation++; this.signingOut = true; clearTimeout(this.timer); this.candidate = null; this.googleId = undefined; this.clearPrivate()
    this.update({ phase: 'restoring', identity: undefined, message: 'Encerrando sessão…' })
    try { await this.port.logout(); this.update({ phase: 'anonymous', message }) }
    catch { this.update({ phase: 'error', message: 'Não foi possível concluir a saída no navegador. Tente sair novamente.' }) }
    finally { this.signingOut = false }
  }
}
