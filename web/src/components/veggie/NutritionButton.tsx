import { useCallback, useState } from 'react'
import { NUTRITION } from '../../i18n/strings/nutrition'
import { useStrings } from '../../i18n/useStrings'
import type { Vegetable } from '../../types'
import { NutritionSheet } from './NutritionSheet'

// The Nutrition button on a vegetable picker row. Opens the nutrition
// pop-up without starting a book.

type Props = {
  vegetable: Vegetable
}

export function NutritionButton({ vegetable }: Props) {
  const t = useStrings(NUTRITION)
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])

  return (
    <>
      <button type="button" className="nf-button" aria-label={t.buttonAria(vegetable.name)} onClick={() => setOpen(true)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
          <path d="M6 3h12v18H6zM9 7h6M9 11h6M9 15h3" />
        </svg>
        {t.button}
      </button>
      {open && <NutritionSheet vegetable={vegetable} onClose={close} />}
    </>
  )
}