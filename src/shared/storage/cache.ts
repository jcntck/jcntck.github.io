import { validate, type Operation, type Snapshot } from './library'

export interface CachedOperation extends Operation { manual?: boolean }
export interface CachedLibrary {
  version: 1
  snapshot: Snapshot | null
  operations: CachedOperation[]
  lastSynced?: string
}
export interface CachePort {
  read(owner: string): CachedLibrary | undefined
  write(owner: string, value: CachedLibrary): void
}
export class BrowserLibraryCache implements CachePort {
  constructor(private storage: () => Pick<Storage, 'getItem' | 'setItem'> = () => localStorage) {}
  private key(owner: string) { return `my-hub:library:v1:${encodeURIComponent(owner)}` }
  read(owner: string): CachedLibrary | undefined {
    const raw = this.storage().getItem(this.key(owner))
    if (!raw) return
    const value: CachedLibrary = JSON.parse(raw)
    if (value.version !== 1 || !Array.isArray(value.operations)) throw new Error('Cache inválido.')
    if (value.snapshot !== null) {
      if (!value.snapshot || typeof value.snapshot.fileId !== 'string') throw new Error('Cache inválido.')
      validate(value.snapshot.document)
    }
    for (const operation of value.operations) {
      if (!operation || !['modules', 'diagnostics'].includes(operation.target) || typeof operation.id !== 'string' || typeof operation.key !== 'string' || !Number.isFinite(Date.parse(operation.updatedAt ?? '')) || !('value' in operation)) throw new Error('Cache inválido.')
    }
    return value
  }
  write(owner: string, value: CachedLibrary) { this.storage().setItem(this.key(owner), JSON.stringify(value)) }
}
