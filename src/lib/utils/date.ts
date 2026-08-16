import { format, formatDistanceToNow, isPast, isFuture, differenceInDays } from 'date-fns'

export function formatDate(date: string | Date, fmt: string = 'MMM d, yyyy') {
  return format(new Date(date), fmt)
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), 'MMM d, yyyy • h:mm a')
}

export function formatTimeAgo(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function isEventPast(date: string | Date) {
  return isPast(new Date(date))
}

export function isEventFuture(date: string | Date) {
  return isFuture(new Date(date))
}

export function daysUntil(date: string | Date) {
  return differenceInDays(new Date(date), new Date())
}

export function formatEventDateRange(start: string | Date, end: string | Date) {
  const s = new Date(start)
  const e = new Date(end)
  if (s.toDateString() === e.toDateString()) {
    return `${format(s, 'EEEE, MMMM d, yyyy')} • ${format(s, 'h:mm a')} - ${format(e, 'h:mm a')}`
  }
  return `${format(s, 'MMM d, h:mm a')} - ${format(e, 'MMM d, yyyy • h:mm a')}`
}
