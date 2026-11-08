import { useEffect, useState } from 'react'
import type { BrowseItem, BrowseResult, MealKey, PlaylistOptions } from '../../types/playlists'
import { browseContent } from '../../utils/playlistsApi'
import { NavIcon } from '../icons/NavIcons'
import { ItemThumb, KindTag, MealTags } from './ItemBits'
import { MealButtons } from './MealButtons'
import { countText, itemKey, mealCount } from './playlistFormat'
import { VegetableTiles } from './VegetableTiles'

// Hand-picking: tap a vegetable, a meal, or search, and every match shows
// right away with its photo, ready to add one by one or all at once.

type Props = {
  options: PlaylistOptions
  picked: Set<string>
  onAdd: (items: BrowseItem[]) => void
}

export function ContentBrowser({ options, picked, onAdd }: Props) {
  const [vegetable, setVegetable] = useState('')
  const [meal, setMeal] = useState<MealKey | ''>('')
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [result, setResult] = useState<BrowseResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const all = result ? [...result.tips, ...result.recipes] : []
  const notAdded = all.filter((i) => !picked.has(itemKey(i.kind, i.id)))

  return (
    <div className="pl-browse">
      <span className="nt-label">Vegetable</span>
      <VegetableTiles vegetables={options.vegetables} value={vegetable} onChange={setVegetable} allowAny />

      <span className="nt-label">Meal</span>
      <MealButtons
        meals={options.meals}
        value={meal}
        onChange={setMeal}
        countFor={(m) => mealCount(options.counts, m, vegetable)}
        allowNone
      />

      <div className="pl-browse-search">
        <input
          className="nt-input"
          value={q}
          placeholder="Search titles, for example muffins or BR-212"
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              setSearch(q.trim())
            }
          }}
        />
        <button type="button" className="st-button" onClick={() => setSearch(q.trim())}>
          <NavIcon name="search" size={16} />
          Search
        </button>
        {search && (
          <button
            type="button"
            className="st-button"
            onClick={() => {
              setQ('')
              setSearch('')
            }}
          >
            Clear
          </button>
        )}
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {!result && !loading && (
        <p className="st-muted">Pick a vegetable, a meal, or search to see what you can add.</p>
      )}
      {loading && !result && <p className="st-muted">Loading...</p>}

      {result && (
        <div className="pl-results">
          <div className="pl-results-head">
            <span>
              {countText(result.tipCount, result.recipeCount)} found
              {loading ? ', updating...' : ''}
            </span>
            <button
              type="button"
              className="st-button is-green pl-add"
              disabled={notAdded.length === 0}
              onClick={() => onAdd(notAdded)}
            >
              <NavIcon name="plus" size={16} />
              {notAdded.length === 0 ? 'All added' : `Add all ${notAdded.length}`}
            </button>
          </div>

          {all.length === 0 ? (
            <p className="st-muted pl-results-empty">Nothing matches. Try another vegetable or meal.</p>
          ) : (
            <ul className="pl-result-list">
              {all.map((item) => {
                const added = picked.has(itemKey(item.kind, item.id))
                return (
                  <li key={itemKey(item.kind, item.id)} className="pl-result">
                    <ItemThumb kind={item.kind} photo={item.photo} />
                    <div className="pl-result-text">
                      <span className="pl-result-meta">
                        <KindTag kind={item.kind} />
                        {item.vegetableName}
                        {item.code ? `, ${item.code}` : ''}
                        <MealTags meals={item.meals} names={options.meals} />
                      </span>
                      <strong>{item.title}</strong>
                      {item.snippet && <span className="pl-result-snippet">{item.snippet}</span>}
                    </div>
                    <button
                      type="button"
                      className={added ? 'st-button pl-add is-added' : 'st-button pl-add'}
                      disabled={added}
                      onClick={() => onAdd([item])}
                    >
                      {added ? 'Added' : 'Add'}
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