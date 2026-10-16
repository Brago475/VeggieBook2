import type { StudySummary } from '../../types/studies'
import { exportUrl } from '../../utils/exportQuery'
import { plural, studyRange, studyTitle } from '../studies/studyFormat'
import { studyFormats } from './exportFormats'

// Each study's books in every format, and every study in one zip.

type Props = {
  studies: StudySummary[]
  answers: boolean
  onDownload: (label: string) => void
}

export function StudyDownloads({ studies, answers, onDownload }: Props) {
  return (
    <section className="ex-card" aria-labelledby="ex-studies">
      <div className="ex-card-head">
        <div>
          <h2 id="ex-studies" className="ex-card-title">
            By study
          </h2>
          <p className="ex-card-sub">Each study's books only, from the day it was switched on until it ended.</p>
        </div>
        {studies.length > 0 && (
          <a
            className="ex-outline"
            href={exportUrl('export/studies')}
            download
            onClick={() => onDownload('Every study, one zip')}
          >
            Every study, one zip
          </a>
        )}
      </div>

      {studies.length === 0 ? (
        <p className="ex-empty">No studies yet. Start one on the Studies page.</p>
      ) : (
        studies.map((s) => (
          <div key={s.id} className="ex-study">
            <div className="ex-study-text">
              <span className="ex-study-name">
                {studyTitle(s)}
                {s.running && <span className="ex-running">Running</span>}
              </span>
              <span className="ex-study-meta">
                {studyRange(s.startedAt, s.endedAt)}, {plural(s.booksSaved, 'book', 'books')},{' '}
                {plural(s.people, 'person', 'people')}
              </span>
            </div>
            <div className="ex-fmts">
              {studyFormats.map((f) => (
                <a
                  key={f.format}
                  className="ex-fmt"
                  href={exportUrl('all-data/export', { study: s.number, answers }, { format: f.format })}
                  download
                  onClick={() => onDownload(`${studyTitle(s)}, ${f.label}`)}
                >
                  {f.label}
                </a>
              ))}
            </div>
          </div>
        ))
      )}
    </section>
  )
}