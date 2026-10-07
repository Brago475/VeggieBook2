import type { DescriptiveRow } from '../../types/analytics'

// SPSS-style descriptive statistics. Standard deviation is the sample
// standard deviation (N - 1), as SPSS reports it. "n/a" means there is not
// enough data for that value.

function show(value: number | null) {
  return value === null ? 'n/a' : value.toFixed(2)
}

type Props = {
  rows: DescriptiveRow[]
}

export function DescriptivesTable({ rows }: Props) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Variable</th>
            <th className="num">N</th>
            <th className="num">Mean</th>
            <th className="num">Median</th>
            <th className="num">Std. deviation</th>
            <th className="num">Min</th>
            <th className="num">Max</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.variable}>
              <td>{r.variable}</td>
              <td className="num">{r.n}</td>
              <td className="num strong">{show(r.mean)}</td>
              <td className="num">{show(r.median)}</td>
              <td className="num">{show(r.sd)}</td>
              <td className="num">{r.min === null ? 'n/a' : r.min}</td>
              <td className="num">{r.max === null ? 'n/a' : r.max}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}