import { percent } from '../../utils/math'

// One row: a label, a bar split into kept (green) and taken out later
// (orange), and the two counts.

type Props = {
  label: string
  kept: number
  removed: number
}

export function KeptRemovedBar({ label, kept, removed }: Props) {
  const total = kept + removed

  return (
    <div className="split-row">
      <span className="split-label">{label}</span>
      <div className="bar split-bar">
        {total > 0 && (
          <>
            <div className="bar-fill" style={{ width: `${percent(kept, total, 1)}%` }} />
            <div className="bar-fill is-warn" style={{ width: `${percent(removed, total, 1)}%` }} />
          </>
        )}
      </div>
      <span className="split-counts">
        {kept} kept, <span className="warn-text">{removed} taken out</span>
      </span>
    </div>
  )
}