import type { PlaylistSummary } from '../../types/playlists'
import type { PdfLanguage } from '../../utils/playlistPdf'
import { PlaylistCard } from './PlaylistCard'

// The playlists as a grid of photo cards.

type Props = {
  items: PlaylistSummary[]
  opening: number | null
  onSend: (p: PlaylistSummary) => void
  onEdit: (p: PlaylistSummary) => void
  onArchive: (p: PlaylistSummary) => void
  onRestore: (p: PlaylistSummary) => void
  onDownload: (p: PlaylistSummary, lang: PdfLanguage) => void
}

export function PlaylistList({ items, opening, onSend, onEdit, onArchive, onRestore, onDownload }: Props) {
  return (
    <ul className="plc-grid">
      {items.map((p) => (
        <PlaylistCard
          key={p.id}
          playlist={p}
          opening={opening === p.id}
          busy={opening !== null}
          onSend={() => onSend(p)}
          onEdit={() => onEdit(p)}
          onArchive={() => onArchive(p)}
          onRestore={() => onRestore(p)}
          onDownload={(lang) => onDownload(p, lang)}
        />
      ))}
    </ul>
  )
}