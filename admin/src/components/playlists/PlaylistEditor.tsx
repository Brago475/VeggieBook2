import { useEffect, useState, type FormEvent } from 'react'
import type { BrowseItem, PickedItem, PlaylistDetail, PlaylistDraft, PlaylistOptions } from '../../types/playlists'
import { NavIcon } from '../icons/NavIcons'
import { StudyIcon } from '../studies/StudyIcons'
import { ContentBrowser } from './ContentBrowser'
import { PlaylistItems } from './PlaylistItems'
import { PlaylistPreview } from './PlaylistPreview'
import { itemKey, MAX_ITEMS, MAX_NAME, pickedFromBrowse, pickedFromEntry } from './playlistFormat'

// Create or edit a playlist, in the Studies dialog style: names, quick start
// and View all, the ordered list, and a live preview. Closes on Cancel, the
// X, Escape, or a click outside.

type Props = {
  // Edit: the playlist. Create: null.
  from: PlaylistDetail | null
  options: PlaylistOptions
  onSave: (draft: PlaylistDraft) => Promise<string | null>
  onClose: () => void
}

export function PlaylistEditor({ from, options, onSave, onClose }: Props) {
  const editing = from !== null
  const [nameEn, setNameEn] = useState(from?.nameEn ?? '')
  const [nameEs, setNameEs] = useState(from?.nameEs ?? '')
  const [items, setItems] = useState<PickedItem[]>(() => from?.items.map(pickedFromEntry) ?? [])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !busy) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  const picked = new Set(items.map((i) => itemKey(i.kind, i.id)))

  function add(list: BrowseItem[]) {
    const fresh = list.filter((i) => !picked.has(itemKey(i.kind, i.id)))
    const room = Math.max(MAX_ITEMS - items.length, 0)
    const taken = fresh.slice(0, room)
    setItems([...items, ...taken.map(pickedFromBrowse)])
    const left = fresh.length - taken.length
    setNote(left > 0 ? `A playlist holds up to ${MAX_ITEMS} items, so ${left} were not added.` : null)
    setError(null)
  }

  function move(index: number, by: -1 | 1) {
    const target = index + by
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    setItems(next)
  }

  function remove(index: number) {
    setItems(items.filter((_, i) => i !== index))
    setNote(null)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return

    const en = nameEn.trim()
    if (!en) {
      setError('Give the playlist a name.')
      return
    }
    if (items.length === 0) {
      setError('Add at least one tip or recipe.')
      return
    }

    setBusy(true)
    setError(null)
    const message = await onSave({
      nameEn: en,
      nameEs: nameEs.trim() || null,
      items: items.map((i) => ({ kind: i.kind, id: i.id })),
    })
    setBusy(false)
    if (message) setError(message)
  }

  const heading = editing ? `Edit "${from.nameEn}"` : 'New playlist'
  const subtitle = 'People get it from a notification and choose Keep or Skip.'

  return (
    <div className="st-overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <form
        className="st-dialog nt-dialog pl-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pl-editor-title"
        onSubmit={submit}
        noValidate
      >
        <div className="st-dialog-head">
          <span className="st-dialog-icon">
            <NavIcon name="playlist" size={20} />
          </span>
          <div className="st-dialog-title">
            <strong id="pl-editor-title">{heading}</strong>
            <span>{subtitle}</span>
          </div>
          <button type="button" className="st-dialog-close" aria-label="Close" disabled={busy} onClick={onClose}>
            <StudyIcon name="close" size={16} />
          </button>
        </div>

        <div className="st-dialog-body nt-dialog-body">
          <div className="pl-editor">
            <div className="pl-editor-main">
              <section className="st-dialog-section nt-section">
                <span className="st-section-title">Name</span>
                <div className="nt-row">
                  <label className="nt-field">
                    <span className="nt-label">English</span>
                    <input
                      className="nt-input"
                      maxLength={MAX_NAME}
                      value={nameEn}
                      placeholder="For example: Zucchini snacks"
                      onChange={(e) => setNameEn(e.target.value)}
                    />
                  </label>
                  <label className="nt-field">
                    <span className="nt-label">Spanish</span>
                    <input
                      className="nt-input"
                      maxLength={MAX_NAME}
                      value={nameEs}
                      placeholder="Optional"
                      onChange={(e) => setNameEs(e.target.value)}
                    />
                  </label>
                </div>
              </section>

              <section className="st-dialog-section nt-section">
                <span className="st-section-title">Add tips and recipes</span>
                <ContentBrowser options={options} picked={picked} onAdd={add} />
              </section>

              <section className="st-dialog-section nt-section">
                <span className="st-section-title">In this playlist ({items.length})</span>
                {note && <p className="pl-note">{note}</p>}
                <PlaylistItems items={items} onMove={move} onRemove={remove} />
              </section>

              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
            </div>

            <aside className="pl-editor-side">
              <PlaylistPreview nameEn={nameEn} nameEs={nameEs} items={items} />
            </aside>
          </div>
        </div>

        <div className="st-dialog-actions nt-dialog-foot">
          <button type="button" className="st-button" disabled={busy} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="st-button is-green" disabled={busy}>
            <NavIcon name="playlist" size={16} />
            {busy ? 'Saving...' : editing ? 'Save changes' : 'Save playlist'}
          </button>
        </div>
      </form>
    </div>
  )
}