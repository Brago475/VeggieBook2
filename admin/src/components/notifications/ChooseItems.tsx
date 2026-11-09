import { useEffect, useState } from 'react'
import type { BrowseResult, MealKey, PickedItem, PlaylistOptions } from '../../types/playlists'
import { imageUrl } from '../../utils/images'
import { browseContent } from '../../utils/playlistsApi'
import { NavIcon } from '../icons/NavIcons'
import { KindTag } from '../playlists/ItemBits'
import { countText, itemKey, MAX_ITEMS, mealCount, pickedFromBrowse } from '../playlists/playlistFormat'
import { MealPills } from './MealPills'
import { VegetableStrip } from './VegetableStrip'
import { ZoomThumb } from './ZoomThumb'

// Hand-picks the items for a new playlist. Results show as photo cards;
// a click checks or unchecks one. Back drops the changes; Done keeps them.

type Props = {
  options: PlaylistOptions
  initial: PickedItem[]
  onBack: () => void
  onDone: (items: PickedItem[]) => void
}

export function ChooseItems({ options, initial, onBack, onDone }: Props) {
  const [chosen, setChosen] = useState<PickedItem[]>(initial)
  const [vegetable, setVegetable] = useState('')
  const [meal, setMeal] = useState<MealKey | ''>('')
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
    if (!vegetable && !meal && !search) {
      setResult(null)
      return
    }
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
  const found = result ? [...result.tips, ...result.recipes].map(pickedFromBrowse) : []
  const notChosen = found.filter((i) => !chosenKeys.has(itemKey(i.kind, i.id)))

  const add = (items: PickedItem[]) => setChosen((c) => [...c, ...items])
  const remove = (item: PickedItem) =>
    setChosen((c) => c.filter((i) => itemKey(i.kind, i.id) !== itemKey(item.kind, item.id)))

  return (
    <div className="ps-choose">
      <div className="ps-choose-head">
        <button type="button" className="ps-link" onClick={onBack}>
          &#8249; Back
        </button>
        <strong>Choose items</strong>
        <button type="button" className="st-button is-green" onClick={() => onDone(chosen)}>
          Done ({chosen.length})
        </button>
      </div>

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
          <span className="nt-label">Chosen ({chosen.length})</span>
          <div className="ps-tray">
            {chosen.map((i) => (
              <button
                key={itemKey(i.kind, i.id)}
                type="button"
                className="ps-chip"
                title={`Remove ${i.title}`}
                onClick={() => remove(i)}
              >
                <ZoomThumb kind={i.kind} photo={i.photo} />
                <span className="ps-chip-text">{i.title}</span>
                <span aria-hidden="true">&#10005;</span>
              </button>
            ))}
          </div>
          {chosen.length > MAX_ITEMS && <p className="pl-note">A playlist holds up to {MAX_ITEMS} items.</p>}
        </div>
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {!result && !loading && <p className="st-muted">Pick a vegetable or a meal, or search, to see items.</p>}
      {loading && !result && <p className="st-muted">Loading...</p>}

      {result && (
        <div className="ps-group">
          <div className="ps-group-head">
            <span className="nt-label">
              {countText(result.tipCount, result.recipeCount)} found{loading ? ', updating...' : ''}
            </span>
            {notChosen.length > 0 && (
              <button type="button" className="ps-link" onClick={() => add(notChosen)}>
                Add all {notChosen.length}
              </button>
            )}
          </div>

          {found.length === 0 ? (
            <p className="st-muted">Nothing matches. Try another vegetable or meal.</p>
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
                        <img className="ps-card-img" src={imageUrl(i.photo)} alt="" loading="lazy" />
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
    </div>
  )
}