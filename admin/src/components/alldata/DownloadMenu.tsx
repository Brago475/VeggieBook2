import type { ResearchFilters } from '../../types/research'
import { allDataDownload } from '../../utils/allDataQuery'

// "Download all" gives one .zip with both files as Excel, CSV, and SPSS.
// "More downloads" opens the single-file downloads. Plain links: the
// browser saves what the API sends, using the page's session. Every link
// carries the page's filters.

type Props = {
  filters: ResearchFilters
  itemAnswers: boolean
}

const formats = [
  { format: 'xlsx', label: 'Excel' },
  { format: 'csv', label: 'CSV' },
  { format: 'spss', label: 'SPSS' },
]

export function DownloadMenu({ filters, itemAnswers }: Props) {
  const itemsExtra: Record<string, string> = itemAnswers ? { answers: 'true' } : {}

  return (
    <div className="ad-downloads">
      <details className="ad-more">
        <summary className="button-secondary">More downloads</summary>
        <div className="ad-more-menu">
          <a className="ad-more-item" href={allDataDownload('export', filters, { format: 'xlsx' })} download>
            <strong>Both files, one Excel workbook</strong>
            <span>Books, Recipes and secrets, Variables, Questions</span>
          </a>

          <div className="ad-more-group">
            <span className="ad-more-title">Books only</span>
            <div className="ad-more-links">
              {formats.map((f) => (
                <a key={f.format} href={allDataDownload('export/books', filters, { format: f.format })} download>
                  {f.label}
                </a>
              ))}
            </div>
          </div>

          <div className="ad-more-group">
            <span className="ad-more-title">
              Recipes and secrets only{itemAnswers ? ', with book answers' : ''}
            </span>
            <div className="ad-more-links">
              {formats.map((f) => (
                <a
                  key={f.format}
                  href={allDataDownload('export/items', filters, { format: f.format, ...itemsExtra })}
                  download
                >
                  {f.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </details>

      <a className="ad-download-all" href={allDataDownload('export', filters, { format: 'zip' })} download>
        Download all
      </a>
    </div>
  )
}