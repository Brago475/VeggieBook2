import type { PickedItem } from '../../types/playlists'
import { NavIcon } from '../icons/NavIcons'
import { ItemThumb, KindTag } from './ItemBits'
import { itemKey } from './playlistFormat'

// The playlist in the order people will see it.

type Props = {
  items: PickedItem[]
  onMove: (index: number, by: -1 | 1) => void
  onRemove: (index: number) => void
}

export function PlaylistItems({ items, onMove, onRemove }: Props) {
  if (items.length === 0) {
    return <p className="st-muted">Nothing added yet. Pick a vegetable or a topic above and choose View all.</p>
  }

  return (
    <ol className="pl-items">
      {items.map((item, i) => (
        <li key={itemKey(item.kind, item.id)} className="pl-item">
          <span className="pl-item-pos">{i + 1}</span>
          <ItemThumb kind={item.kind} photo={item.photo} />
          <div className="pl-item-text">
            <span className="pl-result-meta">
              <KindTag kind={item.kind} />
              {item.vegetableName}
              {item.code ? `, ${item.code}` : ''}
            </span>
            <strong>{item.title}</strong>
          </div>
          <div className="pl-item-actions">
            <button
              type="button"
              className="pl-icon-button"
              aria-label="Move up"
              disabled={i === 0}
              onClick={() => onMove(i, -1)}
            >
              <NavIcon name="up" size={16} />
            </button>
            <button
              type="button"
              className="pl-icon-button"
              aria-label="Move down"
              disabled={i === items.length - 1}
              onClick={() => onMove(i, 1)}
            >
              <NavIcon name="chevron" size={16} />
            </button>
            <button type="button" className="pl-icon-button" aria-label="Remove" onClick={() => onRemove(i)}>
              <NavIcon name="close" size={16} />
            </button>
          </div>
        </li>
      ))}
    </ol>
  )
}