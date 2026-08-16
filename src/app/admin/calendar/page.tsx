'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CalendarView } from '@/components/calendar/CalendarView'
import type { CalendarEventItem } from '@/components/calendar/EventDetailDialog'
import { toast } from 'sonner'

export default function AdminCalendarPage() {
  const [events, setEvents] = useState<CalendarEventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)
  const supabase = useMemo(() => createClient(), [])
  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*, host_club:host_club_id(name, slug, city, university)')
          .order('start_at', { ascending: true })
        if (cancelled) return
        if (error) throw error
        setEvents(data || [])
      } catch {
        if (!cancelled) toast.error('Failed to load events')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [supabase, reloadKey])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-navy">District Calendar</h1>
      <CalendarView events={events} mode="admin" loading={loading} onReload={reload} />
    </div>
  )
}
