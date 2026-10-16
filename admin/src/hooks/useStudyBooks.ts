import { useEffect, useState } from 'react'
import type { AllDataQuestion, AllDataSheet } from '../types/allData'
import { api } from '../utils/api'
import { allDataPath } from '../utils/allDataQuery'
import { noFilters } from '../utils/researchQuery'

// Loads one study's books for the Studies page: the same Books file as All
// Data, filtered to the study (api/Research/AllData/AllDataStudy.cs), and
// the questions, to show the answers in words.
//
// `refresh` changes when the study's numbers change (a book saved, the
// study switched off), so the table loads again and matches the counts.

type Loaded = {
  key: string
  books: AllDataSheet | null
  questions: AllDataQuestion[]
  error: string | null
}

export function useStudyBooks(study: number, refresh: string) {
  const path = allDataPath('books', noFilters, { study: String(study) })
  const key = `${path}#${refresh}`
  const [loaded, setLoaded] = useState<Loaded | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([api<AllDataSheet>(path), api<AllDataQuestion[]>('/admin/all-data/questions')])
      .then(([books, questions]) => {
        if (!cancelled) setLoaded({ key, books, questions, error: null })
      })
      .catch((err: Error) => {
        if (!cancelled) setLoaded({ key, books: null, questions: [], error: err.message })
      })
    return () => {
      cancelled = true
    }
  }, [key, path])

  const current = loaded !== null && loaded.key === key ? loaded : null

  return {
    rows: current?.books?.rows ?? [],
    questions: current?.questions ?? [],
    error: current?.error ?? null,
    loading: current === null,
  }
}