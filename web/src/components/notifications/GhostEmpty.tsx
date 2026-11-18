// Empty state for the Notifications and Playlists tabs: faded outlines of
// the rows that will appear, a title, a short line, and an optional button.

type Props = {
  kind: 'message' | 'playlist'
  title: string
  body: string
  action?: { label: string; onClick: () => void }
}

const ROWS = [
  { title: '72%', meta: '40%' },
  { title: '58%', meta: '34%' },
  { title: '64%', meta: '28%' },
]

export function GhostEmpty({ kind, title, body, action }: Props) {
  return (
    <div className="nf-ghost">
      <ul className="nf-ghost-rows" aria-hidden="true">
        {ROWS.map((row, i) => (
          <li key={i} className="nf-ghost-row">
            <span className={`nf-ghost-thumb${kind === 'playlist' ? ' is-cover' : ''}`} />
            <span className="nf-ghost-lines">
              <span className="nf-ghost-line" style={{ width: row.title }} />
              <span className="nf-ghost-line is-short" style={{ width: row.meta }} />
            </span>
          </li>
        ))}
      </ul>

      <h2 className="nf-ghost-title">{title}</h2>
      <p className="nf-ghost-body">{body}</p>

      {action && (
        <button type="button" className="nf-ghost-btn" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  )
}