import { useCallback, useEffect, useRef, useState } from 'react'
import type { BookSummary, NewBook, NewSecretsBook } from '../types'
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
//
// Both kinds of book are listed, deleted, and given a new cover the same
// way. Only saving differs: a VeggieBook posts to /books, a Secrets Book to
// /books/secrets.

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

  // Any request that changes a book. A 401 means the session ended, which
  // the page is told about; every failure is thrown on with its message for
  // the user, so the screen can show it and let them try again.
  async function send<T>(
    path: string,
    method: 'POST' | 'PUT' | 'DELETE',
    body?: unknown,
  ): Promise<T> {
    try {
      return await apiFetch<T>(path, { method, body })
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        latest.current.onSessionEnded()
      }
      throw err
    }
  }

  // Saves a finished book and refreshes the list. Shared by both kinds of
  // book, so they handle a failed save and an ended session the same way.
  async function post(path: string, body: unknown): Promise<string> {
    const created = await send<{ id: string }>(path, 'POST', body)
    await refresh()
    return created.id
  }

  function saveBook(book: NewBook): Promise<string> {
    return post('/books', book)
  }

  function saveSecretsBook(book: NewSecretsBook): Promise<string> {
    return post('/books/secrets', book)
  }

  // Gives a saved book a new cover, of either kind, and refreshes the list
  // so the home card shows it. An upload is a data URL; anything else is a
  // picture's path, the same test used when a book is saved.
  async function changeCover(id: string, cover: string): Promise<string> {
    const body = cover.startsWith('data:') ? { coverUpload: cover } : { coverPath: cover }
    const result = await send<{ cover: string }>(`/books/${id}/cover`, 'PUT', body)
    await refresh()
    return result.cover
  }

  async function deleteBook(id: string) {
    await send<void>(`/books/${id}`, 'DELETE')
    setLoaded((prev) =>
      prev
        ? { owner: prev.owner, books: prev.books.filter((b) => b.id !== id) }
        : prev,
    )
  }

  function reload() {
    void refresh()
  }

  return {
    books,
    loading,
    error,
    saveBook,
    saveSecretsBook,
    changeCover,
    deleteBook,
    reload,
  }
}