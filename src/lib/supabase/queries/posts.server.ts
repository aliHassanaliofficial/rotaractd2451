import 'server-only'
import { createServerSupabaseClient } from '../server'
import type { Post } from '@/types/database'

export async function getPostBySlug(slug: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('posts')
    .select('*, author:author_id(*), club:club_id(*)')
    .eq('slug', slug)
    .single()

  if (error) throw error
  return data as Post & { author: any; club: any }
}
