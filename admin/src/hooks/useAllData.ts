import { useEffect, useState } from 'react'
import type { AllDataQuestion, AllDataSheet } from '../types/allData'
import type { ResearchFilters } from '../types/research'
import { api } from '../utils/api'
import { allDataPath } from '../utils/allDataQuery'

// Loads both All Data files and the questions, with the page's filters.
//
// The Recipes and secrets file is loaded with the book's answers on every
// row; the page hides those columns unless they are turned on.
//
// While new data loads, the previous data stays on screen (loading is
// true), so the table doesn't flash empty when a filter changes.
// `version` is bumped by the Refresh button to load again.

type Loaded = {
  key: string
  books: AllDataSheet | null
  items: AllDataSheet | null
  questions: AllDataQuestion[]
  error: string | null
}

export function useAllData(filters: ResearchFilters, version: number) {
  const booksPath = allDataPath('books', filters)
  const itemsPath = allDataPath('items', filters, { answers: 'true' })
  const key = `${booksPath}|${itemsPath}#${version}`
  const [loaded, setLoaded] = useState<Loaded | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      api<AllDataSheet>(booksPath),
      api<AllDataSheet>(itemsPath),
      api<AllDataQuestion[]>('/admin/all-data/questions'),
    ])
      .then(([books, items, questions]) => {
        if (!cancelled) setLoaded({ key, books, items, questions, error: null })
      })
      .catch((err: Error) => {
        if (!cancelled) setLoaded({ key, books: null, items: null, questions: [], error: err.message })
      })
    return () => {
      cancelled = true
    }
  }, [key, booksPath, itemsPath])

  const current = loaded !== null && loaded.key === key ? loaded : null
  const shown = current ?? loaded

  return {
    books: shown?.books ?? null,
    items: shown?.items ?? null,
    questions: shown?.questions ?? [],
    error: current?.error ?? null,
    loading: current === null,
  }
}