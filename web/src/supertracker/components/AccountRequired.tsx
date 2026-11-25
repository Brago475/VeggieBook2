import { useStrings } from '../../i18n/useStrings'
import { ST_SETUP } from '../strings/setup'

// Shown to guests, who cannot use SuperTracker2.

export function AccountRequired() {
  const t = useStrings(ST_SETUP)

  return (
    <section className="st2-panel">
      <img
        className="st2-logo"
        src="/supertracker/supertracker2-icon-192.png"
        alt=""
        width={96}
        height={96}
      />
      <h1 className="library-title st2-title">{t.guestTitle}</h1>
      <p className="st2-intro">{t.guestText}</p>
    </section>
  )
}