import { useEffect, useState } from 'react'
import type { FoodDetail } from '../api/foodLogApi'
import { parseAmount } from '../utils/amounts'

// Amount and portion picked for one USDA food. Keeps the portion when the
// same food reloads, and starts on the first portion for a new food.

export function usePortion(food: FoodDetail | null) {
  const [portionId, setPortionId] = useState<number | null>(null)
  const [amountText, setAmountText] = useState('1')

  useEffect(() => {
    if (!food) return
    setPortionId((current) =>
      food.portions.some((p) => p.id === current) ? current : (food.portions[0]?.id ?? null),
    )
  }, [food])

  const portion = food?.portions.find((p) => p.id === portionId) ?? null
  const amount = parseAmount(amountText)
  const valid = amount !== null && amount >= 0.1 && amount <= 50
  const grams = portion && valid && amount !== null ? portion.grams * amount : null

  return { portion, portionId, setPortionId, amountText, setAmountText, amount, valid, grams }
}

export type PortionState = ReturnType<typeof usePortion>