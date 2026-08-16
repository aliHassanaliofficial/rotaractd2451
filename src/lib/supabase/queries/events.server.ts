import 'server-only'
import { createServerSupabaseClient } from '../server'
import type { Event } from '@/types/database'

export async function getEventBySlug(slug: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('events')
    .select('*, host_club:host_club_id(*), organizer:organizer_id(*)')
    .eq('slug', slug)
    .single()

  if (error) throw error
  return data as Event & { host_club: any; organizer: any }
}
