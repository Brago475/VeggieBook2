import { useEffect, useRef, useState } from 'react'
import type { Lang } from '../i18n/language'
import { useLang } from '../i18n/languageContext'
import type { CategorySecrets, SecretCategory } from '../types'
import { apiFetch } from '../utils/api'

// The Secrets Book content. Three loads, used by different screens:
//
//   useSecretCategories  the five categories, for the picker and the home
//                        cards. Reloaded when the language changes.
//   useCategorySecrets   every secret in one category, for the review step.
//                        Loaded when a category is picked.
//   useSecretCovers      one category's pictures, for the cover browser.
//                        Loaded as the user moves between categories, and
//                        remembered, so going back to one is instant.
//
// All open to guests, the same as the vegetables and recipes. Each takes
// the current site language unless one is passed in.

export function useSecretCategories(langOverride?: Lang) {
  const { lang: siteLang } = useLang()
  const lang = langOverride ?? siteLang

  const [categories, setCategories] = useState<SecretCategory[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Ignores a reply that arrives after the screen has moved on, so a
    // slow answer never overwrites a newer one.
    let current = true
    setError(null)

    apiFetch<SecretCategory[]>(`/secret-categories?lang=${lang}`)
      .then((rows) => {
        if (current) setCategories(rows)
      })
      .catch((err: Error) => {
        if (current) setError(err.message)
      })
      .finally(() => {
        if (current) setLoading(false)
      })

    return () => {
      current = false
    }
  }, [lang])

  return { categories, loading, error }
}

// null while no category is chosen: nothing is loaded and data stays null.
export function useCategorySecrets(categoryId: number | null, langOverride?: Lang) {
  const { lang: siteLang } = useLang()
  const lang = langOverride ?? siteLang

  const [data, setData] = useState<CategorySecrets | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // A new category or language clears the old secrets first, so the
    // review screen never shows Breakfast secrets while Lunch is loading.
    setData(null)
    setError(null)

    if (categoryId === null) {
      setLoading(false)
      return
    }

    let current = true
    setLoading(true)

    apiFetch<CategorySecrets>(`/secret-categories/${categoryId}/secrets?lang=${lang}`)
      .then((result) => {
        if (current) setData(result)
      })
      .catch((err: Error) => {
        if (current) setError(err.message)
      })
      .finally(() => {
        if (current) setLoading(false)
      })

    return () => {
      current = false
    }
  }, [categoryId, lang])

  return { data, loading, error }
}

// covers is null while a category's pictures are loading, which is when
// the cover grid shows its skeleton tiles.
export function useSecretCovers(categoryId: number, langOverride?: Lang) {
  const { lang: siteLang } = useLang()
  const lang = langOverride ?? siteLang

  // Pictures already loaded, by language and category. A ref rather than
  // state, the same as useCovers: it is a cache, and filling it should not
  // redraw.
  const cache = useRef(new Map<string, string[]>())
  const key = `${lang}:${categoryId}`

  const [loaded, setLoaded] = useState<{ key: string; covers: string[] } | null>(null)
  const [error, setError] = useState<{ key: string; message: string } | null>(null)

  useEffect(() => {
    if (cache.current.has(key)) return

    let current = true
    apiFetch<string[]>(`/secret-categories/${categoryId}/covers?lang=${lang}`)
      .then((covers) => {
        cache.current.set(key, covers)
        if (current) setLoaded({ key, covers })
      })
      .catch((err: Error) => {
        if (current) setError({ key, message: err.message })
      })

    return () => {
      current = false
    }
  }, [key, categoryId, lang])

  // Read in the same render, so switching category never shows the last
  // one's pictures for a frame.
  const covers =
    cache.current.get(key) ?? (loaded?.key === key ? loaded.covers : null)

  return {
    covers,
    error: error?.key === key ? error.message : null,
  }
}