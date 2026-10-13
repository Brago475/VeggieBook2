import { useCallback, useEffect, useState } from 'react'
import type { SiteSettingsInfo } from '../types/settings'
import { api } from '../utils/api'

// Loads GET /api/admin/settings. A failed reload keeps the last data.

export function useSiteSettings() {
  const [data, setData] = useState<SiteSettingsInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setData(await api<SiteSettingsInfo>('/admin/settings'))
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { data, error, reload: load }
}