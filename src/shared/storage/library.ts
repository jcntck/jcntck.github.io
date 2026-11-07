export type Json = null | boolean | number | string | Json[] | { [key: string]: Json }
export interface Envelope {
  [key: string]: Json
  schemaVersion: 1
  revision: string
  diagnostics: { [key: string]: Json }
  modules: { [key: string]: Json }
}
export class LibraryError extends Error {
  constructor(public code: 'invalid' | 'expired' | 'network' | 'remote' | 'ambiguous' | 'conflict' | 'disconnected', message: string) { super(message) }
}
const record = (value: unknown): value is Record<string, Json> => !!value && typeof value === 'object' && !Array.isArray(value)
export function validate(value: unknown): Envelope {
  if (!record(value) || value.schemaVersion !== 1 || typeof value.revision !== 'string' || !value.revision || !record(value.diagnostics) || !record(value.modules)) {
    throw new LibraryError('invalid', 'Documento inválido ou versão incompatível. Nada foi substituído.')
  }
  return value as Envelope
}
export const emptyEnvelope = (): Envelope => ({ schemaVersion: 1, revision: crypto.randomUUID(), diagnostics: {}, modules: {} })
// Compare content as well as revision; JSON property order is not a change.
export function canonical(value: Json): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (record(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
  return JSON.stringify(value)
}
export interface Snapshot { fileId: string; document: Envelope }
export interface LibraryStorage {
  load(): Promise<Snapshot | null>
  save(base: Snapshot | null, operation: Operation): Promise<Snapshot>
}
export interface Operation { id: string; target: 'diagnostics' | 'modules'; key: string; value: Json }
export function applyOperation(base: Envelope, operation: Operation): Envelope {
  return { ...base, revision: operation.id, [operation.target]: { ...base[operation.target], [operation.key]: operation.value } }
}
