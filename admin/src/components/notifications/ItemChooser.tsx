import { useEffect, useState } from 'react'
import '../../styles/item-chooser.css'
import type { BrowseResult, MealKey, PickedItem, PlaylistOptions } from '../../types/playlists'
import { browseContent } from '../../utils/playlistsApi'
import { NavIcon } from '../icons/NavIcons'
import { ItemThumb, KindTag } from '../playlists/ItemBits'
import { itemKey, MAX_ITEMS, mealCount, pickedFromBrowse } from '../playlists/playlistFormat'
import { ZoomImage } from '../playlists/ZoomImage'
import { MealPills } from './MealPills'
import { VegetableStrip } from './VegetableStrip'

// Search, vegetable, meal and kind filters, the picked tray, and the results
// as photo cards; a click on a card adds or removes it. With no filter it
// shows everything. The parent holds the picked items. Used by Choose items
// and the playlist editor.

type KindFilter = 'all' | 'recipe' | 'tip'

const KINDS: { id: KindFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'recipe', label: 'Recipes' },
  { id: 'tip', label: 'Tips' },
]

type Props = {
  options: PlaylistOptions
  chosen: PickedItem[]
  onChange: (items: PickedItem[]) => void
}

export function ItemChooser({ options, chosen, onChange }: Props) {
  const [vegetable, setVegetable] = useState('')
  const [meal, setMeal] = useState<MealKey | ''>('')
  const [kind, setKind] = useState<KindFilter>('all')
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [result, setResult] = useState<BrowseResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setSearch(q.trim()), 300)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    let live = true
    setLoading(true)
    browseContent({ vegetable, meal, q: search })
      .then((r) => {
        if (!live) return
        setResult(r)
        setError(null)
      })
      .catch((err) => {
        if (!live) return
        setResult(null)
        setError((err as Error).message)
      })
      .finally(() => {
        if (live) setLoading(false)
      })
    return () => {
      live = false
    }
  }, [vegetable, meal, search])

  const chosenKeys = new Set(chosen.map((i) => itemKey(i.kind, i.id)))
  const recipes = result ? result.recipes.map(pickedFromBrowse) : []
  const tips = result ? result.tips.map(pickedFromBrowse) : []
  const found = kind === 'recipe' ? recipes : kind === 'tip' ? tips : [...recipes, ...tips]
  const notChosen = found.filter((i) => !chosenKeys.has(itemKey(i.kind, i.id)))
  const room = Math.max(MAX_ITEMS - chosen.length, 0)

  const countOf = (k: KindFilter) => (k === 'recipe' ? recipes.length : k === 'tip' ? tips.length : recipes.length + tips.length)

  const add = (items: PickedItem[]) => onChange([...chosen, ...items])
  const remove = (item: PickedItem) =>
    onChange(chosen.filter((i) => itemKey(i.kind, i.id) !== itemKey(item.kind, item.id)))

  return (
    <>
      <div className="ps-search">
        <NavIcon name="search" size={16} />
        <input
          value={q}
          aria-label="Search recipes and tips"
          placeholder="Search, for example muffins or BR-212"
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              setSearch(q.trim())
            }
          }}
        />
        {q && (
          <button type="button" className="ps-clear" aria-label="Clear search" onClick={() => setQ('')}>
            &#10005;
          </button>
        )}
      </div>

      <VegetableStrip vegetables={options.vegetables} value={vegetable} onChange={setVegetable} allowAny />
      <MealPills
        meals={options.meals}
        value={meal}
        onChange={setMeal}
        countFor={(m) => mealCount(options.counts, m, vegetable)}
        allowNone
      />

      {chosen.length > 0 && (
        <div className="ps-group">
          <div className="ps-group-head">
            <span className="nt-label">Picked ({chosen.length})</span>
            <button type="button" className="ps-link" onClick={() => onChange([])}>
              Remove all
            </button>
          </div>
          <div className="ps-tray ic-tray">
            {chosen.map((i) => (
              <button
                key={itemKey(i.kind, i.id)}
                type="button"
                className="ps-chip"
                title={`Remove ${i.title}`}
                onClick={() => remove(i)}
              >
                <ItemThumb kind={i.kind} photo={i.photo} />
                <span className="ps-chip-text">{i.title}</span>
                <span aria-hidden="true">&#10005;</span>
              </button>
            ))}
          </div>
          {chosen.length > MAX_ITEMS && (
            <p className="pl-note">
              A playlist holds up to {MAX_ITEMS} items. Remove {chosen.length - MAX_ITEMS} to go on.
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {!result && loading && <p className="st-muted">Loading...</p>}

      {result && (
        <div className="ps-group">
          <div className="ps-group-head">
            <div className="ic-head-left">
              <div className="ic-kinds" role="tablist" aria-label="Show">
                {KINDS.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    role="tab"
                    aria-selected={kind === k.id}
                    className={kind === k.id ? 'ic-kind is-active' : 'ic-kind'}
                    onClick={() => setKind(k.id)}
                  >
                    {k.label}
                    <span>{countOf(k.id)}</span>
                  </button>
                ))}
              </div>
              {loading && <span className="ic-updating">Updating...</span>}
            </div>
            {notChosen.length > 0 && notChosen.length <= room && (
              <button type="button" className="ps-link" onClick={() => add(notChosen)}>
                Add all {notChosen.length}
              </button>
            )}
          </div>

          {found.length === 0 ? (
            <p className="st-muted">Nothing matches. Try another vegetable, meal or search.</p>
          ) : (
            <ul className="ps-cards">
              {found.map((i) => {
                const on = chosenKeys.has(itemKey(i.kind, i.id))
                return (
                  <li key={itemKey(i.kind, i.id)}>
                    <button
                      type="button"
                      aria-pressed={on}
                      className={on ? 'ps-card is-on' : 'ps-card'}
                      onClick={() => (on ? remove(i) : add([i]))}
                    >
                      {i.photo ? (
                        <ZoomImage className="ps-card-img" photo={i.photo} />
                      ) : (
                        <span className="ps-card-img" aria-hidden="true">
                          <NavIcon name="leaf" size={24} />
                        </span>
                      )}
                      <span className={on ? 'ps-card-check is-on' : 'ps-card-check'} aria-hidden="true">
                        {on ? '\u2713' : '+'}
                      </span>
                      <span className="ps-card-text">
                        <span className="ps-card-meta">
                          <KindTag kind={i.kind} />
                          {i.code && <span>{i.code}</span>}
                        </span>
                        <span className="ps-card-title">{i.title}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </>
  )
}