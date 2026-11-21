import { useState } from 'react'

// Omit crossOrigin: these images are displayed, never read as pixels or copied.
export function MangaCover({ url, title }: { url?: string; title: string }) {
  const [failed, setFailed] = useState(false)
  return <div className="manga-cover">
    {url && !failed ? <img src={url} alt={`Capa de ${title}`} width="300" height="400" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} /> :
      <div className="manga-cover-fallback" role="img" aria-label={`${url ? 'Capa indisponível' : 'Sem capa'}: ${title}`}><span className="cover-initial" aria-hidden="true">{title.trim()[0]}</span><span>{url ? 'Capa indisponível' : 'Sem capa'}</span></div>}
  </div>
}
