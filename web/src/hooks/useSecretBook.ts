import { useCallback, useEffect, useState } from 'react'
import type { Secret } from '../types'
import { ApiError, apiFetch } from '../utils/api'
import { useCategorySecrets } from './useSecrets'

// One saved Secrets Book with its secrets, for the screen that opens it
// from the home library. The Secrets counterpart of useBookDetail.
//
// Two loads, joined here:
//   /books/{id}/secrets                 which secrets this book keeps,
//                                       with its category and cover
//   /secret-categories/{id}/secrets     the category's content, the same
//                                       for everyone (text and pictures)
//
// The kept secrets come out in the order they were kept. One that has
// since been turned off in the content is skipped rather than listed
// blank, the same as a removed recipe in a VeggieBook.
//
// Takes the book id, or null when no book is open. A book belonging to
// another account answers 404, the same as one that does not exist.

export type SavedSecretsBook = {
  id: string
  kind: 'secrets'
  secretCategoryId: number
  cover: string
  createdAt: string
  secrets: { id: number; extraCopies: number }[]
}

type Loaded = { id: string; book: SavedSecretsBook }
type Failed = { id: string; message: string }

export function useSecretBook(id: string | null) {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [failed, setFailed] = useState<Failed | null>(null)

  useEffect(() => {
    if (id === null) return

    let cancelled = false
    setFailed(null)

    apiFetch<SavedSecretsBook>(`/books/${id}/secrets`)
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
  // secrets are never shown under a new book's title.
  const book = id !== null && loaded?.id === id ? loaded.book : null

  // The category's content, once the book says which category it is.
  const content = useCategorySecrets(book?.secretCategoryId ?? null)

  // The kept secrets, in the order they were kept, with their content.
  const byId = new Map<number, Secret>(
    (content.data?.secrets ?? []).map((s) => [s.id, s]),
  )
  const secrets: Secret[] = book
    ? book.secrets
        .map((s) => byId.get(s.id))
        .filter((s): s is Secret => s !== undefined)
    : []

  // Takes one secret out of this book. Throws with a message for the user
  // if the server refuses, so the screen can show it. On success the secret
  // leaves the list here straight away, without reloading the whole book.
  const removeSecret = useCallback(
    async (secretId: number) => {
      if (id === null) return
      await apiFetch<void>(`/books/${id}/secrets/${secretId}`, { method: 'DELETE' })
      setLoaded((prev) =>
        prev && prev.id === id
          ? {
              id,
              book: {
                ...prev.book,
                secrets: prev.book.secrets.filter((s) => s.id !== secretId),
              },
            }
          : prev,
      )
    },
    [id],
  )

  const bookError = id !== null && failed?.id === id ? failed.message : null
  const error = bookError ?? content.error
  // Loading until both the book and its category's content are in.
  const loading =
    id !== null && error === null && (book === null || content.data === null)

  return {
    book,
    category: content.data?.category ?? null,
    secrets,
    loading,
    error,
    removeSecret,
  }
}