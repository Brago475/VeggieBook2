import { useEffect, useState } from 'react'
import type { BookDetail, VbRecipe, VbSecretCategory } from '../types/books'
import { api } from '../utils/api'

// What an opened book needs, each loaded only when asked for:
//
//   useBookDetail(key)          the book itself (admin API)
//   useVbRecipe(id)             one recipe, from the same public API the
//                               app uses, so it reads the same
//   useVbSecretCategory(id)     a Secrets category with all its secrets,
//                               also the app's public API
//
// Every result is kept with the address it came from, and only returned
// while that is still the one asked for, so moving to another book or
// recipe never shows the previous one's content for a moment.

type Result<T> = { path: string; value: T | null; error: string | null }

function useLoad<T>(path: string | null) {
  const [result, setResult] = useState<Result<T> | null>(null)

  useEffect(() => {
    if (path === null) return
    let cancelled = false
    api<T>(path)
      .then((value) => {
        if (!cancelled) setResult({ path, value, error: null })
      })
      .catch((err: Error) => {
        if (!cancelled) setResult({ path, value: null, error: err.message })
      })
    return () => {
      cancelled = true
    }
  }, [path])

  const current = path !== null && result?.path === path ? result : null
  return {
    value: current?.value ?? null,
    error: current?.error ?? null,
    loading: path !== null && current === null,
  }
}

// key is "VB2-K7M4-Q9PX-3": the research ID, then the book number.
export function useBookDetail(key: string | null) {
  let path: string | null = null
  if (key !== null) {
    const cut = key.lastIndexOf('-')
    path = `/admin/books/${encodeURIComponent(key.slice(0, cut))}/${key.slice(cut + 1)}`
  }
  const { value, error, loading } = useLoad<BookDetail>(path)
  return { detail: value, error, loading }
}

export function useVbRecipe(id: number | null) {
  const { value, error, loading } = useLoad<VbRecipe>(id === null ? null : `/recipes/${id}`)
  return { recipe: value, error, loading }
}

export function useVbSecretCategory(id: number | null) {
  const { value, error, loading } = useLoad<VbSecretCategory>(id === null ? null : `/secret-categories/${id}/secrets`)
  return { category: value, error, loading }
}