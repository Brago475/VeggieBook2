import { ScreenLabel } from '../components/layout/ScreenLabel'
import { VegetableRow } from '../components/veggie/VegetableRow'
import { FLOW } from '../i18n/strings/flow'
import { useStrings } from '../i18n/useStrings'
import type { Vegetable } from '../types'

// The first step of making a VeggieBook: one row per vegetable. Names come
// from the API in the site language.

type Props = {
  vegetables: Vegetable[]
  loading: boolean
  onSelect: (vegetable: Vegetable) => void
}

export function VegetablePicker({ vegetables, loading, onSelect }: Props) {
  const t = useStrings(FLOW)

  return (
    <>
      <ScreenLabel>{t.selectBook}</ScreenLabel>
      {loading && <p className="message">{t.loading}</p>}
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