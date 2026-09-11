import { useState } from 'react'
import type { SavedBook } from '../types'

// Saved books, currently in localStorage.
//
// This is deliberately the only place storage is touched. When books move to
// the API and the book_session tables, this file changes and nothing else
// does. The SavedBook shape already mirrors those tables.
//
// localStorage holds about 5 MB per site. Uploaded covers are compressed
// before they get here, but a full store is still possible, so saveBook
// reports whether the write worked instead of failing silently.

const KEY = 'veggiebook2.books'

function read(): SavedBook[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as SavedBook[]) : []
  } catch {
    return []
  }
}

export function useSavedBooks() {
  const [books, setBooks] = useState<SavedBook[]>(read)

  // Returns false if the browser refused the write, usually because
  // storage is full. The caller decides what to tell the user.
  function saveBook(book: SavedBook): boolean {
    const next = [book, ...read()]
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      return false
    }
    setBooks(next)
    return true
  }

  return { books, saveBook }
}