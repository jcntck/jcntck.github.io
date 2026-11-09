import { applyOperation, canonical, emptyEnvelope, LibraryError, validate, type LibraryStorage, type Operation, type Snapshot, updatedTime } from '../../shared/storage/library'

const API = 'https://www.googleapis.com/drive/v3'
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file'
export interface Account { id: string; name: string }
export class DriveStorage implements LibraryStorage {
  constructor(private token: () => string, private request: typeof fetch = (input, init) => fetch(input, init)) {}
  private async call(url: string, init: RequestInit = {}): Promise<Response> {
    let response: Response
    try { response = await this.request(url, { ...init, headers: { ...init.headers, Authorization: `Bearer ${this.token()}` }, cache: 'no-store' }) }
    catch (error) { if (error instanceof LibraryError) throw error; throw new LibraryError('network', 'Falha de rede. A tentativa permanece nesta aba.') }
    if (response.status === 401) throw new LibraryError('expired', 'Autorização expirada ou revogada. Reconecte para continuar.')
    if (!response.ok) throw new LibraryError('remote', `O Drive recusou a operação (${response.status}). Releia ou reconecte; nenhum substituto foi criado.`)
    return response
  }
  async subject(): Promise<string> {
    const data = await (await this.call('https://openidconnect.googleapis.com/v1/userinfo')).json()
    if (typeof data.sub !== 'string' || !data.sub) throw new LibraryError('invalid', 'Não foi possível conferir a identidade Google do Drive.')
    return data.sub
  }
  async account(): Promise<Account> {
    const data = await (await this.call(`${API}/about?fields=user(permissionId,displayName)`)).json()
    if (typeof data.user?.permissionId !== 'string') throw new LibraryError('invalid', 'Não foi possível identificar a conta.')
    return { id: data.user.permissionId, name: data.user.displayName || 'Conta Google' }
  }
  async load(): Promise<Snapshot | null> {
    const query = new URLSearchParams({ q: "trashed = false and appProperties has { key='myHubDocument' and value='library-v1' }", fields: 'files(id,webViewLink,modifiedTime),nextPageToken,incompleteSearch', pageSize: '100', spaces: 'drive' })
    const data = await (await this.call(`${API}/files?${query}`)).json()
    if (!Array.isArray(data.files) || data.incompleteSearch || data.nextPageToken || data.files.length > 1) throw new LibraryError('ambiguous', 'Busca incompleta ou vários documentos encontrados. Gravação bloqueada.')
    if (!data.files.length) return null
    const fileId = data.files[0].id
    if (typeof fileId !== 'string') throw new LibraryError('invalid', 'Identificador de arquivo inválido.')
    let document: unknown
    try { document = await (await this.call(`${API}/files/${encodeURIComponent(fileId)}?alt=media`)).json() }
    catch (error) { if (error instanceof LibraryError) throw error; throw new LibraryError('invalid', 'O arquivo não contém JSON válido.') }
    const { webViewLink, modifiedTime } = data.files[0]
    return { fileId, ...(typeof webViewLink === 'string' ? { webViewLink } : {}), ...(typeof modifiedTime === 'string' ? { modifiedTime } : {}), document: validate(document) }
  }
  async save(base: Snapshot | null, operation: Operation): Promise<Snapshot> {
    const remote = await this.load()
    // A lost success response can be recovered without issuing another write.
    if (remote?.document.revision === operation.id && canonical(remote.document[operation.target][operation.key]) === canonical(operation.value)) return remote
    // Timestamped local edits use last-write-wins; older clients retain conflict checks.
    if (remote && operation.updatedAt && updatedTime(remote) >= Date.parse(operation.updatedAt)) return remote
    if (!operation.updatedAt && (base?.fileId !== remote?.fileId || canonical(base?.document ?? null) !== canonical(remote?.document ?? null))) throw new LibraryError('conflict', 'O documento mudou no Drive. Recarregue para decidir sobre a tentativa local.')
    const document = applyOperation(remote?.document ?? emptyEnvelope(), operation)
    if (remote) {
      await this.call(`https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(remote.fileId)}?uploadType=media`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(document) })
    } else {
      const boundary = `hub_${crypto.randomUUID()}`
      const metadata = { name: 'my-hub.json', mimeType: 'application/json', appProperties: { myHubDocument: 'library-v1' } }
      const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(document)}\r\n--${boundary}--`
      await this.call('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body })
    }
    const confirmed = await this.load()
    if (!confirmed || canonical(confirmed.document) !== canonical(document)) throw new LibraryError('conflict', 'Gravação enviada, mas a releitura divergiu. Confira antes de repetir.')
    return confirmed
  }
}
