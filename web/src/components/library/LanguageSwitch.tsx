import type { Lang } from '../../i18n/language'
import { useLang } from '../../i18n/languageContext'
import { useStrings } from '../../i18n/useStrings'
import { COMMON } from '../../i18n/strings/common'
import { GlobeIcon } from '../icons/LanguageIcons'
import '../../styles/language-switch.css'

// English and Spanish. Each option is written in its own language so it can
// be found in either one. Choosing one switches the site at once.
//
//   menu    the full-width switch in the home menu, under its LANGUAGE
//           label (MainMenu.tsx)
//   inline  a small centered switch, under Sign in on Welcome

const OPTIONS: { lang: Lang; label: string }[] = [
  { lang: 'en', label: 'English' },
  { lang: 'es', label: 'Español' },
]

type Props = { variant?: 'menu' | 'inline' }

export function LanguageSwitch({ variant = 'menu' }: Props) {
  const { lang, setLang } = useLang()
  const t = useStrings(COMMON)
  const inMenu = variant === 'menu'

  return (
    <div
      className={inMenu ? 'lang-switch is-menu' : 'lang-switch is-inline'}
      role="group"
      aria-label={inMenu ? t.language : 'Language / Idioma'}
    >
      {!inMenu && <GlobeIcon className="lang-switch-globe" />}

      <span className="lang-switch-options">
        {OPTIONS.map((option) => {
          const on = option.lang === lang
          const state = inMenu
            ? { role: 'menuitemradio', 'aria-checked': on }
            : { 'aria-pressed': on }
          return (
            <button
              key={option.lang}
              type="button"
              lang={option.lang}
              className={on ? 'lang-switch-btn is-on' : 'lang-switch-btn'}
              onClick={() => setLang(option.lang)}
              {...state}
            >
              {option.label}
            </button>
          )
        })}
      </span>
    </div>
  )
}