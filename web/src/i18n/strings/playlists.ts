// Playlists inside Notifications: the Messages and Playlists switch, a
// playlist's page, and making your own from a book. Spanish uses tú.

function countEn(tips: number, recipes: number): string {
  const parts: string[] = []
  if (tips > 0) parts.push(tips === 1 ? '1 tip' : `${tips} tips`)
  if (recipes > 0) parts.push(recipes === 1 ? '1 recipe' : `${recipes} recipes`)
  return parts.length > 0 ? parts.join(', ') : 'Empty'
}

function countEs(tips: number, recipes: number): string {
  const parts: string[] = []
  if (tips > 0) parts.push(tips === 1 ? '1 consejo' : `${tips} consejos`)
  if (recipes > 0) parts.push(recipes === 1 ? '1 receta' : `${recipes} recetas`)
  return parts.length > 0 ? parts.join(', ') : 'Vacía'
}

const en = {
  sections: 'Notifications sections',
  messages: 'Messages',
  playlists: 'Playlists',

  kicker: 'Playlist',
  openPlaylist: 'Open playlist',
  counts: (tips: number, recipes: number): string => countEn(tips, recipes),
  kept: 'Kept',

  keptTitle: 'Kept from notifications',
  keptEmpty: 'Playlists you keep from a notification show here.',
  mineTitle: 'My playlists',
  mineEmpty: 'To make one, tap \u22EE on a VeggieBook, then Make a playlist.',
  newPlaylist: 'New playlist',
  loading: 'Loading playlists...',
  couldNotLoad: 'Could not load your playlists.',
  notFound: 'This playlist is no longer available.',
  backToPlaylists: 'All playlists',
  backToPlaylist: 'Back to playlist',

  tip: 'Tip',
  recipe: 'Recipe',
  keep: 'Keep',
  skip: 'Skip',
  keptNote: 'In your playlists',
  remove: 'Remove from my playlists',
  skippedNote: 'You skipped this playlist. You can still keep it.',

  edit: 'Edit',
  delete: 'Delete playlist',
  deleteTitle: (name: string): string => `Delete "${name}"?`,
  deleteBody: 'The playlist is deleted. Your books and their recipes stay as they are.',
  cancel: 'Cancel',

  makerNew: 'New playlist',
  makerEdit: 'Edit playlist',
  makerSub: 'Open a book and tap the recipes you want.',
  nameLabel: 'Name',
  namePlaceholder: 'Weeknight dinners',
  yourBooks: 'Your books',
  fromBook: (vegetable: string): string => `Your ${vegetable} VeggieBook`,
  bookRecipes: (n: number): string => (n === 1 ? '1 recipe' : `${n} recipes`),
  bookPicked: (n: number): string => `${n} picked`,
  pickAll: 'Pick all',
  clearBook: 'Clear',
  noBooks: 'Save a VeggieBook first. Its recipes show here.',
  save: (n: number): string => (n > 0 ? `Save playlist (${n})` : 'Save playlist'),
  saving: 'Saving...',
  needName: 'Give your playlist a name.',
  needRecipe: 'Pick at least one recipe.',
  somethingWrong: 'Something went wrong. Please try again.',

  makeFromBook: 'Make a playlist',
  addFromBook: 'Add to a playlist',
  bookPlaylistSub: (vegetable: string): string => `Recipes from your ${vegetable} VeggieBook.`,
  modeNew: 'New playlist',
  modeAdd: 'Add to one I made',
  choosePlaylist: 'Which playlist?',
  noOwnYet: 'You have not made a playlist yet. Make a new one first.',
  recipesInBook: 'Recipes in this book',
  addSave: (n: number): string => (n > 0 ? `Add to playlist (${n})` : 'Add to playlist'),
  needPlaylist: 'Pick a playlist.',
  bookNoRecipes: 'This book has no recipes to add.',
}

const es: typeof en = {
  sections: 'Secciones de notificaciones',
  messages: 'Mensajes',
  playlists: 'Listas',

  kicker: 'Lista',
  openPlaylist: 'Abrir lista',
  counts: (tips: number, recipes: number) => countEs(tips, recipes),
  kept: 'Guardada',

  keptTitle: 'Guardadas desde notificaciones',
  keptEmpty: 'Las listas que guardes desde una notificación aparecen aquí.',
  mineTitle: 'Mis listas',
  mineEmpty: 'Para hacer una, toca \u22EE en un VeggieBook y luego Hacer una lista.',
  newPlaylist: 'Nueva lista',
  loading: 'Cargando listas...',
  couldNotLoad: 'No se pudieron cargar tus listas.',
  notFound: 'Esta lista ya no está disponible.',
  backToPlaylists: 'Todas las listas',
  backToPlaylist: 'Volver a la lista',

  tip: 'Consejo',
  recipe: 'Receta',
  keep: 'Guardar',
  skip: 'Omitir',
  keptNote: 'En tus listas',
  remove: 'Quitar de mis listas',
  skippedNote: 'Omitiste esta lista. Todavía puedes guardarla.',

  edit: 'Editar',
  delete: 'Borrar lista',
  deleteTitle: (name: string) => `¿Borrar "${name}"?`,
  deleteBody: 'La lista se borra. Tus libros y sus recetas no cambian.',
  cancel: 'Cancelar',

  makerNew: 'Nueva lista',
  makerEdit: 'Editar lista',
  makerSub: 'Abre un libro y toca las recetas que quieras.',
  nameLabel: 'Nombre',
  namePlaceholder: 'Cenas entre semana',
  yourBooks: 'Tus libros',
  fromBook: (vegetable: string) => `Tu VeggieBook de ${vegetable}`,
  bookRecipes: (n: number) => (n === 1 ? '1 receta' : `${n} recetas`),
  bookPicked: (n: number) => (n === 1 ? '1 elegida' : `${n} elegidas`),
  pickAll: 'Elegir todas',
  clearBook: 'Quitar',
  noBooks: 'Primero guarda un VeggieBook. Sus recetas aparecen aquí.',
  save: (n: number) => (n > 0 ? `Guardar lista (${n})` : 'Guardar lista'),
  saving: 'Guardando...',
  needName: 'Ponle un nombre a tu lista.',
  needRecipe: 'Elige al menos una receta.',
  somethingWrong: 'Algo salió mal. Inténtalo de nuevo.',

  makeFromBook: 'Hacer una lista',
  addFromBook: 'Agregar a una lista',
  bookPlaylistSub: (vegetable: string) => `Recetas de tu VeggieBook de ${vegetable}.`,
  modeNew: 'Nueva lista',
  modeAdd: 'Agregar a una mía',
  choosePlaylist: '¿Qué lista?',
  noOwnYet: 'Todavía no has hecho una lista. Primero haz una nueva.',
  recipesInBook: 'Recetas de este libro',
  addSave: (n: number) => (n > 0 ? `Agregar a la lista (${n})` : 'Agregar a la lista'),
  needPlaylist: 'Elige una lista.',
  bookNoRecipes: 'Este libro no tiene recetas para agregar.',
}

export const PLAYLISTS = { en, es }