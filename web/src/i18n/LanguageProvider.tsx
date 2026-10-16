import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { saveLang, savedLang, type Lang } from './language'
import { LanguageContext } from './languageContext'

// Holds the site language, remembers changes, and keeps the page's lang
// attribute in step so screen readers use the right pronunciation.

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setState] = useState<Lang>(savedLang)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((next: Lang) => {
    setState(next)
    saveLang(next)
  }, [])

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}