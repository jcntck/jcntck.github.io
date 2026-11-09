import { useEffect, useRef, useState } from 'react'
import { checkScan, type ScanHealth } from './scan-health'

// Mount with the URL as key so changing it cancels the check and clears its result.
export function ScanLink({ url, title }: { url: string; title: string }) {
  const [health, setHealth] = useState<ScanHealth>()
  const [checking, setChecking] = useState(false)
  const controller = useRef<AbortController | null>(null)
  const timeoutId = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => { clearTimeout(timeoutId.current); controller.current?.abort(); controller.current = null }, [])
  const verify = async () => {
    controller.current?.abort()
    const attempt = new AbortController()
    controller.current = attempt
    setChecking(true); setHealth(undefined)
    // The race also ends the UI wait when an intermediary ignores cancellation.
    const timeout = new Promise<ScanHealth>(resolve => { timeoutId.current = setTimeout(() => { attempt.abort(); resolve({ kind: 'unknown' }) }, 8000) })
    const result = await Promise.race([checkScan(url, attempt.signal), timeout])
    clearTimeout(timeoutId.current)
    if (controller.current !== attempt) return
    setHealth(result); setChecking(false)
    controller.current = null
  }
  return <div className="scan-link">
    <a href={url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" aria-label={`Ler ${title} na scan (abre em nova aba)`}>Abrir scan <span aria-hidden="true">↗</span></a>
    <button className="manga-text-button" type="button" disabled={checking} aria-label={`Verificar link de ${title}`} onClick={() => void verify()}>{checking ? 'Verificando…' : 'Verificar link'}</button>
    <p role="status" className={`scan-health scan-health-${health?.kind ?? 'idle'}`}>
      <span className="scan-dot" aria-hidden="true" />
      {checking ? 'Consultando o link…' : !health ? 'Link não verificado' : health.kind === 'ok' ? `Link respondeu (HTTP ${health.status})` : health.kind === 'http-error' ? `Resposta HTTP ${health.status}; confira o link` : 'Não foi possível verificar (rede, CORS ou limite de tempo). Abra o link para conferir.'}
    </p>
  </div>
}
