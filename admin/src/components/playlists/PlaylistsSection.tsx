import { useCallback, useState } from 'react'
import { useHashParam } from '../../hooks/useHashParam'
import { useHeld } from '../../hooks/useHeld'
import { usePlaylists } from '../../hooks/usePlaylists'
import type { PlaylistDetail, PlaylistDraft, PlaylistSummary } from '../../types/playlists'
import { fetchPlaylist } from '../../utils/playlistsApi'
import { NavIcon } from '../icons/NavIcons'
import { TopbarActions } from '../layout/TopbarSlot'
import { StudyToast } from '../studies/StudyToast'
import { MealLabels } from './MealLabels'
import { PlaylistEditor } from './PlaylistEditor'
import { inView, PlaylistFilters, type PlaylistView } from './PlaylistFilters'
import { PlaylistList } from './PlaylistList'

// Playlists section of the Notifications page: hand-made and automatic
// playlists as photo cards, and the meal labels both kinds use. The chosen
// filter is kept in the address. Send on a card opens a new notification
// with that playlist chosen. Archived playlists stay with the people who
// kept them and can be restored.

type Editing = { from: PlaylistDetail | null }

type Props = {
  onSend: (p: PlaylistSummary) => void
}

const VIEWS: readonly PlaylistView[] = ['active', 'auto', 'hand', 'archived', 'labels']

const EMPTY: Record<Exclude<PlaylistView, 'labels'>, string> = {
  active: 'No playlists yet.',
  auto: 'No automatic playlists. They are made when a notification uses a vegetable and a meal.',
  hand: 'No hand-made playlists yet.',
  archived: 'No archived playlists.',
}

export function PlaylistsSection({ onSend }: Props) {
  const { list, options, error, create, save, archive, restore } = usePlaylists()
  const [view, setView] = useHashParam('view', VIEWS)
  const [editing, setEditing] = useState<Editing | null>(null)
  const [opening, setOpening] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const closeToast = useCallback(() => setToast(null), [])
  const closeEditor = useCallback(() => setEditing(null), [])
  const firstLoad = useHeld(!list && !error)

  if (!list && error) {
    return (
      <p className="error" role="alert">
        {error}
      </p>
    )
  }

  if (firstLoad || !list || !options) return <p className="st-muted">Loading playlists...</p>

  const shown = list.filter((p) => inView(p, view))
  const openNew = () => setEditing({ from: null })

  async function openEdit(p: PlaylistSummary) {
    if (opening !== null) return
    setOpening(p.id)
    try {
      setEditing({ from: await fetchPlaylist(p.id) })
    } catch (err) {
      setToast((err as Error).message)
    } finally {
      setOpening(null)
    }
  }

  async function saveDraft(draft: PlaylistDraft) {
    if (!editing) return null
    const id = editing.from?.id ?? null
    const message = id !== null ? await save(id, draft) : await create(draft)
    if (!message) {
      setEditing(null)
      setToast(`Saved "${draft.nameEn}".`)
    }
    return message
  }

  async function archiveOne(p: PlaylistSummary) {
    const message = await archive(p.id)
    setToast(message ?? `Archived "${p.nameEn}". You can restore it any time.`)
  }

  async function restoreOne(p: PlaylistSummary) {
    const message = await restore(p.id)
    setToast(message ?? `Restored "${p.nameEn}".`)
  }

  return (
    <>
      <TopbarActions>
        <button type="button" className="st-button is-green" onClick={openNew}>
          <NavIcon name="playlist" size={16} />
          New playlist
        </button>
      </TopbarActions>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <section className="nt-list">
        <div className="nt-list-head">
          <strong className="nt-list-title">Playlists</strong>
          <PlaylistFilters list={list} value={view} onChange={setView} />
        </div>

        {view === 'labels' ? (
          <MealLabels />
        ) : shown.length === 0 ? (
          <div className="nt-empty">
            <p className="st-muted">{EMPTY[view]}</p>
            {(view === 'active' || view === 'hand') && (
              <button type="button" className="st-button is-green" onClick={openNew}>
                <NavIcon name="playlist" size={16} />
                New playlist
              </button>
            )}
          </div>
        ) : (
          <PlaylistList
            items={shown}
            opening={opening}
            onSend={onSend}
            onEdit={(p) => void openEdit(p)}
            onArchive={(p) => void archiveOne(p)}
            onRestore={(p) => void restoreOne(p)}
          />
        )}
      </section>

      {editing && (
        <PlaylistEditor from={editing.from} options={options} onSave={saveDraft} onClose={closeEditor} />
      )}

      {toast && <StudyToast message={toast} onClose={closeToast} />}
    </>
  )
}