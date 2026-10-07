import { useResearchSheet } from '../../../hooks/useResearchSheet'
import type { ResearchFilters, SheetName } from '../../../types/research'
import { Panel } from '../../common/Panel'

// The codebook for the sheet chosen on the Data tab: each column's short
// name, full label, type, and possible values. The same list is in the
// Excel download's Codebook tab and the PDF's last page.

type Props = {
  sheetName: SheetName
  filters: ResearchFilters
  version: number
}

export function VariablesTab({ sheetName, filters, version }: Props) {
  const { sheet, error } = useResearchSheet(sheetName, filters, version)

  if (error) {
    return (
      <p className="error" role="alert">
        {error}
      </p>
    )
  }

  if (!sheet) return <p className="muted">Loading...</p>

  return (
    <Panel title={`Variables: ${sheet.title}`}>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Variable</th>
              <th>Label</th>
              <th>Type</th>
              <th>Values</th>
            </tr>
          </thead>
          <tbody>
            {sheet.columns.map((c) => (
              <tr key={c.key}>
                <td className="strong">{c.key}</td>
                <td>{c.label}</td>
                <td>{c.type}</td>
                <td className="muted">{c.values ? c.values.join('; ') : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}