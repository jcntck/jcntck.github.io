export function ScanLink({ url, name, title }: { url: string; name?: string; title: string }) {
  const label = name?.trim() || new URL(url).hostname
  return <div className="scan-link"><span>Scan</span>
    <a href={url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" aria-label={`Ler ${title} em ${label} (abre em nova aba)`}>{label} <span aria-hidden="true">↗</span></a>
  </div>
}
