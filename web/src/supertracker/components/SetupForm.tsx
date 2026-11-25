import { useState, type FormEvent } from 'react'
import { useStrings } from '../../i18n/useStrings'
import type { Activity, Profile, ProfileInput, Sex, Units } from '../api/superTrackerApi'
import { ST_SETUP } from '../strings/setup'
import { cmToFeetInches, feetInchesToCm, kgToPounds, oneDecimal, poundsToKg } from '../utils/units'
import '../styles/setup.css'

// "About you": the answers that set the calorie estimate and daily goals.
// Limits match api/SuperTracker/SuperTrackerRules.cs.

type Props = {
  initial: Profile | null
  onSave: (input: ProfileInput) => Promise<void>
  onCancel?: () => void
}

type Field = 'age' | 'sex' | 'height' | 'weight' | 'activity' | 'calorieGoal'

const ACTIVITIES: Activity[] = ['sedentary', 'moderate', 'active']

function parse(value: string): number | null {
  const text = value.trim().replace(/,/g, '')
  if (text === '') return null
  const n = Number(text)
  return Number.isFinite(n) ? n : null
}

export function SetupForm({ initial, onSave, onCancel }: Props) {
  const t = useStrings(ST_SETUP)
  const startHeight = initial ? cmToFeetInches(initial.heightCm) : null

  const [units, setUnits] = useState<Units>(initial?.units ?? 'us')
  const [age, setAge] = useState(initial ? String(initial.age) : '')
  const [sex, setSex] = useState<Sex | null>(initial?.sex ?? null)
  const [feet, setFeet] = useState(startHeight ? String(startHeight.feet) : '')
  const [inches, setInches] = useState(startHeight ? String(startHeight.inches) : '')
  const [cm, setCm] = useState(initial ? String(Math.round(initial.heightCm)) : '')
  const [weight, setWeight] = useState(
    initial ? String(initial.units === 'metric' ? initial.weightKg : kgToPounds(initial.weightKg)) : '',
  )
  const [activity, setActivity] = useState<Activity | null>(initial?.activity ?? null)
  const [goal, setGoal] = useState(initial?.calorieGoal ? String(initial.calorieGoal) : '')
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState<string | null>(null)

  function heightInCm(): number | null {
    if (units === 'metric') return parse(cm)
    const f = parse(feet)
    const i = inches.trim() === '' ? 0 : parse(inches)
    if (f === null || i === null || i < 0 || i >= 12) return null
    return feetInchesToCm(f, i)
  }

  function weightInKg(): number | null {
    const w = parse(weight)
    if (w === null) return null
    return units === 'us' ? poundsToKg(w) : w
  }

  // Keeps what was typed when switching between US and metric.
  function switchUnits(next: Units) {
    if (next === units) return
    const h = heightInCm()
    const w = weightInKg()
    if (next === 'metric') {
      if (h !== null) setCm(String(Math.round(h)))
      if (w !== null) setWeight(String(oneDecimal(w)))
    } else {
      if (h !== null) {
        const fi = cmToFeetInches(h)
        setFeet(String(fi.feet))
        setInches(String(fi.inches))
      }
      if (w !== null) setWeight(String(kgToPounds(w)))
    }
    setUnits(next)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setFailed(null)

    const found: Partial<Record<Field, string>> = {}
    const a = parse(age)
    if (a === null || !Number.isInteger(a) || a < 18 || a > 120) found.age = t.errAge
    if (!sex) found.sex = t.errSex
    const h = heightInCm()
    if (h === null || h < 100 || h > 250) found.height = t.errHeight
    const w = weightInKg()
    if (w === null || w < 30 || w > 350) found.weight = t.errWeight
    if (!activity) found.activity = t.errActivity
    const g = goal.trim() === '' ? null : parse(goal)
    if (goal.trim() !== '' && (g === null || !Number.isInteger(g) || g < 1000 || g > 5000)) {
      found.calorieGoal = t.errGoal
    }

    setErrors(found)
    if (Object.keys(found).length > 0 || !sex || !activity || a === null || h === null || w === null) return

    setSaving(true)
    try {
      await onSave({
        age: a,
        sex,
        heightCm: oneDecimal(h),
        weightKg: oneDecimal(w),
        activity,
        units,
        calorieGoal: g,
      })
    } catch (err) {
      setFailed(err instanceof Error ? err.message : '')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="st2-setup" onSubmit={submit} noValidate>
      <header className="st2-setup-head">
        <h1 className="library-title st2-title">{t.title}</h1>
        <p className="st2-intro">{t.intro}</p>
      </header>

      <div className="st2-field">
        <span className="st2-label">{t.units}</span>
        <div className="st2-pills" role="group" aria-label={t.units}>
          {(['us', 'metric'] as Units[]).map((u) => (
            <button
              key={u}
              type="button"
              className={`st2-pill${units === u ? ' is-on' : ''}`}
              aria-pressed={units === u}
              onClick={() => switchUnits(u)}
            >
              {u === 'us' ? t.unitsUs : t.unitsMetric}
            </button>
          ))}
        </div>
      </div>

      <div className="st2-row">
        <div className="st2-field">
          <label className="st2-label" htmlFor="st2-age">
            {t.age}
          </label>
          <input
            id="st2-age"
            className="st2-input"
            inputMode="numeric"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            aria-invalid={!!errors.age}
          />
          {errors.age && <p className="st2-error">{errors.age}</p>}
        </div>

        <div className="st2-field">
          <span className="st2-label">{t.sex}</span>
          <div className="st2-pills" role="group" aria-label={t.sex}>
            {(['female', 'male'] as Sex[]).map((s) => (
              <button
                key={s}
                type="button"
                className={`st2-pill${sex === s ? ' is-on' : ''}`}
                aria-pressed={sex === s}
                onClick={() => setSex(s)}
              >
                {s === 'female' ? t.female : t.male}
              </button>
            ))}
          </div>
          {errors.sex && <p className="st2-error">{errors.sex}</p>}
        </div>
      </div>

      <div className="st2-row">
        <div className="st2-field">
          <span className="st2-label">{t.height}</span>
          {units === 'us' ? (
            <div className="st2-units">
              <input
                className="st2-input"
                inputMode="numeric"
                aria-label={`${t.height} (${t.feet})`}
                value={feet}
                onChange={(e) => setFeet(e.target.value)}
                aria-invalid={!!errors.height}
              />
              <span className="st2-unit">{t.feet}</span>
              <input
                className="st2-input"
                inputMode="numeric"
                aria-label={`${t.height} (${t.inches})`}
                value={inches}
                onChange={(e) => setInches(e.target.value)}
                aria-invalid={!!errors.height}
              />
              <span className="st2-unit">{t.inches}</span>
            </div>
          ) : (
            <div className="st2-units">
              <input
                className="st2-input"
                inputMode="numeric"
                aria-label={`${t.height} (${t.cm})`}
                value={cm}
                onChange={(e) => setCm(e.target.value)}
                aria-invalid={!!errors.height}
              />
              <span className="st2-unit">{t.cm}</span>
            </div>
          )}
          {errors.height && <p className="st2-error">{errors.height}</p>}
        </div>

        <div className="st2-field">
          <label className="st2-label" htmlFor="st2-weight">
            {t.weight}
          </label>
          <div className="st2-units">
            <input
              id="st2-weight"
              className="st2-input"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              aria-invalid={!!errors.weight}
            />
            <span className="st2-unit">{units === 'us' ? t.pounds : t.kg}</span>
          </div>
          {errors.weight && <p className="st2-error">{errors.weight}</p>}
        </div>
      </div>

      <div className="st2-field">
        <span className="st2-label">{t.activity}</span>
        <div className="st2-levels" role="group" aria-label={t.activity}>
          {ACTIVITIES.map((a) => (
            <button
              key={a}
              type="button"
              className={`st2-level${activity === a ? ' is-on' : ''}`}
              aria-pressed={activity === a}
              onClick={() => setActivity(a)}
            >
              <span className="st2-level-title">{t.activities[a].title}</span>
              <span className="st2-level-text">{t.activities[a].text}</span>
            </button>
          ))}
        </div>
        {errors.activity && <p className="st2-error">{errors.activity}</p>}
      </div>

      <div className="st2-field">
        <label className="st2-label" htmlFor="st2-goal">
          {t.goal}
        </label>
        <div className="st2-units">
          <input
            id="st2-goal"
            className="st2-input"
            inputMode="numeric"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            aria-invalid={!!errors.calorieGoal}
          />
          <span className="st2-unit">{t.goalUnit}</span>
        </div>
        <p className="st2-hint">{t.goalHint}</p>
        {errors.calorieGoal && <p className="st2-error">{errors.calorieGoal}</p>}
      </div>

      {failed !== null && (
        <p className="st2-error" role="alert">
          {failed}
        </p>
      )}

      <div className="st2-form-actions">
        <button type="submit" className="st2-start" disabled={saving}>
          {saving ? t.saving : t.save}
        </button>
        {onCancel && (
          <button type="button" className="st2-guide" onClick={onCancel} disabled={saving}>
            {t.cancel}
          </button>
        )}
      </div>
    </form>
  )
}