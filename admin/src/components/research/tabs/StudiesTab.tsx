import { Panel } from '../../common/Panel'

// Studies are built after the IRB is approved. Until then, nothing is
// tracked beyond the books people save.

export function StudiesTab() {
  return (
    <Panel title="Studies">
      <p className="muted">
        Studies start once the IRB is approved. Tracking stays off until then.
      </p>
      <ul className="method studies-plan">
        <li>Create a study and invite participants by email.</li>
        <li>Turn tracking on or off for each study.</li>
        <li>Record the date, time, and time spent on each question, under the research ID.</li>
        <li>Add those columns to the sheets and downloads.</li>
      </ul>
    </Panel>
  )
}