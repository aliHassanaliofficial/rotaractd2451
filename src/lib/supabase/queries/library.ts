import { createClient } from '../client'
import type { LibraryCategory, LibraryItem } from '@/types/database'

export async function getLibraryCategories() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('library_categories')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data as LibraryCategory[]
}

export async function getPublishedLibraryItems(categoryId?: string) {
  const supabase = createClient()
  let query = supabase
    .from('library_items')
    .select('*, category:category_id(*)')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (categoryId) query = query.eq('category_id', categoryId)

  const { data, error } = await query
  if (error) throw error
  return data as (LibraryItem & { category: LibraryCategory })[]
}

export async function createLibraryItem(itemData: Partial<LibraryItem>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('library_items')
    .insert(itemData)
    .select()
    .single()

  if (error) throw error
  return data as LibraryItem
}

export async function updateLibraryItem(id: string, itemData: Partial<LibraryItem>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('library_items')
    .update(itemData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as LibraryItem
}

export async function deleteLibraryItem(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('library_items').delete().eq('id', id)
  if (error) throw error
}

export async function incrementDownloadCount(id: string) {
  const supabase = createClient()
  await supabase.rpc('increment_download_count', { item_id: id })
}
