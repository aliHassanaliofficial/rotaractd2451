'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  addDays,
  addMonths,
  addWeeks,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CalendarRange,
  List as ListIcon,
  Plus,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { getCalendarTypeColors, CALENDAR_TYPES } from '@/lib/constants'
import { EventDetailDialog, type CalendarEventItem, type CalendarMode } from './EventDetailDialog'

type ViewMode = 'month' | 'week' | 'list'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface CalendarViewProps {
  events: CalendarEventItem[]
  mode?: CalendarMode
  loading?: boolean
  onReload?: () => void
}

export function CalendarView({ events, mode = 'public', loading = false, onReload }: CalendarViewProps) {
  const [view, setView] = useState<ViewMode>('month')
  const [cursor, setCursor] = useState(() => new Date())
  const [now] = useState(() => new Date())
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const eventsOn = useMemo(() => {
    const map = new Map<string, CalendarEventItem[]>()
    for (const e of events) {
      const key = format(new Date(e.start_at), 'yyyy-MM-dd')
      const list = map.get(key) ?? []
      list.push(e)
      map.set(key, list)
    }
    for (const list of map.values()) {
      list.sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
    }
    return map
  }, [events])

  const upcoming = useMemo(
    () =>
      [...events]
        .filter((e) => new Date(e.end_at).getTime() >= now.getTime())
        .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()),
    [events, now]
  )

  const past = useMemo(
    () =>
      [...events]
        .filter((e) => new Date(e.end_at).getTime() < now.getTime())
        .sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime()),
    [events, now]
  )

  function openEvent(e: CalendarEventItem) {
    setSelectedEvent(e)
    setDialogOpen(true)
  }

  function goToToday() {
    setCursor(new Date())
  }

  function navigate(delta: number) {
    if (view === 'month') setCursor((c) => addMonths(c, delta))
    else if (view === 'week') setCursor((c) => addWeeks(c, delta))
    else setCursor((c) => addMonths(c, delta))
  }

  const headerLabel =
    view === 'month'
      ? format(cursor, 'MMMM yyyy')
      : view === 'week'
        ? `${format(startOfWeek(cursor, { weekStartsOn: 0 }), 'MMM d')} - ${format(addDays(startOfWeek(cursor, { weekStartsOn: 0 }), 6), 'MMM d, yyyy')}`
        : 'All Entries'

  const manageHref = mode === 'admin' ? '/admin/events/new' : mode === 'club_admin' ? '/club-admin/events/new' : null

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)} aria-label="Previous">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToToday} className="font-medium">
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigate(1)} aria-label="Next">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="ml-2 min-w-[10rem] text-lg font-bold text-navy">{headerLabel}</h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-2xl border p-1">
            <button
              onClick={() => setView('month')}
              className={cn(
                'rounded-xl p-1.5 transition-colors',
                view === 'month' ? 'bg-gradient-to-br from-navy to-cranberry text-white' : 'text-gray-400 hover:text-navy'
              )}
              title="Month view"
            >
              <CalendarDays className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView('week')}
              className={cn(
                'rounded-xl p-1.5 transition-colors',
                view === 'week' ? 'bg-gradient-to-br from-navy to-cranberry text-white' : 'text-gray-400 hover:text-navy'
              )}
              title="Week view"
            >
              <CalendarRange className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView('list')}
              className={cn(
                'rounded-xl p-1.5 transition-colors',
                view === 'list' ? 'bg-gradient-to-br from-navy to-cranberry text-white' : 'text-gray-400 hover:text-navy'
              )}
              title="List view"
            >
              <ListIcon className="h-4 w-4" />
            </button>
          </div>

          {manageHref && (
            <Button asChild>
              <Link href={manageHref}>
                <Plus className="mr-1 h-4 w-4" /> New Entry
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {CALENDAR_TYPES.map((t) => (
          <span key={t.value} className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
            <span className={cn('h-2.5 w-2.5 rounded-full', t.dot)} />
            {t.label}
          </span>
        ))}
      </div>

      {loading ? (
        <div className="flex h-72 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      ) : view === 'month' ? (
        <MonthView cursor={cursor} eventsOn={eventsOn} onOpen={openEvent} onMore={(day) => { setCursor(day); setView('week') }} />
      ) : view === 'week' ? (
        <WeekView cursor={cursor} eventsOn={eventsOn} onOpen={openEvent} />
      ) : (
        <ListView upcoming={upcoming} past={past} mode={mode} onOpen={openEvent} />
      )}

      <EventDetailDialog
        event={selectedEvent}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={mode}
        onStatusToggle={onReload}
      />
    </div>
  )
}

function MonthView({
  cursor,
  eventsOn,
  onOpen,
  onMore,
}: {
  cursor: Date
  eventsOn: Map<string, CalendarEventItem[]>
  onOpen: (e: CalendarEventItem) => void
  onMore: (day: Date) => void
}) {
  const monthStart = startOfMonth(cursor)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
  const today = new Date()
  const MAX_VISIBLE = 3

  return (
    <div className="overflow-hidden rounded-2xl border bg-white">
      <div className="grid grid-cols-7 border-b bg-gray-50">
        {WEEKDAYS.map((d) => (
          <div key={d} className="px-2 py-2 text-center text-xs font-semibold uppercase text-gray-500">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const key = format(day, 'yyyy-MM-dd')
          const dayEvents = eventsOn.get(key) ?? []
          const inMonth = isSameMonth(day, monthStart)
          const isToday = isSameDay(day, today)
          const visible = dayEvents.slice(0, MAX_VISIBLE)
          const extra = dayEvents.length - visible.length
          return (
            <div
              key={i}
              className={cn(
                'min-h-[5.5rem] border-b border-r p-1.5 transition-colors',
                (i + 1) % 7 === 0 && 'border-r-0',
                !inMonth && 'bg-gray-50/60'
              )}
            >
              <div className="mb-1 flex items-center justify-center">
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                    isToday ? 'bg-cranberry text-white' : inMonth ? 'text-navy' : 'text-gray-400'
                  )}
                >
                  {format(day, 'd')}
                </span>
              </div>
              <div className="space-y-1">
                {visible.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => onOpen(e)}
                    className="block w-full truncate rounded px-1 py-0.5 text-left text-[11px] font-medium transition-opacity hover:opacity-80"
                    title={e.title}
                  >
                    <span className="flex items-center gap-1">
                      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', getCalendarTypeColors(e.calendar_type).dot)} />
                      <span className="truncate text-gray-700">{e.title}</span>
                    </span>
                  </button>
                ))}
                {extra > 0 && (
                  <button
                    onClick={() => onMore(day)}
                    className="block w-full truncate px-1 py-0.5 text-left text-[11px] font-semibold text-cranberry hover:underline"
                  >
                    +{extra} more
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WeekView({
  cursor,
  eventsOn,
  onOpen,
}: {
  cursor: Date
  eventsOn: Map<string, CalendarEventItem[]>
  onOpen: (e: CalendarEventItem) => void
}) {
  const weekStart = startOfWeek(cursor, { weekStartsOn: 0 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const today = new Date()

  return (
    <div className="overflow-hidden rounded-2xl border bg-white">
      <div className="grid grid-cols-7 border-b bg-gray-50">
        {days.map((day) => {
          const isToday = isSameDay(day, today)
          return (
            <div key={day.toISOString()} className="px-2 py-2 text-center">
              <p className="text-xs font-semibold uppercase text-gray-500">{format(day, 'EEE')}</p>
              <p
                className={cn(
                  'mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold',
                  isToday ? 'bg-cranberry text-white' : 'text-navy'
                )}
              >
                {format(day, 'd')}
              </p>
            </div>
          )
        })}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const dayEvents = eventsOn.get(key) ?? []
          const isToday = isSameDay(day, today)
          return (
            <div
              key={day.toISOString()}
              className={cn(
                'min-h-[12rem] border-r p-1.5',
                isToday && 'bg-cranberry/5'
              )}
            >
              {dayEvents.length === 0 ? (
                <p className="px-1 pt-2 text-center text-[11px] text-gray-300">No events</p>
              ) : (
                <div className="space-y-1.5">
                  {dayEvents.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => onOpen(e)}
                      className="block w-full rounded-lg border-l-4 bg-gray-50 p-1.5 text-left transition-colors hover:bg-gray-100"
                      title={e.title}
                    >
                      <p className="truncate text-xs font-medium text-navy">{e.title}</p>
                      <p className="text-[11px] text-gray-500">
                        {format(new Date(e.start_at), 'h:mm a')}
                        {e.location ? ` · ${e.location}` : ''}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ListView({
  upcoming,
  past,
  mode,
  onOpen,
}: {
  upcoming: CalendarEventItem[]
  past: CalendarEventItem[]
  mode: CalendarMode
  onOpen: (e: CalendarEventItem) => void
}) {
  const manageMode = mode === 'admin' || mode === 'club_admin'

  function Row({ e }: { e: CalendarEventItem }) {
    const colors = getCalendarTypeColors(e.calendar_type)
    const start = new Date(e.start_at)
    return (
      <button
        onClick={() => onOpen(e)}
        className="flex w-full items-center gap-3 rounded-2xl border bg-white p-3 text-left transition-colors hover:border-gray-300 hover:bg-gray-50"
      >
        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border bg-gray-50">
          <span className="text-xs font-semibold uppercase text-gray-400">{format(start, 'MMM')}</span>
          <span className="text-lg font-bold leading-none text-navy">{format(start, 'd')}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={cn('h-2 w-2 shrink-0 rounded-full', colors.dot)} />
            <span className="truncate font-medium text-navy">{e.title}</span>
          </div>
          <p className="mt-0.5 truncate text-xs text-gray-500">
            {format(new Date(e.start_at), 'h:mm a')} - {format(new Date(e.end_at), 'h:mm a')}
            {e.location ? ` · ${e.location}` : ''}
          </p>
          {manageMode && (
            <p className="mt-0.5 text-[11px] text-gray-400">
              {e.status}
              {e.approval_status === 'pending' ? ' · pending approval' : ''}
            </p>
          )}
        </div>
      </button>
    )
  }

  return (
    <div className="max-h-[34rem] space-y-4 overflow-y-auto rounded-2xl border bg-white p-4">
      {upcoming.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Upcoming</h3>
          <div className="space-y-2">
            {upcoming.map((e) => <Row key={e.id} e={e} />)}
          </div>
        </div>
      )}
      {past.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Past</h3>
          <div className="space-y-2">
            {past.map((e) => <Row key={e.id} e={e} />)}
          </div>
        </div>
      )}
      {upcoming.length === 0 && past.length === 0 && (
        <div className="py-16 text-center text-gray-400">No entries for this period.</div>
      )}
    </div>
  )
}
