import { useCallback, useState } from 'react'
import { useDrafts } from '../../hooks/useDrafts'
import { useHashParam } from '../../hooks/useHashParam'
import { useHeld } from '../../hooks/useHeld'
import { usePlaylists } from '../../hooks/usePlaylists'
import type { PlaylistDraftData, SavedDraft } from '../../types/drafts'
import type { PlaylistDetail, PlaylistDraft, PlaylistSummary } from '../../types/playlists'
import { formatDateTime } from '../../utils/format'
import { downloadPlaylistPdf, type PdfLanguage } from '../../utils/playlistPdf'
import { fetchPlaylist } from '../../utils/playlistsApi'
import { DraftList, type DraftRow } from '../drafts/DraftList'
import { NavIcon } from '../icons/NavIcons'
import { TopbarActions } from '../layout/TopbarSlot'
import { PlaylistsSkeleton } from '../skeletons/PlaylistsSkeleton'
import { StudyToast } from '../studies/StudyToast'
import { DeletePlaylistDialog } from './DeletePlaylistDialog'
import { MealLabels } from './MealLabels'
import { PlaylistEditor } from './PlaylistEditor'
import { inView, PlaylistFilters, type PlaylistView } from './PlaylistFilters'
import { PlaylistList } from './PlaylistList'
import { shortCount } from './playlistFormat'

// Playlists section of the Notifications page: hand-made and automatic
// playlists as photo cards, saved drafts, and the meal labels both kinds
// use. The chosen filter is kept in the address. Send on a card opens a new
// notification with that playlist chosen. A card's menu downloads the
// playlist as a PDF, archives or restores it, and deletes one that nobody
// has. A draft finished and saved becomes a playlist and the draft is
// removed. While loading, the section's outline shows.

type Editing = { from: PlaylistDetail | null; draft: SavedDraft<PlaylistDraftData> | null }

type Props = {
  onSend: (p: PlaylistSummary) => void
}

const VIEWS: readonly PlaylistView[] = ['active', 'auto', 'hand', 'drafts', 'archived', 'labels']

const EMPTY: Record<Exclude<PlaylistView, 'labels' | 'drafts'>, string> = {
  active: 'No playlists yet.',
  auto: 'No automatic playlists. They are made when a notification uses a vegetable and a meal.',
  hand: 'No hand-made playlists yet.',
  archived: 'No archived playlists.',
}

function draftRow(d: SavedDraft<PlaylistDraftData>): DraftRow {
  const items = d.payload.items ?? []
  const tips = items.filter((i) => i.kind === 'tip').length
  const who = d.updatedBy ?? d.createdBy
  return {
    id: d.id,
    title: d.payload.nameEn?.trim() || 'Untitled draft',
    detail: items.length === 0 ? 'No items yet' : shortCount(tips, items.length - tips),
    saved: `Saved${who ? ` by ${who}` : ''}, ${formatDateTime(d.updatedAt ?? d.createdAt)}`,
  }
}

export function PlaylistsSection({ onSend }: Props) {
  const { list, options, error, create, save, archive, restore, remove } = usePlaylists()
  const drafts = useDrafts<PlaylistDraftData>('playlist')
  const [view, setView] = useHashParam('view', VIEWS)
  const [editing, setEditing] = useState<Editing | null>(null)
  const [deleting, setDeleting] = useState<PlaylistSummary | null>(null)
  const [opening, setOpening] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const closeToast = useCallback(() => setToast(null), [])
  const closeEditor = useCallback(() => setEditing(null), [])
  const closeDelete = useCallback(() => setDeleting(null), [])
  const firstLoad = useHeld(!list && !error)

  if (!list && error) {
    return (
      <p className="error" role="alert">
        {error}
      </p>
    )
  }

  if (firstLoad || !list || !options) return <PlaylistsSkeleton />

  const draftList = drafts.drafts ?? []
  const shown = list.filter((p) => inView(p, view))
  const openNew = () => setEditing({ from: null, draft: null })

  async function openEdit(p: PlaylistSummary) {
    if (opening !== null) return
    setOpening(p.id)
    try {
      setEditing({ from: await fetchPlaylist(p.id), draft: null })
    } catch (err) {
      setToast((err as Error).message)
    } finally {
      setOpening(null)
    }
  }

  function openDraft(id: number) {
    const d = draftList.find((x) => x.id === id)
    if (d) setEditing({ from: null, draft: d })
  }

  async function savePlaylist(draft: PlaylistDraft) {
    if (!editing) return null
    const id = editing.from?.id ?? null
    const fromDraft = editing.draft?.id ?? null
    const message = id !== null ? await save(id, draft) : await create(draft)
    if (!message) {
      if (fromDraft !== null) await drafts.remove(fromDraft)
      setEditing(null)
      setToast(`Saved "${draft.nameEn}".`)
    }
    return message
  }

  async function saveAsDraft(data: PlaylistDraftData) {
    if (!editing) return null
    const result = await drafts.save(editing.draft?.id ?? null, data.nameEn || null, data)
    if (typeof result === 'string') return result
    setEditing(null)
    setToast(`Saved "${data.nameEn || 'Untitled draft'}" as a draft.`)
    return null
  }

  async function discardDraft(id: number) {
    const message = await drafts.remove(id)
    setToast(message ?? 'Draft discarded.')
  }

  async function archiveOne(p: PlaylistSummary) {
    const message = await archive(p.id)
    setToast(message ?? `Archived "${p.nameEn}". You can restore it any time.`)
  }

  async function restoreOne(p: PlaylistSummary) {
    const message = await restore(p.id)
    setToast(message ?? `Restored "${p.nameEn}".`)
  }

  async function deleteOne(p: PlaylistSummary) {
    const message = await remove(p.id)
    if (!message) {
      setDeleting(null)
      setToast(`Deleted "${p.nameEn}".`)
    }
    return message
  }

  async function downloadOne(p: PlaylistSummary, lang: PdfLanguage) {
    setToast(`Preparing "${p.nameEn}" as a PDF...`)
    const message = await downloadPlaylistPdf(p.id, lang)
    setToast(message ?? `Downloaded "${p.nameEn}".`)
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
          <PlaylistFilters list={list} draftCount={draftList.length} value={view} onChange={setView} />
        </div>

        {view === 'labels' ? (
          <MealLabels />
        ) : view === 'drafts' ? (
          <>
            {drafts.error && (
              <p className="error" role="alert">
                {drafts.error}
              </p>
            )}
            <DraftList
              rows={draftList.map(draftRow)}
              empty="No drafts. Use Save as draft in the editor to keep an unfinished playlist."
              onContinue={openDraft}
              onDiscard={discardDraft}
            />
          </>
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
            onDownload={(p, lang) => void downloadOne(p, lang)}
            onDelete={setDeleting}
          />
        )}
      </section>

      {editing && (
        <PlaylistEditor
          key={editing.draft ? `draft-${editing.draft.id}` : (editing.from?.id ?? 'new')}
          from={editing.from}
          draft={editing.draft?.payload ?? null}
          options={options}
          onSave={savePlaylist}
          onSaveDraft={saveAsDraft}
          onClose={closeEditor}
        />
      )}

      {deleting && (
        <DeletePlaylistDialog playlist={deleting} onDelete={() => deleteOne(deleting)} onClose={closeDelete} />
      )}

      {toast && <StudyToast message={toast} onClose={closeToast} />}
    </>
  )
}