import { useState } from 'react'
import type { PickedItem } from '../../types/playlists'
import { ItemThumb, KindTag } from '../playlists/ItemBits'
import { countText, itemKey, MAX_ITEMS } from '../playlists/playlistFormat'
import { ZoomThumb } from './ZoomThumb'

// The one line every playlist choice ends with: name, what goes out, and
// View all to list the items.

type Props = {
  name: string
  items: PickedItem[] | null
  loading: boolean
  capped?: boolean
}

export function PlaylistResult({ name, items, loading, capped = false }: Props) {
  const [open, setOpen] = useState(false)

  if (loading && !items) return <p className="st-muted">Loading items...</p>
  if (!items) return null

  const tips = items.filter((i) => i.kind === 'tip').length
  const recipes = items.length - tips
  const photo = items.find((i) => i.photo)?.photo ?? null

  return (
    <div className="ps-result">
      <div className="ps-result-row">
        <ItemThumb kind="recipe" photo={photo} />
        <div className="ps-result-text">
          <strong>{name}</strong>
          <span>{items.length === 0 ? 'Nothing matches yet' : `${countText(tips, recipes)} go out`}</span>
        </div>
        {items.length > 0 && (
          <button type="button" className="ps-link" aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? 'Hide' : 'View all'}
          </button>
        )}
      </div>

      {capped && <p className="pl-note">Only the first {MAX_ITEMS} go out.</p>}

      {open && (
        <ul className="ps-list">
          {items.map((i) => (
            <li key={itemKey(i.kind, i.id)}>
              <ZoomThumb kind={i.kind} photo={i.photo} />
              <KindTag kind={i.kind} />
              <span className="ps-title">{i.title}</span>
              {i.code && <span className="ps-code">{i.code}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}