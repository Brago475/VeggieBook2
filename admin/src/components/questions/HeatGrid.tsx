// Percentage grid shaded by value: darker green is higher.

export type HeatColumn = { key: string; label: string; note?: string }
export type HeatRow = { key: string; label: string; note?: string; cells: (number | null)[] }

type Props = {
  columns: HeatColumn[]
  rows: HeatRow[]
}

function shade(p: number): { background: string; color: string } {
  return { background: `rgba(21, 128, 61, ${(0.08 + 0.92 * (p / 100)).toFixed(2)})`, color: p >= 45 ? '#ffffff' : '#14532d' }
}

export function HeatGrid({ columns, rows }: Props) {
  return (
    <div className="qa-heat-wrap">
      <table className="qa-heat">
        <thead>
          <tr>
            <th scope="col" />
            {columns.map((c) => (
              <th key={c.key} scope="col">
                {c.label}
                {c.note && <span>{c.note}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <th scope="row">
                {r.label}
                {r.note && <span>{r.note}</span>}
              </th>
              {r.cells.map((p, i) => (
                <td key={columns[i].key}>
                  {p === null ? (
                    <span className="qa-cell is-empty">-</span>
                  ) : (
                    <span className="qa-cell" style={shade(p)}>
                      {p}%
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}