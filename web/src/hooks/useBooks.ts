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

  // The latest arguments, for code that runs after an await. A save can
  // finish after the page has moved on (for example, a guest who has just
  // created an account), and it must refresh the list for whoever is signed
  // in by then.
  const latest = useRef({ email, onSessionEnded })
  useEffect(() => {
    latest.current = { email, onSessionEnded }
  })

  // Each load is numbered, and only the newest may update the list. Without
  // this, a slow older request could overwrite a newer one: for example, the
  // first load after sign-in finishing after the refresh that follows a save,
  // and hiding the book that was just saved.
  const seq = useRef(0)

  const load = useCallback(async (owner: string) => {
    const mine = ++seq.current
    try {
      const books = await apiFetch<BookSummary[]>('/books')
      if (mine !== seq.current) return
      setLoaded({ owner, books })
      setLoadError(null)
    } catch (err) {
      if (mine !== seq.current) return
      if (err instanceof ApiError && err.status === 401) {
        latest.current.onSessionEnded()
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

  const refresh = useCallback(async () => {
    const owner = latest.current.email
    if (owner) await load(owner)
  }, [load])

  const books = email && loaded?.owner === email ? loaded.books : []
  const error = email && loadError?.owner === email ? loadError.message : null
  const loading = email !== null && loaded?.owner !== email && error === null

  // Saves a finished book and refreshes the list. Throws an ApiError with a
  // message for the user if the save is refused, so the screen can show it
  // and let them try again.
  async function saveBook(book: NewBook): Promise<string> {
    let created: { id: string }
    try {
      created = await apiFetch<{ id: string }>('/books', {
        method: 'POST',
        body: book,
      })
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        latest.current.onSessionEnded()
      }
      throw err
    }
    await refresh()
    return created.id
  }

  async function deleteBook(id: string) {
    try {
      await apiFetch<void>(`/books/${id}`, { method: 'DELETE' })
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        latest.current.onSessionEnded()
      }
      throw err
    }
    setLoaded((prev) =>
      prev
        ? { owner: prev.owner, books: prev.books.filter((b) => b.id !== id) }
        : prev,
    )
  }

  function reload() {
    void refresh()
  }

  return { books, loading, error, saveBook, deleteBook, reload }
}