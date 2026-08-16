'use client'

import { useState } from 'react'
import { LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EventCard } from './EventCard'
import { cn } from '@/lib/utils/cn'
import type { Event } from '@/types/database'

interface EventGridProps {
  events: Event[]
  loading?: boolean
  emptyMessage?: string
}

export function EventGrid({ events, loading = false, emptyMessage = 'No events found.' }: EventGridProps) {
  const [view, setView] = useState<'grid' | 'list'>('grid')

  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="animate-pulse rounded-2xl border border-gray-200">
            <div className="h-44 rounded-t-2xl bg-gray-200" />
            <div className="space-y-3 p-5">
              <div className="h-4 w-20 rounded bg-gray-200" />
              <div className="h-5 w-3/4 rounded bg-gray-200" />
              <div className="h-4 w-full rounded bg-gray-200" />
              <div className="h-4 w-2/3 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-gray-500">{events.length} event{events.length !== 1 ? 's' : ''} found</p>
        <div className="flex gap-1 rounded-2xl border p-1">
          <Button
            variant={view === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setView('grid')}
            className="h-8 w-8 p-0"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setView('list')}
            className="h-8 w-8 p-0"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="py-16 text-center text-gray-500">{emptyMessage}</div>
      ) : (
        <div
          className={cn(
            view === 'grid'
              ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3'
              : 'flex flex-col gap-4'
          )}
        >
          {events.map((event, i) => (
            <EventCard key={event.id} event={event} index={i} view={view} />
          ))}
        </div>
      )}
    </div>
  )
}
