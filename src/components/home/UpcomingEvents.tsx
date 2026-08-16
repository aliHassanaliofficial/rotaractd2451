'use client'

import { motion } from 'framer-motion'
import { Calendar, MapPin, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatEventDateRange, daysUntil } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'
import type { Event } from '@/types/database'

interface UpcomingEventsProps {
  events?: Event[]
}

const defaultEvents: Event[] = [
  {
    id: '1',
    slug: 'district-conference-2026',
    title: 'District Conference 2026',
    start_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    end_at: new Date(Date.now() + 8 * 86400000).toISOString(),
    location: 'Cairo Marriott Hotel',
    category: 'Conference',
    cover_url: '/images/event-1.jpg',
    capacity: 500,
    registration_open: true,
    price: 0,
    currency: 'EGP',
    is_online: false,
    registration_type: 'public',
    status: 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    slug: 'leadership-workshop',
    title: 'Leadership Development Workshop',
    start_at: new Date(Date.now() + 14 * 86400000).toISOString(),
    end_at: new Date(Date.now() + 14 * 86400000 + 4 * 3600000).toISOString(),
    location: 'Alexandria University',
    category: 'Workshop',
    cover_url: '/images/event-2.jpg',
    capacity: 100,
    registration_open: true,
    price: 50,
    currency: 'EGP',
    is_online: false,
    registration_type: 'public',
    status: 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    slug: 'community-service-day',
    title: 'Community Service Day',
    start_at: new Date(Date.now() + 21 * 86400000).toISOString(),
    end_at: new Date(Date.now() + 21 * 86400000 + 8 * 3600000).toISOString(),
    location: 'Various Locations',
    category: 'Service',
    cover_url: '/images/event-3.jpg',
    capacity: 300,
    registration_open: true,
    price: 0,
    currency: 'EGP',
    is_online: false,
    registration_type: 'public',
    status: 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    slug: 'cultural-festival',
    title: 'Intercultural Festival',
    start_at: new Date(Date.now() + 30 * 86400000).toISOString(),
    end_at: new Date(Date.now() + 31 * 86400000).toISOString(),
    location: 'Cairo Opera House',
    category: 'Cultural',
    cover_url: '/images/event-4.jpg',
    capacity: 800,
    registration_open: false,
    price: 100,
    currency: 'EGP',
    is_online: false,
    registration_type: 'public',
    status: 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    slug: 'online-fundraising-gala',
    title: 'Online Fundraising Gala',
    start_at: new Date(Date.now() + 45 * 86400000).toISOString(),
    end_at: new Date(Date.now() + 45 * 86400000 + 3 * 3600000).toISOString(),
    location: 'Virtual Event',
    category: 'Fundraising',
    cover_url: '/images/event-5.jpg',
    capacity: 1000,
    registration_open: true,
    price: 0,
    currency: 'EGP',
    is_online: true,
    online_url: 'https://zoom.us/...',
    registration_type: 'public',
    status: 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export function UpcomingEvents({ events = defaultEvents }: UpcomingEventsProps) {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold text-navy">Upcoming Events</h2>
            <p className="mt-2 text-gray-600">Don&apos;t miss out on these exciting opportunities</p>
          </div>
          <Button asChild variant="outline">
            <a href="/events">View All</a>
          </Button>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none">
          {events.slice(0, 5).map((event, i) => {
            const days = daysUntil(event.start_at)
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="min-w-[320px] flex-shrink-0 snap-start"
              >
                <Card className="group h-full overflow-hidden">
                  <div className="relative h-40 overflow-hidden">
                    <div
                      className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                      style={{ backgroundImage: `url(${event.cover_url || '/images/placeholder.jpg'})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <Badge variant={event.is_online ? 'info' : 'default'}>
                        {event.category || (event.is_online ? 'Online' : 'In-Person')}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-navy line-clamp-1">{event.title}</h3>
                    <div className="mt-3 space-y-2 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gold" />
                        <span>{formatEventDateRange(event.start_at, event.end_at)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-cranberry" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                      {event.capacity && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-navy" />
                          <span>Capacity: {event.capacity}</span>
                        </div>
                      )}
                    </div>
                    <div
                      className={cn(
                        'mt-4 rounded-2xl px-3 py-2 text-center text-sm font-medium',
                        days > 0
                          ? 'bg-gold/10 text-gold-dark'
                          : 'bg-gray-100 text-gray-500'
                      )}
                    >
                      {days > 0 ? `${days} day${days === 1 ? '' : 's'} away` : 'Happening today!'}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
