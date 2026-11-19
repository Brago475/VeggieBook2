import { useEffect, useRef, useState } from 'react'
import '../../styles/nutrition.css'
import { useLang } from '../../i18n/languageContext'
import { COMMON } from '../../i18n/strings/common'
import { NUTRITION } from '../../i18n/strings/nutrition'
import { useStrings } from '../../i18n/useStrings'
import type { Vegetable } from '../../types'
import type { NutritionItem } from '../../types/nutrition'
import { fetchNutrition, servingText } from '../../utils/nutritionApi'
import { SafeImage } from '../common/SafeImage'

// Nutrition facts for one vegetable in a pop-up: source, raw serving with
// calories, nutrients with % Daily Value, then vitamins and minerals.
// Several kinds show as tabs. Close, a tap outside, or Escape closes it.

type Props = {
  vegetable: Vegetable
  onClose: () => void
}

type RowProps = {
  label: string
  amount: string
  dv?: number
  sub?: boolean
}

function NutrientRow({ label, amount, dv, sub = false }: RowProps) {
  return (
    <li className={sub ? 'nu-row is-sub' : 'nu-row'}>
      <span className="nu-name">{label}</span>
      <span className="nu-amount">{amount}</span>
      <span className={dv === undefined ? 'nu-dv is-empty' : 'nu-dv'}>{dv === undefined ? '' : `${dv}%`}</span>
    </li>
  )
}

export function NutritionSheet({ vegetable, onClose }: Props) {
  const t = useStrings(NUTRITION)
  const common = useStrings(COMMON)
  const { lang } = useLang()
  const [items, setItems] = useState<NutritionItem[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [picked, setPicked] = useState(0)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [onClose])

  useEffect(() => {
    let live = true
    setItems(null)
    setFailed(false)
    fetchNutrition(vegetable.code, lang)
      .then((r) => {
        if (live) setItems(r.items)
      })
      .catch(() => {
        if (live) setFailed(true)
      })
    return () => {
      live = false
    }
  }, [vegetable.code, lang])

  const item = items && items.length > 0 ? items[Math.min(picked, items.length - 1)] : null

  return (
    <div className="dialog-overlay nu-overlay" onClick={onClose}>
      <div
        className="dialog nu-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nu-sheet-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="nu-head">
          <SafeImage className="nu-thumb" src={`/images/${vegetable.image}`} />
          <div className="nu-head-text">
            <h2 className="nu-title" id="nu-sheet-title">
              {vegetable.name}
            </h2>
            <span className="nu-sub">{t.title}</span>
          </div>
          <button ref={closeRef} type="button" className="nu-close" aria-label={common.close} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="nu-body">
          {failed && <p className="nu-message">{t.couldNotLoad}</p>}
          {!failed && items === null && <p className="nu-message">{t.loading}</p>}
          {!failed && items !== null && !item && <p className="nu-message">{t.unavailable}</p>}

          {item && items && (
            <>
              <p className="nu-source">
                {t.source}:{' '}
                <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
                  {item.source === 'fda' ? t.fda : t.fdc}
                </a>
              </p>

              {items.length > 1 && (
                <div className="nu-tabs" role="tablist" aria-label={t.kinds}>
                  {items.map((kind, i) => (
                    <button
                      key={kind.name}
                      type="button"
                      role="tab"
                      className="nu-tab"
                      aria-selected={i === picked}
                      onClick={() => setPicked(i)}
                    >
                      {kind.name}
                    </button>
                  ))}
                </div>
              )}

              <div className="nu-serving">
                <div>
                  <span className="nu-label">{t.serving}</span>
                  <span className="nu-serving-value">{servingText(item)}</span>
                </div>
                <div className="nu-calories">
                  <strong>{item.calories}</strong>
                  <span>{t.calories}</span>
                  <span>{t.fromFat(item.caloriesFromFat)}</span>
                </div>
              </div>

              <p className="nu-section">
                <span>{t.nutrients}</span>
                <span>{t.dailyValue}</span>
              </p>
              <ul className="nu-rows">
                <NutrientRow label={t.fat} amount={`${item.fatG} g`} dv={item.fatDv} />
                <NutrientRow label={t.sodium} amount={`${item.sodiumMg} mg`} dv={item.sodiumDv} />
                <NutrientRow label={t.potassium} amount={`${item.potassiumMg} mg`} dv={item.potassiumDv} />
                <NutrientRow label={t.carbs} amount={`${item.carbsG} g`} dv={item.carbsDv} />
                <NutrientRow label={t.fiber} amount={`${item.fiberG} g`} dv={item.fiberDv} sub />
                <NutrientRow label={t.sugars} amount={`${item.sugarsG} g`} sub />
                <NutrientRow label={t.protein} amount={`${item.proteinG} g`} />
              </ul>

              <p className="nu-section">
                <span>{t.vitamins}</span>
              </p>
              <ul className="nu-grid">
                <li>
                  <span>{t.vitaminA}</span>
                  <strong>{item.vitaminADv}%</strong>
                </li>
                <li>
                  <span>{t.vitaminC}</span>
                  <strong>{item.vitaminCDv}%</strong>
                </li>
                <li>
                  <span>{t.calcium}</span>
                  <strong>{item.calciumDv}%</strong>
                </li>
                <li>
                  <span>{t.iron}</span>
                  <strong>{item.ironDv}%</strong>
                </li>
              </ul>

              <p className="nu-note">{t.footnote}</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}