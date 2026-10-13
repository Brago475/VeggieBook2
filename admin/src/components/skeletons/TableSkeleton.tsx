import type { CSSProperties } from 'react'
import '../../styles/shimmer.css'

// A table outline: a header row and data rows.

type Props = {
  rows?: number
  cols?: number
}

export function TableSkeleton({ rows = 8, cols = 6 }: Props) {
  const style = { '--sk-cols': cols } as CSSProperties
  const cells = (key: string) =>
    Array.from({ length: cols }, (_, i) => <span key={`${key}-${i}`} className="sk sk-line" />)

  return (
    <div className="card sk-block" style={style}>
      <div className="sk-table-row is-head">{cells('h')}</div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="sk-table-row">
          {cells(`r${r}`)}
        </div>
      ))}
    </div>
  )
}