// Downloads a playlist as a PDF. Fetched first so an error can be shown
// instead of leaving the page; the file is named by the server.

export type PdfLanguage = 'en' | 'es'

export async function downloadPlaylistPdf(id: number, lang: PdfLanguage): Promise<string | null> {
  try {
    const res = await fetch(`/api/admin/playlists/${id}/pdf?lang=${lang}&download=1`, {
      credentials: 'include',
    })
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null
      return body?.error ?? "The PDF couldn't be made. Try again."
    }

    const blob = await res.blob()
    const header = res.headers.get('Content-Disposition') ?? ''
    const match = /filename="?([^";]+)"?/i.exec(header)
    const name = match?.[1] ?? `Playlist-${id}.pdf`

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = name
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
    return null
  } catch {
    return "The PDF couldn't be downloaded. Check the connection and try again."
  }
}