import type { PlaylistSummary } from '../../types/playlists'

// Filter chips above the playlist cards, each with its count. Drafts lists
// saved drafts; Meal labels opens the labels screen instead of a list.

export type PlaylistView = 'active' | 'auto' | 'hand' | 'drafts' | 'archived' | 'labels'

const FILTERS: { id: PlaylistView; label: string }[] = [
  { id: 'active', label: 'Active' },
  { id: 'auto', label: 'Automatic' },
  { id: 'hand', label: 'Made by hand' },
  { id: 'drafts', label: 'Drafts' },
  { id: 'archived', label: 'Archived' },
  { id: 'labels', label: 'Meal labels' },
]

export function inView(p: PlaylistSummary, view: PlaylistView): boolean {
  switch (view) {
    case 'active':
      return !p.archived
    case 'auto':
      return !p.archived && p.auto
    case 'hand':
      return !p.archived && !p.auto
    case 'archived':
      return p.archived
    default:
      return false
  }
}

type Props = {
  list: PlaylistSummary[]
  draftCount: number
  value: PlaylistView
  onChange: (view: PlaylistView) => void
}

export function PlaylistFilters({ list, draftCount, value, onChange }: Props) {
  return (
    <div className="plc-filters" role="tablist" aria-label="Playlist filters">
      {FILTERS.map((f) => {
        const count =
          f.id === 'labels' ? null : f.id === 'drafts' ? draftCount : list.filter((p) => inView(p, f.id)).length
        return (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={value === f.id}
            className={value === f.id ? 'plc-filter is-active' : 'plc-filter'}
            onClick={() => onChange(f.id)}
          >
            {f.label}
            {count !== null && <span className="plc-filter-count">{count}</span>}
          </button>
        )
      })}
    </div>
  )
}