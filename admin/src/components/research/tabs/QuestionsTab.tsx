import { useState } from 'react'
import { useResearchSheet } from '../../../hooks/useResearchSheet'
import type { ResearchFilters, SheetRow } from '../../../types/research'
import { percent } from '../../../utils/math'
import { Panel } from '../../common/Panel'

// One question at a time, from the Responses sheet with the page's filters:
//
//   Frequencies   how many VeggieBooks picked each answer
//   By age range  the same, split by age range: count and percent of that
//                 age group's VeggieBooks
//
// Only VeggieBooks count; Secrets Books have no questions. A book can pick
// more than one answer, so percentages can add up to more than 100.

const NOT_GIVEN = 'Not given'

type Props = {
  filters: ResearchFilters
  version: number
}

function picked(row: SheetRow, key: string, answer: string) {
  const value = row[key]
  return typeof value === 'string' && value.split('; ').includes(answer)
}

export function QuestionsTab({ filters, version }: Props) {
  const { sheet, error } = useResearchSheet('responses', filters, version)
  const [selected, setSelected] = useState<string | null>(null)

  if (error) {
    return (
      <p className="error" role="alert">
        {error}
      </p>
    )
  }

  if (!sheet) return <p className="muted">Loading...</p>

  const questions = sheet.columns.filter((c) => /^q\d+$/.test(c.key))
  const question = questions.find((q) => q.key === selected) ?? questions[0]
  if (!question) return <p className="muted">No questions found.</p>

  const books = sheet.rows.filter((r) => r.book_type === 'VeggieBook')
  const answers = question.values ?? []

  const ageColumn = sheet.columns.find((c) => c.key === 'age_range')
  const ages = [...(ageColumn?.values ?? [])]
  if (books.some((r) => r.age_range === null)) ages.push(NOT_GIVEN)
  const booksByAge = new Map(ages.map((a) => [a, books.filter((r) => (r.age_range ?? NOT_GIVEN) === a)]))

  const rows = answers
    .map((answer) => ({
      answer,
      count: books.filter((r) => picked(r, question.key, answer)).length,
    }))
    .sort((a, b) => b.count - a.count)

  return (
    <>
      <Panel
        title="Question"
        aside={
          <select
            className="question-select"
            value={question.key}
            onChange={(e) => setSelected(e.target.value)}
          >
            {questions.map((q) => (
              <option key={q.key} value={q.key}>
                {q.key.toUpperCase()}
              </option>
            ))}
          </select>
        }
      >
        <p className="question-label">{question.label}</p>
        <p className="muted small">
          {books.length} VeggieBooks. A book can pick more than one answer.
        </p>
      </Panel>

      <Panel title="Frequencies">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Answer</th>
                <th className="num">Count</th>
                <th className="num">Percent</th>
                <th className="bar-col" aria-label="Bar" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const pct = percent(r.count, books.length, 1)
                return (
                  <tr key={r.answer}>
                    <td>{r.answer}</td>
                    <td className="num">{r.count}</td>
                    <td className={i === 0 && r.count > 0 ? 'num strong' : 'num'}>{pct}%</td>
                    <td className="bar-col">
                      <div className="bar">
                        <div className="bar-fill" style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="By age range">
        <div className="table-wrap">
          <table className="data-table crosstab">
            <thead>
              <tr>
                <th>Answer</th>
                {ages.map((a) => (
                  <th key={a} className="num">
                    {a}
                    <span className="crosstab-n">n = {booksByAge.get(a)?.length ?? 0}</span>
                  </th>
                ))}
                <th className="num">
                  Total
                  <span className="crosstab-n">n = {books.length}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.answer}>
                  <td>{r.answer}</td>
                  {ages.map((a) => {
                    const group = booksByAge.get(a) ?? []
                    const count = group.filter((row) => picked(row, question.key, r.answer)).length
                    return (
                      <td key={a} className="num">
                        {count} ({percent(count, group.length)}%)
                      </td>
                    )
                  })}
                  <td className="num strong">
                    {r.count} ({percent(r.count, books.length)}%)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  )
}