import { useResearchSheet } from '../../../hooks/useResearchSheet'
import type { ResearchFilters, SheetName } from '../../../types/research'
import { NumberCard } from '../../common/NumberCard'
import { Panel } from '../../common/Panel'
import { DownloadButtons } from '../DownloadButtons'
import { SheetTable } from '../SheetTable'

// The sheet itself: which sheet, four numbers, the table, and downloads.

type Props = {
  sheetName: SheetName
  onSheetName: (name: SheetName) => void
  filters: ResearchFilters
  version: number
}

const sheets: { id: SheetName; label: string }[] = [
  { id: 'responses', label: 'Responses: one row per book' },
  { id: 'participants', label: 'Participants: one row per person' },
]

export function DataTab({ sheetName, onSheetName, filters, version }: Props) {
  const { sheet, error, loading } = useResearchSheet(sheetName, filters, version)

  const participants = sheet ? new Set(sheet.rows.map((r) => r.participant_id)).size : 0

  let coverage = 'n/a'
  if (sheet && sheet.rows.length > 0) {
    const dateKey = sheetName === 'responses' ? 'date' : 'first_book_date'
    const dates = sheet.rows
      .map((r) => r[dateKey])
      .filter((d): d is string => typeof d === 'string')
      .sort()
    if (dates.length > 0) {
      const first = dates[0]
      const last = dates[dates.length - 1]
      coverage = first === last ? first : `${first} to ${last}`
    }
  }

  return (
    <>
      <div className="sheet-switch" role="radiogroup" aria-label="Sheet">
        {sheets.map((s) => (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={s.id === sheetName}
            className={s.id === sheetName ? 'switch-option is-active' : 'switch-option'}
            onClick={() => onSheetName(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {!sheet && !error && <p className="muted">Loading...</p>}

      {sheet && (
        <>
          <div className="card-grid cols-4">
            <NumberCard value={String(sheet.rows.length)} label="Rows" />
            <NumberCard value={String(participants)} label="Participants" />
            <NumberCard value={String(sheet.columns.length)} label="Variables" />
            <NumberCard value={coverage} label="Dates covered" />
          </div>

          <Panel
            title={loading ? `${sheet.title} (updating...)` : sheet.title}
            aside={<DownloadButtons sheet={sheetName} filters={filters} />}
          >
            <SheetTable key={`${sheet.name}-${sheet.generatedAt}`} sheet={sheet} />
          </Panel>
        </>
      )}
    </>
  )
}