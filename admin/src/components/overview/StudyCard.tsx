// The active study at a glance. Studies are built in a later step, so for
// now this says no study is running and links to the Studies section.

type Props = {
  onOpen: () => void
}

export function StudyCard({ onOpen }: Props) {
  return (
    <section className="card panel study-card">
      <header className="panel-head">
        <h2 className="panel-title">Active study</h2>
        <span className="status is-off">Not running</span>
      </header>
      <div className="panel-body study-body">
        <p className="study-empty">No study running</p>
        <p className="muted small">
          When a study runs, this shows how many people are in it, how many saw the notice, and how
          much has been recorded.
        </p>
        <button type="button" className="button-secondary" onClick={onOpen}>
          Go to Studies
        </button>
      </div>
    </section>
  )
}