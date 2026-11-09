import type { PlaylistVegetable } from '../../types/playlists'
import { imageUrl } from '../../utils/images'
import { NavIcon } from '../icons/NavIcons'

// Compact vegetable picker: small round photos in one wrapped row.

type Props = {
  vegetables: PlaylistVegetable[]
  value: string
  onChange: (code: string) => void
}

export function VegetableStrip({ vegetables, value, onChange }: Props) {
  return (
    <div className="ps-veg" role="radiogroup" aria-label="Vegetable">
      {vegetables.map((v) => (
        <button
          key={v.code}
          type="button"
          role="radio"
          aria-checked={value === v.code}
          className={value === v.code ? 'ps-veg-item is-active' : 'ps-veg-item'}
          onClick={() => onChange(v.code)}
        >
          {v.image ? (
            <img className="ps-veg-img" src={imageUrl(v.image)} alt="" loading="lazy" />
          ) : (
            <span className="ps-veg-img" aria-hidden="true">
              <NavIcon name="leaf" size={18} />
            </span>
          )}
          <span>{v.name}</span>
        </button>
      ))}
    </div>
  )
}