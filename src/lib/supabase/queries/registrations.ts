import { createClient } from '../client'
import type { Registration } from '@/types/database'

export async function getRegistrationsByEvent(eventId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('registrations')
    .select('*, profile:profile_id(*, club:club_id(*)), transaction_method:transaction_method_id(*)')
    .eq('event_id', eventId)
    .order('registered_at', { ascending: false })

  if (error) throw error
  return data as (Registration & { profile: any })[]
}

export async function createRegistration(regData: {
  event_id: string
  profile_id?: string
  guest_name?: string
  guest_email?: string
  guest_phone?: string
  guest_club?: string
  notes?: string
}) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('registrations')
    .insert(regData)
    .select()
    .single()

  if (error) throw error
  return data as Registration
}

export async function updateRegistrationStatus(id: string, status: Registration['status']) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('registrations')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Registration
}

export async function checkInAttendee(id: string, checkedInBy: string) {
  const supabase = createClient()
  const { data: existing } = await supabase
    .from('registrations')
    .select('id, status')
    .eq('id', id)
    .eq('status', 'confirmed')
    .maybeSingle()

  if (!existing) return null

  const { data, error } = await supabase
    .from('registrations')
    .update({
      status: 'attended',
      checked_in_at: new Date().toISOString(),
      checked_in_by: checkedInBy,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Registration
}

export async function getRegistrationByQR(qrCode: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('registrations')
    .select('*, event:event_id(*), profile:profile_id(*)')
    .eq('qr_code', qrCode)
    .single()

  if (error) throw error
  return data as Registration & { event: any; profile: any }
}

export async function getRegistrationById(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('registrations')
    .select('*, event:event_id(*), profile:profile_id(*, club:club_id(*)), transaction_method:transaction_method_id(*)')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Registration & { event: any; profile: any }
}

export async function getUserRegistrations(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('registrations')
    .select('*, event:event_id(*), profile:profile_id(*, club:club_id(*)), transaction_method:transaction_method_id(*)')
    .eq('profile_id', userId)
    .order('registered_at', { ascending: false })

  if (error) throw error
  return data as (Registration & { event: any; profile: any })[]
}

export async function getRegistrationCount(eventId: string) {
  const supabase = createClient()
  const { count, error } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .in('status', ['confirmed', 'attended', 'pending'])

  if (error) throw error
  return count || 0
}
