import { useEffect, useMemo, useState } from 'react'
import { LeafDecor } from '../components/layout/LeafDecor'
import { BookShelf, type ShelfBook } from '../components/playlists/BookShelf'
import { PickFooter } from '../components/playlists/PickFooter'
import { PickHead } from '../components/playlists/PickHead'
import { PickRow } from '../components/playlists/PickRow'
import { EditIcon } from '../components/playlists/PlaylistIcons'
import { useLang } from '../i18n/languageContext'
import { PLAYLISTS } from '../i18n/strings/playlists'
import { useStrings } from '../i18n/useStrings'
import type { BookSummary } from '../types'
import { apiFetch } from '../utils/api'
import {
  createOwnPlaylist,
  fetchBookChoices,
  fetchOwnPlaylist,
  updateOwnPlaylist,
  type BookChoice,
} from '../utils/playlistsApi'

// Picking recipes from saved VeggieBooks, for a new playlist (no
// playlistId) or to add to one already made. A shelf of book covers picks
// which book's recipes show; startBookId opens it on one book, as when
// coming from a book's ⋮. When adding, recipes already in the playlist are
// marked and cannot be picked again; taking recipes out is done on the
// edit screen. Books are only read.

type Props = {
  playlistId: number | null
  startBookId?: string | null
  onSaved: (id: number) => void
  onCancel: () => void
  onMakeBook: () => void
}

type Target = { name: string; ids: number[] }

const MAX_NAME = 60

function shortDate(iso: string, lang: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US', { month: 'short', day: 'numeric' })
}

export function PlaylistPicker({ playlistId, startBookId = null, onSaved, onCancel, onMakeBook }: Props) {
  const t = useStrings(PLAYLISTS)
  const { lang } = useLang()
  const adding = playlistId !== null

  const [books, setBooks] = useState<BookChoice[] | null>(null)
  const [covers, setCovers] = useState<Map<string, string>>(new Map())
  const [target, setTarget] = useState<Target | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [name, setName] = useState('')
  const [picked, setPicked] = useState<number[]>([])
  const [active, setActive] = useState<string | null>(startBookId)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let live = true
    Promise.all([
      fetchBookChoices(lang),
      // Covers are only decoration; the picker works without them.
      apiFetch<BookSummary[]>('/books').catch(() => [] as BookSummary[]),
      playlistId === null ? Promise.resolve(null) : fetchOwnPlaylist(playlistId, lang),
    ])
      .then(([choices, summaries, own]) => {
        if (!live) return
        setBooks(choices.filter((b) => b.recipes.length > 0))
        setCovers(new Map(summaries.map((s) => [s.id, s.cover])))
        if (own) {
          const ids = own.recipeIds ?? own.items.filter((i) => i.kind === 'recipe').map((i) => i.id)
          setTarget({ name: own.name, ids })
        }
      })
      .catch(() => {
        if (live) setLoadError(true)
      })
    return () => {
      live = false
    }
  }, [playlistId, lang])

  const already = useMemo(() => new Set(target?.ids ?? []), [target])
  const current = books?.find((b) => b.id === active) ?? books?.[0] ?? null

  const shelf: ShelfBook[] = (books ?? []).map((b) => ({
    id: b.id,
    name: b.vegetableName,
    date: shortDate(b.createdAt, lang),
    cover: covers.get(b.id) ?? null,
    picked: b.recipes.filter((r) => picked.includes(r.id)).length,
  }))

  const visible = current ? current.recipes.map((r) => r.id).filter((id) => !already.has(id)) : []
  const allPicked = visible.length > 0 && visible.every((id) => picked.includes(id))

  function toggle(id: number) {
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
    setError(null)
  }

  function toggleAll() {
    setPicked((prev) =>
      allPicked ? prev.filter((id) => !visible.includes(id)) : [...new Set([...prev, ...visible])],
    )
    setError(null)
  }

  async function save() {
    if (busy || !books) return
    setError(null)

    if (!adding) {
      const trimmed = name.trim()
      if (!trimmed) return setError(t.needName)
      if (picked.length === 0) return setError(t.needRecipe)
      setBusy(true)
      try {
        const created = await createOwnPlaylist(trimmed, picked)
        onSaved(created.id)
      } catch (err) {
        setError(err instanceof Error ? err.message : t.somethingWrong)
        setBusy(false)
      }
      return
    }

    if (!target || playlistId === null) return
    if (picked.length === 0) return setError(t.needRecipe)
    setBusy(true)
    try {
      await updateOwnPlaylist(playlistId, target.name, [...target.ids, ...picked])
      onSaved(playlistId)
    } catch (err) {
      setError(err instanceof Error ? err.message : t.somethingWrong)
      setBusy(false)
    }
  }

  const loading = books === null && !loadError
  const noBooks = books !== null && books.length === 0

  return (
    <div className="account-screen nf-screen pl-maker pk-screen">
      <LeafDecor className="account-leaf" />

      <PickHead kicker={adding ? t.kickerAdd : t.makerNew} sub={adding ? t.addSub : t.newSub}>
        {adding ? (
          <h1 className="library-title pk-title">{target?.name ?? ''}</h1>
        ) : (
          <h1 className="library-title pk-title">
            <label className="pk-name">
              <input
                className="pk-name-input"
                value={name}
                maxLength={MAX_NAME}
                placeholder={t.namePrompt}
                aria-label={t.nameLabel}
                onChange={(e) => {
                  setName(e.target.value)
                  setError(null)
                }}
              />
              <EditIcon className="pk-name-icon" />
            </label>
          </h1>
        )}
      </PickHead>

      {loadError && <p className="message">{t.couldNotLoad}</p>}
      {loading && <div className="skeleton nf-skel-detail" aria-hidden="true" />}

      {noBooks && (
        <>
          <p className="pl-empty">{t.noBooks}</p>
          <PickFooter
            cancelLabel={t.cancel}
            saveLabel={t.makeBook}
            busy={false}
            onCancel={onCancel}
            onSave={onMakeBook}
          />
        </>
      )}

      {current && (
        <>
          <p className="pl-field-label pk-shelf-label">{t.yourBooks}</p>
          <BookShelf
            label={t.yourBooks}
            prevLabel={t.prevBooks}
            nextLabel={t.nextBooks}
            books={shelf}
            active={current.id}
            onChange={setActive}
          />

          <div className="bp-head pk-tools">
            <p className="pl-field-label bp-label">{t.bookCount(current.vegetableName, current.recipes.length)}</p>
            {visible.length > 0 && (
              <button type="button" className="bp-link" onClick={toggleAll}>
                {allPicked ? t.clearBook : t.pickAll}
              </button>
            )}
          </div>

          <ul className="pk-list">
            {current.recipes.map((r) => (
              <li key={r.id}>
                <PickRow
                  title={r.title}
                  photo={r.photo}
                  on={picked.includes(r.id)}
                  inLabel={already.has(r.id) ? t.inPlaylist : null}
                  onToggle={() => toggle(r.id)}
                />
              </li>
            ))}
          </ul>

          {error && <p className="message">{error}</p>}

          <PickFooter
            cancelLabel={t.cancel}
            saveLabel={busy ? t.saving : adding ? t.addSave(picked.length) : t.save(picked.length)}
            busy={busy}
            onCancel={onCancel}
            onSave={save}
          />
        </>
      )}
    </div>
  )
}