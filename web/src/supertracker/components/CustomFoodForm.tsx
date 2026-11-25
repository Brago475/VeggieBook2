import { useState, type FormEvent } from 'react'
import { useStrings } from '../../i18n/useStrings'
import type { CustomFood, CustomFoodInput } from '../api/customFoodsApi'
import { ST_CUSTOM } from '../strings/customFoods'
import '../styles/setup.css'

// Create or edit one of the account's own foods. Limits match
// api/SuperTracker/CustomFoodRules.cs.

type Props = {
  initial: CustomFood | null
  onSave: (input: CustomFoodInput) => Promise<void>
  onCancel: () => void
}

type NumberKey = Exclude<keyof CustomFoodInput, 'name' | 'serving' | 'servingGrams'>

const LIMITS: Record<NumberKey, number> = {
  kcal: 5000,
  proteinG: 500,
  satFatG: 500,
  sodiumMg: 20000,
  addedSugarG: 500,
  fiberG: 200,
  vegetables: 10,
  fruits: 10,
  dairy: 10,
  wholeGrains: 10,
  healthyFats: 10,
}

function start(initial: CustomFood | null, key: NumberKey): string {
  return initial ? String(initial[key]) : key === 'kcal' ? '' : '0'
}

function parse(text: string): number | null {
  const n = Number(text.trim().replace(',', '.'))
  return text.trim() !== '' && Number.isFinite(n) ? n : null
}

export function CustomFoodForm({ initial, onSave, onCancel }: Props) {
  const t = useStrings(ST_CUSTOM)
  const [name, setName] = useState(initial?.name ?? '')
  const [serving, setServing] = useState(initial?.serving ?? '')
  const [grams, setGrams] = useState(initial?.servingGrams ? String(initial.servingGrams) : '')
  const [values, setValues] = useState<Record<NumberKey, string>>(() => ({
    kcal: start(initial, 'kcal'),
    proteinG: start(initial, 'proteinG'),
    satFatG: start(initial, 'satFatG'),
    sodiumMg: start(initial, 'sodiumMg'),
    addedSugarG: start(initial, 'addedSugarG'),
    fiberG: start(initial, 'fiberG'),
    vegetables: start(initial, 'vegetables'),
    fruits: start(initial, 'fruits'),
    dairy: start(initial, 'dairy'),
    wholeGrains: start(initial, 'wholeGrains'),
    healthyFats: start(initial, 'healthyFats'),
  }))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function set(key: NumberKey, text: string) {
    setValues((v) => ({ ...v, [key]: text }))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (name.trim().length < 1 || name.trim().length > 80) return setError(t.errName)
    if (serving.trim().length < 1 || serving.trim().length > 40) return setError(t.errServing)

    const numbers = {} as Record<NumberKey, number>
    for (const key of Object.keys(LIMITS) as NumberKey[]) {
      const n = parse(values[key])
      if (n === null || n < 0 || n > LIMITS[key]) return setError(t.errNumber)
      numbers[key] = n
    }
    const g = grams.trim() === '' ? null : parse(grams)
    if (grams.trim() !== '' && (g === null || g <= 0 || g > 5000)) return setError(t.errNumber)

    setSaving(true)
    setError(null)
    try {
      await onSave({ name: name.trim(), serving: serving.trim(), servingGrams: g, ...numbers })
    } catch (err) {
      setError(err instanceof Error ? err.message : '')
    } finally {
      setSaving(false)
    }
  }

  const numberField = (key: NumberKey, label: string) => (
    <div className="st2-field" key={key}>
      <label className="st2-label" htmlFor={`st2-cf-${key}`}>
        {label}
      </label>
      <input
        id={`st2-cf-${key}`}
        className="st2-input"
        inputMode="decimal"
        value={values[key]}
        onChange={(e) => set(key, e.target.value)}
      />
    </div>
  )

  return (
    <form className="st2-setup" onSubmit={submit} noValidate>
      <h2 className="st2-food-name">{initial ? t.editTitle : t.createTitle}</h2>

      <div className="st2-field">
        <label className="st2-label" htmlFor="st2-cf-name">
          {t.name}
        </label>
        <input
          id="st2-cf-name"
          className="st2-input"
          maxLength={80}
          placeholder={t.namePlaceholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="st2-row">
        <div className="st2-field">
          <label className="st2-label" htmlFor="st2-cf-serving">
            {t.serving}
          </label>
          <input
            id="st2-cf-serving"
            className="st2-input"
            maxLength={40}
            placeholder={t.servingPlaceholder}
            value={serving}
            onChange={(e) => setServing(e.target.value)}
          />
        </div>
        <div className="st2-field">
          <label className="st2-label" htmlFor="st2-cf-grams">
            {t.servingGrams}
          </label>
          <input
            id="st2-cf-grams"
            className="st2-input"
            inputMode="decimal"
            value={grams}
            onChange={(e) => setGrams(e.target.value)}
          />
        </div>
      </div>

      <h3 className="st2-plan-h2">{t.perServing}</h3>
      <div className="st2-grid2">
        {numberField('kcal', t.calories)}
        {numberField('proteinG', t.protein)}
        {numberField('satFatG', t.satFat)}
        {numberField('sodiumMg', t.sodium)}
        {numberField('addedSugarG', t.addedSugars)}
        {numberField('fiberG', t.fiber)}
      </div>

      <h3 className="st2-plan-h2">{t.countsAs}</h3>
      <p className="st2-hint">{t.countsAsHint}</p>
      <div className="st2-grid2">
        {numberField('vegetables', t.vegetables)}
        {numberField('fruits', t.fruits)}
        {numberField('dairy', t.dairy)}
        {numberField('wholeGrains', t.wholeGrains)}
        {numberField('healthyFats', t.healthyFats)}
      </div>

      {error !== null && (
        <p className="st2-error" role="alert">
          {error}
        </p>
      )}

      <div className="st2-form-actions">
        <button type="submit" className="st2-start" disabled={saving}>
          {saving ? t.saving : t.save}
        </button>
        <button type="button" className="st2-guide" onClick={onCancel} disabled={saving}>
          {t.cancel}
        </button>
      </div>
    </form>
  )
}