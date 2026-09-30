// The user id and token carried by the links in confirmation and password
// reset emails: /confirm-email?user=...&token=...
//
// Read once when the page opens, then removed from the address bar, so the
// token does not sit in the browser's history or get copied along with the
// address. Reading and removing are separate so React can safely run the
// read more than once.

export type LinkParams = { userId: string; token: string }

export function readLinkParams(): LinkParams | null {
  const query = new URLSearchParams(window.location.search)
  const userId = query.get('user')
  const token = query.get('token')
  return userId && token ? { userId, token } : null
}

export function clearLinkParams() {
  if (window.location.search) {
    window.history.replaceState(window.history.state, '', window.location.pathname)
  }
}