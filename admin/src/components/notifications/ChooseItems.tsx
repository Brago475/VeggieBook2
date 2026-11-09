import { useEffect, useState } from 'react'
import type { BrowseResult, MealKey, PickedItem, PlaylistOptions } from '../../types/playlists'
import { browseContent } from '../../utils/playlistsApi'
import { ItemThumb, KindTag } from '../playlists/ItemBits'
import { countText, itemKey, MAX_ITEMS, pickedFromBrowse } from '../playlists/playlistFormat'

// Hand-picks the items for a new playlist. Back drops the changes; Done
// keeps them. Chosen items stay on top in the order they were picked.

type Props = {
  options: PlaylistOptions
  initial: PickedItem[]
  onBack: () => void
  onDone: (items: PickedItem[]) => void
}

function PickRow({ item, checked, onToggle }: { item: PickedItem; checked: boolean; onToggle: () => void }) {
  return (
    <li>
      <button type="button" className="ps-pick-row" aria-pressed={checked} onClick={onToggle}>
        <span className={checked ? 'ps-box is-on' : 'ps-box'} aria-hidden="true">
          {checked ? '\u2713' : ''}
        </span>
        <ItemThumb kind={item.kind} photo={item.photo} />
        <KindTag kind={item.kind} />
        <span className="ps-title">{item.title}</span>
        {item.code && <span className="ps-code">{item.code}</span>}
      </button>
    </li>
  )
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

      <div className="ps-choose-filters">
        <input
          className="nt-input"
          value={q}
          placeholder="Search, for example muffins or BR-212"
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              setSearch(q.trim())
            }
          }}
        />
        <select className="nt-input" value={vegetable} onChange={(e) => setVegetable(e.target.value)}>
          <option value="">All vegetables</option>
          {options.vegetables.map((v) => (
            <option key={v.code} value={v.code}>
              {v.name}
            </option>
          ))}
        </select>
        <select className="nt-input" value={meal} onChange={(e) => setMeal(e.target.value as MealKey | '')}>
          <option value="">All meals</option>
          {options.meals.map((m) => (
            <option key={m.key} value={m.key}>
              {m.en}
            </option>
          ))}
        </select>
      </div>

      {chosen.length > MAX_ITEMS && <p className="pl-note">A playlist holds up to {MAX_ITEMS} items.</p>}

      {chosen.length > 0 && (
        <div className="ps-group">
          <span className="nt-label">Chosen ({chosen.length})</span>
          <ul className="ps-list ps-pick">
            {chosen.map((i) => (
              <PickRow key={itemKey(i.kind, i.id)} item={i} checked onToggle={() => remove(i)} />
            ))}
          </ul>
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
          {notChosen.length === 0 ? (
            <p className="st-muted">{found.length === 0 ? 'Nothing matches.' : 'All of these are chosen.'}</p>
          ) : (
            <ul className="ps-list ps-pick">
              {notChosen.map((i) => (
                <PickRow key={itemKey(i.kind, i.id)} item={i} checked={false} onToggle={() => add([i])} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}