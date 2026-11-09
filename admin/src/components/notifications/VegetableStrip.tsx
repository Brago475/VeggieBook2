import type { PlaylistVegetable } from '../../types/playlists'
import { imageUrl } from '../../utils/images'
import { NavIcon } from '../icons/NavIcons'

// Compact vegetable picker: small round photos spread across one row.
// With allowAny, the first choice means all vegetables (value '').

type Props = {
  vegetables: PlaylistVegetable[]
  value: string
  onChange: (code: string) => void
  allowAny?: boolean
}

function Choice({ active, label, image, onClick }: { active: boolean; label: string; image: string | null; onClick: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      className={active ? 'ps-veg-item is-active' : 'ps-veg-item'}
      onClick={onClick}
    >
      {image ? (
        <img className="ps-veg-img" src={imageUrl(image)} alt="" loading="lazy" />
      ) : (
        <span className="ps-veg-img" aria-hidden="true">
          <NavIcon name="leaf" size={18} />
        </span>
      )}
      <span>{label}</span>
    </button>
  )
}

export function VegetableStrip({ vegetables, value, onChange, allowAny = false }: Props) {
  return (
    <div className="ps-veg" role="radiogroup" aria-label="Vegetable">
      {allowAny && <Choice active={value === ''} label="All" image={null} onClick={() => onChange('')} />}
      {vegetables.map((v) => (
        <Choice key={v.code} active={value === v.code} label={v.name} image={v.image} onClick={() => onChange(v.code)} />
      ))}
    </div>
  )
}