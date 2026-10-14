import { createContext, useContext } from 'react'
import type { Lang } from './language'

// The current language, shared with every screen through LanguageProvider.

export type LanguageValue = {
  lang: Lang
  setLang: (lang: Lang) => void
}

export const LanguageContext = createContext<LanguageValue>({
  lang: 'en',
  setLang: () => {},
})

export function useLang(): LanguageValue {
  return useContext(LanguageContext)
}