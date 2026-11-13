import type { PlaylistSummary } from '../../types/playlists'
import type { PdfLanguage } from '../../utils/playlistPdf'
import { NavIcon } from '../icons/NavIcons'
import { CardMenu, type MenuItem } from './CardMenu'
import { PlaylistCollage } from './PlaylistCollage'
import { shortCount } from './playlistFormat'

// One playlist as a photo card:
//
//   Top      a collage of its first photos and its badges
//   Middle   the name, the Spanish name tagged ES, what it holds, then
//            Sent, Kept and Not kept as three boxes, and who made it
//   Bottom   Send, Edit, and a menu: Download (English or Spanish), Archive
//            or Restore, and Delete for one never sent, kept or skipped

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
  onDelete: () => void
}

// "By alex", "By alex, edited by sam", or null when nobody is recorded.
function whoText(p: PlaylistSummary): string | null {
  if (p.createdBy && p.updatedBy && p.createdBy !== p.updatedBy) return `By ${p.createdBy}, edited by ${p.updatedBy}`
  if (p.createdBy) return `By ${p.createdBy}`
  if (p.updatedBy) return `Edited by ${p.updatedBy}`
  return null
}

// Never sent and never kept or skipped, so nobody has it.
export function canDelete(p: PlaylistSummary): boolean {
  return p.sent === 0 && p.kept === 0 && p.notKept === 0
}

export function PlaylistCard({
  playlist: p,
  opening,
  busy,
  onSend,
  onEdit,
  onArchive,
  onRestore,
  onDownload,
  onDelete,
}: Props) {
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
    ...(canDelete(p) ? [{ label: 'Delete', icon: 'delete' as const, onClick: onDelete, danger: true }] : []),
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
          <span className="plc-es">
            <span className="plc-lang" aria-label="Spanish name">
              ES
            </span>
            <span lang="es">{p.nameEs}</span>
          </span>
        )}

        <span className="plc-count">
          <NavIcon name="playlist" size={15} />
          {empty ? 'No items' : shortCount(p.tips, p.recipes)}
        </span>

        <dl className="plc-stats">
          <div>
            <dt>Sent</dt>
            <dd>{p.sent}</dd>
          </div>
          <div>
            <dt>Kept</dt>
            <dd>{p.kept}</dd>
          </div>
          <div>
            <dt>Not kept</dt>
            <dd>{p.notKept}</dd>
          </div>
        </dl>

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