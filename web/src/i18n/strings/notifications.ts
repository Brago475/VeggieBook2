// The Notifications screen and the message pop-up. Spanish uses tú.

const en = {
  title: 'Notifications',
  sub: 'Messages from the VeggieBook team',
  loading: 'Loading messages...',
  couldNotLoad: 'Could not load your messages.',
  empty: 'You have no messages right now.',
  newLabel: 'New',
  sent: (date: string) => `Sent ${date}`,
  alertTitle: 'New message',
  view: 'View',
  linkNote: 'opens in a new tab',
  unreadCount: (n: number) =>
    n === 1 ? '1 unread message' : `${n} unread messages`,
}

const es: typeof en = {
  title: 'Notificaciones',
  sub: 'Mensajes del equipo de VeggieBook',
  loading: 'Cargando mensajes...',
  couldNotLoad: 'No se pudieron cargar tus mensajes.',
  empty: 'No tienes mensajes por ahora.',
  newLabel: 'Nuevo',
  sent: (date: string) => `Enviado el ${date}`,
  alertTitle: 'Mensaje nuevo',
  view: 'Ver',
  linkNote: 'se abre en una pestaña nueva',
  unreadCount: (n: number) =>
    n === 1 ? '1 mensaje sin leer' : `${n} mensajes sin leer`,
}

export const NOTIFICATIONS = { en, es }