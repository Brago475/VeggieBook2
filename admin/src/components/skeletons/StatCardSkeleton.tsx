import '../../styles/shimmer.css'

// Outline of a StatCard: icon and label, the number, and a note line.

export function StatCardSkeleton() {
  return (
    <div className="card sk-stat">
      <div className="sk-stat-head">
        <span className="sk sk-icon" />
        <span className="sk sk-label" />
      </div>
      <span className="sk sk-value" />
      <span className="sk sk-note" />
    </div>
  )
}