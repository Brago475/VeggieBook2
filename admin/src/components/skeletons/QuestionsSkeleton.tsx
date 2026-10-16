import '../../styles/books.css'
import '../../styles/questions.css'
import '../../styles/shimmer.css'
import { BlockSkeleton } from './BlockSkeleton'
import { CardRowSkeleton } from './CardRowSkeleton'

// Outline of Question Analytics: number cards, filters, tabs, and a chart.

const TABS = 4

export function QuestionsSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading answers">
      <div className="sk-stack" aria-hidden="true">
        <CardRowSkeleton className="bk-stats" />

        <BlockSkeleton height={64} />

        <div className="sk-pill-row">
          {Array.from({ length: TABS }, (_, i) => (
            <span key={i} className="sk sk-pill" />
          ))}
        </div>

        <BlockSkeleton height={320} title />
      </div>
    </div>
  )
}