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

  availableUntil: (date: string) => `Available until ${date}`,
  openLink: (host: string) => `Open ${host}`,
  notFound: 'This notification is no longer available.',
  backToAll: 'All notifications',
  linkNote: 'opens in a new tab',

  newTitle: (n: number): string => (n === 1 ? 'New notification' : 'New notifications'),
  readMore: 'Read more',
  stepOf: (i: number, n: number) => `${i} of ${n}`,
  previous: 'Previous notification',
  next: 'Next notification',
  seeAll: 'See all',

  unreadCount: (n: number): string =>
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

  availableUntil: (date: string) => `Disponible hasta el ${date}`,
  openLink: (host: string) => `Abrir ${host}`,
  notFound: 'Esta notificación ya no está disponible.',
  backToAll: 'Todas las notificaciones',
  linkNote: 'se abre en una pestaña nueva',

  newTitle: (n: number) => (n === 1 ? 'Notificación nueva' : 'Notificaciones nuevas'),
  readMore: 'Leer más',
  stepOf: (i: number, n: number) => `${i} de ${n}`,
  previous: 'Notificación anterior',
  next: 'Notificación siguiente',
  seeAll: 'Ver todas',

  unreadCount: (n: number) =>
    n === 1 ? '1 notificación sin leer' : `${n} notificaciones sin leer`,
}

export const NOTIFICATIONS = { en, es }