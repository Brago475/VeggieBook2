import '../../styles/nutrition.css'
import type { Vegetable } from '../../types'
import { SafeImage } from '../common/SafeImage'
import { NutritionButton } from './NutritionButton'

// One row in the vegetable picker: thumbnail and name in a button that
// starts the book, and a Nutrition button beside it. The two are siblings,
// since a button cannot hold another button.
//
// SafeImage, so a thumbnail that fails to load shows the VeggieBook mark
// instead of a broken-image icon.

type Props = {
  vegetable: Vegetable
  onSelect: (vegetable: Vegetable) => void
}

export function VegetableRow({ vegetable, onSelect }: Props) {
  return (
    <div className="veg-item">
      <button type="button" className="veg-row" onClick={() => onSelect(vegetable)}>
        <SafeImage className="veg-thumb" src={`/images/${vegetable.image}`} />
        <span className="veg-name">{vegetable.name}</span>
      </button>
      <NutritionButton vegetable={vegetable} />
    </div>
  )
}