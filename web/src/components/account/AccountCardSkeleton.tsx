import '../../styles/account-skeleton.css'

// Outlines shown inside an account settings card while its details load.
// The card's icon and title stay real; only the loading parts are outlined.

type Props = {
  fields?: number
  chip?: boolean
  button?: boolean
}

export function AccountCardSkeleton({ fields = 0, chip = false, button = true }: Props) {
  return (
    <div className="account-skeleton" aria-hidden="true">
      {chip && <span className="skeleton account-skeleton-chip" />}
      {Array.from({ length: fields }, (_, i) => (
        <span key={i} className="account-skeleton-field">
          <span className="skeleton account-skeleton-label" />
          <span className="skeleton account-skeleton-input" />
        </span>
      ))}
      {button && <span className="skeleton account-skeleton-button" />}
    </div>
  )
}

// Stands in for the line of text under a card's title.
export function AccountTextSkeleton({ lines = 1 }: { lines?: number }) {
  return (
    <span className="account-skeleton-text-group" aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <span key={i} className="skeleton account-skeleton-text" />
      ))}
    </span>
  )
}