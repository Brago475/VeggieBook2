// Short names for the questions and answers, for table headers and chips.
// The full wording always comes from the database; these only shorten it
// for the screen. Anything not listed here shows its full text.

const questionNames: Record<number, { name: string; hint: string }> = {
  1: { name: 'Appliances', hint: 'Select all appliances that apply' },
  2: { name: 'Kinds of recipes', hint: 'Select all that apply' },
  3: { name: 'Information', hint: 'Select all that apply' },
  4: { name: 'Nutrition tips', hint: 'Select all that apply' },
  5: { name: 'Storing', hint: 'Select all that apply' },
}

const shortAnswers: Record<string, string> = {
  Microwave: 'Microwave',
  'Crock Pot': 'Crock Pot',
  Juicer: 'Juicer',
  Steamer: 'Steamer',
  'Blender or Food Processor': 'Blender',
  'That are kid-friendly': 'Kid-friendly',
  'That combine the vegetable with chicken or meat': 'With meat',
  'For soup containing the vegetable': 'Soup',
  'With Latino flavors': 'Latino',
  'With Asian flavors': 'Asian',
  'With Soul Food flavors': 'Soul Food',
  'Making snacks with the vegetable': 'Snacks',
  'Preparing the vegetable for one or two people': 'For 1 or 2',
  'Making baby food with the vegetable for babies six months or older': 'Baby food',
  'Preparing the vegetable for someone with diabetes': 'Diabetes',
  'In general': 'General',
  'For children under 16': 'Under 16',
  'For adults and seniors': 'Adults, seniors',
  'Storing the vegetable': 'Storing',
  'Freezing the vegetable': 'Freezing',
  'Preventing spoilage of the vegetable': 'Spoilage',
}

export function questionName(no: number): string {
  return questionNames[no]?.name ?? `Question ${no}`
}

export function questionHint(no: number): string {
  return questionNames[no]?.hint ?? 'Select all that apply'
}

export function shortAnswer(text: string): string {
  return shortAnswers[text] ?? text
}

// "Storing the vegetable" becomes "Storing broccoli" for a Broccoli book.
export function withVegetable(text: string, vegetable: string | null | undefined): string {
  if (!vegetable) return text
  return text.split('the vegetable').join(vegetable.toLowerCase())
}