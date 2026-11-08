// The Notifications list, one notification's page, and the pop-up.
// Spanish uses tú.

const en = {
  title: 'Notifications',
  sub: 'Updates from the VeggieBook team',
  loading: 'Loading notifications...',
  couldNotLoad: 'Could not load your notifications.',

  show: 'Show',
  tabAll: (n: number) => `All ${n}`,
  tabUnread: (n: number) => `Unread ${n}`,
  today: 'Today',
  earlier: 'Earlier',
  emptyAll: 'You have no notifications right now.',
  emptyUnread: 'You are all caught up.',
  expireNote: 'Notifications leave this list when they expire.',
  unreadLabel: 'Unread',
  newLabel: 'New',

  kicker: 'VeggieBook notification',
  sentAt: (date: string, time: string) => `${date}, ${time}`,
  availableUntil: (date: string) => `Available until ${date}`,
  notFound: 'This notification is no longer available.',
  backToAll: 'All notifications',
  opensNewTab: 'Opens in a new tab',
  linkNote: 'opens in a new tab',

  newCount: (n: number) => (n === 1 ? '1 new notification' : `${n} new notifications`),
  stepOf: (i: number, n: number) => `${i} of ${n}`,
  previous: 'Previous notification',
  next: 'Next notification',
  moreWaiting: 'More notifications',
  andMore: (n: number) => (n === 1 ? 'and 1 more' : `and ${n} more`),
  seeAll: 'See all notifications',

  unreadCount: (n: number) =>
    n === 1 ? '1 unread notification' : `${n} unread notifications`,
}

const es: typeof en = {
  title: 'Notificaciones',
  sub: 'Novedades del equipo de VeggieBook',
  loading: 'Cargando notificaciones...',
  couldNotLoad: 'No se pudieron cargar tus notificaciones.',

  show: 'Mostrar',
  tabAll: (n: number) => `Todas ${n}`,
  tabUnread: (n: number) => `Sin leer ${n}`,
  today: 'Hoy',
  earlier: 'Antes',
  emptyAll: 'No tienes notificaciones por ahora.',
  emptyUnread: 'Ya leíste todas tus notificaciones.',
  expireNote: 'Las notificaciones salen de esta lista cuando vencen.',
  unreadLabel: 'Sin leer',
  newLabel: 'Nueva',

  kicker: 'Notificación de VeggieBook',
  sentAt: (date: string, time: string) => `${date}, ${time}`,
  availableUntil: (date: string) => `Disponible hasta el ${date}`,
  notFound: 'Esta notificación ya no está disponible.',
  backToAll: 'Todas las notificaciones',
  opensNewTab: 'Se abre en una pestaña nueva',
  linkNote: 'se abre en una pestaña nueva',

  newCount: (n: number) => (n === 1 ? '1 notificación nueva' : `${n} notificaciones nuevas`),
  stepOf: (i: number, n: number) => `${i} de ${n}`,
  previous: 'Notificación anterior',
  next: 'Notificación siguiente',
  moreWaiting: 'Más notificaciones',
  andMore: (n: number) => (n === 1 ? 'y 1 más' : `y ${n} más`),
  seeAll: 'Ver todas las notificaciones',

  unreadCount: (n: number) =>
    n === 1 ? '1 notificación sin leer' : `${n} notificaciones sin leer`,
}

export const NOTIFICATIONS = { en, es }