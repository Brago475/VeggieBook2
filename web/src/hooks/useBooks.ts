import { useCallback, useEffect, useRef, useState } from 'react'
import type { BookSummary, NewBook } from '../types'
import { ApiError, apiFetch } from '../utils/api'

// The signed-in account's saved books, kept in sync with the API.
//
// Takes the signed-in email, or null for a guest. Guests have no books here
// at all: a guest's book exists only in the open page and is never sent to
// the server.
//
// The loaded list remembers which account it belongs to. If one person signs
// out and another signs in on the same device, the first person's books are
// never shown to the second, not even for the moment before the new list
// arrives.
//
// If the API answers 401 mid-visit (password changed on another device,
// account deleted elsewhere), onSessionEnded is called so the page can drop
// back to guest.

type Loaded = { owner: string; books: BookSummary[] }
type LoadError = { owner: string; message: string }

export function useBooks(email: string | null, onSessionEnded: () => void) {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [loadError, setLoadError] = useState<LoadError | null>(null)

  // Always call the latest onSessionEnded without restarting the load
  // whenever the parent re-renders.
  const sessionEnded = useRef(onSessionEnded)
  useEffect(() => {
    sessionEnded.current = onSessionEnded
  })

  const load = useCallback(async (owner: string) => {
    try {
      const books = await apiFetch<BookSummary[]>('/books')
      setLoaded({ owner, books })
      setLoadError(null)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        sessionEnded.current()
      } else {
        setLoadError({
          owner,
          message:
            err instanceof Error ? err.message : 'Could not load your books.',
        })
      }
    }
  }, [])

  useEffect(() => {
    if (email) void load(email)
  }, [email, load])

  const books = email && loaded?.owner === email ? loaded.books : []
  const error = email && loadError?.owner === email ? loadError.message : null
  const loading = email !== null && loaded?.owner !== email && error === null

  // Saves a finished book and refreshes the list. Throws an ApiError with a
  // message for the user if the save is refused, so the cover screen can
  // show it and let them try again.
  async function saveBook(book: NewBook): Promise<string> {
    try {
      const created = await apiFetch<{ id: string }>('/books', {
        method: 'POST',
        body: book,
      })
      if (email) await load(email)
      return created.id
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) sessionEnded.current()
      throw err
    }
  }

  async function deleteBook(id: string) {
    try {
      await apiFetch<void>(`/books/${id}`, { method: 'DELETE' })
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) sessionEnded.current()
      throw err
    }
    setLoaded((prev) =>
      prev ? { owner: prev.owner, books: prev.books.filter((b) => b.id !== id) } : prev,
    )
  }

  function reload() {
    if (email) void load(email)
  }

  return { books, loading, error, saveBook, deleteBook, reload }
}