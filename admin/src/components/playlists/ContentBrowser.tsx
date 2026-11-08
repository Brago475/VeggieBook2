import { useState } from 'react'
import type { BrowseItem, BrowseResult, PlaylistOptions } from '../../types/playlists'
import { browseContent } from '../../utils/playlistsApi'
import { NavIcon } from '../icons/NavIcons'
import { ItemThumb, KindTag } from './ItemBits'
import { countText, itemKey, topicLabel } from './playlistFormat'

// Quick start and View all: pick a vegetable, a topic from the question
// labels, or type a search, then see every match before adding.

type Props = {
  options: PlaylistOptions
  picked: Set<string>
  onAdd: (items: BrowseItem[]) => void
}

export function ContentBrowser({ options, picked, onAdd }: Props) {
  const [vegetable, setVegetable] = useState('')
  const [topic, setTopic] = useState('')
  const [q, setQ] = useState('')
  const [result, setResult] = useState<BrowseResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const vegName = options.vegetables.find((v) => v.code === vegetable)?.name ?? null
  const canSearch = vegetable !== '' || topic !== '' || q.trim() !== ''

  function countFor(t: string) {
    const rows = options.counts.filter((c) => c.topic === t && (vegetable === '' || c.vegetable === vegetable))
    return {
      tips: rows.reduce((sum, c) => sum + c.tips, 0),
      recipes: rows.reduce((sum, c) => sum + c.recipes, 0),
    }
  }

  async function viewAll() {
    if (!canSearch || loading) return
    setLoading(true)
    setError(null)
    try {
      setResult(await browseContent({ vegetable, topic, q: q.trim() }))
    } catch (err) {
      setResult(null)
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const all = result ? [...result.tips, ...result.recipes] : []
  const notAdded = all.filter((i) => !picked.has(itemKey(i.kind, i.id)))

  return (
    <div className="pl-browse">
      <div className="pl-browse-filters">
        <label className="nt-field">
          <span className="nt-label">Vegetable</span>
          <select
            className="nt-input"
            value={vegetable}
            onChange={(e) => {
              setVegetable(e.target.value)
              setResult(null)
            }}
          >
            <option value="">Any vegetable</option>
            {options.vegetables.map((v) => (
              <option key={v.code} value={v.code}>
                {v.name}
              </option>
            ))}
          </select>
        </label>

        <label className="nt-field">
          <span className="nt-label">Topic</span>
          <select
            className="nt-input"
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value)
              setResult(null)
            }}
          >
            <option value="">Any topic</option>
            {options.topics.map((t) => {
              const c = countFor(t.topic)
              return (
                <option key={t.topic} value={t.topic}>
                  {topicLabel(t, vegName)} ({countText(c.tips, c.recipes)})
                </option>
              )
            })}
          </select>
        </label>
      </div>

      <div className="pl-browse-search">
        <input
          className="nt-input"
          value={q}
          placeholder="Search titles, for example muffins or BR-212"
          onChange={(e) => {
            setQ(e.target.value)
            setResult(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void viewAll()
            }
          }}
        />
        <button type="button" className="st-button" disabled={!canSearch || loading} onClick={() => void viewAll()}>
          <NavIcon name="search" size={16} />
          {loading ? 'Loading...' : 'View all'}
        </button>
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {result && (
        <div className="pl-results">
          <div className="pl-results-head">
            <span>{countText(result.tipCount, result.recipeCount)} found</span>
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
            <p className="st-muted pl-results-empty">Nothing matches. Try another vegetable or topic.</p>
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