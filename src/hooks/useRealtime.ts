'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRegistrationsRealtime(eventId: string, onUpdate: () => void) {
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`registrations:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'registrations',
          filter: `event_id=eq.${eventId}`,
        },
        onUpdate
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId])
}

export function useNotificationsRealtime(userId: string | undefined, onUpdate: () => void) {
  const supabase = createClient()

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `profile_id=eq.${userId}`,
        },
        onUpdate
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])
}
