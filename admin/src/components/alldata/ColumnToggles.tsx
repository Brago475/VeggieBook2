import type { ColumnGroup } from '../../types/allData'
import { groupLabels, groupOrder } from '../../utils/allDataColumns'

// Show or hide groups of columns on screen. Downloads always have every
// column.

type Props = {
  shown: Record<ColumnGroup, boolean>
  onChange: (next: Record<ColumnGroup, boolean>) => void
}

export function ColumnToggles({ shown, onChange }: Props) {
  return (
    <div className="ad-columns">
      <span className="ad-columns-label">Show columns</span>
      {groupOrder.map((g) => (
        <button
          key={g}
          type="button"
          aria-pressed={shown[g]}
          className={shown[g] ? 'ad-chip-toggle is-on' : 'ad-chip-toggle'}
          onClick={() => onChange({ ...shown, [g]: !shown[g] })}
        >
          <span aria-hidden="true">{shown[g] ? '✓' : '+'}</span>
          {groupLabels[g]}
        </button>
      ))}
      <span className="ad-columns-note">Downloads always include every column.</span>
    </div>
  )
}