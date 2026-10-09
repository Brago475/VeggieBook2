import type { ResearchFilters } from '../../types/research'
import { allDataDownload } from '../../utils/allDataQuery'
import { AllDataIcon, type AllDataIconName } from './AllDataIcons'

// Four buttons, each downloading all the data (both files) with the
// page's filters:
//
//   Excel  one workbook, headers in words ("Q1: Microwave"); opens in
//          Excel and also imports into SPSS
//   SPSS   files made for SPSS: every question and answer labeled, and
//          0/1 shown as Not picked / Picked
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

const formats: { format: string; label: string; title: string; icon: AllDataIconName }[] = [
  { format: 'xlsx', label: 'Excel', title: 'Both files in one Excel workbook (also imports into SPSS)', icon: 'sheet' },
  { format: 'spss', label: 'SPSS', title: 'Both files ready for SPSS, with every label set', icon: 'layers' },
  { format: 'pdf', label: 'PDF', title: 'Both files in one PDF', icon: 'file' },
  { format: 'csv', label: 'CSV', title: 'Both files as CSV, in one zip', icon: 'file' },
]

export function DownloadMenu({ filters, itemAnswers }: Props) {
  const extra: Record<string, string> = itemAnswers ? { answers: 'true' } : {}

  return (
    <div className="ad-downloads" role="group" aria-label="Download all data">
      <span className="ad-downloads-label">Download all</span>
      {formats.map((f, i) => (
        <a
          key={f.format}
          className={i === 0 ? 'ad-dl is-main' : 'ad-dl'}
          href={allDataDownload('export', filters, { format: f.format, ...extra })}
          title={f.title}
          download
        >
          <AllDataIcon name={f.icon} size={17} />
          {f.label}
        </a>
      ))}
    </div>
  )
}