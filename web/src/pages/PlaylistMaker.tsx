import { useEffect, useState } from 'react'
import { LeafDecor } from '../components/layout/LeafDecor'
import { PickFooter } from '../components/playlists/PickFooter'
import { PickRow } from '../components/playlists/PickRow'
import { EditIcon } from '../components/playlists/PlaylistIcons'
import { useLang } from '../i18n/languageContext'
import { PLAYLISTS } from '../i18n/strings/playlists'
import { useStrings } from '../i18n/useStrings'
import { fetchOwnPlaylist, updateOwnPlaylist, type PlaylistRecipe } from '../utils/playlistsApi'

// Editing your own playlist: its name, and only the recipes already in it.
// Unchecking a recipe takes it out on save. Recipes are added from the
// playlist's Add button (pages/PlaylistPicker.tsx). Books are only read.
// Styled like the picker: the name is the title, rows are compact, and the
// bottom bar holds Cancel and Save.

type Props = {
  playlistId: number
  onSaved: (id: number) => void
  onCancel: () => void
}

const MAX_NAME = 60

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
    if (busy || !recipes) return
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

  return (
    <div className="account-screen nf-screen pl-maker pk-screen">
      <LeafDecor className="account-leaf" />

      <div className="library-head">
        <div className="library-head-text">
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
          <p className="library-sub">{t.editSub}</p>
        </div>
      </div>

      {loadError && <p className="message">{t.couldNotLoad}</p>}
      {!recipes && !loadError && <div className="skeleton nf-skel-detail" aria-hidden="true" />}

      {recipes && (
        <>
          <div className="bp-head pk-tools">
            <p className="pl-field-label bp-label">{t.inThisPlaylist(kept.length)}</p>
          </div>

          <ul className="pk-list">
            {recipes.map((r) => {
              const on = kept.includes(r.id)
              return (
                <li key={r.id}>
                  <PickRow
                    title={r.title}
                    photo={r.photo}
                    meta={on ? r.vegetableName : t.willRemove}
                    on={on}
                    onToggle={() => toggle(r.id)}
                  />
                </li>
              )
            })}
          </ul>

          <p className="pl-empty pk-note">{t.editAddHint}</p>

          {error && <p className="message">{error}</p>}

          <PickFooter
            cancelLabel={t.cancel}
            saveLabel={busy ? t.saving : t.saveChanges}
            busy={busy}
            onCancel={onCancel}
            onSave={save}
          />
        </>
      )}
    </div>
  )
}