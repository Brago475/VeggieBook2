import { useState } from 'react'
import '../../styles/saved-playlists.css'
import type { PlaylistSummary } from '../../types/playlists'
import { NavIcon } from '../icons/NavIcons'
import { PlaylistCollage } from '../playlists/PlaylistCollage'
import { shortCount } from '../playlists/playlistFormat'

// Saved playlists as small photo cards in the notification editor. A click
// picks one. A search box shows once the list is long.

const SEARCH_FROM = 7

type Props = {
  playlists: PlaylistSummary[]
  value: number | null
  onChange: (id: number) => void
}

export function SavedPlaylists({ playlists, value, onChange }: Props) {
  const [q, setQ] = useState('')
  const term = q.trim().toLowerCase()
  const shown = term
    ? playlists.filter(
        (p) => p.nameEn.toLowerCase().includes(term) || (p.nameEs ?? '').toLowerCase().includes(term),
      )
    : playlists

  return (
    <div className="sp">
      {playlists.length >= SEARCH_FROM && (
        <div className="ps-search">
          <NavIcon name="search" size={16} />
          <input
            value={q}
            aria-label="Search saved playlists"
            placeholder="Search saved playlists"
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button type="button" className="ps-clear" aria-label="Clear search" onClick={() => setQ('')}>
              &#10005;
            </button>
          )}
        </div>
      )}

      {shown.length === 0 ? (
        <p className="st-muted">No saved playlist matches.</p>
      ) : (
        <ul className="sp-grid" role="radiogroup" aria-label="Saved playlist">
          {shown.map((p) => {
            const on = p.id === value
            return (
              <li key={p.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={on}
                  className={on ? 'sp-card is-on' : 'sp-card'}
                  onClick={() => onChange(p.id)}
                >
                  <PlaylistCollage photos={p.photos} />
                  <span className={on ? 'ps-card-check is-on' : 'ps-card-check'} aria-hidden="true">
                    {on ? '\u2713' : '+'}
                  </span>
                  <span className="sp-text">
                    <strong className="sp-name">{p.nameEn}</strong>
                    <span className="sp-count">{shortCount(p.tips, p.recipes)}</span>
                    {(p.auto || p.archived) && (
                      <span className="sp-tags">
                        {p.auto && <span className="sp-tag">Automatic</span>}
                        {p.archived && <span className="sp-tag">Archived</span>}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}