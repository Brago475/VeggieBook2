import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../../utils/api'
import { getMe, saveProfile, type Me, type ProfileInput } from '../api/superTrackerApi'

// Loads the account's SuperTracker2 status. A 403 means a guest, who
// needs a real account to use SuperTracker2.

type State =
  | { status: 'loading' }
  | { status: 'guest' }
  | { status: 'error'; message: string }
  | { status: 'ready'; me: Me }

export function useSuperTracker() {
  const [state, setState] = useState<State>({ status: 'loading' })

  const load = useCallback(async () => {
    setState({ status: 'loading' })
    try {
      setState({ status: 'ready', me: await getMe() })
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setState({ status: 'guest' })
      } else {
        setState({ status: 'error', message: err instanceof Error ? err.message : '' })
      }
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const save = useCallback(async (input: ProfileInput) => {
    const profile = await saveProfile(input)
    setState((s) => (s.status === 'ready' ? { status: 'ready', me: { ...s.me, profile } } : s))
  }, [])

  return { state, reload: load, save }
}