// A small "Live" line at the top of Overview: a pulsing green dot and the
// time the numbers were last loaded. Turns orange if the last refresh
// failed, while the older numbers stay on screen.

type Props = {
  updatedAt: Date | null
  failed: boolean
}

const timeFormat = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })

export function LiveStatus({ updatedAt, failed }: Props) {
  return (
    <p className={failed ? 'live is-failed' : 'live'}>
      <span className="live-dot" aria-hidden="true" />
      {failed ? (
        <span>Couldn't refresh. Showing numbers from {updatedAt ? timeFormat.format(updatedAt) : 'earlier'}.</span>
      ) : (
        <span>
          Live, updated {updatedAt ? timeFormat.format(updatedAt) : 'now'}. Refreshes every minute.
        </span>
      )}
    </p>
  )
}