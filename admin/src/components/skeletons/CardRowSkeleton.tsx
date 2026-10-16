import '../../styles/shimmer.css'
import { StatCardSkeleton } from './StatCardSkeleton'

// A row of number card outlines. className sets the page's own grid.

type Props = {
  count?: number
  className?: string
}

export function CardRowSkeleton({ count = 4, className = 'sk-cards' }: Props) {
  return (
    <div className={className}>
      {Array.from({ length: count }, (_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  )
}