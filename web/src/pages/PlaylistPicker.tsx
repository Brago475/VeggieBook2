import { useEffect, useMemo, useState } from 'react'
import { LeafDecor } from '../components/layout/LeafDecor'
import { BookChips, type BookChip } from '../components/playlists/BookChips'
import { PickFooter } from '../components/playlists/PickFooter'
import { PickRow } from '../components/playlists/PickRow'
import { useLang } from '../i18n/languageContext'
import { PLAYLISTS } from '../i18n/strings/playlists'
import { useStrings } from '../i18n/useStrings'
import {
  createOwnPlaylist,
  fetchBookChoices,
  fetchOwnPlaylist,
  updateOwnPlaylist,
  type BookChoice,
} from '../utils/playlistsApi'

// Picking recipes from every saved VeggieBook, for a new playlist (no
// playlistId) or to add to one already made. Chips narrow the list to one
// book. When adding, recipes already in the playlist are marked and cannot
// be picked again; taking recipes out is done on the edit screen. Books are
// only read.

type Props = {
  playlistId: number | null
  onSaved: (id: number) => void
  onCancel: () => void
  onMakeBook: () => void
}

type Target = { name: string; ids: number[] }
type Recipe = BookChoice['recipes'][number]
type Group = { id: string; label: string; recipes: Recipe[] }

const MAX_NAME = 60

// Books of the same vegetable get a number so their chips differ.
function chipLabels(books: BookChoice[]): Map<string, string> {
  const totals = new Map<string, number>()
  for (const b of books) totals.set(b.vegetableName, (totals.get(b.vegetableName) ?? 0) + 1)

  const seen = new Map<string, number>()
  const labels = new Map<string, string>()
  for (const b of books) {
    const n = (seen.get(b.vegetableName) ?? 0) + 1
    seen.set(b.vegetableName, n)
    labels.set(b.id, (totals.get(b.vegetableName) ?? 0) > 1 ? `${b.vegetableName} ${n}` : b.vegetableName)
  }
  return labels
}

export function PlaylistPicker({ playlistId, onSaved, onCancel, onMakeBook }: Props) {
  const t = useStrings(PLAYLISTS)
  const { lang } = useLang()
  const adding = playlistId !== null

  const [books, setBooks] = useState<BookChoice[] | null>(null)
  const [target, setTarget] = useState<Target | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [name, setName] = useState('')
  const [picked, setPicked] = useState<number[]>([])
  const [active, setActive] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let live = true
    Promise.all([
      fetchBookChoices(lang),
      playlistId === null ? Promise.resolve(null) : fetchOwnPlaylist(playlistId, lang),
    ])
      .then(([choices, own]) => {
        if (!live) return
        setBooks(choices.filter((b) => b.recipes.length > 0))
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

  const labels = useMemo(() => chipLabels(books ?? []), [books])
  const already = useMemo(() => new Set(target?.ids ?? []), [target])

  // All books: each recipe shows once, under the first book that has it.
  const groups: Group[] = useMemo(() => {
    if (!books) return []
    const list = active === null ? books : books.filter((b) => b.id === active)
    const shown = new Set<number>()
    const result: Group[] = []
    for (const b of list) {
      const recipes: Recipe[] = []
      for (const r of b.recipes) {
        if (shown.has(r.id)) continue
        shown.add(r.id)
        recipes.push(r)
      }
      if (recipes.length > 0) result.push({ id: b.id, label: t.fromBook(b.vegetableName), recipes })
    }
    return result
  }, [books, active, t])

  const visible = groups.flatMap((g) => g.recipes.map((r) => r.id)).filter((id) => !already.has(id))
  const allVisiblePicked = visible.length > 0 && visible.every((id) => picked.includes(id))
  const noneVisiblePicked = visible.every((id) => !picked.includes(id))

  const chips: BookChip[] = (books ?? []).map((b) => ({
    id: b.id,
    label: labels.get(b.id) ?? b.vegetableName,
    picked: b.recipes.filter((r) => picked.includes(r.id)).length,
  }))

  function toggle(id: number) {
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
    setError(null)
  }

  function pickAll() {
    setPicked((prev) => [...new Set([...prev, ...visible])])
    setError(null)
  }

  function clearVisible() {
    setPicked((prev) => prev.filter((id) => !visible.includes(id)))
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

  const title = adding ? (target ? t.addTo(target.name) : t.addFromBook) : t.makerNew
  const loading = books === null && !loadError
  const noBooks = books !== null && books.length === 0

  return (
    <div className="account-screen nf-screen pl-maker pk-screen">
      <LeafDecor className="account-leaf" />

      <div className="library-head">
        <div className="library-head-text">
          <h1 className="library-title">{title}</h1>
          {!adding && <p className="library-sub">{t.pickerSub}</p>}
        </div>
      </div>

      {adding && <p className="pk-hint">{t.addSub}</p>}

      {!adding && !noBooks && (
        <label className="pl-field">
          <span className="pl-field-label">{t.nameLabel}</span>
          <input
            className="pl-input"
            value={name}
            maxLength={MAX_NAME}
            placeholder={t.namePlaceholder}
            onChange={(e) => {
              setName(e.target.value)
              setError(null)
            }}
          />
        </label>
      )}

      {loadError && <p className="message">{t.couldNotLoad}</p>}
      {loading && <div className="skeleton nf-skel-detail" aria-hidden="true" />}

      {noBooks && (
        <>
          <p className="pl-empty">{t.noBooks}</p>
          <div className="pl-savebar">
            <button type="button" className="pl-btn" onClick={onCancel}>
              {t.cancel}
            </button>
            <button type="button" className="pl-btn is-primary" onClick={onMakeBook}>
              {t.makeBook}
            </button>
          </div>
        </>
      )}

      {books && books.length > 0 && (
        <>
          {books.length > 1 && (
            <BookChips
              label={t.booksFilter}
              allLabel={t.allBooks}
              allPicked={picked.length}
              books={chips}
              active={active}
              onChange={setActive}
            />
          )}

          <div className="bp-head pk-tools">
            <p className="pl-field-label bp-label">{t.pickRecipes}</p>
            <div className="bp-tools">
              <button type="button" className="bp-link" disabled={allVisiblePicked || visible.length === 0} onClick={pickAll}>
                {t.pickAll}
              </button>
              <button type="button" className="bp-link" disabled={noneVisiblePicked} onClick={clearVisible}>
                {t.clearBook}
              </button>
            </div>
          </div>

          {groups.map((g) => (
            <section key={g.id} className="pk-group">
              {active === null && books.length > 1 && <p className="pl-field-label pk-group-label">{g.label}</p>}
              <ul className="pk-list">
                {g.recipes.map((r) => (
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
            </section>
          ))}

          {error && <p className="message">{error}</p>}

          <PickFooter
            countLabel={t.bookPicked(picked.length)}
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