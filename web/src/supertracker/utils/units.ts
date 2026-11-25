// US and metric conversions for height and weight.

const CM_PER_INCH = 2.54
const KG_PER_POUND = 0.45359237

export function feetInchesToCm(feet: number, inches: number): number {
  return (feet * 12 + inches) * CM_PER_INCH
}

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const total = Math.round(cm / CM_PER_INCH)
  return { feet: Math.floor(total / 12), inches: total % 12 }
}

export function poundsToKg(pounds: number): number {
  return pounds * KG_PER_POUND
}

export function kgToPounds(kg: number): number {
  return Math.round(kg / KG_PER_POUND)
}

export function oneDecimal(value: number): number {
  return Math.round(value * 10) / 10
}