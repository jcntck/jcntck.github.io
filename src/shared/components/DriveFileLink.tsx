interface DriveFileLinkProps {
  fileId: string
  webViewLink?: string
  children?: React.ReactNode
}

export function DriveFileLink({ fileId, webViewLink, children = 'Abrir arquivo no Google Drive' }: DriveFileLinkProps) {
  let href = `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/view`
  if (webViewLink) {
    try {
      const url = new URL(webViewLink)
      if (url.origin === 'https://drive.google.com' && !url.username && !url.password) href = url.href
    } catch { /* Use the file ID when no valid Drive viewer URL is available. */ }
  }
  return <a href={href} target="_blank" rel="noopener noreferrer">{children}<span className="sr-only"> (abre em nova aba)</span></a>
}
