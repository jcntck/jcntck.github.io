import { useState } from 'react'

// Omit crossOrigin: these images are displayed, never read as pixels or copied.
export function MangaCover({ url, title }: { url?: string; title: string }) {
  const [failed, setFailed] = useState(false)
  return <div className="manga-cover">
    {url && !failed ? <img src={url} alt={`Capa de ${title}`} width="300" height="400" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} /> :
      <div className="manga-cover-fallback" role="img" aria-label={`${url ? 'Capa indisponível' : 'Sem capa'}: ${title}`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><path d="M4 4h7a3 3 0 0 1 3 3v14a4 4 0 0 0-4-2H4V4Zm16 0h-3v15h3V4Z" /></svg><span>{url ? 'Capa indisponível' : 'Sem capa'}</span></div>}
  </div>
}
