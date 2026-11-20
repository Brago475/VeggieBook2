import { LockIcon } from '../../components/icons/LibraryIcons'
import { useStrings } from '../../i18n/useStrings'
import { StepList } from '../components/StepList'
import { ViewChoice } from '../components/ViewChoice'
import { LOCKED } from '../config'
import { useViewMode } from '../hooks/useViewMode'
import { ST_WELCOME } from '../strings/welcome'
import '../styles/supertracker.css'

// The SuperTracker2 welcome screen, opened from the VeggieBook menu. Shows
// the app or website layout chosen on this device. While LOCKED, Get
// started and the guide link show Coming soon and do nothing.

type Props = {
  onStart?: () => void
  onGuide?: () => void
}

export function SuperTrackerWelcome({ onStart, onGuide }: Props) {
  const t = useStrings(ST_WELCOME)
  const view = useViewMode()

  return (
    <div className={`st2 is-${view.mode}`}>
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
          {view.canChoose && (
            <ViewChoice
              label={t.viewLabel}
              value={view.saved}
              onChange={view.choose}
              options={[
                { mode: 'app', title: t.viewApp, text: t.viewAppText },
                { mode: 'site', title: t.viewSite, text: t.viewSiteText },
              ]}
            />
          )}

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