import { useEffect, useState, type FormEvent } from 'react'
import '../../styles/playlist-steps.css'
import '../../styles/playlist-editor.css'
import type { PlaylistDraftData } from '../../types/drafts'
import type { PickedItem, PlaylistDetail, PlaylistDraft, PlaylistOptions } from '../../types/playlists'
import { NavIcon } from '../icons/NavIcons'
import { ItemChooser } from '../notifications/ItemChooser'
import { StudyIcon } from '../studies/StudyIcons'
import { PlaylistItems } from './PlaylistItems'
import { PlaylistPreview } from './PlaylistPreview'
import { PlaylistSteps } from './PlaylistSteps'
import { MAX_ITEMS, MAX_NAME, pickedFromEntry, shortCount } from './playlistFormat'

// Create or edit a playlist in three steps: name, add tips and recipes as
// photo cards, then review the order with a live preview and save. New
// playlists open on step 1, existing ones on Review, a draft on the
// furthest step it can reach. Closes on Cancel, the X, Escape, or a click
// outside.
//
// A new playlist (or a draft) can be saved as a draft at any step, even
// half finished. Saving it for real runs the normal checks.
//
// Editing sends the version it opened with, so a save is refused if another
// admin saved first. The header names who made it and who edited it last.

type Props = {
  // Edit: the playlist. Create: null.
  from: PlaylistDetail | null
  // A saved draft to continue.
  draft?: PlaylistDraftData | null
  options: PlaylistOptions
  onSave: (draft: PlaylistDraft) => Promise<string | null>
  onSaveDraft?: (data: PlaylistDraftData) => Promise<string | null>
  onClose: () => void
}

const STEPS = ['Name', 'Add tips and recipes', 'Review and save']
const REVIEW = 2

// "Made by alex, last edited by sam", or null when nobody is recorded.
function whoLine(from: PlaylistDetail): string | null {
  const parts: string[] = []
  if (from.createdBy) parts.push(`Made by ${from.createdBy}`)
  if (from.updatedBy) parts.push(`last edited by ${from.updatedBy}`)
  if (parts.length === 0) return null
  const line = parts.join(', ')
  return line.charAt(0).toUpperCase() + line.slice(1)
}

function startStep(from: PlaylistDetail | null, draft: PlaylistDraftData | null): number {
  if (from) return REVIEW
  if (!draft || !draft.nameEn.trim()) return 0
  return draft.items.length === 0 ? 1 : REVIEW
}

export function PlaylistEditor({ from, draft = null, options, onSave, onSaveDraft, onClose }: Props) {
  const editing = from !== null
  const [step, setStep] = useState(() => startStep(from, draft))
  const [nameEn, setNameEn] = useState(draft?.nameEn ?? from?.nameEn ?? '')
  const [nameEs, setNameEs] = useState(draft?.nameEs ?? from?.nameEs ?? '')
  const [items, setItems] = useState<PickedItem[]>(
    () => draft?.items ?? from?.items.map(pickedFromEntry) ?? [],
  )
  // The version this editor opened with; refreshing the list does not change it.
  const [version] = useState<number | null>(() => from?.version ?? null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !busy) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  const nameProblem = nameEn.trim() ? null : 'Give the playlist a name.'
  const itemsProblem =
    items.length === 0
      ? 'Add at least one tip or recipe.'
      : items.length > MAX_ITEMS
        ? `A playlist holds up to ${MAX_ITEMS} items. Remove ${items.length - MAX_ITEMS} to go on.`
        : null
  // The furthest step that can be opened.
  const reachable = nameProblem ? 0 : itemsProblem ? 1 : REVIEW
  const canDraft = !editing && onSaveDraft !== undefined

  function go(target: number) {
    if (target > reachable) {
      setError(nameProblem ?? itemsProblem)
      return
    }
    setError(null)
    setStep(target)
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
  }

  async function saveAsDraft() {
    if (busy || !onSaveDraft) return
    setBusy(true)
    setError(null)
    const message = await onSaveDraft({ nameEn: nameEn.trim(), nameEs: nameEs.trim(), items })
    setBusy(false)
    if (message) setError(message)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    if (step < REVIEW) {
      go(step + 1)
      return
    }

    const problem = nameProblem ?? itemsProblem
    if (problem) {
      setError(problem)
      return
    }

    setBusy(true)
    setError(null)
    const message = await onSave({
      nameEn: nameEn.trim(),
      nameEs: nameEs.trim() || null,
      items: items.map((i) => ({ kind: i.kind, id: i.id })),
      version,
    })
    setBusy(false)
    if (message) setError(message)
  }

  const heading = editing ? `Edit "${from.nameEn}"` : draft ? 'Draft playlist' : 'New playlist'
  const subtitle = editing
    ? (whoLine(from) ?? 'People get it from a notification and choose Keep or Skip.')
    : draft
      ? 'Finish it and save, or keep it as a draft for later.'
      : 'People get it from a notification and choose Keep or Skip.'
  const tips = items.filter((i) => i.kind === 'tip').length

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

        <PlaylistSteps steps={STEPS} current={step} reachable={reachable} onGo={go} />

        <div className="st-dialog-body nt-dialog-body">
          {step === 0 && (
            <section className="st-dialog-section nt-section pe-name">
              <span className="st-section-title">Name</span>
              <label className="nt-field">
                <span className="nt-label">English</span>
                <input
                  className="nt-input"
                  maxLength={MAX_NAME}
                  value={nameEn}
                  autoFocus
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
                <span className="nt-hint">Left empty, Spanish readers see the English name.</span>
              </label>
            </section>
          )}

          {step === 1 && (
            <section className="st-dialog-section nt-section pe-add">
              <div className="pe-section-head">
                <span className="st-section-title">Add tips and recipes</span>
                <span className="pe-count">
                  {items.length} of up to {MAX_ITEMS} picked
                </span>
              </div>
              <ItemChooser options={options} chosen={items} onChange={setItems} />
            </section>
          )}

          {step === REVIEW && (
            <div className="pl-editor">
              <div className="pl-editor-main">
                <div className="pe-summary">
                  <div className="pe-summary-text">
                    <strong>{nameEn.trim() || 'Untitled playlist'}</strong>
                    <span lang={nameEs.trim() ? 'es' : undefined}>
                      {nameEs.trim() ? nameEs.trim() : 'No Spanish name, so Spanish readers see the English name'}
                    </span>
                    <span className="pe-summary-count">{shortCount(tips, items.length - tips)}</span>
                  </div>
                  <button type="button" className="ps-link" onClick={() => go(0)}>
                    Change
                  </button>
                </div>

                <section className="st-dialog-section nt-section">
                  <div className="pe-section-head">
                    <span className="st-section-title">In this playlist ({items.length})</span>
                    <button type="button" className="ps-link" onClick={() => go(1)}>
                      Add more
                    </button>
                  </div>
                  <span className="nt-hint">People see the items in this order.</span>
                  <PlaylistItems items={items} onMove={move} onRemove={remove} />
                </section>
              </div>

              <aside className="pl-editor-side">
                <PlaylistPreview nameEn={nameEn} nameEs={nameEs} items={items} />
              </aside>
            </div>
          )}

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="st-dialog-actions nt-dialog-foot">
          {step === 0 ? (
            <button type="button" className="st-button" disabled={busy} onClick={onClose}>
              Cancel
            </button>
          ) : (
            <button type="button" className="st-button" disabled={busy} onClick={() => go(step - 1)}>
              <NavIcon name="back" size={16} />
              Back
            </button>
          )}
          <span className="pe-spacer" />
          {canDraft && (
            <button type="button" className="st-button" disabled={busy} onClick={() => void saveAsDraft()}>
              Save as draft
            </button>
          )}
          <button type="submit" className="st-button is-green" disabled={busy}>
            {step === REVIEW ? (
              <>
                <NavIcon name="playlist" size={16} />
                {busy ? 'Saving...' : editing ? 'Save changes' : 'Save playlist'}
              </>
            ) : step === 0 ? (
              'Next: add items'
            ) : (
              `Next: review (${items.length})`
            )}
          </button>
        </div>
      </form>
    </div>
  )
}