import { canonical, updatedTime, LibraryError, type LibraryStorage, type Operation, type Snapshot } from '../../shared/storage/library'
import { DriveStorage, type Account } from './drive'
import type { Grant } from './identity'
import { BrowserLibraryCache, type CachePort } from '../../shared/storage/cache'
export type Phase = 'disconnected' | 'authorizing' | 'loading' | 'ready' | 'saving' | 'error' | 'expired'
export interface State {
  phase: Phase; account?: Account; snapshot?: Snapshot | null; pending?: Operation; queued?: Operation
  message: string; canWrite: boolean; canEdit: boolean; automatic: boolean; cacheError?: string; cached: boolean
  syncPhase: 'idle' | 'pending' | 'syncing' | 'synced' | 'error' | 'conflict'
  lastSynced?: string
}
export interface AccountStorage extends LibraryStorage { account(): Promise<Account>; subject?(): Promise<string> }
interface StagedOperation extends Operation { manual?: boolean }
export class CloudSession {
  private token = ''
  private expires = 0
  private generation = 0
  private busy = false
  private known = false
  private loaded = false
  private cacheOwner?: string
  private cacheError?: string
  private base: Snapshot | null = null
  private account?: Account
  private pending?: StagedOperation
  private queue: StagedOperation[] = []
  private timer?: ReturnType<typeof setTimeout>
  private automaticTimer?: ReturnType<typeof setTimeout>
  private automatic = false
  private syncPhase: State['syncPhase'] = 'idle'
  private lastSynced?: string
  private state: State = { phase: 'disconnected', message: 'Drive desconectado.', canWrite: false, canEdit: false, cached: false, automatic: false, syncPhase: 'idle' }
  private listeners = new Set<() => void>()
  private storage: AccountStorage
  constructor(private factory: (token: () => string) => AccountStorage = token => new DriveStorage(token), private identity?: () => string | undefined, private cache: CachePort = new BrowserLibraryCache()) { this.storage = factory(() => this.accessToken()) }
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
  getSnapshot = () => this.state
  pendingSection(target: Operation['target'], key: string) {
    return [this.pending, ...this.queue].reverse().find(operation => operation?.target === target && operation.key === key)?.value
  }
  private update(phase: Phase, message: string) {
    this.state = { phase, message, account: this.account, snapshot: this.loaded ? this.base : undefined, pending: this.pending, queued: this.queue[0], canWrite: this.known && !!this.token && !this.busy, canEdit: this.loaded && !this.busy, cacheError: this.cacheError, cached: !!this.cacheOwner && this.loaded && !this.cacheError, automatic: this.automatic, syncPhase: this.syncPhase, lastSynced: this.lastSynced }
    this.listeners.forEach(listener => listener())
  }
  private accessToken() {
    if (this.identity && !this.identity()) throw new LibraryError('disconnected', 'Entre novamente no hub para continuar.')
    if (!this.token || Date.now() >= this.expires) throw new LibraryError('expired', 'Autorização Drive expirada. Reconecte para sincronizar.')
    return this.token
  }
  restoreCache() {
    const owner = this.identity?.()
    if (!owner || owner === this.cacheOwner) return
    this.clearLocalSession()
    this.cacheOwner = owner
    try {
      const cached = this.cache.read(owner)
      if (cached) {
        this.base = cached.snapshot; this.loaded = true
        this.pending = cached.operations[0]; this.queue = cached.operations.slice(1)
        this.lastSynced = cached.lastSynced
        this.syncPhase = this.pending ? 'pending' : 'idle'
      }
    } catch { this.cacheError = 'Não foi possível ler o cache local. Conecte o Drive para carregar a biblioteca.' }
    this.update('disconnected', this.loaded ? 'Biblioteca restaurada do cache local. Drive desconectado; conecte quando quiser sincronizar.' : 'Drive desconectado.')
  }
  private persist() {
    if (!this.cacheOwner || !this.loaded) return
    try {
      this.cache.write(this.cacheOwner, { version: 1, snapshot: this.base, operations: [this.pending, ...this.queue].filter((op): op is StagedOperation => !!op), ...(this.lastSynced ? { lastSynced: this.lastSynced } : {}) })
      this.cacheError = undefined
    } catch { this.cacheError = 'Não foi possível salvar no navegador. As alterações estão somente nesta aba; sincronize antes de recarregar.' }
  }
  clearLocalSession() {
    this.cacheOwner = undefined; this.cacheError = undefined
    this.disconnect(false)
  }
  disconnect(keepLocal = true) {
    this.generation++; clearTimeout(this.timer); clearTimeout(this.automaticTimer); this.token = ''; this.expires = 0; this.known = false; this.account = undefined; this.busy = false; this.automatic = false
    if (!keepLocal) { this.base = null; this.loaded = false; this.pending = undefined; this.queue = []; this.lastSynced = undefined }
    this.syncPhase = this.pending ? 'pending' : 'idle'
    this.update('disconnected', 'Drive desconectado. O login do hub permanece independente.')
  }
  private adoptRemote(remote: Snapshot | null) {
    // Recover a confirmed write after a lost response without sending it again.
    if (this.pending && remote?.document.revision === this.pending.id && canonical(remote.document[this.pending.target][this.pending.key]) === canonical(this.pending.value)) this.pending = this.queue.shift()
    const operations = [this.pending, ...this.queue].filter((op): op is StagedOperation => !!op)
    const baseTime = updatedTime(this.base)
    const remoteTime = updatedTime(remote)
    const newest = Math.max(baseTime, ...operations.map(op => Date.parse(op.updatedAt ?? '') || 0))
    if (remoteTime && newest <= remoteTime) { this.pending = undefined; this.queue = [] }
    else if (this.base && baseTime > remoteTime) {
      // A previously confirmed cache can also be newer than an older remote copy.
      // Prepare differences without uploading; keep the original content timestamp.
      const restored: StagedOperation[] = []
      const value = this.base.document.modules.mangas
      if (value !== undefined && !operations.some(op => op.target === 'modules' && op.key === 'mangas') && canonical(value) !== canonical(remote?.document.modules.mangas ?? null)) {
        restored.push({ id: crypto.randomUUID(), target: 'modules', key: 'mangas', value, updatedAt: new Date(baseTime).toISOString(), manual: true })
      }
      const remaining = [...restored, ...operations]
      this.pending = remaining.shift(); this.queue = remaining
    }
    this.base = remote; this.loaded = true; this.known = true
    this.persist()
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
    this.restoreCache()
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
      if (this.account && this.account.id !== account.id) { this.base = null; this.loaded = false; this.pending = undefined; this.queue = []; this.lastSynced = undefined; this.automatic = false }
      this.account = account
      this.update('loading', 'Conferindo documento da conta…')
      const remote = await this.storage.load()
      if (generation !== this.generation) return
      this.accessToken()
      this.adoptRemote(remote)
      this.timer = setTimeout(() => { this.token = ''; this.known = false; clearTimeout(this.automaticTimer); this.update('expired', 'Autorização Drive expirada. Reconecte para sincronizar.') }, Math.max(0, this.expires - Date.now()))
      this.busy = false; this.syncPhase = this.pending ? 'pending' : 'idle'
      this.update('ready', this.pending ? 'Conta conferida. A alteração está pendente de sincronização.' : 'Conta conectada e documento conferido.')
      // Reconnection does not automatically resend a failed operation.
    } catch (error) { if (generation === this.generation) { this.token = ''; this.busy = false; this.failure(error) } }
  }
  async reload() {
    if (this.busy || !this.token) return
    this.busy = true; clearTimeout(this.automaticTimer); const generation = this.generation; this.update('loading', 'Relendo do Drive…')
    try {
      const remote = await this.storage.load()
      if (generation !== this.generation) return
      this.accessToken(); this.adoptRemote(remote)
      this.busy = false; this.syncPhase = this.pending ? 'pending' : 'idle'
      this.update('ready', 'Nova leitura remota concluída.')
    } catch (error) { if (generation === this.generation) { this.busy = false; this.failure(error) } }
  }
  stageSection(target: Operation['target'], key: string, value: Operation['value'], { manual = false }: { manual?: boolean } = {}) {
    if (this.identity && !this.identity()) return
    const previous = Math.max(updatedTime(this.base), ...[this.pending, ...this.queue].map(op => Date.parse(op?.updatedAt ?? '') || 0))
    const operation: StagedOperation = { id: crypto.randomUUID(), updatedAt: new Date(Math.max(Date.now(), previous + 1)).toISOString(), target, key, value: structuredClone(value), ...(manual ? { manual } : {}) }
    // A failed/uncertain operation must retain its ID until resolved. Preserve edits
    // made while it is in flight separately and send them only after confirmation.
    if (!this.pending) { this.pending = operation }
    else if (!this.busy && this.syncPhase === 'pending' && this.pending.target === target && this.pending.key === key) this.pending = operation
    else { this.queue = this.queue.filter(item => item.target !== target || item.key !== key); this.queue.push(operation) }
    if (!this.busy && !['error', 'conflict'].includes(this.syncPhase)) this.syncPhase = 'pending'
    this.persist()
    this.update(this.state.phase, this.cacheOwner && !this.cacheError ? 'Alteração salva no navegador; ainda não foi salva no Drive.' : 'Alteração preparada nesta aba; ainda não foi salva no Drive.')
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
    if (!this.automatic || this.busy || !this.known || !this.pending || this.pending.manual || this.syncPhase !== 'pending' || !this.token || (typeof document !== 'undefined' && document.visibilityState === 'hidden')) return
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
      this.accessToken(); this.pending = this.queue.shift(); this.adoptRemote(saved); this.busy = false; this.lastSynced = new Date().toISOString(); this.syncPhase = this.pending ? 'pending' : 'synced'; this.persist()
      this.update('ready', this.pending ? 'Envio confirmado. Há uma nova alteração pendente.' : saved.document.revision === operation.id ? 'Gravação confirmada por releitura do Drive.' : 'A versão mais recente do Drive foi mantida e salva no cache local.')
      this.scheduleAutomatic()
    } catch (error) { if (generation === this.generation) { this.busy = false; this.failure(error) } }
  }
  async saveSection(target: Operation['target'], key: string, value: Operation['value']) { if (!this.pending) this.stageSection(target, key, value); await this.sync() }
  saveProbe() { return this.saveSection('diagnostics', 'probe', { id: crypto.randomUUID(), at: new Date().toISOString() }) }
}
