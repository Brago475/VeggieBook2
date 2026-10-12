import { useState } from 'react'
import type { QaBook, QaData } from '../../types/questions'
import { questionName, shortAnswer } from '../../utils/answerNames'
import { HeatGrid } from './HeatGrid'
import { crossShare, downloadCsv } from './questionMath'

// Compare tab: cross-tabulation of two questions.

type Props = {
  data: QaData
  veggie: QaBook[]
}

export function CompareTab({ data, veggie }: Props) {
  const qs = data.questions
  const [rowNo, setRowNo] = useState(qs[1]?.no ?? qs[0]?.no ?? 0)
  const [colNo, setColNo] = useState(qs[0]?.no ?? 0)

  const rowQ = qs.find((q) => q.no === rowNo)
  const colQ = qs.find((q) => q.no === colNo)
  if (!rowQ || !colQ) return <p className="st-muted">No questions found.</p>

  const rows = rowQ.choices.map((r) => {
    const cells = colQ.choices.map((c) => crossShare(veggie, r.attribute, c.attribute))
    const base = cells[0]?.base ?? 0
    return { r, cells, base }
  })

  function download() {
    downloadCsv(`compare-q${rowQ!.no}-q${colQ!.no}.csv`, [
      [`Q${rowQ!.no} answer`, 'Books', ...colQ!.choices.map((c) => `Q${colQ!.no}: ${c.text} (%)`)],
      ...rows.map(({ r, cells, base }) => [r.text, base, ...cells.map((x) => x.percent)]),
    ])
  }

  const select = (label: string, value: number, onChange: (n: number) => void) => (
    <label className="bk-select">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {qs.map((q) => (
          <option key={q.no} value={q.no}>
            Q{q.no} {questionName(q.no)}
          </option>
        ))}
      </select>
    </label>
  )

  return (
    <section className="qa-panel">
      <div className="qa-compare-bar">
        <h2>Compare two questions</h2>
        {select('Rows', rowNo, setRowNo)}
        {select('Columns', colNo, setColNo)}
        <button type="button" className="st-button qa-push" onClick={download}>
          Download table
        </button>
      </div>
      <p className="qa-sub">Of the VeggieBooks that picked the row answer, the share that also picked the column answer.</p>
      <HeatGrid
        columns={colQ.choices.map((c) => ({ key: c.attribute, label: shortAnswer(c.text) }))}
        rows={rows.map(({ r, cells, base }) => ({
          key: r.attribute,
          label: shortAnswer(r.text),
          note: `n=${base}`,
          cells: cells.map((x) => (x.base === 0 ? null : x.percent)),
        }))}
      />
    </section>
  )
}