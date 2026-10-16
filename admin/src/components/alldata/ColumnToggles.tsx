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
    <div className="vbd-columns">
      <span className="vbd-columns-label">Show columns</span>
      {groupOrder.map((g) => (
        <button
          key={g}
          type="button"
          aria-pressed={shown[g]}
          className={shown[g] ? 'vbd-chip-toggle is-on' : 'vbd-chip-toggle'}
          onClick={() => onChange({ ...shown, [g]: !shown[g] })}
        >
          <span aria-hidden="true">{shown[g] ? '✓' : '+'}</span>
          {groupLabels[g]}
        </button>
      ))}
      <span className="vbd-columns-note">Downloads always include every column.</span>
    </div>
  )
}