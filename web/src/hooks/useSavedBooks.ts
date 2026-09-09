import { useEffect, useState } from 'react'
import type { SavedBook } from '../types'

// Saved books, currently in localStorage.
//
// This is deliberately the only place storage is touched. When books move to
// the API and the book_session tables, this file changes and nothing else
// does. The SavedBook shape already mirrors those tables.

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
  const [books, setBooks] = useState<SavedBook[]>([])

  useEffect(() => {
    setBooks(read())
  }, [])

  function saveBook(book: SavedBook) {
    const next = [book, ...read()]
    localStorage.setItem(KEY, JSON.stringify(next))
    setBooks(next)
  }

  return { books, saveBook }
}