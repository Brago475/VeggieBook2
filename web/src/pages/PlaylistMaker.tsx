import { useEffect, useState } from 'react'
import { SafeImage } from '../components/common/SafeImage'
import { LeafDecor } from '../components/layout/LeafDecor'
import { useLang } from '../i18n/languageContext'
import { PLAYLISTS } from '../i18n/strings/playlists'
import { useStrings } from '../i18n/useStrings'
import { coverSrc } from '../utils/coverSrc'
import { fetchOwnPlaylist, updateOwnPlaylist, type PlaylistRecipe } from '../utils/playlistsApi'

// Editing your own playlist: its name, and only the recipes already in it.
// Unchecking a recipe takes it out on save. Recipes are added from a
// VeggieBook's ⋮ on home (pages/BookPlaylist.tsx). Books are only read.

type Props = {
  // Null only for the old New playlist address, which now points to books.
  playlistId: number | null
  onSaved: (id: number) => void
  onCancel: () => void
}

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

export function PlaylistMaker({ playlistId, onSaved, onCancel }: Props) {
  const t = useStrings(PLAYLISTS)
  const { lang } = useLang()
  const [recipes, setRecipes] = useState<PlaylistRecipe[] | null>(null)
  const [name, setName] = useState('')
  const [kept, setKept] = useState<number[]>([])
  const [loadError, setLoadError] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (playlistId === null) return
    let live = true
    fetchOwnPlaylist(playlistId, lang)
      .then((d) => {
        if (!live) return
        const list = d.items.filter((i): i is PlaylistRecipe => i.kind === 'recipe')
        setRecipes(list)
        setName((prev) => prev || d.name)
        setKept((prev) => (prev.length > 0 ? prev : list.map((r) => r.id)))
      })
      .catch(() => {
        if (live) setLoadError(true)
      })
    return () => {
      live = false
    }
  }, [playlistId, lang])

  function toggle(id: number) {
    setKept((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
    setError(null)
  }

  async function save() {
    if (busy || playlistId === null || !recipes) return
    const trimmed = name.trim()
    if (!trimmed) return setError(t.needName)
    const ids = recipes.map((r) => r.id).filter((id) => kept.includes(id))
    if (ids.length === 0) return setError(t.needKeep)

    setBusy(true)
    setError(null)
    try {
      await updateOwnPlaylist(playlistId, trimmed, ids)
      onSaved(playlistId)
    } catch (err) {
      setError(err instanceof Error ? err.message : t.somethingWrong)
      setBusy(false)
    }
  }

  if (playlistId === null) {
    return (
      <div className="account-screen nf-screen pl-maker">
        <LeafDecor className="account-leaf" />
        <p className="pl-empty">{t.mineEmpty}</p>
        <div className="pl-savebar">
          <button type="button" className="pl-btn" onClick={onCancel}>
            {t.backToPlaylists}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="account-screen nf-screen pl-maker">
      <LeafDecor className="account-leaf" />

      <div className="library-head">
        <div className="library-head-text">
          <h1 className="library-title">{t.makerEdit}</h1>
          <p className="library-sub">{t.editSub}</p>
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
      {!recipes && !loadError && <div className="skeleton nf-skel-detail" aria-hidden="true" />}

      {recipes && (
        <section className="bp-section">
          <p className="pl-field-label bp-label">{t.inThisPlaylist(kept.length)}</p>
          <ul className="nf-list">
            {recipes.map((r) => {
              const on = kept.includes(r.id)
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    className={on ? 'pl-pick is-on' : 'pl-pick'}
                    aria-pressed={on}
                    onClick={() => toggle(r.id)}
                  >
                    <SafeImage className="recipe-thumb" src={r.photo ? coverSrc(r.photo) : null} />
                    <span className="bp-row-text">
                      <span className="pl-pick-title">{r.title}</span>
                      <span className="bp-row-meta">{on ? r.vegetableName : t.willRemove}</span>
                    </span>
                    <Check on={on} />
                  </button>
                </li>
              )
            })}
          </ul>
          <p className="pl-empty">{t.editAddHint}</p>
        </section>
      )}

      {error && <p className="message">{error}</p>}

      <div className="pl-savebar">
        <button type="button" className="pl-btn" disabled={busy} onClick={onCancel}>
          {t.cancel}
        </button>
        <button type="button" className="pl-btn is-primary" disabled={busy || !recipes} onClick={save}>
          {busy ? t.saving : t.saveChanges}
        </button>
      </div>
    </div>
  )
}