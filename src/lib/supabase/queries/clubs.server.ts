import 'server-only'
import { createServerSupabaseClient } from '../server'
import type { Club } from '@/types/database'

export async function getClubBySlug(slug: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('clubs')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) throw error
  return data as Club
}
