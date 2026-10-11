import type { StudyPreview } from '../../types/studies'
import { OffIdList } from './OffIdList'
import { StudyIcon } from './StudyIcons'
import { plural } from './studyFormat'
import '../../styles/studies-empty.css'

// Shown when no study has ever been switched on: what Study 1 would include
// right now, and a big button to start it. The button opens the same
// confirm dialog as the switch in the top bar, so nothing starts by
// accident.

type Props = {
  nextNumber: number
  preview: StudyPreview
  onStart: () => void
}

export function StudyEmpty({ nextNumber, preview, onStart }: Props) {
  const getsNotice = preview.offIds.filter((p) => p.by === 'self').length

  return (
    <section className="st-detail st-ready">
      <div className="st-detail-head">
        <span className="st-badge">
          <StudyIcon name="flask" size={24} />
        </span>
        <div className="st-detail-title">
          <span className="st-detail-name">
            <strong>Ready for Study {nextNumber}</strong>
          </span>
          <span className="st-ready-text">
            Nothing is recorded until a study is switched on. Here is who it would include right now.
          </span>
        </div>
      </div>

      <div className="st-dialog-tiles">
        <div className="st-tile is-green">
          <span className="st-tile-label">
            <StudyIcon name="signal" size={16} />
            Tracked
          </span>
          <span className="st-tile-value">{preview.tracked.toLocaleString()}</span>
          <span className="st-tile-note">
            of {plural(preview.people, 'participant', 'participants')}. Included right away, no notice.
          </span>
        </div>
        <div className="st-tile is-orange">
          <span className="st-tile-label">
            <StudyIcon name="bell" size={16} />
            Get the notice
          </span>
          <span className="st-tile-value">{getsNotice.toLocaleString()}</span>
          <span className="st-tile-note">Turned tracking off. They can turn it on or stay out.</span>
        </div>
      </div>

      <div className="st-off">
        <div className="st-off-head">
          <strong>Tracking off: research IDs</strong>
        </div>
        <OffIdList people={preview.offIds} />
      </div>

      <div className="st-ready-action">
        <button type="button" className="st-button is-green st-ready-button" onClick={onStart}>
          <StudyIcon name="play" size={18} />
          Start Study {nextNumber}
        </button>
        <span className="st-ready-note">You will see a confirm step first.</span>
      </div>
    </section>
  )
}