// Text from the original VeggieBook data has %s where the app put the
// vegetable's name ("Freezing %s"). The admin site isn't about one
// vegetable, so it says "the vegetable" there instead.

export function fillVegetable(text: string): string {
  return text.replaceAll('%s', 'the vegetable')
}