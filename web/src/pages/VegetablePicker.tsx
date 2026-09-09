import { ScreenLabel } from '../components/ScreenLabel'
import { VegetableRow } from '../components/VegetableRow'
import type { Vegetable } from '../types'

type Props = {
  vegetables: Vegetable[]
  loading: boolean
  onSelect: (vegetable: Vegetable) => void
}

export function VegetablePicker({ vegetables, loading, onSelect }: Props) {
  return (
    <>
      <ScreenLabel>Select VeggieBook</ScreenLabel>
      {loading && <p className="message">Loading...</p>}
      <ul>
        {vegetables.map((veg) => (
          <li key={veg.code}>
            <VegetableRow vegetable={veg} onSelect={onSelect} />
          </li>
        ))}
      </ul>
    </>
  )
}