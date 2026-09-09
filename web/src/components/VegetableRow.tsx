import type { Vegetable } from '../types'

// One row in the vegetable picker: thumbnail on the left, name on the right.
// The whole row is a button so the tap target is the full width.

type Props = {
  vegetable: Vegetable
  onSelect: (vegetable: Vegetable) => void
}

export function VegetableRow({ vegetable, onSelect }: Props) {
  return (
    <button
      type="button"
      className="veg-row"
      onClick={() => onSelect(vegetable)}
    >
      <img
        className="veg-thumb"
        src={`/images/${vegetable.image}`}
        alt=""
        loading="lazy"
      />
      <span className="veg-name">{vegetable.name}</span>
    </button>
  )
}