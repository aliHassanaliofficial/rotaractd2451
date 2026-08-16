'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { formatEventDateRange, daysUntil, isEventPast } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'
import { EVENT_CATEGORIES } from '@/lib/constants'
import { Calendar, MapPin, Clock, Users, Grid3X3, List, Search, ArrowRight, Ticket } from 'lucide-react'
import type { Event } from '@/types/database'

const EVENTS_PER_PAGE = 9

export default function EventsPage() {
  const [events, setEvents] = useState<(Event & { host_club: any })[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [page, setPage] = useState(1)
  const [tab, setTab] = useState('upcoming')

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (category) params.set('category', category)
      if (tab === 'past') params.set('status', 'completed,published')
      params.set('limit', String(EVENTS_PER_PAGE))
      params.set('offset', String((page - 1) * EVENTS_PER_PAGE))

      const res = await fetch(`/api/events?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setEvents(data.events || [])
    } catch {
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [category, page, tab])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  const filtered = events.filter((e) => {
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false
    if (tab === 'upcoming' && isEventPast(e.end_at)) return false
    if (tab === 'past' && !isEventPast(e.end_at)) return false
    return true
  })

  const totalPages = Math.ceil((filtered.length || 1) / EVENTS_PER_PAGE)

  return (
    <div className="flex flex-col">
      <section className="bg-gradient-to-br from-navy via-[#0a4a82] to-cranberry/50 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">Events</h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-300">
            Discover events, workshops, and activities organized by Rotaract clubs.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative md:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-1 rounded-2xl border p-1">
                <button
                  onClick={() => setView('grid')}
                  className={cn('rounded-2xl p-1.5 transition-colors', view === 'grid' ? 'bg-gradient-to-br from-navy to-cranberry text-white' : 'text-gray-400 hover:text-navy')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setView('list')}
                  className={cn('rounded-2xl p-1.5 transition-colors', view === 'list' ? 'bg-gradient-to-br from-navy to-cranberry text-white' : 'text-gray-400 hover:text-navy')}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="mb-8 flex flex-wrap gap-2">
            <button
              onClick={() => { setCategory(''); setPage(1) }}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                !category ? 'bg-gradient-to-br from-navy to-cranberry text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              All
            </button>
            {EVENT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => { setCategory(cat === category ? '' : cat); setPage(1) }}
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                  category === cat ? 'bg-cranberry text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <Tabs value={tab} onValueChange={(v) => { setTab(v); setPage(1) }}>
            <TabsList className="mb-8">
              <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
              <TabsTrigger value="past">Past Events</TabsTrigger>
            </TabsList>

            <TabsContent value={tab}>
              {loading ? (
                <div className={view === 'grid'
                  ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3'
                  : 'space-y-4'
                }>
                  {Array.from({ length: 6 }).map((_, i) => (
                    view === 'grid' ? (
                      <Card key={i} className="overflow-hidden">
                        <Skeleton className="h-44 w-full rounded-2xl" />
                        <CardContent className="p-4">
                          <Skeleton className="mb-2 h-4 w-20" />
                          <Skeleton className="mb-2 h-5 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </CardContent>
                      </Card>
                    ) : (
                      <Skeleton key={i} className="h-32 w-full" />
                    )
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-20 text-center">
                  <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                  <p className="text-lg text-gray-400">
                    {tab === 'upcoming' ? 'No upcoming events found.' : 'No past events found.'}
                  </p>
                  <Button variant="outline" className="mt-4" onClick={() => { setSearch(''); setCategory('') }}>
                    Clear Filters
                  </Button>
                </div>
              ) : view === 'grid' ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((event, i) => (
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
                                <Calendar className="h-12 w-12 text-white/50" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-3 left-3 right-3">
                              {event.category && <Badge variant="secondary">{event.category}</Badge>}
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
                              {event.price > 0 && (
                                <div className="flex items-center gap-1.5">
                                  <Ticket className="h-3.5 w-3.5" />
                                  <span>{event.price} {event.currency}</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filtered.map((event) => (
                    <Link key={event.id} href={`/events/${event.slug}`}>
                      <Card className="group transition-all hover:shadow-md">
                        <CardContent className="flex items-center gap-4 p-4">
                          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl max-sm:hidden">
                            {event.cover_url ? (
                              <Image src={event.cover_url} alt={event.title} fill className="object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center bg-gradient-to-br from-navy to-cranberry">
                                <Calendar className="h-8 w-8 text-white/50" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              {event.category && <Badge variant="outline" className="text-xs">{event.category}</Badge>}
                            </div>
                            <h3 className="font-semibold text-navy group-hover:text-cranberry">{event.title}</h3>
                            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatEventDateRange(event.start_at, event.end_at)}
                              </span>
                              {event.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {event.location}
                                </span>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="hidden h-5 w-5 shrink-0 text-cranberry transition-all group-hover:translate-x-1 sm:block" />
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    Previous
                  </Button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <Button key={i} variant={page === i + 1 ? 'default' : 'outline'} size="sm" onClick={() => setPage(i + 1)}>
                      {i + 1}
                    </Button>
                  ))}
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                    Next
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  )
}
