import '../../styles/shimmer.css'

// Rows of a round mark and two lines, for feeds and lists.

type Props = {
  rows?: number
}

export function ListSkeleton({ rows = 6 }: Props) {
  return (
    <div className="sk-list">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="sk-list-row">
          <span className="sk sk-dot" />
          <span className="sk-lines">
            <span className="sk sk-line is-mid" />
            <span className="sk sk-line is-short" />
          </span>
        </div>
      ))}
    </div>
  )
}