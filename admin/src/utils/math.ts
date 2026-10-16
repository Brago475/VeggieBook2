// Small number helpers shared by the analytics screens.

// Part of a whole as a percentage. Zero when there is nothing to divide by.
export function percent(part: number, whole: number, decimals = 0): number {
  if (whole === 0) return 0
  const factor = 10 ** decimals
  return Math.round((part / whole) * 100 * factor) / factor
}

// "1 book", "3 books".
export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`
}