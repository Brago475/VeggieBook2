import { useState } from 'react'
import { useMealLabels } from '../../hooks/useMealLabels'
import type { PlaylistKind } from '../../types/playlists'
import { imageUrl } from '../../utils/images'
import { NavIcon } from '../icons/NavIcons'
import { itemKey } from './playlistFormat'
import { VegetableTiles } from './VegetableTiles'

// Meal labels screen: every recipe and tip as a photo card with Breakfast,
// Lunch, Dinner and Snack chips. A tap saves right away. Labels feed both
// automatic and hand-picked playlists.

export function MealLabels() {
  const { data, error, pending, toggle } = useMealLabels()
  const [vegetable, setVegetable] = useState('')
  const [kind, setKind] = useState<PlaylistKind>('recipe')
  const [onlyEmpty, setOnlyEmpty] = useState(false)

  if (!data && error) {
    return (
      <p className="error" role="alert">
        {error}
      </p>
    )
  }
  if (!data) return <p className="st-muted">Loading meal labels...</p>

  const pool = kind === 'recipe' ? data.recipes : data.tips
  const shown = pool.filter(
    (i) => (!vegetable || i.vegetable === vegetable) && (!onlyEmpty || i.meals.length === 0),
  )
  const labeledRecipes = data.recipes.filter((r) => r.meals.length > 0).length
  const vegName = (code: string) => data.vegetables.find((v) => v.code === code)?.name ?? code

  return (
    <div className="ml-panel">
      <p className="ml-progress">
        <strong>
          {labeledRecipes} of {data.recipes.length}
        </strong>{' '}
        recipes have a meal label. Tap a label to add or remove it. It saves right away.
      </p>

      <VegetableTiles vegetables={data.vegetables} value={vegetable} onChange={setVegetable} allowAny />

      <div className="ml-filters">
        <div className="seg" role="radiogroup" aria-label="Show">
          {(['recipe', 'tip'] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={kind === k}
              className={kind === k ? 'seg-btn is-active' : 'seg-btn'}
              onClick={() => setKind(k)}
            >
              {k === 'recipe' ? `Recipes (${data.recipes.length})` : `Tips (${data.tips.length})`}
            </button>
          ))}
        </div>
        <label className="nt-check">
          <input type="checkbox" checked={onlyEmpty} onChange={(e) => setOnlyEmpty(e.target.checked)} />
          <span>Not labeled yet</span>
        </label>
        <span className="st-muted">{shown.length} shown</span>
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {shown.length === 0 ? (
        <p className="st-muted">Nothing to show with these filters.</p>
      ) : (
        <ul className="ml-grid">
          {shown.map((item) => {
            const key = itemKey(item.kind, item.id)
            const saving = pending.has(key)
            return (
              <li key={key} className={item.meals.length === 0 ? 'ml-card is-empty' : 'ml-card'}>
                {item.photo ? (
                  <img className="ml-photo" src={imageUrl(item.photo)} alt="" loading="lazy" />
                ) : (
                  <span className="ml-photo" aria-hidden="true">
                    <NavIcon name="leaf" size={28} />
                  </span>
                )}
                <div className="ml-body">
                  <span className="ml-meta">
                    {vegName(item.vegetable)}
                    {item.code ? `, ${item.code}` : ''}
                  </span>
                  <strong>{item.title}</strong>
                  {item.snippet && <span className="ml-snippet">{item.snippet}</span>}
                </div>
                <div className="ml-chips">
                  {data.meals.map((m) => {
                    const on = item.meals.includes(m.key)
                    return (
                      <button
                        key={m.key}
                        type="button"
                        aria-pressed={on}
                        className={on ? 'ml-chip is-on' : 'ml-chip'}
                        disabled={saving}
                        onClick={() => void toggle(item, m.key)}
                      >
                        {m.en}
                      </button>
                    )
                  })}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}