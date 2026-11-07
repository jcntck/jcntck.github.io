import { LibraryError, type LibraryStorage, type Operation, type Snapshot } from '../../shared/storage/library'
import { DriveStorage, type Account } from './drive'
import type { Grant } from './identity'
export type Phase = 'disconnected' | 'authorizing' | 'loading' | 'ready' | 'saving' | 'error' | 'expired'
export interface State { phase: Phase; account?: Account; snapshot?: Snapshot | null; pending?: Operation; message: string; canWrite: boolean }
export interface AccountStorage extends LibraryStorage { account(): Promise<Account> }
export class CloudSession {
  private token = ''
  private expires = 0
  private generation = 0
  private busy = false
  private known = false
  private base: Snapshot | null = null
  private account?: Account
  private pending?: Operation
  private timer?: ReturnType<typeof setTimeout>
  private state: State = { phase: 'disconnected', message: 'Drive desconectado.', canWrite: false }
  private listeners = new Set<() => void>()
  private storage: AccountStorage
  constructor(private factory: (token: () => string) => AccountStorage = token => new DriveStorage(token)) { this.storage = factory(() => this.accessToken()) }
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
  getSnapshot = () => this.state
  private update(phase: Phase, message: string) {
    this.state = { phase, message, account: this.account, snapshot: this.known ? this.base : undefined, pending: this.pending, canWrite: this.known && !!this.token && !this.busy }
    this.listeners.forEach(listener => listener())
  }
  private accessToken() {
    if (!this.token || Date.now() >= this.expires) throw new LibraryError('expired', 'Sessão expirada. Reconecte para continuar.')
    return this.token
  }
  disconnect() {
    this.generation++; clearTimeout(this.timer); this.token = ''; this.expires = 0; this.known = false; this.base = null; this.pending = undefined; this.account = undefined; this.busy = false
    this.update('disconnected', 'Sessão local encerrada. O consentimento no Google permanece até você revogá-lo.')
  }
  private failure(error: unknown) {
    this.known = false
    if (error instanceof LibraryError && error.code === 'expired') {
      this.token = ''; clearTimeout(this.timer); this.update('expired', error.message)
    } else this.update('error', error instanceof Error ? error.message : 'Operação não concluída.')
  }
  async connect(authorize: () => Promise<Grant>) {
    if (this.busy) return
    this.busy = true; this.known = false; this.token = ''; clearTimeout(this.timer)
    const generation = ++this.generation
    this.update('authorizing', 'Aguardando autorização Google…')
    try {
      const grant = await authorize()
      if (generation !== this.generation) return
      this.storage = this.factory(() => {
        if (generation !== this.generation) throw new LibraryError('disconnected', 'Sessão encerrada.')
        return this.accessToken()
      })
      this.token = grant.access_token; this.expires = Date.now() + Number(grant.expires_in) * 1000
      const account = await this.storage.account()
      if (generation !== this.generation) return
      if (this.account?.id !== account.id) { this.base = null; this.pending = undefined }
      this.account = account
      this.update('loading', 'Conferindo documento da conta…')
      const remote = await this.storage.load()
      if (generation !== this.generation) return
      // Retain the original base when retrying an operation from this account.
      if (!this.pending) this.base = remote
      this.known = true
      this.timer = setTimeout(() => { this.token = ''; this.known = false; this.update('expired', 'Sessão expirada. Reconecte por um clique.') }, Math.max(0, this.expires - Date.now()))
      this.busy = false; this.update('ready', this.pending ? 'Conta confirmada. A tentativa pendente será conferida antes de repetir.' : 'Conta conectada e documento conferido.')
    } catch (error) { if (generation === this.generation) { this.token = ''; this.busy = false; this.failure(error) } }
  }
  async reload() {
    if (this.busy || !this.token) return
    this.busy = true; const generation = this.generation; this.update('loading', 'Relendo do Drive…')
    try {
      const remote = await this.storage.load()
      if (generation !== this.generation) return
      this.base = remote; this.known = true; this.pending = undefined; this.busy = false
      this.update('ready', 'Nova leitura remota concluída.')
    } catch (error) { if (generation === this.generation) { this.busy = false; this.failure(error) } }
  }
  async saveSection(target: Operation['target'], key: string, value: Operation['value']) {
    if (this.busy || !this.known || !this.token) return
    this.pending ??= { id: crypto.randomUUID(), target, key, value }
    this.busy = true; const generation = this.generation; this.update('saving', 'Gravando e confirmando no Drive…')
    try {
      const saved = await this.storage.save(this.base, this.pending)
      if (generation !== this.generation) return
      this.base = saved; this.known = true; this.pending = undefined; this.busy = false; this.update('ready', 'Gravação confirmada por releitura do Drive.')
    } catch (error) { if (generation === this.generation) { this.busy = false; this.failure(error) } }
  }
  saveProbe() { return this.saveSection('diagnostics', 'probe', { id: crypto.randomUUID(), at: new Date().toISOString() }) }
}
