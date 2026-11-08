import { useCallback, useState } from 'react'
import { useHeld } from '../../hooks/useHeld'
import { usePlaylists } from '../../hooks/usePlaylists'
import type { PlaylistDetail, PlaylistDraft, PlaylistSummary } from '../../types/playlists'
import { fetchPlaylist } from '../../utils/playlistsApi'
import { NavIcon } from '../icons/NavIcons'
import { TopbarActions } from '../layout/TopbarSlot'
import { StudyToast } from '../studies/StudyToast'
import { MealLabels } from './MealLabels'
import { PlaylistEditor } from './PlaylistEditor'
import { PlaylistList } from './PlaylistList'

// Playlists section of the Notifications page: hand-made and automatic
// playlists a message can open, and the meal labels both kinds use.
// Archived playlists stay with the people who kept them and can be restored.

type Editing = { from: PlaylistDetail | null }
type View = 'active' | 'archived' | 'labels'

export function PlaylistsSection() {
  const { list, options, error, create, save, archive, restore } = usePlaylists()
  const [view, setView] = useState<View>('active')
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

  const active = list.filter((p) => !p.archived)
  const archived = list.filter((p) => p.archived)
  const shown = view === 'archived' ? archived : active
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

  const tabs: { id: View; label: string; count: number | null }[] = [
    { id: 'active', label: 'Active', count: active.length },
    { id: 'archived', label: 'Archived', count: archived.length },
    { id: 'labels', label: 'Meal labels', count: null },
  ]

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
          <div className="nt-tabs" role="tablist" aria-label="Playlist lists">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={view === t.id}
                className={view === t.id ? 'nt-tab is-active' : 'nt-tab'}
                onClick={() => setView(t.id)}
              >
                {t.label}
                {t.count !== null && <span className="nt-tab-count">{t.count}</span>}
              </button>
            ))}
          </div>
        </div>

        {view === 'labels' ? (
          <MealLabels />
        ) : shown.length === 0 ? (
          <div className="nt-empty">
            <p className="st-muted">{view === 'active' ? 'No playlists yet.' : 'No archived playlists.'}</p>
            {view === 'active' && (
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