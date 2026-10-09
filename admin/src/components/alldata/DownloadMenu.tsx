import type { ResearchFilters } from '../../types/research'
import { allDataDownload } from '../../utils/allDataQuery'

// Three buttons, each downloading all the data (both files) with the
// page's filters:
//
//   Excel  one workbook: Books, Recipes and secrets, Variables, Questions
//   PDF    one PDF with both files
//   CSV    a zip of books.csv and recipes-and-secrets.csv
//
// With "Book answers on each row" on, the recipe rows include the book's
// answers in every format. Plain links: the browser saves what the API
// sends, using the page's session.

type Props = {
  filters: ResearchFilters
  itemAnswers: boolean
}

const formats = [
  { format: 'xlsx', label: 'Excel', title: 'Both files in one Excel workbook' },
  { format: 'pdf', label: 'PDF', title: 'Both files in one PDF' },
  { format: 'csv', label: 'CSV', title: 'Both files as CSV, in one zip' },
]

export function DownloadMenu({ filters, itemAnswers }: Props) {
  const extra: Record<string, string> = itemAnswers ? { answers: 'true' } : {}

  return (
    <div className="ad-downloads" role="group" aria-label="Download all data">
      <span className="muted small">Download all</span>
      {formats.map((f, i) => (
        <a
          key={f.format}
          className={i === 0 ? 'ad-download-all' : 'button-secondary ad-download'}
          href={allDataDownload('export', filters, { format: f.format, ...extra })}
          title={f.title}
          download
        >
          {f.label}
        </a>
      ))}
    </div>
  )
}