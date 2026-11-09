import { useEffect, useRef, useState } from 'react'
import { LeafDecor } from '../components/layout/LeafDecor'
import { BookPicker } from '../components/playlists/BookPicker'
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

// Making or changing your own playlist: a name, then your saved books, one
// open at a time, with their recipes tapped to pick. Books are only read.

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
  const [openId, setOpenId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // The name, picks and open book are set from the first load only.
  const filled = useRef(false)

  useEffect(() => {
    let live = true
    Promise.all([fetchBookChoices(lang), playlistId === null ? Promise.resolve(null) : fetchOwnPlaylist(playlistId, lang)])
      .then(([choices, existing]) => {
        if (!live) return
        setBooks(choices)
        if (filled.current) return
        filled.current = true
        const ids = existing?.recipeIds ?? []
        if (existing) {
          setName(existing.name)
          setPicked(ids)
        }
        const first = choices.find((b) => b.recipes.some((r) => ids.includes(r.id))) ?? choices[0]
        setOpenId(first?.id ?? null)
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

  function setMany(ids: number[], on: boolean) {
    setPicked((prev) => (on ? [...prev, ...ids.filter((id) => !prev.includes(id))] : prev.filter((x) => !ids.includes(x))))
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

      {books && books.length > 0 && (
        <>
          <p className="pl-field-label pl-books-label">{t.yourBooks}</p>
          <div className="pl-books">
            {books.map((book) => (
              <BookPicker
                key={book.id}
                book={book}
                open={openId === book.id}
                picked={picked}
                onOpen={() => setOpenId(openId === book.id ? null : book.id)}
                onToggle={toggle}
                onSetMany={setMany}
              />
            ))}
          </div>
        </>
      )}

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