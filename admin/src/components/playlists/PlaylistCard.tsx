import type { PlaylistSummary } from '../../types/playlists'
import type { PdfLanguage } from '../../utils/playlistPdf'
import { NavIcon } from '../icons/NavIcons'
import { CardMenu, type MenuItem } from './CardMenu'
import { PlaylistCollage } from './PlaylistCollage'
import { shortCount } from './playlistFormat'

// One playlist as a photo card: a collage of its first photos, its names,
// counts, who made it, and Send, Edit, and a menu for Download (English or
// Spanish) and Archive or Restore.

type Props = {
  playlist: PlaylistSummary
  // This card is loading its editor.
  opening: boolean
  // Any card is loading its editor.
  busy: boolean
  onSend: () => void
  onEdit: () => void
  onArchive: () => void
  onRestore: () => void
  onDownload: (lang: PdfLanguage) => void
}

function sentText(sent: number): string {
  if (sent === 0) return 'Not sent yet'
  return sent === 1 ? 'Sent once' : `Sent ${sent} times`
}

// "By alex, edited by sam", or null when nobody is recorded.
function whoText(p: PlaylistSummary): string | null {
  const parts: string[] = []
  if (p.createdBy) parts.push(`By ${p.createdBy}`)
  if (p.updatedBy) parts.push(p.createdBy ? `edited by ${p.updatedBy}` : `Edited by ${p.updatedBy}`)
  return parts.length > 0 ? parts.join(', ') : null
}

export function PlaylistCard({ playlist: p, opening, busy, onSend, onEdit, onArchive, onRestore, onDownload }: Props) {
  const who = whoText(p)
  const empty = p.tips + p.recipes === 0

  const menu: MenuItem[] = [
    ...(empty
      ? []
      : [
          { label: 'Download English', icon: 'download' as const, onClick: () => onDownload('en') },
          { label: 'Download Spanish', icon: 'download' as const, onClick: () => onDownload('es') },
        ]),
    p.archived
      ? { label: 'Restore', icon: 'restore', onClick: onRestore }
      : { label: 'Archive', icon: 'archive', onClick: onArchive },
  ]

  return (
    <li className={p.archived ? 'plc-card is-archived' : 'plc-card'}>
      <div className="plc-top">
        <PlaylistCollage photos={p.photos} />
        {(p.live || p.auto || p.archived) && (
          <div className="plc-badges">
            {p.live && <span className="plc-badge is-live">In a live notification</span>}
            {p.auto && <span className="plc-badge">Automatic</span>}
            {p.archived && <span className="plc-badge">Archived</span>}
          </div>
        )}
      </div>

      <div className="plc-body">
        <strong className="plc-name">{p.nameEn}</strong>
        {p.nameEs && (
          <span className="plc-es" lang="es">
            {p.nameEs}
          </span>
        )}
        <div className="pl-chips">
          <span className="pl-chip">{shortCount(p.tips, p.recipes)}</span>
          <span className="pl-chip">{sentText(p.sent)}</span>
          <span className="pl-chip">Kept by {p.kept}</span>
          <span className="pl-chip">Not kept by {p.notKept}</span>
        </div>
        {who && <span className="plc-who">{who}</span>}
      </div>

      <div className="plc-actions">
        {!p.archived && (
          <button type="button" className="st-button is-green" onClick={onSend}>
            <NavIcon name="bell" size={16} />
            Send
          </button>
        )}
        <button type="button" className="st-button" disabled={busy} onClick={onEdit}>
          {opening ? 'Opening...' : 'Edit'}
        </button>
        <CardMenu label={`More for ${p.nameEn}`} items={menu} />
      </div>
    </li>
  )
}