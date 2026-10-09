import { useState } from 'react'
import { useResearchSheet } from '../../../hooks/useResearchSheet'
import type { ResearchFilters, SheetRow } from '../../../types/research'
import { Panel } from '../../common/Panel'
import { DownloadButtons } from '../DownloadButtons'

// Every answer on the self-profiling questions, ranked by how often it was
// picked, with the page's filters. Built by the API (Most chosen sheet), so
// the downloads match what is on screen.
//
//   Books    VeggieBooks that picked the answer (one person can count
//            more than once)
//   People   participants who picked it at least once (each person once)
//
// Rank by switches between the two. Picking one question shows only its
// answers. Answers no one picked stay in the list so gaps are visible.

type Props = {
  filters: ResearchFilters
  version: number
}

type RankBy = 'books' | 'people'

function count(row: SheetRow, key: string): number {
  const value = row[key]
  return typeof value === 'number' ? value : 0
}

export function MostChosenTab({ filters, version }: Props) {
  const { sheet, error, loading } = useResearchSheet('choices', filters, version)
  const [question, setQuestion] = useState('')
  const [rankBy, setRankBy] = useState<RankBy>('books')

  if (error) {
    return (
      <p className="error" role="alert">
        {error}
      </p>
    )
  }

  if (!sheet) return <p className="muted">Loading...</p>

  const label = (key: string) => sheet.columns.find((c) => c.key === key)?.label ?? key
  const questions = sheet.columns.find((c) => c.key === 'question_no')?.values ?? []
  const other: RankBy = rankBy === 'books' ? 'people' : 'books'

  const rows = sheet.rows
    .filter((r) => !question || r.question_no === question)
    .slice()
    .sort((a, b) => count(b, rankBy) - count(a, rankBy) || count(b, other) - count(a, other))

  const ranked = rows.map((row) => ({
    row,
    rank: 1 + rows.filter((x) => count(x, rankBy) > count(row, rankBy)).length,
  }))

  const nothingYet = sheet.rows.every((r) => count(r, 'books') === 0)

  return (
    <Panel
      title={loading ? 'Most chosen answers (updating...)' : 'Most chosen answers'}
      aside={<DownloadButtons sheet="choices" filters={filters} />}
    >
      <p className="muted small">
        Every answer on the questions, ranked. Books counts every saved VeggieBook that picked the
        answer; People counts each person once. A book can pick more than one answer, so
        percentages add up to more than 100.
      </p>

      <div className="filters">
        <label className="filter">
          <span className="filter-label">Question</span>
          <select value={question} onChange={(e) => setQuestion(e.target.value)}>
            <option value="">All questions</option>
            {questions.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </label>

        <label className="filter">
          <span className="filter-label">Rank by</span>
          <select value={rankBy} onChange={(e) => setRankBy(e.target.value as RankBy)}>
            <option value="books">Books</option>
            <option value="people">People</option>
          </select>
        </label>
      </div>

      {nothingYet ? (
        <p className="muted">No VeggieBooks match these filters yet.</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th className="num">#</th>
                <th>Answer</th>
                <th>Question</th>
                <th className="num">{label('books')}</th>
                <th className="num">{label('books_pct')}</th>
                <th className="num">{label('people')}</th>
                <th className="num">{label('people_pct')}</th>
                <th className="bar-col" aria-label="Bar" />
              </tr>
            </thead>
            <tbody>
              {ranked.map(({ row, rank }) => {
                const pct = count(row, `${rankBy}_pct`)
                const top = rank === 1 && count(row, rankBy) > 0
                return (
                  <tr key={`${row.question_no}-${row.answer}`}>
                    <td className="num">{rank}</td>
                    <td className={top ? 'strong' : undefined}>{row.answer}</td>
                    <td title={String(row.question ?? '')}>{row.question_no}</td>
                    <td className="num">{count(row, 'books')}</td>
                    <td className="num">{count(row, 'books_pct')}%</td>
                    <td className="num">{count(row, 'people')}</td>
                    <td className="num">{count(row, 'people_pct')}%</td>
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
      )}
    </Panel>
  )
}