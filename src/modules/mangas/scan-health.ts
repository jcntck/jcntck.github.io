import { validScanUrl } from './model'

export type ScanHealth = { kind: 'ok' | 'http-error'; status: number } | { kind: 'unknown' }
export async function checkScan(url: string, signal: AbortSignal): Promise<ScanHealth> {
  if (!validScanUrl(url) || (window.location.protocol === 'https:' && new URL(url).protocol !== 'https:')) return { kind: 'unknown' }
  try {
    const response = await fetch(url, { method: 'HEAD', mode: 'cors', credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer', signal })
    if (response.type === 'opaque' || response.type === 'opaqueredirect' || response.status === 0) return { kind: 'unknown' }
    return { kind: response.ok ? 'ok' : 'http-error', status: response.status }
  } catch { return { kind: 'unknown' } }
}
