// Empty states for the Notifications and Playlists tabs, drawn as faded
// versions of what will appear there.
//
//   message   a faded day heading and three fading spine pages, the title
//             and line, then an optional dashed closing card
//   playlist  a faded playlist card, shaped like the real one with the
//             spaced label, and a second card peeking under it, then the
//             title, line, and an optional button

type Props = {
  kind: 'message' | 'playlist'
  title: string
  body: string
  // Messages: the faded day heading and the closing card's line.
  day?: string
  note?: string
  // Playlists: the spaced word on the faded card.
  label?: string
  action?: { label: string; onClick: () => void }
}

function PhotoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="3" y="5" width="18" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="9" cy="10" r="1.8" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 17l5-4.5 4 3.5 3-2.5 4 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}

function PlaylistAddIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M4 6h12M4 11h12M4 16h7M17 14v6M14 17h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

const PAGE_LINES = [
  ['78%', '52%'],
  ['64%'],
  ['70%'],
]

export function GhostEmpty({ kind, title, body, day, note, label, action }: Props) {
  if (kind === 'message') {
    return (
      <div className="nf-ghost is-message">
        {day && (
          <div className="nf-ghost-day" aria-hidden="true">
            <span className="nf-ghost-day-title">{day}</span>
            <span className="nf-day-rule" />
          </div>
        )}

        <ul className="nf-ghost-pages" aria-hidden="true">
          {PAGE_LINES.map((lines, i) => (
            <li key={i} className="nf-ghost-page">
              <span className="nf-ghost-page-spine" />
              <span className="nf-ghost-page-body">
                {lines.map((w, j) => (
                  <span key={j} className="nf-ghost-line" style={{ width: w }} />
                ))}
                <span className="nf-ghost-line is-short" style={{ width: '22%' }} />
              </span>
            </li>
          ))}
        </ul>

        <h2 className="nf-ghost-title">{title}</h2>
        <p className="nf-ghost-body">{body}</p>

        {note && (
          <div className="nf-chapter-end is-ghost">
            <span className="nf-chapter-spine" aria-hidden="true" />
            <p className="nf-chapter-text">{note}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="nf-ghost is-playlist">
      <div className="nf-ghost-cards" aria-hidden="true">
        <div className="nf-ghost-card">
          <span className="nf-ghost-photo">
            <PhotoIcon />
          </span>
          <span className="nf-ghost-dots">
            <span className="is-on" />
            <span />
            <span />
          </span>
          <span className="nf-ghost-badge" />
          <span className="nf-ghost-text">
            <span className="nf-ghost-name" />
            {label && <span className="nf-ghost-label">{label}</span>}
            <span className="nf-ghost-count" />
          </span>
          <span className="nf-ghost-open" />
        </div>
        <div className="nf-ghost-card is-peek" />
      </div>

      <h2 className="nf-ghost-title">{title}</h2>
      <p className="nf-ghost-body">{body}</p>

      {action && (
        <button type="button" className="nf-ghost-btn" onClick={action.onClick}>
          <PlaylistAddIcon />
          {action.label}
        </button>
      )}
    </div>
  )
}