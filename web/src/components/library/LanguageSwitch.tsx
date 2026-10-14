import type { Lang } from '../../i18n/language'
import { useLang } from '../../i18n/languageContext'
import { GlobeIcon } from '../icons/LanguageIcons'
import '../../styles/language-switch.css'

// English and Spanish, inside the home menu above Sign out. Each option is
// written in its own language so it can be found in either one. Choosing
// one switches the site at once and keeps the menu open.

const OPTIONS: { lang: Lang; label: string }[] = [
  { lang: 'en', label: 'English' },
  { lang: 'es', label: 'Español' },
]

export function LanguageSwitch() {
  const { lang, setLang } = useLang()

  return (
    <div className="lang-switch" role="group" aria-label="Language / Idioma">
      <span className="lang-switch-label">
        <GlobeIcon />
        {lang === 'es' ? 'Idioma' : 'Language'}
      </span>

      <span className="lang-switch-options">
        {OPTIONS.map((option) => {
          const on = option.lang === lang
          return (
            <button
              key={option.lang}
              type="button"
              role="menuitemradio"
              aria-checked={on}
              lang={option.lang}
              className={on ? 'lang-switch-btn is-on' : 'lang-switch-btn'}
              onClick={() => setLang(option.lang)}
            >
              {option.label}
            </button>
          )
        })}
      </span>
    </div>
  )
}