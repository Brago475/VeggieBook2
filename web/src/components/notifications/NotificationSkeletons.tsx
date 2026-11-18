import '../../styles/notification-skeletons.css'

// Loading outlines for the Notifications screens, shaped like the real
// cards: the message list, one notification, the Playlists tab and one
// playlist. Screen readers hear the label once instead of empty shapes.

type ListProps = {
  label: string
  kind: 'message' | 'playlist'
  count: number
}

// A group label and a few cards, as in the message list or the Playlists tab.
export function CardListSkeleton({ label, kind, count }: ListProps) {
  return (
    <div className="nf-skel" role="status" aria-busy="true">
      <span className="visually-hidden">{label}</span>
      <section className="nf-section" aria-hidden="true">
        <span className="skeleton nf-skel-label" />
        <ul className="nf-list">
          {Array.from({ length: count }, (_, i) => (
            <li key={i}>
              <div className="nf-skel-row">
                <span className={kind === 'message' ? 'skeleton nf-skel-icon' : 'skeleton nf-skel-cover'} />
                <span className="nf-skel-body">
                  <span className={kind === 'message' ? 'skeleton nf-skel-line' : 'skeleton nf-skel-line is-mid'} />
                  <span className="skeleton nf-skel-line is-short" />
                </span>
                <span className="skeleton nf-skel-chevron" />
              </div>
            </li>
          ))}
        </ul>
      </section>
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

const PLAYLIST_ROWS = 4

// One playlist: the heading, its rows (the same row outline a saved book
// uses), and the Skip and Keep buttons.
export function PlaylistSkeleton({ label }: { label: string }) {
  return (
    <div className="account-screen nf-screen pl-screen nf-skel" role="status" aria-busy="true">
      <span className="visually-hidden">{label}</span>
      <div aria-hidden="true">
        <header className="pl-head">
          <span className="skeleton nf-skel-kicker" />
          <span className="skeleton nf-skel-title" />
          <span className="skeleton nf-skel-sub" />
        </header>

        <ul className="book-recipes pl-items">
          {Array.from({ length: PLAYLIST_ROWS }, (_, i) => (
            <li key={i}>
              <div className="skel-row">
                <span className="skeleton skel-thumb" />
                <span className="skeleton skel-row-title" />
              </div>
            </li>
          ))}
        </ul>

        <div className="nf-skel-decide">
          <span className="skeleton" />
          <span className="skeleton" />
        </div>
      </div>
    </div>
  )
}