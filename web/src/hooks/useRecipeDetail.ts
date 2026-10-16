import { useEffect, useState } from 'react'
import { useLang } from '../i18n/languageContext'
import type { RecipeDetail } from '../types'

// Loads one recipe's full content in the current language. The review flow
// shows recipes one at a time, so fetching per card avoids pulling detail
// for recipes the user drops without ever seeing.
//
// Every result is stored with the id and language it belongs to, and only
// returned while both still match what is asked for. A different recipe or
// language simply has no content yet, from the first frame, so old content
// never shows under a new title.

type Loaded = {
  id: number
  lang: string
  detail: RecipeDetail | null
  error: string | null
}

export function useRecipeDetail(id: number | null) {
  const { lang } = useLang()
  const [loaded, setLoaded] = useState<Loaded | null>(null)

  useEffect(() => {
    if (id === null) return

    let cancelled = false

    fetch(`/api/recipes/${id}?lang=${lang}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data: RecipeDetail) => {
        if (!cancelled) setLoaded({ id, lang, detail: data, error: null })
      })
      .catch((err) => {
        if (!cancelled) setLoaded({ id, lang, detail: null, error: String(err) })
      })

    // Guards against a slow response for a recipe the user already passed.
    return () => {
      cancelled = true
    }
  }, [id, lang])

  const current = loaded !== null && loaded.id === id && loaded.lang === lang ? loaded : null

  return {
    detail: current?.detail ?? null,
    error: current?.error ?? null,
  }
}