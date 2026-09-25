// The app's addresses, and conversion between an address and the screen it
// names. Kept separate from the hook so it can be read and tested on its
// own.
//
//   /                             home (or Welcome for a visitor)
//   /new                          making a new VeggieBook
//   /secrets                      making a new Secrets Book
//   /book/{id}                    a saved book, of either kind
//   /book/{id}/recipe/{recipeId}  one recipe inside a VeggieBook
//   /book/{id}/secret/{secretId}  one secret inside a Secrets Book
//   /book/{id}/cover              changing a saved book's cover
//   /account                      account settings
//   /signin, /register            sign in, create account
//
// Anything else is treated as home, and the address is corrected to /.

export type Route =
  | { view: 'home' }
  | { view: 'flow' }
  | { view: 'secrets' }
  | { view: 'account' }
  | { view: 'signin' }
  | { view: 'register' }
  | {
      view: 'book'
      bookId: string
      recipeId: number | null
      secretId: number | null
      // Changing this book's cover.
      cover: boolean
    }

function book(
  bookId: string,
  recipeId: number | null = null,
  secretId: number | null = null,
  cover = false,
): Route {
  return { view: 'book', bookId, recipeId, secretId, cover }
}

export function parseRoute(path: string): Route {
  const parts = path.split('/').filter(Boolean)

  if (parts.length === 0) return { view: 'home' }

  if (parts.length === 1) {
    switch (parts[0]) {
      case 'new':
        return { view: 'flow' }
      case 'secrets':
        return { view: 'secrets' }
      case 'account':
        return { view: 'account' }
      case 'signin':
        return { view: 'signin' }
      case 'register':
        return { view: 'register' }
    }
  }

  if (parts[0] === 'book' && parts[1]) {
    const id = parts[1]
    if (parts.length === 2) return book(id)
    if (parts.length === 3 && parts[2] === 'cover') return book(id, null, null, true)
    if (parts.length === 4 && /^\d+$/.test(parts[3])) {
      if (parts[2] === 'recipe') return book(id, Number(parts[3]))
      if (parts[2] === 'secret') return book(id, null, Number(parts[3]))
    }
  }

  return { view: 'home' }
}

// The one correct address for a route, so a stray trailing slash or an
// unknown path can be tidied up.
export function routePath(route: Route): string {
  switch (route.view) {
    case 'home':
      return '/'
    case 'flow':
      return '/new'
    case 'secrets':
      return '/secrets'
    case 'account':
      return '/account'
    case 'signin':
      return '/signin'
    case 'register':
      return '/register'
    case 'book':
      if (route.cover) return `/book/${route.bookId}/cover`
      if (route.recipeId !== null) return `/book/${route.bookId}/recipe/${route.recipeId}`
      if (route.secretId !== null) return `/book/${route.bookId}/secret/${route.secretId}`
      return `/book/${route.bookId}`
  }
}