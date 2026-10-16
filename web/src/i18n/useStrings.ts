import type { Lang } from './language'
import { useLang } from './languageContext'

// Picks one area's words in the current language. Each strings file
// exports { en, es }, and es is typed to match en, so a missing Spanish
// line fails the build.

export type Strings<T> = Record<Lang, T>

export function useStrings<T>(strings: Strings<T>): T {
  return strings[useLang().lang]
}