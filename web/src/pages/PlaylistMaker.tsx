import { useEffect, useRef, useState } from 'react'
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
  updateOwnPlaylist,
  type BookChoice,
} from '../utils/playlistsApi'

// Making or changing your own playlist: a name, then the recipes in your
// saved books, grouped by book, tapped to pick. Books are only read.

type Props = {
  // Null for a new playlist.
  playlistId: number | null
  onSaved: (id: number) => void
  onCancel: () => void
}

const MAX_NAME = 60

export function PlaylistMaker({ playlistId, onSaved, onCancel }: Props) {
  const t = useStrings(PLAYLISTS)
  const { lang } = useLang()
  const [books, setBooks] = useState<BookChoice[] | null>(null)
  const [name, setName] = useState('')
  const [picked, setPicked] = useState<number[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // The name and picks are filled from the playlist once, never over edits.
  const filled = useRef(false)

  useEffect(() => {
    let live = true
    Promise.all([fetchBookChoices(lang), playlistId === null ? Promise.resolve(null) : fetchOwnPlaylist(playlistId, lang)])
      .then(([choices, existing]) => {
        if (!live) return
        setBooks(choices)
        if (existing && !filled.current) {
          filled.current = true
          setName(existing.name)
          setPicked(existing.recipeIds ?? [])
        }
      })
      .catch((err) => {
        if (live) setLoadError(err instanceof Error ? err.message : t.somethingWrong)
      })
    return () => {
      live = false
    }
  }, [playlistId, lang, t.somethingWrong])

  function toggle(id: number) {
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
    setError(null)
  }

  async function save() {
    if (busy) return
    const trimmed = name.trim()
    if (!trimmed) {
      setError(t.needName)
      return
    }
    if (picked.length === 0) {
      setError(t.needRecipe)
      return
    }

    setBusy(true)
    setError(null)
    try {
      if (playlistId === null) {
        const created = await createOwnPlaylist(trimmed, picked)
        onSaved(created.id)
      } else {
        await updateOwnPlaylist(playlistId, trimmed, picked)
        onSaved(playlistId)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.somethingWrong)
      setBusy(false)
    }
  }

  return (
    <div className="account-screen nf-screen pl-maker">
      <LeafDecor className="account-leaf" />

      <div className="library-head">
        <div className="library-head-text">
          <h1 className="library-title">{playlistId === null ? t.makerNew : t.makerEdit}</h1>
          <p className="library-sub">{t.makerSub}</p>
        </div>
      </div>

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

      {loadError && <p className="message">{t.couldNotLoad}</p>}
      {!books && !loadError && <div className="skeleton nf-skel-detail" aria-hidden="true" />}

      {books && books.length === 0 && <p className="pl-empty">{t.noBooks}</p>}

      {books?.map((book) => (
        <section key={book.id} className="nf-section">
          <h2 className="nf-group-label">{t.fromBook(book.vegetableName)}</h2>
          <ul className="nf-list">
            {book.recipes.map((r) => {
              const on = picked.includes(r.id)
              return (
                <li key={`${book.id}:${r.id}`}>
                  <button
                    type="button"
                    className={on ? 'pl-pick is-on' : 'pl-pick'}
                    aria-pressed={on}
                    onClick={() => toggle(r.id)}
                  >
                    <SafeImage className="recipe-thumb" src={r.photo ? coverSrc(r.photo) : null} />
                    <span className="pl-pick-title">{r.title}</span>
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
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      {error && <p className="message">{error}</p>}

      <div className="pl-savebar">
        <button type="button" className="pl-btn" disabled={busy} onClick={onCancel}>
          {t.cancel}
        </button>
        <button type="button" className="pl-btn is-primary" disabled={busy} onClick={save}>
          {busy ? t.saving : t.save(picked.length)}
        </button>
      </div>
    </div>
  )
}