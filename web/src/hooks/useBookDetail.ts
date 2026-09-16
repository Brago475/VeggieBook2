import { useEffect, useState } from 'react'
import { ApiError, apiFetch } from '../utils/api'

// One saved book with its recipes, for the screen that opens a book from
// the home library.
//
// The recipes arrive with their titles and first photo, so the list needs
// no further requests. Opening one recipe still loads its full content
// through useRecipeDetail, the same way the review step does.
//
// Takes the book id, or null when no book is open. A book belonging to
// another account answers 404, the same as one that does not exist, so
// there is nothing to distinguish here.

export type BookRecipeSummary = {
  id: number
  extraCopies: number
  displayCode: string | null
  title: string
  // Null for the recipes whose photos were lost with the original img/
  // folder, so the list shows a title alone rather than a broken image.
  photo: string | null
}

export type BookDetail = {
  id: string
  kind: string
  vegetableCode: string
  cover: string
  createdAt: string
  attributes: string[]
  recipes: BookRecipeSummary[]
}

type Loaded = { id: string; book: BookDetail }
type Failed = { id: string; message: string }

export function useBookDetail(id: string | null) {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [failed, setFailed] = useState<Failed | null>(null)

  useEffect(() => {
    if (id === null) return

    let cancelled = false
    setFailed(null)

    apiFetch<BookDetail>(`/books/${id}`)
      .then((book) => {
        if (!cancelled) setLoaded({ id, book })
      })
      .catch((err) => {
        if (cancelled) return
        const message =
          err instanceof ApiError && err.status === 404
            ? 'This book is no longer available.'
            : err instanceof Error
              ? err.message
              : 'Could not open this book.'
        setFailed({ id, message })
      })

    // Guards against a slow response for a book the user has already left.
    return () => {
      cancelled = true
    }
  }, [id])

  // Only answers for the book currently asked for, so the previous book's
  // recipes are never shown under a new book's title.
  const book = id !== null && loaded?.id === id ? loaded.book : null
  const error = id !== null && failed?.id === id ? failed.message : null
  const loading = id !== null && book === null && error === null

  return { book, loading, error }
}