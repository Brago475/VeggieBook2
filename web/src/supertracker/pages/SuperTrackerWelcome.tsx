import { LockIcon } from '../../components/icons/LibraryIcons'
import { useStrings } from '../../i18n/useStrings'
import { StepList } from '../components/StepList'
import { LOCKED } from '../config'
import { ST_WELCOME } from '../strings/welcome'
import '../styles/supertracker.css'

// The SuperTracker2 welcome screen, opened from the VeggieBook menu.
// While LOCKED, Get started and the guide link show Coming soon.

type Props = {
  onStart?: () => void
  onGuide?: () => void
}

export function SuperTrackerWelcome({ onStart, onGuide }: Props) {
  const t = useStrings(ST_WELCOME)

  return (
    <div className="st2">
      <div className="st2-welcome">
        <section className="st2-hero">
          <img
            className="st2-logo"
            src="/supertracker/supertracker2-icon-192.png"
            alt={t.logoAlt}
            width={96}
            height={96}
          />
          <h1 className="library-title st2-title">{t.title}</h1>
          <p className="st2-intro">{t.intro}</p>
        </section>

        <section className="st2-side">
          <StepList label={t.stepsLabel} steps={t.steps} />
          <p className="st2-note">{t.separate}</p>
        </section>

        <section className="st2-actions">
          <button type="button" className="st2-start" disabled={LOCKED} onClick={onStart}>
            {LOCKED && <LockIcon />}
            {t.getStarted}
          </button>
          <button type="button" className="st2-guide" disabled={LOCKED} onClick={onGuide}>
            {t.guide}
          </button>
          {LOCKED && <p className="st2-soon">{t.comingSoon}</p>}
        </section>
      </div>
    </div>
  )
}