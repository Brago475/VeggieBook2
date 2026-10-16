// Bottom button bar.
//
// The original app used a single full-width button pinned at the bottom and
// put Back in the masthead's top-left corner. This supports both: pass only
// a primary label for the original look, or add a secondary for two buttons.

type Props = {
  primaryLabel: string
  onPrimary: () => void
  secondaryLabel?: string
  onSecondary?: () => void
}

export function NavBar({
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: Props) {
  return (
    <div className="nav">
      {secondaryLabel && onSecondary && (
        <button type="button" className="nav-btn" onClick={onSecondary}>
          {secondaryLabel}
        </button>
      )}
      <button
        type="button"
        className="nav-btn nav-btn-primary"
        onClick={onPrimary}
      >
        {primaryLabel}
      </button>
    </div>
  )
}