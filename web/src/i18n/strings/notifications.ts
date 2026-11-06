// The Notifications inbox, the message thread, and the pop-up. Spanish
// uses tú.

const en = {
  title: 'Notifications',
  sub: 'Messages from the VeggieBook team',
  sender: 'VeggieBook team',
  loading: 'Loading messages...',
  couldNotLoad: 'Could not load your messages.',

  show: 'Show',
  tabAll: (n: number) => `All ${n}`,
  tabUnread: (n: number) => `Unread ${n}`,
  today: 'Today',
  earlier: 'Earlier',
  emptyAll: 'You have no messages right now.',
  emptyUnread: 'You are all caught up.',
  expireNote: 'Messages leave this list when they expire.',
  unreadLabel: 'Unread',

  threadCount: (n: number) => (n === 1 ? '1 message' : `${n} messages`),
  availableUntil: (date: string) => `available until ${date}`,
  noReplies: 'Messages from the team only. Replies are not available.',
  opensNewTab: 'Opens in a new tab',
  linkNote: 'opens in a new tab',

  newMessages: (n: number) => (n === 1 ? '1 new message' : `${n} new messages`),
  messageOf: (i: number, n: number) => `Message ${i} of ${n}`,
  previous: 'Previous message',
  next: 'Next message',
  alsoWaiting: 'Also waiting',
  andMore: (n: number) => (n === 1 ? 'and 1 more' : `and ${n} more`),
  seeAll: 'See all messages',

  unreadCount: (n: number) =>
    n === 1 ? '1 unread message' : `${n} unread messages`,
}

const es: typeof en = {
  title: 'Notificaciones',
  sub: 'Mensajes del equipo de VeggieBook',
  sender: 'Equipo de VeggieBook',
  loading: 'Cargando mensajes...',
  couldNotLoad: 'No se pudieron cargar tus mensajes.',

  show: 'Mostrar',
  tabAll: (n: number) => `Todos ${n}`,
  tabUnread: (n: number) => `Sin leer ${n}`,
  today: 'Hoy',
  earlier: 'Antes',
  emptyAll: 'No tienes mensajes por ahora.',
  emptyUnread: 'Ya leíste todos tus mensajes.',
  expireNote: 'Los mensajes salen de esta lista cuando vencen.',
  unreadLabel: 'Sin leer',

  threadCount: (n: number) => (n === 1 ? '1 mensaje' : `${n} mensajes`),
  availableUntil: (date: string) => `disponible hasta el ${date}`,
  noReplies: 'Solo mensajes del equipo. No se puede responder.',
  opensNewTab: 'Se abre en una pestaña nueva',
  linkNote: 'se abre en una pestaña nueva',

  newMessages: (n: number) => (n === 1 ? '1 mensaje nuevo' : `${n} mensajes nuevos`),
  messageOf: (i: number, n: number) => `Mensaje ${i} de ${n}`,
  previous: 'Mensaje anterior',
  next: 'Mensaje siguiente',
  alsoWaiting: 'También te esperan',
  andMore: (n: number) => (n === 1 ? 'y 1 más' : `y ${n} más`),
  seeAll: 'Ver todos los mensajes',

  unreadCount: (n: number) =>
    n === 1 ? '1 mensaje sin leer' : `${n} mensajes sin leer`,
}

export const NOTIFICATIONS = { en, es }