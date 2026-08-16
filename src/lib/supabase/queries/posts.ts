import { createClient } from '../client'
import type { Post } from '@/types/database'

export async function getPublishedPosts(options?: { limit?: number; offset?: number; tag?: string }) {
  const supabase = createClient()
  let query = supabase
    .from('posts')
    .select('*, author:author_id(*)')
    .eq('status', 'published')
    .eq('is_announcement', false)
    .order('published_at', { ascending: false })

  if (options?.tag) query = query.contains('tags', [options.tag])
  if (options?.limit) query = query.limit(options.limit)
  if (options?.offset) query = query.range(options.offset, options.offset + (options.limit || 10) - 1)

  const { data, error } = await query
  if (error) throw error
  return data as (Post & { author: any })[]
}

export async function createPost(postData: Partial<Post>) {
  const supabase = createClient()
  const { data, error } = await supabase.from('posts').insert(postData).select().single()
  if (error) throw error
  return data as Post
}

export async function updatePost(id: string, postData: Partial<Post>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('posts')
    .update(postData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Post
}

export async function deletePost(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('posts').delete().eq('id', id)
  if (error) throw error
}

export async function incrementPostViews(id: string) {
  const supabase = createClient()
  await supabase.rpc('increment_post_views', { post_id: id })
}

export async function getPinnedAnnouncements() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('is_announcement', true)
    .eq('status', 'published')
    .eq('is_pinned', true)
    .order('announcement_priority', { ascending: true })
    .order('published_at', { ascending: false })

  if (error) throw error
  return data as Post[]
}

export async function getAllAnnouncements() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('is_announcement', true)
    .eq('status', 'published')
    .order('is_pinned', { ascending: false })
    .order('announcement_priority', { ascending: true })
    .order('published_at', { ascending: false })

  if (error) throw error
  return data as Post[]
}
