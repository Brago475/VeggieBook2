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
//   /about                        about VeggieBook, open to everyone
//   /terms, /privacy              Terms of Use and Privacy Policy, open to everyone
//   /signin, /register            sign in, create account
//   /forgot-password              ask for a password reset link
//   /reset-password?user&token    choose a new password, from the email link
//   /confirm-email?user&token     confirm an email address, from the email link
//
// Anything else is treated as home, and the address is corrected to /.
// The ?user&token part of the two email links is read by those pages
// themselves (see utils/linkParams.ts), not here.

export type Route =
  | { view: 'home' }
  | { view: 'flow' }
  | { view: 'secrets' }
  | { view: 'account' }
  | { view: 'about' }
  | { view: 'terms' }
  | { view: 'privacy' }
  | { view: 'signin' }
  | { view: 'register' }
  | { view: 'forgotPassword' }
  | { view: 'resetPassword' }
  | { view: 'confirmEmail' }
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
      case 'about':
        return { view: 'about' }
      case 'terms':
        return { view: 'terms' }
      case 'privacy':
        return { view: 'privacy' }
      case 'signin':
        return { view: 'signin' }
      case 'register':
        return { view: 'register' }
      case 'forgot-password':
        return { view: 'forgotPassword' }
      case 'reset-password':
        return { view: 'resetPassword' }
      case 'confirm-email':
        return { view: 'confirmEmail' }
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
    case 'about':
      return '/about'
    case 'terms':
      return '/terms'
    case 'privacy':
      return '/privacy'
    case 'signin':
      return '/signin'
    case 'register':
      return '/register'
    case 'forgotPassword':
      return '/forgot-password'
    case 'resetPassword':
      return '/reset-password'
    case 'confirmEmail':
      return '/confirm-email'
    case 'book':
      if (route.cover) return `/book/${route.bookId}/cover`
      if (route.recipeId !== null) return `/book/${route.bookId}/recipe/${route.recipeId}`
      if (route.secretId !== null) return `/book/${route.bookId}/secret/${route.secretId}`
      return `/book/${route.bookId}`
  }
}