import { createClient } from '../client'
import type { Event } from '@/types/database'
import type { EventFormData } from '@/lib/validations/event'

export async function getPublishedEvents(options?: {
  category?: string
  clubId?: string
  status?: string
  limit?: number
  offset?: number
}) {
  const supabase = createClient()
  let query = supabase
    .from('events')
    .select('*, host_club:host_club_id(*)')
    .eq('status', options?.status || 'published')
    .order('start_at', { ascending: true })

  if (options?.category) query = query.eq('category', options.category)
  if (options?.clubId) query = query.eq('host_club_id', options.clubId)
  if (options?.limit) query = query.limit(options.limit)
  if (options?.offset) query = query.range(options.offset, options.offset + (options.limit || 10) - 1)

  const { data, error } = await query
  if (error) throw error
  return data as (Event & { host_club: any })[]
}

export async function getUpcomingEvents(limit: number = 5) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('events')
    .select('*, host_club:host_club_id(*)')
    .eq('status', 'published')
    .gte('start_at', new Date().toISOString())
    .order('start_at', { ascending: true })
    .limit(limit)

  if (error) throw error
  return data as (Event & { host_club: any })[]
}

export async function getEventById(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Event
}

export async function createEvent(eventData: Partial<EventFormData>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('events')
    .insert(eventData)
    .select()
    .single()

  if (error) throw error
  return data as Event
}

export async function updateEvent(id: string, eventData: Partial<EventFormData>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('events')
    .update(eventData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Event
}

export async function deleteEvent(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) throw error
}

export async function getEventsByHostClub(clubId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('host_club_id', clubId)
    .order('start_at', { ascending: false })

  if (error) throw error
  return data as Event[]
}

export async function cloneEvent(id: string) {
  const original = await getEventById(id)
  const { id: _, created_at, updated_at, slug, ...rest } = original
  return createEvent({
    ...rest,
    title: `${rest.title} (Copy)`,
    status: 'draft',
  })
}
