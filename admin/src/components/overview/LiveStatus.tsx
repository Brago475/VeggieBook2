// The "Live" line at the top of Overview: a green Live pill with a pulsing
// dot, then the full day, date, and time the numbers were last loaded, in
// Eastern time like the rest of the page, so there's no doubt which day it
// means. Turns orange if the last refresh failed, while the older numbers
// stay on screen.

type Props = {
  updatedAt: Date | null
  failed: boolean
}

// "Sunday, October 11, 2026 at 2:44 PM"
const fullFormat = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'full',
  timeStyle: 'short',
  timeZone: 'America/New_York',
})

export function LiveStatus({ updatedAt, failed }: Props) {
  const when = updatedAt ? fullFormat.format(updatedAt) : null

  return (
    <div className={failed ? 'live is-failed' : 'live'} role="status">
      <span className="live-pill">
        <span className="live-dot" aria-hidden="true" />
        {failed ? 'Not updating' : 'Live'}
      </span>
      {failed ? (
        <span>
          Couldn't refresh. Showing numbers from <strong>{when ?? 'earlier'}</strong> Eastern.
        </span>
      ) : (
        <>
          <span>
            Updated <strong>{when ?? 'just now'}</strong> Eastern
          </span>
          <span className="live-note">Refreshes every minute</span>
        </>
      )}
    </div>
  )
}