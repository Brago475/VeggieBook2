import type { PictureCount } from '../../types/admin'
import { imageUrl } from '../../utils/images'
import '../../styles/overview-rings.css'

// Books by vegetable, or Secrets Books by category, as pictures.
//
// Everything picked at least once gets a ring around its picture. The ring
// fills by its share of all books of that kind, and under it are the name,
// the number of books, and the share. Everything not picked yet sits below
// as small picture chips, so the zeros take little room but stay visible.
//
// Green for VeggieBooks, violet for Secrets Books (the page's four colors).
// A picture that is missing or fails to load shows the first letter instead.

type Props = {
  rows: PictureCount[]
  unit: string // "VeggieBooks" or "Secrets Books"
  tone: 'green' | 'violet'
  empty: string
}

function Picture({ row, className }: { row: PictureCount; className: string }) {
  if (!row.image) {
    return (
      <span className={`${className} is-letter`} aria-hidden="true">
        {row.name.charAt(0)}
      </span>
    )
  }
  return (
    <img
      className={className}
      src={imageUrl(row.image)}
      alt=""
      loading="lazy"
      onError={(e) => {
        e.currentTarget.style.visibility = 'hidden'
      }}
    />
  )
}

export function PictureRings({ rows, unit, tone, empty }: Props) {
  const total = rows.reduce((sum, r) => sum + r.count, 0)
  const picked = rows.filter((r) => r.count > 0)
  const notPicked = rows.filter((r) => r.count === 0)

  return (
    <div className={`rings is-${tone}`}>
      {picked.length === 0 ? (
        <p className="muted">{empty}</p>
      ) : (
        <ul className="rings-grid">
          {picked.map((r, i) => {
            const share = total > 0 ? Math.round((r.count / total) * 100) : 0
            return (
              <li key={r.name} className="ring-item" style={{ animationDelay: `${i * 60}ms` }}>
                <div
                  className="ring"
                  style={{ ['--share' as string]: `${share}%` }}
                  role="img"
                  aria-label={`${r.name}: ${r.count} of ${total} ${unit}, ${share}%`}
                >
                  <span className="ring-inner">
                    <Picture row={r} className="ring-pic" />
                  </span>
                </div>
                <span className="ring-name">{r.name}</span>
                <span className="ring-count">{r.count === 1 ? '1 book' : `${r.count.toLocaleString()} books`}</span>
                <span className="ring-share">
                  {share}% of {unit}
                </span>
              </li>
            )
          })}
        </ul>
      )}

      {notPicked.length > 0 && (
        <div className="rings-rest">
          <span className="rings-rest-title">Not picked yet</span>
          <ul className="rings-chips">
            {notPicked.map((r) => (
              <li key={r.name} className="ring-chip">
                <Picture row={r} className="ring-chip-pic" />
                {r.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}