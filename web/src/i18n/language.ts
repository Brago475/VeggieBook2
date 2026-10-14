// The site language and where it is remembered.
//
// The choice is kept in this browser. Before anything is chosen, a browser
// set to Spanish starts in Spanish; everything else starts in English.

export type Lang = 'en' | 'es'

const KEY = 'vb2-lang'

export function savedLang(): Lang {
  try {
    const value = localStorage.getItem(KEY)
    if (value === 'en' || value === 'es') return value
  } catch {
    // Storage can be blocked; fall through to the browser language.
  }
  const browser = typeof navigator !== 'undefined' ? navigator.language : ''
  return browser.toLowerCase().startsWith('es') ? 'es' : 'en'
}

export function saveLang(lang: Lang) {
  try {
    localStorage.setItem(KEY, lang)
  } catch {
    // The choice still applies for this visit.
  }
}