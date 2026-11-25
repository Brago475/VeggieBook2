import { useState, type FormEvent } from 'react'
import { useStrings } from '../../i18n/useStrings'
import { addVegetable, type DayTotals } from '../api/foodLogApi'
import type { Plan } from '../api/superTrackerApi'
import { useVegetables } from '../hooks/useVegetables'
import { ST_TODAY } from '../strings/today'
import { count, tenth } from '../utils/format'
import { VegetableProgress } from './VegetableProgress'
import '../styles/setup.css'

// "Add vegetables": a VeggieBook vegetable and an amount in cups, shown
// with the servings and nutrients it adds before saving.

type Props = {
  date: string
  plan: Plan
  totals: DayTotals | null
  onAdded: () => void
  onDone: () => void
}

const PRESETS = [0.5, 1, 2] as const

function parseCups(text: string): number | null {
  const n = Number(text.trim().replace(',', '.'))
  return text.trim() !== '' && Number.isFinite(n) ? n : null
}

export function AddVegetables({ date, plan, totals, onAdded, onDone }: Props) {
  const t = useStrings(ST_TODAY)
  const veg = useVegetables()

  const [key, setKey] = useState('')
  const [preset, setPreset] = useState<number | null>(1)
  const [otherText, setOtherText] = useState('')
  const [saving, setSaving] = useState(false)
  const [added, setAdded] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const choice = veg.list.find((v) => v.key === key) ?? null
  const cups = preset ?? parseCups(otherText)
  const validCups = cups !== null && cups >= 0.25 && cups <= 10
  const presetLabels: Record<number, string> = { 0.5: t.half, 1: t.one, 2: t.two }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!choice) return
    if (!validCups || cups === null) {
      setError(t.errAmount)
      return
    }
    setSaving(true)
    setError(null)
    try {
      await addVegetable(date, choice.key, cups)
      setAdded(`${t.added}: ${choice.name}, ${tenth(cups)} ${cups === 1 ? t.cup : t.cups}`)
      onAdded()
    } catch (err) {
      setError(err instanceof Error ? err.message : '')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="st2-setup" onSubmit={submit} noValidate>
      <header className="st2-setup-head">
        <h1 className="library-title st2-title">{t.addTitle}</h1>
      </header>

      <VegetableProgress have={totals?.vegetables ?? 0} goal={plan.servings.vegetables.min} />

      <div className="st2-field">
        <label className="st2-label" htmlFor="st2-veg">
          {t.vegetable}
        </label>
        <select
          id="st2-veg"
          className="st2-input"
          value={key}
          onChange={(e) => {
            setKey(e.target.value)
            setAdded(null)
          }}
        >
          <option value="">{t.choose}</option>
          {veg.list.map((v) => (
            <option key={v.key} value={v.key}>
              {v.name}
            </option>
          ))}
        </select>
        {veg.error !== null && <p className="st2-error">{veg.error}</p>}
      </div>

      <div className="st2-field">
        <span className="st2-label">{t.howMuch}</span>
        <div className="st2-amounts" role="group" aria-label={t.howMuch}>
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              className={`st2-pill${preset === p ? ' is-on' : ''}`}
              aria-pressed={preset === p}
              onClick={() => {
                setPreset(p)
                setAdded(null)
              }}
            >
              {presetLabels[p]}
            </button>
          ))}
          <button
            type="button"
            className={`st2-pill${preset === null ? ' is-on' : ''}`}
            aria-pressed={preset === null}
            onClick={() => {
              setPreset(null)
              setAdded(null)
            }}
          >
            {t.other}
          </button>
        </div>
        {preset === null && (
          <div className="st2-units">
            <input
              className="st2-input"
              inputMode="decimal"
              aria-label={t.otherLabel}
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
            />
            <span className="st2-unit">{t.cups}</span>
          </div>
        )}
        {preset === null && <p className="st2-hint">{t.otherHint}</p>}
      </div>

      {choice && validCups && cups !== null && (
        <section className="st2-plan-section">
          <p className="st2-group-amount">
            {t.countsAs} {tenth(choice.perCup.servings * cups)} {t.servingsWord}
          </p>
          <h2 className="st2-plan-h2">{t.forAmount}</h2>
          <dl className="st2-summary">
            <div className="st2-summary-row">
              <dt>{t.calories}</dt>
              <dd>{count(choice.perCup.kcal * cups)}</dd>
            </div>
            <div className="st2-summary-row">
              <dt>{t.fiber}</dt>
              <dd>{tenth(choice.perCup.fiberG * cups)} g</dd>
            </div>
            <div className="st2-summary-row">
              <dt>{t.vitaminC}</dt>
              <dd>{count(choice.perCup.vitaminCMg * cups)} mg</dd>
            </div>
            <div className="st2-summary-row">
              <dt>{t.potassium}</dt>
              <dd>{count(choice.perCup.potassiumMg * cups)} mg</dd>
            </div>
          </dl>
        </section>
      )}

      {added !== null && (
        <p className="st2-added" role="status">
          {added}
        </p>
      )}
      {error !== null && (
        <p className="st2-error" role="alert">
          {error}
        </p>
      )}

      <div className="st2-form-actions">
        <button type="submit" className="st2-start" disabled={saving || !choice}>
          {saving ? t.adding : t.add}
        </button>
        <button type="button" className="st2-guide" onClick={onDone} disabled={saving}>
          {t.done}
        </button>
      </div>
    </form>
  )
}