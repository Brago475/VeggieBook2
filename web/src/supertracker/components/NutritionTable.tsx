import { useStrings } from '../../i18n/useStrings'
import type { Amounts } from '../api/foodLogApi'
import { ST_LOOKUP } from '../strings/lookup'
import { NUTRIENTS, type NutrientUnit } from '../utils/amounts'
import { count, tenth } from '../utils/format'

// Nutrition for one food, or two foods side by side.

type Column = {
  title: string
  amounts: Amounts | null
}

type Props = {
  columns: Column[]
}

export function NutritionTable({ columns }: Props) {
  const l = useStrings(ST_LOOKUP)

  function show(unit: NutrientUnit, value: number): string {
    if (unit === 'kcal') return count(value)
    if (unit === 'mg') return `${count(value)} ${l.units.mg}`
    return `${tenth(value)} ${l.units[unit]}`
  }

  return (
    <table className="st2-compare">
      <thead>
        <tr>
          <th scope="col">{l.nutrient}</th>
          {columns.map((c, i) => (
            <th key={i} scope="col">
              {c.title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {NUTRIENTS.map((n) => (
          <tr key={n.key}>
            <th scope="row">{l.rows[n.key]}</th>
            {columns.map((c, i) => (
              <td key={i}>{c.amounts ? show(n.unit, c.amounts[n.key]) : ''}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}