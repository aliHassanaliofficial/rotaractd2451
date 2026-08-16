import { createClient } from '../client'
import type { Profile } from '@/types/database'

export async function getProfile(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*, club:club_id(*)')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Profile & { club: any }
}

export async function updateProfile(id: string, profileData: Partial<Profile>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .update(profileData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Profile
}

export async function getAllUsers() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*, club:club_id(*)')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as (Profile & { club: any })[]
}

export async function updateUserRole(id: string, role: Profile['role']) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Profile
}

export async function deactivateUser(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .update({ is_active: false })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Profile
}

export async function activateUser(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .update({ is_active: true })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Profile
}
