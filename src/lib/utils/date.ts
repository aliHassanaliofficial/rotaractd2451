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

export function getRotaryYear(date: string | Date): string {
  const d = new Date(date)
  const year = d.getFullYear()
  const startYear = d.getMonth() >= 6 ? year : year - 1
  return `${startYear.toString().slice(-2)}/${(startYear + 1).toString().slice(-2)}`
}

export function getCurrentRotaryYear() {
  return getRotaryYear(new Date())
}

export function getRotaryYearRange(year: string): { start: Date; end: Date } {
  const isFull = year.includes('-')
  const pattern = isFull ? /^(\d{4})-(\d{4})$/ : /^(\d{2})\/(\d{2})$/
  const match = year.match(pattern)
  if (!match) return { start: new Date(), end: new Date() }
  const first = parseInt(match[1], 10)
  const startYear = isFull ? first : 2000 + first
  return {
    start: new Date(startYear, 6, 1),
    end: new Date(startYear + 1, 5, 30),
  }
}

export function formatRotaryYear(year: string): string {
  if (!year) return ''
  if (year.includes('-')) {
    const parts = year.split('-')
    return `RY ${parts[0].slice(-2)}/${parts[1].slice(-2)}`
  }
  const y = parseInt(year)
  if (isNaN(y)) return `RY ${year}`
  return `RY ${y.toString().slice(-2)}/${(y + 1).toString().slice(-2)}`
}
