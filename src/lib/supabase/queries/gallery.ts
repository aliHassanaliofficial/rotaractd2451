import { createClient } from '../client'
import type { GalleryAlbum, GalleryMedia } from '@/types/database'

export async function getPublishedAlbums() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('gallery_albums')
    .select('*, event:event_id(*), club:club_id(*), media:gallery_media(count)')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as (GalleryAlbum & { event: any; club: any; media: any })[]
}

export async function getAlbumBySlug(slug: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('gallery_albums')
    .select('*, event:event_id(*), club:club_id(*)')
    .eq('slug', slug)
    .single()

  if (error) throw error
  return data as GalleryAlbum & { event: any; club: any }
}

export async function getAlbumMedia(albumId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('gallery_media')
    .select('*')
    .eq('album_id', albumId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as GalleryMedia[]
}

export async function createAlbum(albumData: Partial<GalleryAlbum>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('gallery_albums')
    .insert(albumData)
    .select()
    .single()

  if (error) throw error
  return data as GalleryAlbum
}

export async function updateAlbum(id: string, albumData: Partial<GalleryAlbum>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('gallery_albums')
    .update(albumData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as GalleryAlbum
}

export async function deleteAlbum(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('gallery_albums').delete().eq('id', id)
  if (error) throw error
}

export async function addMedia(mediaData: Partial<GalleryMedia>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('gallery_media')
    .insert(mediaData)
    .select()
    .single()

  if (error) throw error
  return data as GalleryMedia
}

export async function addMultipleMedia(mediaItems: Partial<GalleryMedia>[]) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('gallery_media')
    .insert(mediaItems)
    .select()

  if (error) throw error
  return data as GalleryMedia[]
}

export async function deleteMedia(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('gallery_media').delete().eq('id', id)
  if (error) throw error
}

export async function updateMediaOrder(items: { id: string; sort_order: number }[]) {
  const supabase = createClient()
  for (const item of items) {
    await supabase.from('gallery_media').update({ sort_order: item.sort_order }).eq('id', item.id)
  }
}

export async function getAlbumsByEvent(eventId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('gallery_albums')
    .select('*')
    .eq('event_id', eventId)
    .eq('is_published', true)

  if (error) throw error
  return data as GalleryAlbum[]
}
