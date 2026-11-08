import type { PlaylistSummary } from '../../types/playlists'
import { NavIcon } from '../icons/NavIcons'
import { plural } from './playlistFormat'

// One compact card per playlist.

type Props = {
  items: PlaylistSummary[]
  opening: number | null
  onEdit: (p: PlaylistSummary) => void
  onArchive: (p: PlaylistSummary) => void
  onRestore: (p: PlaylistSummary) => void
}

export function PlaylistList({ items, opening, onEdit, onArchive, onRestore }: Props) {
  return (
    <ul className="pl-cards">
      {items.map((p) => (
        <li key={p.id} className="pl-card">
          <div className="pl-card-main">
            <div className="pl-card-name">
              <strong>{p.nameEn}</strong>
              {p.auto && <span className="pl-badge is-auto">Automatic</span>}
              {p.live && <span className="pl-badge is-live">In a live notification</span>}
              {p.archived && <span className="pl-badge">Archived</span>}
            </div>
            {p.nameEs && <span className="pl-card-es">Spanish: {p.nameEs}</span>}
            <div className="pl-chips">
              <span className="pl-chip">{plural(p.tips, 'tip')}</span>
              <span className="pl-chip">{plural(p.recipes, 'recipe')}</span>
              <span className="pl-chip">
                {p.sent === 0 ? 'Not sent yet' : `Sent ${p.sent === 1 ? 'once' : `${p.sent} times`}`}
              </span>
              <span className="pl-chip">Kept by {p.kept}</span>
              <span className="pl-chip">Not kept by {p.notKept}</span>
            </div>
          </div>

          <div className="pl-card-actions">
            <button type="button" className="st-button" disabled={opening !== null} onClick={() => onEdit(p)}>
              {opening === p.id ? 'Opening...' : 'Edit'}
            </button>
            {p.archived ? (
              <button type="button" className="st-button" onClick={() => onRestore(p)}>
                <NavIcon name="restore" size={16} />
                Restore
              </button>
            ) : (
              <button type="button" className="st-button" onClick={() => onArchive(p)}>
                <NavIcon name="archive" size={16} />
                Archive
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}