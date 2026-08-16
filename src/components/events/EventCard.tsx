'use client'

import { motion } from 'framer-motion'
import { Calendar, MapPin, Clock, IndianRupee } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CountdownTimer } from './CountdownTimer'
import { formatEventDateRange } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'
import type { Event } from '@/types/database'

interface EventCardProps {
  event: Event
  index?: number
  view?: 'grid' | 'list'
}

const statusBadge: Record<string, 'default' | 'destructive' | 'warning' | 'success'> = {
  published: 'default',
  cancelled: 'destructive',
  draft: 'warning',
  completed: 'success',
}

export function EventCard({ event, index = 0, view = 'grid' }: EventCardProps) {
  const isList = view === 'list'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card
        className={cn(
          'group overflow-hidden transition-all hover:shadow-lg',
          isList && 'flex'
        )}
      >
        <div
          className={cn(
            'relative overflow-hidden',
            isList ? 'h-auto w-48 shrink-0' : 'h-44'
          )}
        >
          <div
            className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url(${event.cover_url || '/images/placeholder.jpg'})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            <Badge variant={statusBadge[event.status] || 'default'} className="capitalize">
              {event.status}
            </Badge>
            {event.is_online && <Badge variant="info">Online</Badge>}
          </div>
          {!isList && (
            <div className="absolute bottom-2 right-2">
              <CountdownTimer targetDate={event.start_at} />
            </div>
          )}
        </div>

        <CardContent className={cn('flex flex-col', isList ? 'flex-1 p-5' : 'p-5')}>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {event.category && (
              <span className="rounded-full bg-gold/10 px-2 py-0.5 text-xs font-medium text-gold-dark">
                {event.category}
              </span>
            )}
            {event.price > 0 && (
              <span className="flex items-center gap-0.5 rounded-full bg-cranberry/10 px-2 py-0.5 text-xs font-medium text-cranberry">
                <IndianRupee className="h-3 w-3" />
                {event.price} {event.currency}
              </span>
            )}
            {event.price === 0 && event.status === 'published' && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                Free
              </span>
            )}
          </div>

          <h3
            className={cn(
              'font-semibold text-navy group-hover:text-cranberry transition-colors line-clamp-1',
              isList ? 'text-lg' : 'text-base'
            )}
          >
            {event.title}
          </h3>

          <div className="mt-auto space-y-1.5 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-gold" />
              <span className="line-clamp-1">{formatEventDateRange(event.start_at, event.end_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-cranberry" />
              <span className="line-clamp-1">{event.location || (event.is_online ? 'Online' : 'TBD')}</span>
            </div>
          </div>

          {isList && (
            <div className="mt-3">
              <CountdownTimer targetDate={event.start_at} />
            </div>
          )}

          {event.registration_open && event.status === 'published' && (
            <Button size="sm" className="mt-4 w-full" asChild>
              <a href={`/events/${event.slug}/register`}>Register Now</a>
            </Button>
          )}

          {!isList && (
            <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
              <a href={`/events/${event.slug}`}>View Details</a>
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
