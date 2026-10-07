import { percent } from '../../utils/math'

// One bar split into kept (green) and taken out later (orange).

type Props = {
  label: string
  kept: number
  removed: number
}

export function KeptRemovedBar({ label, kept, removed }: Props) {
  const total = kept + removed

  return (
    <div className="split">
      <div className="split-top">
        <span className="split-label">{label}</span>
        <span className="muted small">
          {kept} kept · {removed} taken out
        </span>
      </div>
      {total === 0 ? (
        <p className="muted small">None saved yet.</p>
      ) : (
        <>
          <div className="split-bar">
            <div className="split-kept" style={{ width: `${(kept / total) * 100}%` }} />
            <div className="split-removed" style={{ width: `${(removed / total) * 100}%` }} />
          </div>
          <p className="muted small split-note">
            {percent(removed, total)}% were taken out after the book was saved.
          </p>
        </>
      )}
    </div>
  )
}