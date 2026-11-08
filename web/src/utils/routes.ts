// The app's addresses, and conversion between an address and the screen it
// names. Kept separate from the hook so it can be read and tested on its
// own.
//
//   /                                         home (or Welcome for a visitor)
//   /new                                      making a new VeggieBook
//   /secrets                                  making a new Secrets Book
//   /book/{id}                                a saved book, of either kind
//   /book/{id}/recipe/{recipeId}              one recipe inside a VeggieBook
//   /book/{id}/secret/{secretId}              one secret inside a Secrets Book
//   /book/{id}/cover                          changing a saved book's cover
//   /account                                  account settings
//   /notifications                            the inbox of messages from the research team
//   /notifications/{id}                       one message on its own page
//   /notifications/playlists                  the Playlists tab of Notifications
//   /notifications/playlist/{id}              a playlist from a notification
//   /notifications/playlist/{id}/recipe/{r}   one recipe opened from it
//   /notifications/playlist/{id}/tip/{t}      one tip opened from it
//   /notifications/mine/new                   making your own playlist
//   /notifications/mine/{id}                  one of your own playlists
//   /notifications/mine/{id}/recipe/{r}       one recipe opened from it
//   /notifications/mine/{id}/edit             changing your own playlist
//   /about                                    about VeggieBook, open to everyone
//   /terms, /privacy                          Terms of Use and Privacy Policy, open to everyone
//   /signin, /register                        sign in, create account
//   /forgot-password                          forgot password (PIN, then security question)
//
// Anything else is treated as home, and the address is corrected to /.

export type PlaylistSource = 'admin' | 'own'

export type PlaylistOpen = { kind: 'recipe' | 'tip'; id: number } | null

export type Route =
  | { view: 'home' }
  | { view: 'flow' }
  | { view: 'secrets' }
  | { view: 'account' }
  | { view: 'notifications'; messageId: string | null }
  | { view: 'playlists' }
  | { view: 'playlist'; source: PlaylistSource; playlistId: number; open: PlaylistOpen }
  | { view: 'playlistMaker'; playlistId: number | null }
  | { view: 'about' }
  | { view: 'terms' }
  | { view: 'privacy' }
  | { view: 'signin' }
  | { view: 'register' }
  | { view: 'forgotPassword' }
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

function playlist(source: PlaylistSource, playlistId: number, open: PlaylistOpen = null): Route {
  return { view: 'playlist', source, playlistId, open }
}

const NUMBER = /^\d+$/

function decode(part: string): string | null {
  try {
    return decodeURIComponent(part)
  } catch {
    return null
  }
}

function parsePlaylist(parts: string[]): Route | null {
  const source: PlaylistSource | null =
    parts[1] === 'playlist' ? 'admin' : parts[1] === 'mine' ? 'own' : null
  if (!source) return null

  if (source === 'own' && parts.length === 3 && parts[2] === 'new') {
    return { view: 'playlistMaker', playlistId: null }
  }
  if (!parts[2] || !NUMBER.test(parts[2])) return null

  const id = Number(parts[2])
  if (parts.length === 3) return playlist(source, id)
  if (source === 'own' && parts.length === 4 && parts[3] === 'edit') {
    return { view: 'playlistMaker', playlistId: id }
  }
  if (parts.length === 5 && NUMBER.test(parts[4])) {
    if (parts[3] === 'recipe') return playlist(source, id, { kind: 'recipe', id: Number(parts[4]) })
    if (parts[3] === 'tip' && source === 'admin') return playlist(source, id, { kind: 'tip', id: Number(parts[4]) })
  }
  return null
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
      case 'notifications':
        return { view: 'notifications', messageId: null }
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
    }
  }

  if (parts[0] === 'notifications') {
    if (parts.length === 2 && parts[1] === 'playlists') return { view: 'playlists' }

    const found = parsePlaylist(parts)
    if (found) return found

    if (parts.length === 2) {
      const messageId = decode(parts[1])
      if (messageId) return { view: 'notifications', messageId }
    }
  }

  if (parts[0] === 'book' && parts[1]) {
    const id = parts[1]
    if (parts.length === 2) return book(id)
    if (parts.length === 3 && parts[2] === 'cover') return book(id, null, null, true)
    if (parts.length === 4 && NUMBER.test(parts[3])) {
      if (parts[2] === 'recipe') return book(id, Number(parts[3]))
      if (parts[2] === 'secret') return book(id, null, Number(parts[3]))
    }
  }

  return { view: 'home' }
}

// The address of a playlist, or of one item open inside it.
export function playlistPath(source: PlaylistSource, playlistId: number, open: PlaylistOpen = null): string {
  const base = `/notifications/${source === 'admin' ? 'playlist' : 'mine'}/${playlistId}`
  return open ? `${base}/${open.kind}/${open.id}` : base
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
    case 'notifications':
      return route.messageId === null
        ? '/notifications'
        : `/notifications/${encodeURIComponent(route.messageId)}`
    case 'playlists':
      return '/notifications/playlists'
    case 'playlist':
      return playlistPath(route.source, route.playlistId, route.open)
    case 'playlistMaker':
      return route.playlistId === null
        ? '/notifications/mine/new'
        : `/notifications/mine/${route.playlistId}/edit`
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
    case 'book':
      if (route.cover) return `/book/${route.bookId}/cover`
      if (route.recipeId !== null) return `/book/${route.bookId}/recipe/${route.recipeId}`
      if (route.secretId !== null) return `/book/${route.bookId}/secret/${route.secretId}`
      return `/book/${route.bookId}`
  }
}