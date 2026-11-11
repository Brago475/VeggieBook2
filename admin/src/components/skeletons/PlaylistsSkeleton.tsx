import '../../styles/shimmer.css'
import '../../styles/notification-skeletons.css'

// Outline of the Notifications page's Playlists section: the list card's
// title and filter chips, then playlist cards with a photo area, two lines
// and the button bar.

const CARDS = 6

export function PlaylistsSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading playlists">
      <div className="card sk-block" aria-hidden="true">
        <div className="sk-bar-row">
          <span className="sk sk-title" />
          <span className="sk sk-tabs" />
        </div>

        <ul className="plc-grid">
          {Array.from({ length: CARDS }, (_, i) => (
            <li key={i} className="ntsk-card">
              <span className="sk ntsk-photo" />
              <span className="ntsk-body">
                <span className="sk sk-line is-mid" />
                <span className="sk sk-line is-short" />
              </span>
              <span className="ntsk-actions">
                <span className="sk" />
                <span className="sk" />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}