// One recipe: the review card and the sections shared with a saved book.
// Spanish labels follow the original app's recipe page
// (recipe_mobile_es.html).

const en = {
  counter: (position: number, total: number) => `Recipe ${position} of ${total}`,
  couldNotLoad: (error: string) => `Could not load details: ${error}`,
  loadingDetails: 'Loading recipe details',

  ingredients: 'Ingredients',
  summary: 'Summary',
  instructions: 'Instructions',
  notes: 'Notes',
  photos: 'Photos',

  prepTime: 'Preparation Time:',
  madeAhead: 'Can be made ahead:',
  cookTime: 'Cooking Time:',
  frozen: 'Can be frozen:',
  servings: 'Servings:',
  leftovers: 'Good for leftovers:',

  prepStep: (n: string) => `Preparation step ${n}`,
}

const es: typeof en = {
  counter: (position: number, total: number) => `Receta ${position} de ${total}`,
  couldNotLoad: (error: string) => `No se pudieron cargar los detalles: ${error}`,
  loadingDetails: 'Cargando los detalles de la receta',

  ingredients: 'Ingredientes',
  summary: 'En Resumen',
  instructions: 'Instrucciones',
  notes: 'Notas',
  photos: 'Fotos',

  prepTime: 'Tiempo de preparación:',
  madeAhead: '¿Se puede hacer por adelantado?',
  cookTime: 'Tiempo para cocinar:',
  frozen: '¿Se puede congelar?',
  servings: 'Porciones:',
  leftovers: '¿Se puede guardar lo que sobre?',

  prepStep: (n: string) => `Paso de preparación ${n}`,
}

export const RECIPE = { en, es }