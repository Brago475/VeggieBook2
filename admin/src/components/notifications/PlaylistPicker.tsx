import { useEffect, useRef, useState } from 'react'
import '../../styles/playlist-steps.css'
import type { PickedItem, PlaylistOptions, PlaylistSummary } from '../../types/playlists'
import { browseContent, fetchPlaylist, fetchPlaylistList, fetchPlaylistOptions } from '../../utils/playlistsApi'
import { NavIcon } from '../icons/NavIcons'
import {
  MAX_ITEMS,
  MAX_NAME,
  mealCount,
  pickedFromBrowse,
  pickedFromEntry,
  shortCount,
} from '../playlists/playlistFormat'
import { ChooseItems } from './ChooseItems'
import { MealPills } from './MealPills'
import { KIND_LABELS, type PlaylistChoice } from './playlistChoice'
import { PlaylistResult } from './PlaylistResult'
import { SavedPlaylists } from './SavedPlaylists'
import { VegetableStrip } from './VegetableStrip'

// The Playlist part of the notification editor. Off by default. When on, it
// asks one thing at a time; a finished step folds into one line with Change.

type Props = {
  value: PlaylistChoice
  // The playlist already on this message, offered even if archived since.
  currentPlaylistId: number | null
  onChange: (next: PlaylistChoice) => void
}

const KINDS = [
  { id: 'saved', hint: 'Send one made before', icon: 'playlist' },
  { id: 'auto', hint: 'Vegetable plus meal', icon: 'leaf' },
  { id: 'pick', hint: 'Choose the items', icon: 'plus' },
] as const

function Step({ n, title, done = false }: { n: number; title: string; done?: boolean }) {
  return (
    <div className="ps-step">
      <span className={done ? 'ps-num is-done' : 'ps-num'}>{done ? '\u2713' : n}</span>
      <strong>{title}</strong>
    </div>
  )
}

export function PlaylistPicker({ value, currentPlaylistId, onChange }: Props) {
  const [options, setOptions] = useState<PlaylistOptions | null>(null)
  const [playlists, setPlaylists] = useState<PlaylistSummary[] | null>(null)
  const [loaded, setLoaded] = useState<PickedItem[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [choosing, setChoosing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const reloadedFor = useRef<number | null>(null)

  const { on, kind, playlistId, vegetable, meal, picked, name } = value
  const set = (patch: Partial<PlaylistChoice>) => onChange({ ...value, ...patch })

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

  // A playlist saved by this editor is not in the first list; load it once.
  useEffect(() => {
    if (kind !== 'saved' || playlistId === null || !playlists) return
    if (playlists.some((p) => p.id === playlistId) || reloadedFor.current === playlistId) return
    reloadedFor.current = playlistId
    fetchPlaylistList()
      .then(setPlaylists)
      .catch(() => {})
  }, [kind, playlistId, playlists])

  useEffect(() => {
    let job: Promise<PickedItem[]> | null = null
    if (on && kind === 'saved' && playlistId !== null) {
      job = fetchPlaylist(playlistId).then((d) => d.items.map(pickedFromEntry))
    } else if (on && kind === 'auto' && vegetable && meal) {
      job = browseContent({ vegetable, meal, q: '' }).then((r) => [...r.tips, ...r.recipes].map(pickedFromBrowse))
    }
    if (!job) {
      setLoaded(null)
      return
    }
    let live = true
    setLoading(true)
    job
      .then((list) => {
        if (!live) return
        setLoaded(list)
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
  }, [on, kind, playlistId, vegetable, meal])

  if (choosing && options) {
    return (
      <ChooseItems
        options={options}
        initial={picked}
        onBack={() => setChoosing(false)}
        onDone={(items) => {
          set({ picked: items })
          setChoosing(false)
        }}
      />
    )
  }

  const choosable = (playlists ?? []).filter((p) => !p.archived || p.id === currentPlaylistId)
  const savedName = playlists?.find((p) => p.id === playlistId)?.nameEn ?? 'Saved playlist'
  const vegName = options?.vegetables.find((v) => v.code === vegetable)?.name
  const mealName = options?.meals.find((m) => m.key === meal)?.en
  const autoName = vegName && mealName ? `${mealName} ideas with ${vegName.toLowerCase()}` : ''
  const autoItems = loaded && kind === 'auto' ? loaded.slice(0, MAX_ITEMS) : loaded
  const pickedTips = picked.filter((i) => i.kind === 'tip').length

  return (
    <div className="ps">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        className={on ? 'ps-toggle is-on' : 'ps-toggle'}
        onClick={() => set({ on: !on })}
      >
        <span className="ps-switch" aria-hidden="true" />
        <span className="ps-switch-text">
          <strong>Add a playlist</strong>
          <span>{on ? 'People see an Open playlist button and can keep or skip it.' : 'Off: this is a message only.'}</span>
        </span>
      </button>

      {on && error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {on && !options && !error && <p className="st-muted">Loading...</p>}

      {on && options && kind === null && (
        <>
          <Step n={1} title="What kind?" />
          <div className="ps-kinds" role="radiogroup" aria-label="Kind of playlist">
            {KINDS.map((k) => (
              <button key={k.id} type="button" role="radio" aria-checked={false} className="ps-kind" onClick={() => set({ kind: k.id })}>
                <NavIcon name={k.icon} size={18} />
                <strong>{KIND_LABELS[k.id]}</strong>
                <span>{k.hint}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {on && options && kind !== null && (
        <>
          <div className="ps-done">
            <Step n={1} title="Kind" done />
            <span className="ps-done-value">{KIND_LABELS[kind]}</span>
            <button type="button" className="ps-link" onClick={() => set({ kind: null })}>
              Change
            </button>
          </div>

          {kind === 'saved' && (
            <>
              <Step n={2} title="Which one?" />
              {choosable.length === 0 ? (
                <p className="st-muted">No saved playlists yet. Use Pick myself to make one.</p>
              ) : (
                <SavedPlaylists playlists={choosable} value={playlistId} onChange={(id) => set({ playlistId: id })} />
              )}
              {playlistId !== null && <PlaylistResult name={savedName} items={loaded} loading={loading} />}
            </>
          )}

          {kind === 'auto' && (
            <>
              <Step n={2} title="Vegetable" />
              <VegetableStrip vegetables={options.vegetables} value={vegetable} onChange={(code) => set({ vegetable: code })} />
              <Step n={3} title="Meal" />
              <MealPills
                meals={options.meals}
                value={meal}
                onChange={(m) => set({ meal: m })}
                countFor={(m) => mealCount(options.counts, m, vegetable)}
              />
              {vegetable && meal && (
                <PlaylistResult
                  name={autoName}
                  items={autoItems}
                  loading={loading}
                  capped={(loaded?.length ?? 0) > MAX_ITEMS}
                />
              )}
            </>
          )}

          {kind === 'pick' && (
            <>
              <Step n={2} title="Items" />
              <div className="ps-items">
                <span>
                  {picked.length === 0 ? (
                    'Nothing chosen yet.'
                  ) : (
                    <>
                      <strong>{picked.length === 1 ? '1 item:' : `${picked.length} items:`}</strong>{' '}
                      {shortCount(pickedTips, picked.length - pickedTips)}
                    </>
                  )}
                </span>
                <button type="button" className="st-button is-green" onClick={() => setChoosing(true)}>
                  {picked.length === 0 ? 'Choose items' : 'Change items'}
                </button>
              </div>
              <Step n={3} title="Name" />
              <input
                className="nt-input"
                aria-label="Playlist name"
                maxLength={MAX_NAME}
                value={name}
                placeholder="For example: Zucchini snacks"
                onChange={(e) => set({ name: e.target.value })}
              />
              <span className="nt-hint">Saved so you can send it again under Saved.</span>
              {picked.length > 0 && (
                <PlaylistResult name={name.trim() || 'New playlist'} items={picked} loading={false} />
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}