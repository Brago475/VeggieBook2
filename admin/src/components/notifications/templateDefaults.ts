import type { NotificationTemplate, TemplateDefaultLink } from '../../types/notifications'
import { EMPTY_CHOICE, type PlaylistChoice } from './playlistChoice'

// Which playlist a template starts with. For a template with a vegetable:
// that vegetable's default, then the any-vegetable default, then the
// automatic playlist for the vegetable with the meal left to pick.
// Archived playlists are skipped.

export const ANY_VEGETABLE = ''

export function linkFor(
  links: TemplateDefaultLink[],
  template: NotificationTemplate,
  vegetable: string,
): TemplateDefaultLink | null {
  const live = links.filter((l) => l.templateKey === template.key && !l.archived)
  if (!template.needsVegetable) return live.find((l) => l.vegetable === ANY_VEGETABLE) ?? null
  return live.find((l) => l.vegetable === vegetable) ?? live.find((l) => l.vegetable === ANY_VEGETABLE) ?? null
}

export function defaultChoice(
  links: TemplateDefaultLink[],
  template: NotificationTemplate,
  vegetable: string,
): PlaylistChoice | null {
  const link = linkFor(links, template, vegetable)
  if (link) return { ...EMPTY_CHOICE, on: true, kind: 'saved', playlistId: link.playlistId }
  if (template.needsVegetable && vegetable) return { ...EMPTY_CHOICE, on: true, kind: 'auto', vegetable }
  return null
}