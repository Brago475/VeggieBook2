import { useLang } from '../../i18n/languageContext'
import { COMMON } from '../../i18n/strings/common'
import { CRASH } from '../../i18n/strings/crash'
import { useStrings } from '../../i18n/useStrings'
import '../../styles/crash.css'

// Shown by ErrorBoundary. Both actions load the page fresh, which clears the failed state.

export function CrashScreen() {
  const { lang } = useLang()
  const t = useStrings(CRASH)
  const common = useStrings(COMMON)

  return (
    <main className="crash">
      <img
        className="crash-logo"
        src={`/brand/logo-positive-${lang}.png`}
        alt={common.veggieLogoAlt}
      />
      <div className="crash-card" role="alert">
        <h1 className="crash-title">{t.title}</h1>
        <p className="crash-text">{t.text}</p>
        <div className="crash-actions">
          <button
            type="button"
            className="crash-primary"
            onClick={() => window.location.reload()}
          >
            {t.reload}
          </button>
          <button
            type="button"
            className="crash-link"
            onClick={() => window.location.assign('/')}
          >
            {t.home}
          </button>
        </div>
      </div>
    </main>
  )
}