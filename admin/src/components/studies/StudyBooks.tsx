import type { AllDataQuestion } from '../../types/allData'
import type { SheetRow } from '../../types/research'
import type { StudySummary } from '../../types/studies'
import { useStudyBooks } from '../../hooks/useStudyBooks'
import { allDataDownload } from '../../utils/allDataQuery'
import { bookSubject, isSecrets, shortTime } from '../../utils/allDataFormat'
import { shortAnswer } from '../../utils/answerNames'
import { noFilters } from '../../utils/researchQuery'
import { OffIdList } from './OffIdList'
import { StudyIcon } from './StudyIcons'
import { plural, studyFullTitle, studyRange } from './studyFormat'

// "Data from Fall pilot (Study 2)": every book saved during the picked
// study, by people whose tracking was on when they saved it. The same rows
// as All Data with that study picked, so the downloads here and there are
// the same files.
//
//   Head    the study's dates, how many books and tracked people, the four
//           downloads (Excel, SPSS, PDF, CSV) and Open in All Data
//   Off     the research IDs of people with tracking off, if any
//   Table   one row per book: research ID, when, book type, vegetable or
//           category, answers, and how many recipes and secrets were kept
//           or taken out later

type Props = {
  study: StudySummary
  onOpenData: () => void
}

const downloads = [
  { format: 'xlsx', label: 'Excel', main: true },
  { format: 'spss', label: 'SPSS', main: false },
  { format: 'pdf', label: 'PDF', main: false },
  { format: 'csv', label: 'CSV', main: false },
]

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// 2026-10-12 and 15:14 to "Oct 12, 2026, 3:14 PM"
function savedAt(row: SheetRow): string {
  const [y, m, d] = String(row.date ?? '').split('-').map(Number)
  if (!y || !m || !d) return String(row.date ?? '')
  return `${months[m - 1]} ${d}, ${y}, ${shortTime(row.time)}`
}

// "Q1: Crock Pot, Q2: Latino"
function answersOf(row: SheetRow, questions: AllDataQuestion[]): string {
  if (isSecrets(row)) return 'No questions'
  const picked = questions.flatMap((q) =>
    q.choices.filter((c) => row[c.key] === 1).map((c) => `Q${q.no}: ${shortAnswer(c.text)}`),
  )
  return picked.length ? picked.join(', ') : 'None picked'
}

const count = (row: SheetRow, ...keys: string[]) => keys.reduce((n, k) => n + Number(row[k] ?? 0), 0)

export function StudyBooks({ study, onOpenData }: Props) {
  const refresh = `${study.booksSaved}|${study.endedAt ?? ''}`
  const { rows, questions, error, loading } = useStudyBooks(study.number, refresh)

  const sorted = [...rows].sort((a, b) =>
    `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
  )

  return (
    <section className="tl-data" aria-labelledby="tl-data-title">
      <div className="tl-data-head">
        <div className="tl-data-title">
          <h2 id="tl-data-title">Data from {studyFullTitle(study)}</h2>
          <span className="tl-data-when">
            <StudyIcon name="calendar" size={14} />
            {studyRange(study.startedAt, study.endedAt)}. {plural(study.booksSaved, 'book', 'books')},{' '}
            {plural(study.tracked, 'tracked person', 'tracked people')}.
          </span>
        </div>

        <div className="tl-data-actions">
          {downloads.map((d) => (
            <a
              key={d.format}
              className={d.main ? 'st-button is-green' : 'st-button'}
              href={allDataDownload('export', noFilters, { format: d.format, study: String(study.number) })}
              download
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 4v11" />
                <path d="m7 10.5 5 5 5-5" />
                <path d="M5 20h14" />
              </svg>
              {d.label}
            </a>
          ))}
          <button type="button" className="st-button" onClick={onOpenData}>
            <StudyIcon name="table" size={16} />
            Open in All Data
          </button>
        </div>
      </div>

      {study.trackingOff > 0 && (
        <div className="tl-data-off">
          <span className="tl-data-off-label">Tracking off ({study.trackingOff.toLocaleString()})</span>
          <OffIdList people={study.offIds} />
        </div>
      )}

      {error && (
        <p className="error tl-data-note" role="alert">
          {error}
        </p>
      )}
      {loading && !error && <p className="st-muted tl-data-note">Loading...</p>}
      {!loading && !error && sorted.length === 0 && (
        <p className="st-muted tl-data-note">
          {study.running ? 'No books saved during this study yet.' : 'No books were saved during this study.'}
        </p>
      )}

      {!loading && sorted.length > 0 && (
        <div className="tl-table-wrap">
          <table className="tl-table">
            <thead>
              <tr>
                <th scope="col">Research ID</th>
                <th scope="col">Saved</th>
                <th scope="col">Book</th>
                <th scope="col">Vegetable or category</th>
                <th scope="col">Answers</th>
                <th scope="col">Kept</th>
                <th scope="col">Taken out</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={`${r.participant_id}#${r.book_no}`}>
                  <td className="tl-id">{r.participant_id}</td>
                  <td className="tl-when">{savedAt(r)}</td>
                  <td>
                    <span className={isSecrets(r) ? 'tl-type is-secrets' : 'tl-type'}>
                      {isSecrets(r) ? 'Secrets Book' : 'VeggieBook'}
                    </span>
                  </td>
                  <td>{bookSubject(r)}</td>
                  <td className="tl-answers" title={answersOf(r, questions)}>
                    {answersOf(r, questions)}
                  </td>
                  <td className="tl-kept">{count(r, 'recipes_kept', 'secrets_kept')}</td>
                  <td className="tl-out">{count(r, 'recipes_removed', 'secrets_removed')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}