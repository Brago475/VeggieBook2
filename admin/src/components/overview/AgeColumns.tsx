import type { NameCount } from '../../types/admin'
import '../../styles/overview-age.css'

// Participants by age as a column chart: one column per age range, in the
// order the API sends them (youngest first, "Not given" last), the count on
// top and the age range under it. Columns are scaled to the largest group
// and grow in one after another. Empty groups keep a thin gray line so the
// gap is visible.

type Props = {
  ages: NameCount[]
  empty: string
}

// The tallest column fills 85% of the chart, leaving room for its count on
// top; an empty group keeps a 2% line.
function columnHeight(count: number, max: number) {
  return Math.max(2, (count / max) * 85)
}

export function AgeColumns({ ages, empty }: Props) {
  if (ages.every((a) => a.count === 0)) return <p className="muted">{empty}</p>

  const max = Math.max(1, ...ages.map((a) => a.count))

  return (
    <div className="age-chart">
      <ul className="age-cols">
        {ages.map((a, i) => (
          <li key={a.name} className={a.count === 0 ? 'age-col is-zero' : 'age-col'}>
            <span className="age-count">{a.count.toLocaleString()}</span>
            <span
              className="age-bar"
              style={{ height: `${columnHeight(a.count, max)}%`, animationDelay: `${i * 60}ms` }}
              role="img"
              aria-label={`${a.name}: ${a.count === 1 ? '1 participant' : `${a.count} participants`}`}
            />
          </li>
        ))}
      </ul>
      <div className="age-labels" aria-hidden="true">
        {ages.map((a) => (
          <span key={a.name}>{a.name}</span>
        ))}
      </div>
    </div>
  )
}