'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatEventDateRange, formatRotaryYear, getRotaryYear, getRotaryYearRange, isEventPast, daysUntil } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'
import { Sparkles, Calendar, MapPin, Ticket, Users, ArrowRight } from 'lucide-react'
import type { Event, Club } from '@/types/database'

type ConferenceEvent = Event & { host_club?: Club | null }

export default function ConferencePage() {
  const [conferences, setConferences] = useState<ConferenceEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState('')

  useEffect(() => {
    let cancelled = false
    fetch('/api/events?type=conference&limit=500')
      .then((res) => (res.ok ? res.json() : { events: [] }))
      .then((data) => {
        if (!cancelled) setConferences(data.events || [])
      })
      .catch(() => {
        if (!cancelled) setConferences([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const years = useMemo(() => {
    const set = new Set<string>()
    conferences.forEach((c) => set.add(getRotaryYear(c.start_at)))
    return [...set].sort((a, b) => {
      const [ay, by] = [parseInt(a.split('/')[0]), parseInt(b.split('/')[0])]
      return by - ay
    })
  }, [conferences])

  const filteredYears = selectedYear ? years.filter((y) => y === selectedYear) : years

  const totalAttendees = conferences.reduce(
    (sum, c) => sum + (c.capacity && c.show_capacity ? c.capacity : 0),
    0
  )

  return (
    <div className="flex flex-col">
      <section className="bg-gradient-to-br from-navy via-[#0a4a82] to-cranberry/50 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <Sparkles className="mx-auto mb-4 h-14 w-14 text-gold" />
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">District Conference</h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-300">
            The annual gathering of District 2451 — where tomorrow&apos;s leaders connect, learn, and serve together.
          </p>
        </div>
      </section>

      {!loading && conferences.length > 0 && (
        <section className="border-b border-gray-100 bg-white py-6">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {years.map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear((y) => (y === year ? '' : year))}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
                    selectedYear === year ? 'bg-gradient-to-br from-navy to-cranberry text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {formatRotaryYear(year)}
                </button>
              ))}
              {years.length > 1 && (
                <button
                  onClick={() => setSelectedYear('')}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                    !selectedYear ? 'bg-gradient-to-br from-navy to-cranberry text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  All Years
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="py-16">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="space-y-14">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="mb-6 h-8 w-40" />
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <Card key={j} className="overflow-hidden">
                        <Skeleton className="h-44 w-full rounded-2xl" />
                        <CardContent className="p-4">
                          <Skeleton className="mb-2 h-4 w-24" />
                          <Skeleton className="mb-2 h-5 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : conferences.length === 0 ? (
            <div className="py-20 text-center">
              <Sparkles className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <p className="text-lg text-gray-400">No conferences published yet.</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedYear || 'all'}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="space-y-16"
              >
                {filteredYears.map((year) => {
                  const yearConferences = conferences.filter((c) => getRotaryYear(c.start_at) === year)
                  const { start, end } = getRotaryYearRange(year)
                  const upcomingCount = yearConferences.filter((c) => !isEventPast(c.start_at)).length
                  return (
                    <section key={year}>
                      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-4">
                          <h2 className="text-3xl font-bold text-navy">{formatRotaryYear(year)}</h2>
                          <div className="h-0.5 flex-1 rounded-full bg-gradient-to-r from-gold/60 to-transparent md:w-32" />
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatEventDateRange(start.toISOString(), end.toISOString())}
                          </span>
                          {upcomingCount > 0 && (
                            <Badge variant="cranberry" className="font-medium">{upcomingCount} upcoming</Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {yearConferences.map((event, i) => (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05, duration: 0.4 }}
                          >
                            <Link href={`/events/${event.slug}`}>
                              <Card className="group h-full overflow-hidden">
                                <div className="relative h-44 overflow-hidden">
                                  {event.cover_url ? (
                                    <Image src={event.cover_url} alt={event.title} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                                  ) : (
                                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-navy to-cranberry">
                                      <Sparkles className="h-12 w-12 text-white/50" />
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                  <div className="absolute bottom-3 left-3 right-3">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <Badge variant="cranberry">Conference</Badge>
                                      <Badge variant="secondary">{formatRotaryYear(year)}</Badge>
                                    </div>
                                    <p className="mt-1 text-sm text-white/90">
                                      {!isEventPast(event.start_at)
                                        ? daysUntil(event.start_at) >= 0
                                          ? `${daysUntil(event.start_at)} days away`
                                          : 'Ongoing'
                                        : 'Completed'}
                                    </p>
                                  </div>
                                </div>
                                <CardContent className="p-4">
                                  <h3 className="mb-2 line-clamp-2 font-semibold text-navy group-hover:text-cranberry">
                                    {event.title}
                                  </h3>
                                  <div className="space-y-1 text-sm text-gray-500">
                                    <div className="flex items-center gap-1.5">
                                      <Calendar className="h-3.5 w-3.5" />
                                      <span>{formatEventDateRange(event.start_at, event.end_at)}</span>
                                    </div>
                                    {event.location && (
                                      <div className="flex items-center gap-1.5">
                                        <MapPin className="h-3.5 w-3.5" />
                                        <span className="truncate">{event.location}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-3 pt-1">
                                      {event.show_capacity && event.capacity != null && event.capacity > 0 && (
                                        <span className="inline-flex items-center gap-1">
                                          <Users className="h-3.5 w-3.5" />
                                          {event.capacity}
                                        </span>
                                      )}
                                      {event.price > 0 ? (
                                        <span className="inline-flex items-center gap-1">
                                          <Ticket className="h-3.5 w-3.5" />
                                          {event.price} {event.currency}
                                        </span>
                                      ) : (
                                        <Badge variant="outline" className="text-xs">Free</Badge>
                                      )}
                                      {event.title && (
                                        <ArrowRight className="ml-auto h-4 w-4 text-cranberry transition-transform group-hover:translate-x-1" />
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                    </section>
                  )
                })}
              </motion.div>
            </AnimatePresence>
          )}

          {!loading && conferences.length > 0 && totalAttendees > 0 && (
            <div className="mt-16 rounded-3xl bg-gradient-to-br from-navy via-[#0a4a82] to-cranberry/70 px-6 py-10 text-center text-white">
              <Users className="mx-auto mb-3 h-10 w-10 text-gold" />
              <p className="text-3xl font-bold">{totalAttendees.toLocaleString()}+</p>
              <p className="mt-1 text-gray-300">leaders gathered at District conferences</p>
              {!selectedYear && (
                <Button className="mt-6 bg-white text-navy hover:bg-gold" asChild>
                  <Link href="/events?type=conference">Explore All Events</Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}