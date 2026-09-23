import type { Vegetable } from '../types'
import { SafeImage } from './SafeImage'

// One row in the vegetable picker: thumbnail on the left, name on the right.
// The whole row is a button so the tap target is the full width.
//
// SafeImage, so a thumbnail that fails to load shows the VeggieBook mark
// instead of a broken-image icon.

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
      <SafeImage className="veg-thumb" src={`/images/${vegetable.image}`} />
      <span className="veg-name">{vegetable.name}</span>
    </button>
  )
}