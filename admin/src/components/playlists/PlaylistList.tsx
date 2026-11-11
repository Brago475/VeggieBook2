import type { PlaylistSummary } from '../../types/playlists'
import { PlaylistCard } from './PlaylistCard'

// The playlists as a grid of photo cards.

type Props = {
  items: PlaylistSummary[]
  opening: number | null
  onSend: (p: PlaylistSummary) => void
  onEdit: (p: PlaylistSummary) => void
  onArchive: (p: PlaylistSummary) => void
  onRestore: (p: PlaylistSummary) => void
}

export function PlaylistList({ items, opening, onSend, onEdit, onArchive, onRestore }: Props) {
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
        />
      ))}
    </ul>
  )
}