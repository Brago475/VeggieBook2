import { useState } from 'react'
import type { NotificationTemplate, TemplateDefaultLink } from '../../types/notifications'
import { clearTemplateDefault } from '../../utils/templateDefaultsApi'
import { ANY_VEGETABLE } from './templateDefaults'

// Below the playlist: make it the default for the chosen template, or stop
// using it as the default. A template with a vegetable can have a default
// for one vegetable or for any vegetable.

export type DefaultScope = 'vegetable' | 'any'

type Props = {
  template: NotificationTemplate
  vegetable: string
  vegetableName: string | null
  // Null for a hand-picked playlist not saved yet.
  playlistId: number | null
  links: TemplateDefaultLink[]
  checked: boolean
  scope: DefaultScope
  onCheck: (on: boolean) => void
  onScope: (scope: DefaultScope) => void
  onCleared: () => void
}

export function DefaultPlaylistOption({
  template,
  vegetable,
  vegetableName,
  playlistId,
  links,
  checked,
  scope,
  onCheck,
  onScope,
  onCleared,
}: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const own = playlistId === null ? [] : links.filter((l) => l.templateKey === template.key && l.playlistId === playlistId)
  const current = template.needsVegetable
    ? (own.find((l) => l.vegetable === vegetable) ?? own.find((l) => l.vegetable === ANY_VEGETABLE))
    : own.find((l) => l.vegetable === ANY_VEGETABLE)

  async function stop() {
    if (!current || busy) return
    setBusy(true)
    setError(null)
    try {
      await clearTemplateDefault(current.templateKey, current.vegetable)
      onCleared()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (current) {
    const forWhat = !template.needsVegetable
      ? 'this message'
      : current.vegetable === ANY_VEGETABLE
        ? 'this message with any vegetable'
        : `this message with ${vegetableName ?? 'this vegetable'}`
    return (
      <div className="nt-field">
        <span className="nt-hint">This playlist is the default for {forWhat}.</span>
        <button type="button" className="ps-link" disabled={busy} onClick={() => void stop()}>
          {busy ? 'Saving...' : 'Stop using as default'}
        </button>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="nt-field">
      <label className="nt-check">
        <input type="checkbox" checked={checked} onChange={(e) => onCheck(e.target.checked)} />
        <span>Use this playlist by default for this message</span>
      </label>
      {checked && template.needsVegetable && (
        <select
          className="nt-input"
          aria-label="Default for which vegetable"
          value={scope}
          onChange={(e) => onScope(e.target.value as DefaultScope)}
        >
          <option value="any">With any vegetable</option>
          <option value="vegetable">With {vegetableName ?? 'this vegetable'} only</option>
        </select>
      )}
      {checked && (
        <span className="nt-hint">Saved with this message. Picking this message later starts with this playlist.</span>
      )}
    </div>
  )
}