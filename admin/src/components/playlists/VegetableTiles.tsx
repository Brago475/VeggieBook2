import type { PlaylistVegetable } from '../../types/playlists'
import { imageUrl } from '../../utils/images'
import { NavIcon } from '../icons/NavIcons'

// Vegetable picker as photo tiles. With allowAny, the first tile means all
// vegetables (value '').

type Props = {
  vegetables: PlaylistVegetable[]
  value: string
  onChange: (code: string) => void
  allowAny?: boolean
}

export function VegetableTiles({ vegetables, value, onChange, allowAny = false }: Props) {
  return (
    <div className="vt-grid" role="radiogroup" aria-label="Vegetable">
      {allowAny && (
        <button
          type="button"
          role="radio"
          aria-checked={value === ''}
          className={value === '' ? 'vt-tile is-active' : 'vt-tile'}
          onClick={() => onChange('')}
        >
          <span className="vt-img" aria-hidden="true">
            <NavIcon name="leaf" size={24} />
          </span>
          All vegetables
        </button>
      )}
      {vegetables.map((v) => (
        <button
          key={v.code}
          type="button"
          role="radio"
          aria-checked={value === v.code}
          className={value === v.code ? 'vt-tile is-active' : 'vt-tile'}
          onClick={() => onChange(v.code)}
        >
          {v.image ? (
            <img className="vt-img" src={imageUrl(v.image)} alt="" loading="lazy" />
          ) : (
            <span className="vt-img" aria-hidden="true">
              <NavIcon name="leaf" size={24} />
            </span>
          )}
          {v.name}
        </button>
      ))}
    </div>
  )
}