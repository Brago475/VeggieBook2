import '../../styles/panels.css'
import '../../styles/shimmer.css'

// Outline of a Panel: the heading line and one block for the body.

type Props = {
  height?: number
}

export function PanelSkeleton({ height = 240 }: Props) {
  return (
    <section className="card panel">
      <header className="panel-head">
        <span className="sk sk-title" />
      </header>
      <div className="panel-body">
        <span className="sk sk-chart" style={{ height }} />
      </div>
    </section>
  )
}