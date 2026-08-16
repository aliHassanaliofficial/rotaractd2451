import { createClient } from '../client'
import type { Club, ClubOfficer, Profile } from '@/types/database'

export async function getActiveClubs(options?: { city?: string; university?: string; limit?: number }) {
  const supabase = createClient()
  let query = supabase.from('clubs').select('*').eq('is_active', true).order('name')

  if (options?.city) query = query.eq('city', options.city)
  if (options?.university) query = query.ilike('university', `%${options.university}%`)
  if (options?.limit) query = query.limit(options.limit)

  const { data, error } = await query
  if (error) throw error
  return data as Club[]
}

export async function getClubById(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clubs')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Club
}

export async function createClub(clubData: Partial<Club>) {
  const supabase = createClient()
  const { data, error } = await supabase.from('clubs').insert(clubData).select().single()
  if (error) throw error
  return data as Club
}

export async function updateClub(id: string, clubData: Partial<Club>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clubs')
    .update(clubData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Club
}

export async function deleteClub(id: string, action: 'inactivate' | 'permanent' = 'inactivate', password?: string) {
  const res = await fetch(`/api/admin/clubs/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action,
      password: action === 'permanent' ? password : undefined,
    }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.error || 'Failed to delete club')
  }
}

export async function getClubOfficers(clubId: string, year?: string) {
  const supabase = createClient()
  let query = supabase
    .from('club_officers')
    .select('*, profile:profile_id(*)')
    .eq('club_id', clubId)

  if (year) query = query.eq('year', year)
  else query = query.eq('is_current', true)

  const { data, error } = await query
  if (error) throw error
  return data as (ClubOfficer & { profile: Profile })[]
}

export async function addClubOfficer(officer: { club_id: string; profile_id: string; position: string; year: string }) {
  const supabase = createClient()
  const { data, error } = await supabase.from('club_officers').insert(officer).select().single()
  if (error) throw error
  return data as ClubOfficer
}

export async function removeClubOfficer(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('club_officers').delete().eq('id', id)
  if (error) throw error
}

export async function getClubMembers(clubId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('club_id', clubId)
    .eq('is_active', true)

  if (error) throw error
  return data as Profile[]
}

export async function getClubsByCity() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clubs')
    .select('city')
    .eq('is_active', true)
    .not('city', 'is', null)

  if (error) throw error
  const cities = [...new Set(data.map((c: any) => c.city))].sort()
  return cities as string[]
}
