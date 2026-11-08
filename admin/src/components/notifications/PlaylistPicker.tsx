import { useEffect, useState } from 'react'
import type { PlaylistMode } from '../../types/notifications'
import type { MealKey, PickedItem, PlaylistOptions, PlaylistSummary } from '../../types/playlists'
import { browseContent, fetchPlaylist, fetchPlaylistList, fetchPlaylistOptions } from '../../utils/playlistsApi'
import { ItemThumb, KindTag } from '../playlists/ItemBits'
import { MealButtons } from '../playlists/MealButtons'
import {
  countText,
  itemKey,
  MAX_ITEMS,
  mealCount,
  pickedFromBrowse,
  pickedFromEntry,
} from '../playlists/playlistFormat'
import { VegetableTiles } from '../playlists/VegetableTiles'

// The Playlist part of the notification editor: none, automatic (a
// vegetable and a meal, built by the server from meal labels), or one made
// in the Playlists section. View all lists every item that goes out.

export type PlaylistChoice = {
  mode: PlaylistMode
  vegetable: string
  meal: MealKey | ''
  playlistId: number | null
}

const MODES: { id: PlaylistMode; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'auto', label: 'Automatic' },
  { id: 'made', label: 'One you made' },
]

type Props = {
  value: PlaylistChoice
  // The playlist already on this message, offered even if archived since.
  currentPlaylistId: number | null
  onChange: (next: PlaylistChoice) => void
}

export function PlaylistPicker({ value, currentPlaylistId, onChange }: Props) {
  const [options, setOptions] = useState<PlaylistOptions | null>(null)
  const [playlists, setPlaylists] = useState<PlaylistSummary[] | null>(null)
  const [items, setItems] = useState<PickedItem[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { mode, vegetable, meal, playlistId } = value

  useEffect(() => {
    let live = true
    Promise.all([fetchPlaylistOptions(), fetchPlaylistList()])
      .then(([o, l]) => {
        if (!live) return
        setOptions(o)
        setPlaylists(l)
      })
      .catch((err) => {
        if (live) setError((err as Error).message)
      })
    return () => {
      live = false
    }
  }, [])

  useEffect(() => {
    const ready = (mode === 'auto' && vegetable !== '' && meal !== '') || (mode === 'made' && playlistId !== null)
    if (!ready) {
      setItems(null)
      return
    }
    let live = true
    setLoading(true)
    const run =
      mode === 'auto'
        ? browseContent({ vegetable, meal, q: '' }).then((r) => [...r.tips, ...r.recipes].map(pickedFromBrowse))
        : fetchPlaylist(playlistId as number).then((d) => d.items.map(pickedFromEntry))
    run
      .then((list) => {
        if (!live) return
        setItems(list)
        setError(null)
      })
      .catch((err) => {
        if (live) setError((err as Error).message)
      })
      .finally(() => {
        if (live) setLoading(false)
      })
    return () => {
      live = false
    }
  }, [mode, vegetable, meal, playlistId])

  const set = (patch: Partial<PlaylistChoice>) => onChange({ ...value, ...patch })
  const choosable = (playlists ?? []).filter((p) => !p.archived || p.id === currentPlaylistId)
  const vegName = options?.vegetables.find((v) => v.code === vegetable)?.name
  const mealName = options?.meals.find((m) => m.key === meal)?.en
  const autoName = vegName && mealName ? `${mealName} ideas with ${vegName.toLowerCase()}` : null
  const tips = items?.filter((i) => i.kind === 'tip').length ?? 0
  const recipes = (items?.length ?? 0) - tips

  return (
    <div className="pp-block">
      <div className="seg" role="radiogroup" aria-label="What the notification opens">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={mode === m.id}
            className={mode === m.id ? 'seg-btn is-active' : 'seg-btn'}
            onClick={() => set({ mode: m.id })}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === 'none' && <p className="st-muted">A message only, with no playlist.</p>}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {mode !== 'none' && !options && !error && <p className="st-muted">Loading...</p>}

      {mode === 'auto' && options && (
        <>
          <span className="nt-label">Vegetable</span>
          <VegetableTiles vegetables={options.vegetables} value={vegetable} onChange={(code) => set({ vegetable: code })} />
          <span className="nt-label">Meal</span>
          <MealButtons
            meals={options.meals}
            value={meal}
            onChange={(m) => set({ meal: m })}
            countFor={(m) => mealCount(options.counts, m, vegetable)}
          />
          {autoName && (
            <p className="pp-name">
              Name in the app: <strong>{autoName}</strong>
            </p>
          )}
        </>
      )}

      {mode === 'made' &&
        playlists &&
        (choosable.length === 0 ? (
          <p className="st-muted">No playlists yet. Make one in the Playlists section first.</p>
        ) : (
          <label className="nt-field">
            <span className="nt-label">Playlist</span>
            <select
              className="nt-input"
              value={playlistId ?? ''}
              onChange={(e) => set({ playlistId: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">Pick a playlist</option>
              {choosable.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nameEn} ({countText(p.tips, p.recipes)}){p.auto ? ', automatic' : ''}
                  {p.archived ? ', archived' : ''}
                </option>
              ))}
            </select>
          </label>
        ))}

      {mode !== 'none' && loading && <p className="st-muted">Loading items...</p>}

      {mode !== 'none' && !loading && items && (
        <details className="pp-items" open>
          <summary className="pp-summary">
            View all: {items.length === 0 ? 'nothing matches yet' : `${countText(tips, recipes)} go out`}
          </summary>
          {mode === 'auto' && items.length > MAX_ITEMS && (
            <p className="pl-note">Only the first {MAX_ITEMS} go out.</p>
          )}
          {items.length > 0 && (
            <ul className="pp-list">
              {items.map((i) => (
                <li key={itemKey(i.kind, i.id)}>
                  <ItemThumb kind={i.kind} photo={i.photo} />
                  <KindTag kind={i.kind} />
                  <span className="pp-title">{i.title}</span>
                  {i.code && <span className="pp-code">{i.code}</span>}
                </li>
              ))}
            </ul>
          )}
        </details>
      )}
    </div>
  )
}