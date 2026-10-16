import type { ExportSummary } from '../../hooks/useExportSummary'
import type { StudySummary } from '../../types/studies'
import { exportUrl, shortDay } from '../../utils/exportQuery'
import { AllDataIcon } from '../alldata/AllDataIcons'
import { studyTitle } from '../studies/studyFormat'
import { CountStat } from './CountStat'
import { allFormats, zipContents } from './exportFormats'

// Everything in one zip, for all data or one study. The scope and answers
// option chosen here apply to the whole page.

type Props = {
  studies: StudySummary[]
  study: number | null
  onStudy: (study: number | null) => void
  answers: boolean
  onAnswers: (on: boolean) => void
  summary: ExportSummary | null
  onDownload: (label: string) => void
}

export function ExportHero({ studies, study, onStudy, answers, onAnswers, summary, onDownload }: Props) {
  const picked = study === null ? null : studies.find((s) => s.number === study) ?? null
  const scopeName = picked ? studyTitle(picked) : 'All data'
  const params = { study, answers }
  const dates =
    summary === null ? '...' : summary.from && summary.to ? `${shortDay(summary.from)} to ${shortDay(summary.to)}` : 'None yet'

  return (
    <section className="ex-hero" aria-labelledby="ex-hero-title">
      <div className="ex-hero-text">
        <span className="ex-eyebrow">Download center</span>
        <h2 id="ex-hero-title">Everything in one zip</h2>
        <p>
          Every research file for the data you pick: the Excel workbook, both CSV files, the SPSS files with every
          label set, and a README that explains each column.
        </p>
      </div>

      <div className="ex-scopes" role="radiogroup" aria-label="Which data">
        <button
          type="button"
          role="radio"
          aria-checked={study === null}
          className={study === null ? 'ex-scope is-on' : 'ex-scope'}
          onClick={() => onStudy(null)}
        >
          All data
        </button>
        {studies.map((s) => (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={study === s.number}
            className={study === s.number ? 'ex-scope is-on' : 'ex-scope'}
            onClick={() => onStudy(s.number)}
          >
            {studyTitle(s)}
            {s.running && <span className="ex-scope-live">Running</span>}
          </button>
        ))}
      </div>

      <div className="ex-chips">
        {zipContents.map((c) => (
          <span key={c} className="ex-chip">
            {c}
          </span>
        ))}
      </div>

      <div className="ex-hero-foot">
        <dl className="ex-stats">
          <CountStat label="Books" value={summary?.books ?? null} />
          <CountStat label="Participants" value={summary?.participants ?? null} />
          <CountStat label="Recipes and secrets" value={summary?.items ?? null} />
          <div>
            <dt>Dates covered</dt>
            <dd>{dates}</dd>
          </div>
        </dl>

        <div className="ex-hero-actions">
          <a
            className="ex-big"
            href={exportUrl('all-data/export', params, { format: 'zip' })}
            download
            onClick={() => onDownload(`Everything, ${scopeName}`)}
          >
            <AllDataIcon name="down" size={18} />
            Download everything
          </a>
          <div className="ex-hero-formats">
            <span>Or one format:</span>
            {allFormats.map((f) => (
              <a
                key={f.format}
                href={exportUrl('all-data/export', params, { format: f.format })}
                download
                onClick={() => onDownload(`${f.label}, ${scopeName}`)}
              >
                {f.label}
              </a>
            ))}
          </div>
          <label className="ex-hero-check">
            <input type="checkbox" checked={answers} onChange={(e) => onAnswers(e.target.checked)} />
            Add book answers to recipe rows
          </label>
        </div>
      </div>
    </section>
  )
}