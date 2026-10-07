import { percent } from '../../utils/math'

// One bar split into kept (green) and taken out later (orange), with the
// two totals under it.

type Props = {
  label: string
  kept: number
  removed: number
}

export function KeptRemovedBar({ label, kept, removed }: Props) {
  const total = kept + removed

  return (
    <div className="split">
      <div className="split-head">
        <span className="split-label">{label}</span>
        {total > 0 && <span className="split-pct">{percent(kept, total)}% kept</span>}
      </div>
      <div className="split-bar">
        {total > 0 && (
          <>
            <div className="split-kept" style={{ width: `${(kept / total) * 100}%` }} />
            <div className="split-removed" style={{ width: `${(removed / total) * 100}%` }} />
          </>
        )}
      </div>
      <div className="split-legend">
        <span>
          <span className="legend-dot is-kept" /> Kept <strong>{kept}</strong>
        </span>
        <span>
          <span className="legend-dot is-removed" /> Taken out <strong>{removed}</strong>
        </span>
      </div>
    </div>
  )
}