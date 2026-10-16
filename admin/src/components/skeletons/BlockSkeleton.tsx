import '../../styles/shimmer.css'

// A card with one block, optionally under a title line.

type Props = {
  height?: number
  title?: boolean
}

export function BlockSkeleton({ height = 200, title = false }: Props) {
  return (
    <div className="card sk-block">
      {title && <span className="sk sk-title has-space" />}
      <span className="sk sk-fill" style={{ height }} />
    </div>
  )
}