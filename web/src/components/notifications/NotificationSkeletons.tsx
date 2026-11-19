import '../../styles/notification-skeletons.css'

// Loading outlines for the Notifications screens, shaped like the real
// thing so nothing jumps when it arrives: the message list as spine pages,
// the Playlists tab as photo cards, one notification, and one open
// playlist (its top, its vegetable chapters, and the bottom bar). Screen
// readers hear the label once instead of empty shapes.

type ListProps = {
  label: string
  kind: 'message' | 'playlist'
  count: number
}

// The message list or the Playlists tab.
export function CardListSkeleton({ label, kind, count }: ListProps) {
  const items = Array.from({ length: count }, (_, i) => i)

  return (
    <div className="nf-skel" role="status" aria-busy="true">
      <span className="visually-hidden">{label}</span>

      {kind === 'message' ? (
        <div aria-hidden="true">
          <div className="nf-skel-day">
            <span className="skeleton nf-skel-day-title" />
            <span className="nf-skel-day-rule" />
          </div>
          <div className="nf-skel-stack">
            {items.map((i) => (
              <div key={i} className="nf-skel-page">
                <span className="nf-skel-page-spine" />
                <span className="nf-skel-page-body">
                  <span className="skeleton nf-skel-line" />
                  <span className="skeleton nf-skel-line is-mid" />
                  <span className="skeleton nf-skel-line is-short" />
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="nf-skel-stack is-cards" aria-hidden="true">
          {items.map((i) => (
            <div key={i} className="skeleton nf-skel-pcard">
              <span className="nf-skel-pcard-badge" />
              <span className="nf-skel-pcard-text">
                <span className="nf-skel-pcard-name" />
                <span className="nf-skel-pcard-label" />
                <span className="nf-skel-pcard-count" />
              </span>
              <span className="nf-skel-pcard-open" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// One notification's card: the date row, the text, and a button.
export function DetailSkeleton({ label }: { label: string }) {
  return (
    <div className="nf-skel" role="status" aria-busy="true">
      <span className="visually-hidden">{label}</span>
      <div className="nf-skel-card" aria-hidden="true">
        <div className="nf-skel-meta">
          <span className="skeleton nf-skel-dot" />
          <span className="skeleton nf-skel-date" />
        </div>
        <div className="nf-skel-text">
          <span className="skeleton nf-skel-line" />
          <span className="skeleton nf-skel-line" />
          <span className="skeleton nf-skel-line" />
        </div>
        <span className="skeleton nf-skel-button" />
      </div>
    </div>
  )
}

const CHAPTERS = 3

// One open playlist: the top like its card, folded vegetable chapters, and
// the bar pinned to the bottom.
export function PlaylistSkeleton({ label }: { label: string }) {
  return (
    <div className="account-screen nf-screen pl-screen nf-skel" role="status" aria-busy="true">
      <span className="visually-hidden">{label}</span>
      <div aria-hidden="true">
        <div className="skeleton nf-skel-pcard is-hero">
          <span className="nf-skel-pcard-badge" />
          <span className="nf-skel-pcard-text">
            <span className="nf-skel-pcard-name" />
            <span className="nf-skel-pcard-label" />
            <span className="nf-skel-pcard-count" />
          </span>
        </div>

        <div className="nf-skel-stack">
          {Array.from({ length: CHAPTERS }, (_, i) => (
            <div key={i} className="nf-skel-chapter">
              <span className="skeleton nf-skel-avatar" />
              <span className="nf-skel-chapter-text">
                <span className="skeleton nf-skel-line is-tiny" />
                <span className="skeleton nf-skel-line is-mid" />
              </span>
              <span className="skeleton nf-skel-count" />
            </div>
          ))}
        </div>

        <div className="nf-skel-bar">
          <span className="skeleton" />
          <span className="skeleton" />
        </div>
      </div>
    </div>
  )
}