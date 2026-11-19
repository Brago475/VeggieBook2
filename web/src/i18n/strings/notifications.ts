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
  emptyTitle: 'No messages yet',
  emptyAll: 'Updates from the VeggieBook team show up here.',
  emptyUnread: 'You are all caught up.',
  firstChapter: 'Your first chapter starts with the next message.',
  chapterEnd: 'The end of this chapter.',
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
  nextOne: 'Next one',
  seeAllNotifications: 'See all notifications',
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
  emptyTitle: 'Todavía no hay mensajes',
  emptyAll: 'Las novedades del equipo de VeggieBook aparecen aquí.',
  emptyUnread: 'Ya leíste todas tus notificaciones.',
  firstChapter: 'Tu primer capítulo empieza con el próximo mensaje.',
  chapterEnd: 'Fin de este capítulo.',
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
  nextOne: 'Siguiente',
  seeAllNotifications: 'Ver todas las notificaciones',
  stepOf: (i: number, n: number) => `${i} de ${n}`,
  previous: 'Notificación anterior',
  next: 'Notificación siguiente',
  seeAll: 'Ver todas',

  unreadCount: (n: number) =>
    n === 1 ? '1 notificación sin leer' : `${n} notificaciones sin leer`,
}

export const NOTIFICATIONS = { en, es }