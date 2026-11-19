import { PLAYLISTS } from '../../i18n/strings/playlists'
import { useStrings } from '../../i18n/useStrings'
import {
  BookmarkIcon,
  BookmarkOffIcon,
  CheckCircleIcon,
  EditIcon,
  ListIcon,
  PlusIcon,
  TrashIcon,
} from './PlaylistIcons'

// The bar pinned to the bottom of an open playlist. What it holds depends
// on the playlist:
//   new      from the team, not decided yet: a short hint, Skip and Keep
//   skipped  from the team, skipped: a note and Keep
//   kept     from the team, kept: a note, My playlists, and Remove
//   own      made by the person: Edit, Add, My playlists, and Delete

export type PlaylistBarMode = 'new' | 'skipped' | 'kept' | 'own'

type Props = {
  mode: PlaylistBarMode
  busy: boolean
  onKeep: () => void
  onSkip: () => void
  onRemove: () => void
  onPlaylists: () => void
  onEdit: () => void
  onAdd: () => void
  onDelete: () => void
}

export function PlaylistBar({
  mode,
  busy,
  onKeep,
  onSkip,
  onRemove,
  onPlaylists,
  onEdit,
  onAdd,
  onDelete,
}: Props) {
  const t = useStrings(PLAYLISTS)

  if (mode === 'own') {
    return (
      <div className="pl-bar is-tools">
        <div className="pl-tools">
          <button type="button" className="pl-tool" onClick={onEdit}>
            <EditIcon />
            {t.edit}
          </button>
          <button type="button" className="pl-tool" onClick={onAdd}>
            <PlusIcon />
            {t.addShort}
          </button>
          <button type="button" className="pl-tool is-primary" onClick={onPlaylists}>
            <ListIcon />
            {t.myPlaylists}
          </button>
          <button type="button" className="pl-tool is-danger" disabled={busy} onClick={onDelete}>
            <TrashIcon />
            {t.deleteShort}
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'kept') {
    return (
      <div className="pl-bar">
        <p className="pl-bar-note">
          <CheckCircleIcon />
          {t.keptNote}
        </p>
        <div className="pl-bar-row">
          <button type="button" className="pl-bar-btn is-primary" onClick={onPlaylists}>
            <ListIcon />
            {t.myPlaylists}
          </button>
          <button
            type="button"
            className="pl-bar-btn is-icon"
            aria-label={t.remove}
            title={t.remove}
            disabled={busy}
            onClick={onRemove}
          >
            <BookmarkOffIcon />
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'skipped') {
    return (
      <div className="pl-bar">
        <p className="pl-bar-note is-hint">{t.skippedNote}</p>
        <div className="pl-bar-row">
          <button type="button" className="pl-bar-btn is-primary" disabled={busy} onClick={onKeep}>
            <BookmarkIcon />
            {t.keepPlaylist}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="pl-bar">
      <p className="pl-bar-note is-hint">{t.keepHint}</p>
      <div className="pl-bar-row">
        <button type="button" className="pl-bar-btn" disabled={busy} onClick={onSkip}>
          {t.skip}
        </button>
        <button type="button" className="pl-bar-btn is-primary" disabled={busy} onClick={onKeep}>
          <BookmarkIcon />
          {t.keepPlaylist}
        </button>
      </div>
    </div>
  )
}