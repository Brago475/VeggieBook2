import { useEffect, useState } from 'react'
import { SafeImage } from '../components/common/SafeImage'
import { LeafDecor } from '../components/layout/LeafDecor'
import { useLang } from '../i18n/languageContext'
import { PLAYLISTS } from '../i18n/strings/playlists'
import { useStrings } from '../i18n/useStrings'
import { coverSrc } from '../utils/coverSrc'
import {
  createOwnPlaylist,
  fetchBookChoices,
  fetchOwnPlaylist,
  fetchPlaylistLibrary,
  updateOwnPlaylist,
  type BookChoice,
  type OwnPlaylistSummary,
} from '../utils/playlistsApi'
import type { BookPlaylistMode } from '../utils/routes'

// A playlist from one saved VeggieBook, opened from the ⋮ on its card:
// a new playlist, or this book's recipes added to one already made.
// Recipes from other books stay in that playlist. Books are only read.

type Props = {
  bookId: string
  mode: BookPlaylistMode
  onMode: (mode: BookPlaylistMode) => void
  onSaved: (playlistId: number) => void
  onCancel: () => void
}

type Existing = { name: string; ids: number[] }

const MAX_NAME = 60

function Check({ on }: { on: boolean }) {
  return (
    <span className="pl-check" aria-hidden="true">
      {on && (
        <svg viewBox="0 0 24 24" focusable="false">
          <path
            d="M5 12.5l4.5 4.5L19 7.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  )
}

export function BookPlaylist({ bookId, mode, onMode, onSaved, onCancel }: Props) {
  const t = useStrings(PLAYLISTS)
  const { lang } = useLang()
  // Undefined while loading; null when the book has no recipes to add.
  const [book, setBook] = useState<BookChoice | null | undefined>(undefined)
  const [own, setOwn] = useState<OwnPlaylistSummary[]>([])
  const [loadError, setLoadError] = useState(false)
  const [name, setName] = useState('')
  const [picked, setPicked] = useState<number[]>([])
  const [target, setTarget] = useState<number | null>(null)
  const [existing, setExisting] = useState<Existing | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let live = true
    Promise.all([fetchBookChoices(lang), fetchPlaylistLibrary(lang)])
      .then(([choices, library]) => {
        if (!live) return
        const found = choices.find((b) => b.id === bookId)
        setBook(found && found.recipes.length > 0 ? found : null)
        setOwn(library.own)
      })
      .catch(() => {
        if (live) setLoadError(true)
      })
    return () => {
      live = false
    }
  }, [bookId, lang])

  useEffect(() => {
    setPicked([])
    setTarget(null)
    setError(null)
  }, [mode])

  // Adding: the chosen playlist's recipes from this book start checked.
  useEffect(() => {
    if (mode !== 'add' || target === null || !book) {
      setExisting(null)
      return
    }
    let live = true
    fetchOwnPlaylist(target, lang)
      .then((d) => {
        if (!live) return
        const ids = d.recipeIds ?? []
        setExisting({ name: d.name, ids })
        setPicked(ids.filter((id) => book.recipes.some((r) => r.id === id)))
      })
      .catch((err) => {
        if (live) setError(err instanceof Error ? err.message : t.somethingWrong)
      })
    return () => {
      live = false
    }
  }, [mode, target, book, lang, t.somethingWrong])

  const bookIds = book ? book.recipes.map((r) => r.id) : []

  function toggle(id: number) {
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
    setError(null)
  }

  function setAll(on: boolean) {
    setPicked(on ? bookIds : [])
    setError(null)
  }

  async function save() {
    if (busy || !book) return
    setError(null)

    if (mode === 'new') {
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

    if (target === null) return setError(t.needPlaylist)
    if (!existing) return
    const merged = [...existing.ids.filter((id) => !bookIds.includes(id)), ...picked]
    if (merged.length === 0) return setError(t.needRecipe)
    setBusy(true)
    try {
      await updateOwnPlaylist(target, existing.name, merged)
      onSaved(target)
    } catch (err) {
      setError(err instanceof Error ? err.message : t.somethingWrong)
      setBusy(false)
    }
  }

  const showRecipes = book && (mode === 'new' || (target !== null && existing !== null))
  const canSave = !!book && !busy && !(mode === 'add' && own.length === 0)

  return (
    <div className="account-screen nf-screen pl-maker">
      <LeafDecor className="account-leaf" />

      <div className="library-head">
        <div className="library-head-text">
          <h1 className="library-title">{mode === 'new' ? t.makeFromBook : t.addFromBook}</h1>
          {book && <p className="library-sub">{t.bookPlaylistSub(book.vegetableName)}</p>}
        </div>
      </div>

      <div className="pl-switch" role="tablist" aria-label={t.playlists}>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'new'}
          className="pl-switch-btn"
          onClick={() => mode !== 'new' && onMode('new')}
        >
          {t.modeNew}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'add'}
          className="pl-switch-btn"
          onClick={() => mode !== 'add' && onMode('add')}
        >
          {t.modeAdd}
        </button>
      </div>

      {loadError && <p className="message">{t.couldNotLoad}</p>}
      {book === undefined && !loadError && <div className="skeleton nf-skel-detail" aria-hidden="true" />}
      {book === null && <p className="pl-empty">{t.bookNoRecipes}</p>}

      {book && mode === 'new' && (
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

      {book && mode === 'add' && (
        <section className="bp-section">
          <p className="pl-field-label bp-label">{t.choosePlaylist}</p>
          {own.length === 0 ? (
            <p className="pl-empty">{t.noOwnYet}</p>
          ) : (
            <ul className="nf-list">
              {own.map((p) => {
                const on = target === p.id
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      className={on ? 'pl-pick is-on' : 'pl-pick'}
                      aria-pressed={on}
                      onClick={() => setTarget(p.id)}
                    >
                      <SafeImage className="pl-row-cover" src={p.cover ? coverSrc(p.cover) : null} />
                      <span className="bp-row-text">
                        <span className="pl-pick-title">{p.name}</span>
                        <span className="bp-row-meta">{t.counts(0, p.recipes)}</span>
                      </span>
                      <Check on={on} />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}

      {showRecipes && (
        <section className="bp-section">
          <div className="bp-head">
            <p className="pl-field-label bp-label">{t.recipesInBook}</p>
            <div className="bp-tools">
              <button type="button" className="bp-link" disabled={picked.length === bookIds.length} onClick={() => setAll(true)}>
                {t.pickAll}
              </button>
              <button type="button" className="bp-link" disabled={picked.length === 0} onClick={() => setAll(false)}>
                {t.clearBook}
              </button>
            </div>
          </div>
          <ul className="nf-list">
            {book.recipes.map((r) => {
              const on = picked.includes(r.id)
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    className={on ? 'pl-pick is-on' : 'pl-pick'}
                    aria-pressed={on}
                    onClick={() => toggle(r.id)}
                  >
                    <SafeImage className="recipe-thumb" src={r.photo ? coverSrc(r.photo) : null} />
                    <span className="pl-pick-title">{r.title}</span>
                    <Check on={on} />
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {error && <p className="message">{error}</p>}

      <div className="pl-savebar">
        <button type="button" className="pl-btn" disabled={busy} onClick={onCancel}>
          {t.cancel}
        </button>
        <button type="button" className="pl-btn is-primary" disabled={!canSave} onClick={save}>
          {busy ? t.saving : mode === 'new' ? t.save(picked.length) : t.addSave(picked.length)}
        </button>
      </div>
    </div>
  )
}