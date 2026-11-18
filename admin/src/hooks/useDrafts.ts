import { useCallback, useEffect, useState } from 'react'
import type { DraftKind, SavedDraft } from '../types/drafts'
import { deleteDraft, listDrafts, saveDraft } from '../utils/draftsApi'

// Loads one kind of draft and saves or removes them. The list reloads after
// each change. A failed change returns the API's message.

export function useDrafts<T>(kind: DraftKind) {
  const [drafts, setDrafts] = useState<SavedDraft<T>[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setDrafts(await listDrafts<T>(kind))
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    }
  }, [kind])

  useEffect(() => {
    void load()
  }, [load])

  // The draft's id on success, or the error message.
  const save = useCallback(
    async (id: number | null, title: string | null, payload: T): Promise<{ id: number } | string> => {
      try {
        const result = await saveDraft(kind, id, title, payload)
        await load()
        return result
      } catch (err) {
        return (err as Error).message
      }
    },
    [kind, load],
  )

  const remove = useCallback(
    async (id: number): Promise<string | null> => {
      try {
        await deleteDraft(id)
        await load()
        return null
      } catch (err) {
        return (err as Error).message
      }
    },
    [load],
  )

  return { drafts, error, reload: load, save, remove }
}