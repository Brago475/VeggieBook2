import { useStrings } from '../../i18n/useStrings'
import type { FoodDetail } from '../api/foodLogApi'
import type { PortionState } from '../hooks/usePortion'
import { ST_TRACKER } from '../strings/tracker'
import { tenth } from '../utils/format'

// Amount and portion fields for one USDA food.

type Props = {
  id: string
  food: FoodDetail
  state: PortionState
}

export function PortionFields({ id, food, state }: Props) {
  const t = useStrings(ST_TRACKER)

  return (
    <div className="st2-row">
      <div className="st2-field st2-field-small">
        <label className="st2-label" htmlFor={`${id}-amount`}>
          {t.amount}
        </label>
        <input
          id={`${id}-amount`}
          className="st2-input"
          inputMode="decimal"
          value={state.amountText}
          onChange={(e) => state.setAmountText(e.target.value)}
          aria-invalid={!state.valid}
        />
      </div>
      <div className="st2-field">
        <label className="st2-label" htmlFor={`${id}-portion`}>
          {t.portion}
        </label>
        <select
          id={`${id}-portion`}
          className="st2-input"
          value={state.portionId ?? ''}
          onChange={(e) => state.setPortionId(Number(e.target.value))}
        >
          {food.portions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.description} ({tenth(p.grams)} g)
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}