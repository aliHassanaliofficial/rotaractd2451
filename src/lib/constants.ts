export const EVENT_CATEGORIES = [
  'Cultural',
  'Professional',
  'Service',
  'Social',
  'Sports',
  'Fundraising',
  'Conference',
  'Workshop',
] as const

export const CALENDAR_TYPES = [
  { value: 'event', label: 'Event', dot: 'bg-red-500', badge: 'bg-red-100 text-red-700', bar: 'bg-red-500', solid: 'bg-red-500 text-white' },
  { value: 'project', label: 'Project', dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700', bar: 'bg-blue-500', solid: 'bg-blue-500 text-white' },
  { value: 'meeting', label: 'Meeting', dot: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-800', bar: 'bg-yellow-400', solid: 'bg-yellow-400 text-yellow-900' },
] as const

export type CalendarTypeValue = (typeof CALENDAR_TYPES)[number]['value']

export function getCalendarType(type?: string | null): CalendarTypeValue {
  return type === 'project' || type === 'meeting' ? type : 'event'
}

export function getCalendarTypeColors(type?: string | null) {
  const value = getCalendarType(type)
  return CALENDAR_TYPES.find((t) => t.value === value) ?? CALENDAR_TYPES[0]
}

export const OFFICER_POSITIONS = [
  'President',
  'Vice President',
  'Secretary',
  'Treasurer',
  'Director of Service',
  'Director of Professional Development',
  'Director of Public Relations',
  'Director of Membership',
  'Director of Finance',
  'Past President',
] as const

export const MILESTONE_TYPES = [
  { value: 'founding', label: 'Founding', color: 'bg-gold' },
  { value: 'achievement', label: 'Achievement', color: 'bg-cranberry' },
  { value: 'event', label: 'Event', color: 'bg-navy' },
  { value: 'leadership', label: 'Leadership', color: 'bg-green-600' },
] as const

export const ANNOUNCEMENT_PRIORITIES = [
  { value: 'normal', label: 'Normal', color: 'bg-gray-400' },
  { value: 'important', label: 'Important', color: 'bg-cranberry' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-600' },
] as const

export const REG_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  attended: 'Attended',
}

export const REG_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  attended: 'bg-blue-100 text-blue-800',
}

export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  CLUB_LOGOS: 'club-logos',
  EVENT_COVERS: 'event-covers',
  GALLERY: 'gallery',
  LIBRARY: 'library',
  DOCUMENTS: 'documents',
} as const

export const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/events', label: 'Events' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/clubs', label: 'Clubs' },
  { href: '/news', label: 'News' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/contact', label: 'Contact' },
] as const

export const RESOURCE_LINKS = [
  { href: '/library', label: 'Library', description: 'Documents & downloadable resources' },
  { href: '/announcements', label: 'Announcements', description: 'Official district updates' },
  { href: '/history', label: 'History', description: 'Our journey through the years' },
  { href: '/newsletter', label: 'Newsletter', description: 'Subscribe to district news' },
] as const
