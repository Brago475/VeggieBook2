// The numbered steps on the welcome screen.

type Step = { title: string; text: string }

type Props = {
  label: string
  steps: Step[]
}

export function StepList({ label, steps }: Props) {
  return (
    <ol className="st2-steps" aria-label={label}>
      {steps.map((s, i) => (
        <li key={s.title} className="st2-step">
          <span className="st2-step-num" aria-hidden="true">
            {i + 1}
          </span>
          <span className="st2-step-text">
            <span className="st2-step-title">{s.title}</span>
            <span className="st2-step-sub">{s.text}</span>
          </span>
        </li>
      ))}
    </ol>
  )
}