// Number formats for plan amounts: 3.5 shows as 3½, 4.25 as 4¼.

const FRACTIONS: Record<string, string> = { '0.25': '¼', '0.5': '½', '0.75': '¾' }

export function servings(value: number): string {
  const whole = Math.floor(value)
  const part = FRACTIONS[String(Math.round((value - whole) * 100) / 100)]
  if (!part) return String(value)
  return whole === 0 ? part : `${whole}${part}`
}

export function range(min: number, max: number, to: string): string {
  return min === max ? servings(min) : `${servings(min)} ${to} ${servings(max)}`
}

export function count(value: number): string {
  return value.toLocaleString('en-US')
}