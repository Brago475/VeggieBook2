import { useState } from 'react'
import { AllDataIcon } from '../components/alldata/AllDataIcons'
import { ExportFormatCard } from '../components/export/ExportFormatCard'
import { bundleFormats, sheets, singleFormats } from '../components/export/exportFormats'
import { studyTitle } from '../components/studies/studyFormat'
import { useStudies } from '../hooks/useStudies'
import { allDataDownload } from '../utils/allDataQuery'
import { noFilters } from '../utils/researchQuery'
import '../styles/studies.css'
import '../styles/panels.css'
import '../styles/export.css'

// Admin Export page: a shortcut to every research download. The study and
// answers options apply to every link on the page. Date, age and vegetable
// filters stay on All Data.

export function Export() {
  const { data } = useStudies()
  const [study, setStudy] = useState<number | null>(null)
  const [answers, setAnswers] = useState(false)

  const extra: Record<string, string> = {}
  if (study !== null) extra.study = String(study)
  if (answers) extra.answers = 'true'

  const studies = data?.studies ?? []
  const picked = study === null ? null : studies.find((s) => s.number === study) ?? null
  const scope = picked ? `Only books saved during ${studyTitle(picked)}.` : 'Every tracked book.'

  return (
    <div className="ex-page">
      <section className="ex-hero" aria-labelledby="ex-all">
        <div>
          <h2 id="ex-all" className="ex-hero-title">
            Everything at once
          </h2>
          <p className="ex-hero-text">
            One zip with the Excel workbook, both CSV files, the SPSS files with every label set, and a README that
            explains each column.
          </p>
        </div>

        <div className="ex-options">
          <label className="ex-field">
            Data
            <select
              value={study === null ? '' : String(study)}
              onChange={(e) => setStudy(e.target.value === '' ? null : Number(e.target.value))}
            >
              <option value="">All data</option>
              {studies.map((s) => (
                <option key={s.id} value={s.number}>
                  {studyTitle(s)}
                </option>
              ))}
            </select>
          </label>

          <label className="ex-check">
            <input type="checkbox" checked={answers} onChange={(e) => setAnswers(e.target.checked)} />
            Add each book&apos;s answers to the recipe rows
          </label>
        </div>

        <a className="ex-main" href={allDataDownload('export', noFilters, { format: 'zip', ...extra })} download>
          <AllDataIcon name="layers" size={18} />
          Download everything
        </a>
        <span className="ex-scope">{scope}</span>
      </section>

      <h2 className="ex-section-title">One format</h2>
      <div className="ex-grid">
        {bundleFormats.map((f) => (
          <ExportFormatCard
            key={f.format}
            label={f.label}
            text={f.text}
            icon={f.icon}
            href={allDataDownload('export', noFilters, { format: f.format, ...extra })}
          />
        ))}
      </div>

      <h2 className="ex-section-title">One file by itself</h2>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>File</th>
              <th>Download</th>
            </tr>
          </thead>
          <tbody>
            {sheets.map((s) => (
              <tr key={s.id}>
                <td>
                  <span className="ex-file-name">{s.label}</span>
                  <span className="ex-file-note">{s.text}</span>
                </td>
                <td>
                  <div className="ex-links">
                    {singleFormats.map((f) => (
                      <a
                        key={f.format}
                        className="st-button"
                        href={allDataDownload(`export/${s.id}`, noFilters, { format: f.format, ...extra })}
                        download
                      >
                        {f.label}
                      </a>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="ex-note">
        Every file is keyed by the anonymous research ID. Admin accounts, guests, and books saved while tracking was
        off are never included. To download by date, age, or vegetable, use the filters on All Data.
      </p>
    </div>
  )
}