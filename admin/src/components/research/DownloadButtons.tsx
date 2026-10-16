import type { ExportFormat, ResearchFilters, SheetName } from '../../types/research'
import { exportUrl } from '../../utils/researchQuery'

// Download the sheet, with the page's filters, as Excel, CSV, PDF, or SPSS.
// Plain links: the browser downloads the file the API sends, using the same
// session as the page.

const formats: { format: ExportFormat; label: string }[] = [
  { format: 'xlsx', label: 'Excel' },
  { format: 'csv', label: 'CSV' },
  { format: 'pdf', label: 'PDF' },
  { format: 'spss', label: 'SPSS' },
]

type Props = {
  sheet: SheetName
  filters: ResearchFilters
}

export function DownloadButtons({ sheet, filters }: Props) {
  return (
    <div className="downloads">
      <span className="muted small">Download</span>
      {formats.map((f) => (
        <a key={f.format} className="button-secondary" href={exportUrl(sheet, f.format, filters)} download>
          {f.label}
        </a>
      ))}
    </div>
  )
}