import { LibraryError, type LibraryStorage, type Operation, type Snapshot } from '../../shared/storage/library'
import { DriveStorage, type Account } from './drive'
import type { Grant } from './identity'
export type Phase = 'disconnected' | 'authorizing' | 'loading' | 'ready' | 'saving' | 'error' | 'expired'
export interface State {
  phase: Phase; account?: Account; snapshot?: Snapshot | null; pending?: Operation; queued?: Operation
  message: string; canWrite: boolean; automatic: boolean
  syncPhase: 'idle' | 'pending' | 'syncing' | 'synced' | 'error' | 'conflict'
  lastSynced?: string
}
export interface AccountStorage extends LibraryStorage { account(): Promise<Account>; subject?(): Promise<string> }
export class CloudSession {
  private token = ''
  private expires = 0
  private generation = 0
  private busy = false
  private known = false
  private base: Snapshot | null = null
  private account?: Account
  private pending?: Operation
  private pendingBased = false
  private queue: Operation[] = []
  private timer?: ReturnType<typeof setTimeout>
  private automaticTimer?: ReturnType<typeof setTimeout>
  private automatic = false
  private syncPhase: State['syncPhase'] = 'idle'
  private lastSynced?: string
  private state: State = { phase: 'disconnected', message: 'Drive desconectado.', canWrite: false, automatic: false, syncPhase: 'idle' }
  private listeners = new Set<() => void>()
  private storage: AccountStorage
  constructor(private factory: (token: () => string) => AccountStorage = token => new DriveStorage(token), private identity?: () => string | undefined) { this.storage = factory(() => this.accessToken()) }
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
  getSnapshot = () => this.state
  pendingSection(target: Operation['target'], key: string) {
    return [this.pending, ...this.queue].reverse().find(operation => operation?.target === target && operation.key === key)?.value
  }
  private update(phase: Phase, message: string) {
    this.state = { phase, message, account: this.account, snapshot: this.known ? this.base : undefined, pending: this.pending, queued: this.queue[0], canWrite: this.known && !!this.token && !this.busy, automatic: this.automatic, syncPhase: this.syncPhase, lastSynced: this.lastSynced }
    this.listeners.forEach(listener => listener())
  }
  private accessToken() {
    if (this.identity && !this.identity()) throw new LibraryError('disconnected', 'Entre novamente no hub para continuar.')
    if (!this.token || Date.now() >= this.expires) throw new LibraryError('expired', 'Autorização Drive expirada. Reconecte para sincronizar.')
    return this.token
  }
  disconnect() {
    this.generation++; clearTimeout(this.timer); clearTimeout(this.automaticTimer); this.token = ''; this.expires = 0; this.known = false; this.base = null; this.account = undefined; this.busy = false; this.automatic = false
    this.pending = undefined; this.pendingBased = false; this.queue = []; this.lastSynced = undefined
    this.syncPhase = this.pending ? 'pending' : 'idle'
    this.update('disconnected', 'Drive desconectado. O login do hub permanece independente.')
  }
  private failure(error: unknown) {
    this.known = false; clearTimeout(this.automaticTimer)
    this.syncPhase = error instanceof LibraryError && error.code === 'conflict' ? 'conflict' : 'error'
    if (error instanceof LibraryError && error.code === 'expired') {
      this.token = ''; clearTimeout(this.timer); this.update('expired', error.message)
    } else this.update('error', error instanceof Error ? error.message : 'Operação não concluída.')
  }
  async connect(authorize: () => Promise<Grant>) {
    if (this.busy || (this.identity && !this.identity())) return
    const expectedSubject = this.identity?.()
    this.busy = true; this.known = false; this.token = ''; clearTimeout(this.timer); clearTimeout(this.automaticTimer)
    const generation = ++this.generation
    this.update('authorizing', 'Aguardando autorização Google Drive…')
    try {
      const grant = await authorize()
      if (generation !== this.generation) return
      this.storage = this.factory(() => {
        if (generation !== this.generation || (this.identity && this.identity() !== expectedSubject)) throw new LibraryError('disconnected', 'Sessão encerrada ou conta alterada.')
        return this.accessToken()
      })
      this.token = grant.access_token; this.expires = Date.now() + Number(grant.expires_in) * 1000
      if (expectedSubject) {
        if (!this.storage.subject || await this.storage.subject() !== expectedSubject) throw new LibraryError('invalid', 'A conta do Drive é diferente do login. Conecte a mesma conta ou troque o login.')
        if (generation !== this.generation) return
      }
      const account = await this.storage.account()
      if (generation !== this.generation) return
      if (this.account && this.account.id !== account.id) { this.base = null; this.pending = undefined; this.queue = []; this.lastSynced = undefined; this.automatic = false }
      this.account = account
      this.update('loading', 'Conferindo documento da conta…')
      const remote = await this.storage.load()
      if (generation !== this.generation) return
      this.accessToken()
      // Keep the base for a failed operation. A newly prepared offline-in-this-tab change
      // has no known base yet and must first adopt this successful remote read.
      if (!this.pending || !this.pendingBased) { this.base = remote; this.pendingBased = !!this.pending }
      this.known = true
      this.timer = setTimeout(() => { this.token = ''; this.known = false; clearTimeout(this.automaticTimer); this.update('expired', 'Autorização Drive expirada. Reconecte para sincronizar.') }, Math.max(0, this.expires - Date.now()))
      this.busy = false; this.syncPhase = this.pending ? 'pending' : 'idle'
      this.update('ready', this.pending ? 'Conta conferida. A alteração está pendente de sincronização.' : 'Conta conectada e documento conferido.')
      // Reconnection does not automatically resend a failed operation.
    } catch (error) { if (generation === this.generation) { this.token = ''; this.busy = false; this.failure(error) } }
  }
  async reload() {
    if (this.busy || !this.token) return
    const discarded = new Set([this.pending?.id, ...this.queue.map(operation => operation.id)])
    this.busy = true; clearTimeout(this.automaticTimer); const generation = this.generation; this.update('loading', 'Relendo do Drive…')
    try {
      const remote = await this.storage.load()
      if (generation !== this.generation) return
      this.accessToken(); this.base = remote; this.known = true
      const remaining = [this.pending, ...this.queue].filter((operation): operation is Operation => !!operation && !discarded.has(operation.id))
      this.pending = remaining.shift(); this.queue = remaining; this.pendingBased = !!this.pending; this.busy = false; this.syncPhase = this.pending ? 'pending' : 'idle'
      this.update('ready', 'Nova leitura remota concluída.')
    } catch (error) { if (generation === this.generation) { this.busy = false; this.failure(error) } }
  }
  stageSection(target: Operation['target'], key: string, value: Operation['value']) {
    if (this.identity && !this.identity()) return
    const operation: Operation = { id: crypto.randomUUID(), target, key, value: structuredClone(value) }
    // A failed/uncertain operation must retain its ID until resolved. Preserve edits
    // made while it is in flight separately and send them only after confirmation.
    if (!this.pending) { this.pending = operation; this.pendingBased = this.known }
    else if (!this.busy && this.syncPhase === 'pending' && this.pending.target === target && this.pending.key === key) this.pending = operation
    else { this.queue = this.queue.filter(item => item.target !== target || item.key !== key); this.queue.push(operation) }
    if (!this.busy && !['error', 'conflict'].includes(this.syncPhase)) this.syncPhase = 'pending'
    this.update(this.state.phase, 'Alteração preparada nesta aba; ainda não foi salva no Drive.')
    this.scheduleAutomatic()
  }
  stageProbe() { this.stageSection('diagnostics', 'probe', { id: crypto.randomUUID(), at: new Date().toISOString() }) }
  setAutomatic(enabled: boolean) {
    this.automatic = enabled; clearTimeout(this.automaticTimer)
    this.update(this.state.phase, enabled ? 'Sincronização automática habilitada nesta sessão.' : 'Sincronização manual selecionada.')
    this.scheduleAutomatic()
  }
  private scheduleAutomatic() {
    clearTimeout(this.automaticTimer)
    if (!this.automatic || this.busy || !this.known || !this.pending || this.syncPhase !== 'pending' || !this.token || (typeof document !== 'undefined' && document.visibilityState === 'hidden')) return
    this.automaticTimer = setTimeout(() => { void this.sync() }, 750)
  }
  resumeAutomatic() { this.scheduleAutomatic() }
  async sync() {
    if (this.busy || !this.known || !this.token || (this.identity && !this.identity())) return
    if (!this.pending) { await this.reload(); return }
    this.busy = true; clearTimeout(this.automaticTimer); const generation = this.generation; const operation = this.pending
    this.syncPhase = 'syncing'; this.update('saving', 'Sincronizando e confirmando no Drive…')
    try {
      const saved = await this.storage.save(this.base, operation)
      if (generation !== this.generation) return
      this.accessToken(); this.base = saved; this.known = true; this.pending = this.queue.shift(); this.pendingBased = !!this.pending; this.busy = false; this.lastSynced = new Date().toISOString(); this.syncPhase = this.pending ? 'pending' : 'synced'
      this.update('ready', this.pending ? 'Envio confirmado. Há uma nova alteração pendente.' : 'Gravação confirmada por releitura do Drive.')
      this.scheduleAutomatic()
    } catch (error) { if (generation === this.generation) { this.busy = false; this.failure(error) } }
  }
  async saveSection(target: Operation['target'], key: string, value: Operation['value']) { if (!this.pending) this.stageSection(target, key, value); await this.sync() }
  saveProbe() { return this.saveSection('diagnostics', 'probe', { id: crypto.randomUUID(), at: new Date().toISOString() }) }
}
