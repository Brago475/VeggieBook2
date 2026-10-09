import '../../styles/charts.css'

// A ranked list with a bar under each label, longest first as given. Bars
// are scaled to the largest value and grow in one after another. Rows with
// zero stay in the list so gaps are visible.

export type BarRow = {
  label: string
  value: number
}

type Props = {
  rows: BarRow[]
  empty: string
}

export function BarList({ rows, empty }: Props) {
  const max = Math.max(1, ...rows.map((r) => r.value))

  if (rows.every((r) => r.value === 0)) return <p className="muted">{empty}</p>

  return (
    <ul className="barlist">
      {rows.map((r, i) => (
        <li key={r.label} className={r.value === 0 ? 'barlist-row is-zero' : 'barlist-row'}>
          <div className="barlist-line">
            <span>{r.label}</span>
            <span className="barlist-value">{r.value.toLocaleString()}</span>
          </div>
          <div className="bar">
            <div
              className="bar-fill barlist-fill"
              style={{ width: `${(r.value / max) * 100}%`, animationDelay: `${i * 50}ms` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}