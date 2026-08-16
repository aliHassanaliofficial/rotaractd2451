'use client'

import { useState, useEffect } from 'react'
import { CalendarView } from '@/components/calendar/CalendarView'
import type { CalendarEventItem } from '@/components/calendar/EventDetailDialog'

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEventItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const from = new Date()
        from.setFullYear(from.getFullYear() - 1)
        const to = new Date()
        to.setFullYear(to.getFullYear() + 1)

        const params = new URLSearchParams()
        params.set('limit', '500')
        params.set('from', from.toISOString())
        params.set('to', to.toISOString())

        const res = await fetch(`/api/events?${params.toString()}`)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        if (cancelled) return
        setEvents(data.events || [])
      } catch {
        if (!cancelled) setEvents([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="flex flex-col">
      <section className="bg-gradient-to-br from-navy via-[#0a4a82] to-cranberry/50 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">District Calendar</h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-300">
            Events, projects, and meetings across the district - browse by month, week, or list.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <CalendarView events={events} loading={loading} />
        </div>
      </section>
    </div>
  )
}
