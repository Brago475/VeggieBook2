// The step bar at the top of the playlist editor. Steps past the furthest
// one that can be opened are disabled.

type Props = {
  steps: string[]
  current: number
  reachable: number
  onGo: (index: number) => void
}

export function PlaylistSteps({ steps, current, reachable, onGo }: Props) {
  return (
    <ol className="pe-steps">
      {steps.map((label, i) => {
        const done = i < current
        const cls = i === current ? 'pe-step is-current' : done ? 'pe-step is-done' : 'pe-step'
        return (
          <li key={label}>
            <button
              type="button"
              className={cls}
              aria-current={i === current ? 'step' : undefined}
              disabled={i > reachable}
              onClick={() => onGo(i)}
            >
              <span className="pe-step-num">{done ? '\u2713' : i + 1}</span>
              {label}
            </button>
          </li>
        )
      })}
    </ol>
  )
}