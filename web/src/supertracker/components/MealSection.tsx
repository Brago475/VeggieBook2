import { useState, type FormEvent } from 'react'
import { useStrings } from '../../i18n/useStrings'
import type { DayEntry } from '../api/foodLogApi'
import { ST_COMBOS } from '../strings/combos'
import { ST_TRACKER } from '../strings/tracker'
import { count, tenth } from '../utils/format'

// One meal on Today: its foods, calories, Add, Copy from previous day
// while it is empty, and Save as combo once it has foods. Tapping a food
// opens Edit food.

type Props = {
  title: string
  entries: DayEntry[]
  onAdd?: () => void
  addLabel?: string
  onCopy?: () => void
  copying?: boolean
  onSaveCombo?: (name: string) => Promise<void>
  onRemove: (id: number) => void
  onEdit?: (entry: DayEntry) => void
}

export function MealSection({ title, entries, onAdd, addLabel, onCopy, copying, onSaveCombo, onRemove, onEdit }: Props) {
  const t = useStrings(ST_TRACKER)
  const c = useStrings(ST_COMBOS)
  const kcal = entries.reduce((sum, e) => sum + e.amounts.kcal, 0)

  const [naming, setNaming] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!onSaveCombo || name.trim() === '') return
    setSaving(true)
    setMessage(null)
    try {
      await onSaveCombo(name.trim())
      setMessage(`${c.saved}: ${name.trim()}`)
      setNaming(false)
      setName('')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="st2-meal">
      <header className="st2-meal-head">
        <h3 className="st2-meal-title">{title}</h3>
        <span className="st2-meal-kcal">
          {count(kcal)} {t.cal}
        </span>
      </header>

      {entries.length === 0 ? (
        <div className="st2-meal-empty-row">
          <p className="st2-meal-empty">{t.nothing}</p>
          {onCopy && (
            <button type="button" className="st2-meal-copy" onClick={onCopy} disabled={copying}>
              {copying ? t.copying : t.copyPrev}
            </button>
          )}
        </div>
      ) : (
        <ul className="st2-meal-list">
          {entries.map((e) => (
            <li key={e.id} className="st2-entry">
              {onEdit ? (
                <button type="button" className="st2-entry-edit" onClick={() => onEdit(e)}>
                  <span className="st2-entry-text">
                    <span className="st2-entry-name">{e.name}</span>
                    <span className="st2-hint">
                      {tenth(e.quantity)} {e.portion}
                    </span>
                  </span>
                </button>
              ) : (
                <div className="st2-entry-text">
                  <span className="st2-entry-name">{e.name}</span>
                  <span className="st2-hint">
                    {tenth(e.quantity)} {e.portion}
                  </span>
                </div>
              )}
              <span className="st2-entry-kcal">{count(e.amounts.kcal)}</span>
              <button
                type="button"
                className="st2-entry-remove"
                aria-label={`${t.remove} ${e.name}`}
                onClick={() => onRemove(e.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {onSaveCombo && entries.length > 0 && (
        <div className="st2-meal-combo">
          {naming ? (
            <form className="st2-combo-form" onSubmit={save}>
              <label className="visually-hidden" htmlFor={`st2-combo-${title}`}>
                {c.comboName}
              </label>
              <input
                id={`st2-combo-${title}`}
                className="st2-input"
                maxLength={60}
                placeholder={c.namePlaceholder}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
              <button type="submit" className="st2-chip is-on" disabled={saving || name.trim() === ''}>
                {saving ? c.saving : c.save}
              </button>
              <button type="button" className="st2-meal-copy" onClick={() => setNaming(false)}>
                {c.cancel}
              </button>
            </form>
          ) : (
            <button
              type="button"
              className="st2-meal-copy"
              onClick={() => {
                setNaming(true)
                setMessage(null)
              }}
            >
              {c.saveAsCombo}
            </button>
          )}
          {message !== null && (
            <p className="st2-hint" role="status">
              {message}
            </p>
          )}
        </div>
      )}

      {onAdd && (
        <button type="button" className="st2-meal-add" onClick={onAdd}>
          + {addLabel}
        </button>
      )}
    </section>
  )
}