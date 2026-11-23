import type { PlaylistSummary } from '../../types/playlists'
import type { PdfLanguage } from '../../utils/playlistPdf'
import { NavIcon } from '../icons/NavIcons'
import { CardMenu, type MenuItem } from './CardMenu'
import { PlaylistCollage } from './PlaylistCollage'
import { shortCount } from './playlistFormat'

// One playlist as a cover card:
//
//   Cover    a square collage with what it holds (top left), one status
//            badge (top right), and Reached, Kept and Skipped along the bottom
//   Info     the name with the menu, the Spanish name, EN and ES tags, and
//            who made it; every line is one fixed row so all cards match
//   Actions  Send and Edit
//
// The menu holds the messages it is the default for, Download (English or
// Spanish), Archive or Restore, and Delete for one never sent, kept or skipped.

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

type Badge = { label: string; full: string; tone: 'live' | 'plain' }

// Never sent and never kept or skipped, so nobody has it.
export function canDelete(p: PlaylistSummary): boolean {
  return p.sent === 0 && p.kept === 0 && p.notKept === 0
}

// One badge only, so it never crowds the count: Live, then Archived, then Automatic.
function badgeOf(p: PlaylistSummary): Badge | null {
  if (p.live) return { label: 'Live', full: 'In a live notification', tone: 'live' }
  if (p.archived) return { label: 'Archived', full: 'Archived', tone: 'plain' }
  if (p.auto) return { label: 'Automatic', full: 'Made automatically', tone: 'plain' }
  return null
}

function maker(p: PlaylistSummary): string | null {
  return p.createdBy ?? p.updatedBy ?? null
}

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />
    </svg>
  )
}

function PersonIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
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
  const empty = p.tips + p.recipes === 0
  const badge = badgeOf(p)
  const by = maker(p)
  const edited = p.updatedBy && p.updatedBy !== p.createdBy ? `, edited by ${p.updatedBy}` : ''
  const defaults = p.defaultFor ?? []
  const note = defaults.length > 0 ? `Default for: ${defaults.map((x) => x.label).join('; ')}` : undefined

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
      <div className="plc-cover">
        <PlaylistCollage photos={p.photos} />

        <div className="plc-top-row">
          <span className="plc-count">
            <NavIcon name="playlist" size={14} />
            <span>{empty ? 'Nothing yet' : shortCount(p.tips, p.recipes)}</span>
          </span>
          {badge && (
            <span className={badge.tone === 'live' ? 'plc-badge is-live' : 'plc-badge'} title={badge.full}>
              {badge.tone === 'live' && <i aria-hidden="true" />}
              {badge.label}
            </span>
          )}
        </div>

        <dl className="plc-band">
          <div>
            <dd>{p.reached}</dd>
            <dt>Reached</dt>
          </div>
          <div>
            <dd>{p.kept}</dd>
            <dt>Kept</dt>
          </div>
          <div>
            <dd>{p.notKept}</dd>
            <dt>Skipped</dt>
          </div>
        </dl>
      </div>

      <div className="plc-info">
        <div className="plc-title-row">
          <strong className="plc-name" title={p.nameEn}>
            {p.nameEn}
          </strong>
          <CardMenu label={`More for ${p.nameEn}`} items={menu} note={note} />
        </div>

        <span className="plc-es-name" title={p.nameEs ?? undefined}>
          {p.nameEs ? <span lang="es">{p.nameEs}</span> : <span className="is-missing">No Spanish name yet</span>}
        </span>

        <div className="plc-chips">
          <span className="plc-lang" title="English">
            EN
          </span>
          {p.nameEs ? (
            <span className="plc-lang" title={p.nameEs}>
              ES
            </span>
          ) : (
            <span className="plc-lang is-missing" title="No Spanish name yet">
              ES
            </span>
          )}
          {by && (
            <span className="plc-by" title={`Made by ${by}${edited}`}>
              <PersonIcon />
              <span>By {by}</span>
            </span>
          )}
        </div>
      </div>

      <div className="plc-actions">
        {!p.archived && (
          <button type="button" className="st-button is-green" onClick={onSend}>
            <NavIcon name="bell" size={16} />
            Send
          </button>
        )}
        <button type="button" className="st-button" disabled={busy} onClick={onEdit}>
          <PencilIcon />
          {opening ? 'Opening...' : 'Edit'}
        </button>
      </div>
    </li>
  )
}