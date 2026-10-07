import type { DescriptiveRow } from '../../types/analytics'

// SPSS-style descriptive statistics. Standard deviation is the sample
// standard deviation (N - 1), as SPSS reports it. "n/a" means there is not
// enough data for that value.

type Props = {
  rows: DescriptiveRow[]
}

function show(value: number | null) {
  return value === null ? 'n/a' : value.toFixed(2)
}

export function DescriptivesTable({ rows }: Props) {
  return (
    <div className="stats-wrap">
      <table className="stats-table">
        <thead>
          <tr>
            <th>Variable</th>
            <th>N</th>
            <th>Mean</th>
            <th>Median</th>
            <th>Std. deviation</th>
            <th>Min</th>
            <th>Max</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.variable}>
              <td>{r.variable}</td>
              <td>{r.n}</td>
              <td>{show(r.mean)}</td>
              <td>{show(r.median)}</td>
              <td>{show(r.sd)}</td>
              <td>{r.min === null ? 'n/a' : r.min}</td>
              <td>{r.max === null ? 'n/a' : r.max}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}