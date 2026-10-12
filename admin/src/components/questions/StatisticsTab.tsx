import type { QaBook } from '../../types/questions'
import { descriptives, downloadCsv, pct, veggieOf } from './questionMath'

// Statistics tab: key findings and descriptive statistics.

type Props = {
  books: QaBook[]
}

const fmt = (v: number, digits = 1) => (Number.isInteger(v) ? String(v) : v.toFixed(digits))

export function StatisticsTab({ books }: Props) {
  const veggie = veggieOf(books)
  const english = books.filter((b) => b.language !== 'es').length
  const personal = books.filter((b) => b.personalCover).length
  const recipesKept = veggie.reduce((n, b) => n + b.kept.length, 0)
  const recipesOut = veggie.reduce((n, b) => n + b.removed.length, 0)
  const extra = books.reduce((n, b) => n + b.extraCopies, 0)
  const rows = descriptives(books)

  const findings = [
    { label: 'English books', value: `${pct(english, books.length)}%`, note: `${pct(books.length - english, books.length)}% in Spanish` },
    { label: 'Personal covers', value: `${pct(personal, books.length)}%`, note: 'Uploaded their own photo' },
    { label: 'Recipes kept', value: `${pct(recipesKept, recipesKept + recipesOut)}%`, note: `${pct(recipesOut, recipesKept + recipesOut)}% taken out later` },
    { label: 'Extra copies', value: extra.toLocaleString(), note: 'Printed copies requested' },
  ]

  function download() {
    downloadCsv('descriptive-statistics.csv', [
      ['Measure', 'N', 'Mean', 'Median', 'SD', 'Min', 'Max'],
      ...rows.map((r) => [r.label, r.n, fmt(r.mean, 2), fmt(r.median), fmt(r.sd, 2), r.min, r.max]),
    ])
  }

  return (
    <div className="qa-stack">
      <div>
        <h2 className="qa-section-title">Key findings</h2>
        <div className="qa-findings">
          {findings.map((f) => (
            <div key={f.label} className="qa-finding">
              <span>{f.label}</span>
              <strong>{f.value}</strong>
              <span className="qa-finding-note">{f.note}</span>
            </div>
          ))}
        </div>
      </div>

      <section className="qa-panel">
        <div className="qa-panel-head">
          <h2>Descriptive statistics</h2>
          <button type="button" className="st-button" onClick={download}>
            Download table
          </button>
        </div>
        <div className="qa-table-wrap">
          <table className="qa-table">
            <thead>
              <tr>
                <th scope="col">Measure</th>
                <th scope="col">N</th>
                <th scope="col">Mean</th>
                <th scope="col">Median</th>
                <th scope="col">SD</th>
                <th scope="col">Min</th>
                <th scope="col">Max</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label}>
                  <th scope="row">{r.label}</th>
                  <td>{r.n.toLocaleString()}</td>
                  <td>{fmt(r.mean)}</td>
                  <td>{fmt(r.median)}</td>
                  <td>{fmt(r.sd)}</td>
                  <td>{r.min}</td>
                  <td>{r.max}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="qa-hint">SD is the sample standard deviation. Books per participant counts participants with at least one book in scope.</p>
      </section>
    </div>
  )
}