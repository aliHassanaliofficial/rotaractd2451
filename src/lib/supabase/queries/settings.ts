import { createClient } from '../client'
import type { SiteSetting, HistoryEntry, DistrictLeadership, ContactMessage, Notification, AuditLog } from '@/types/database'

export async function getSiteSetting(key: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('key', key)
    .single()

  if (error) return null
  return data as SiteSetting
}

export async function getSiteSettings(keys?: string[]) {
  const supabase = createClient()
  let query = supabase.from('site_settings').select('*')
  if (keys?.length) query = query.in('key', keys)
  const { data, error } = await query
  if (error) return null

  const record: Record<string, any> = {}
  for (const s of data || []) {
    record[s.key] = s.value
  }
  return record
}

export async function updateSiteSetting(key: string, value: any, userId?: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('site_settings')
    .upsert({ key, value, updated_by: userId, updated_at: new Date().toISOString() })
    .select()
    .single()

  if (error) throw error
  return data as SiteSetting
}

export async function getHistoryEntries() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('history_entries')
    .select('*')
    .order('year', { ascending: false })
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data as HistoryEntry[]
}

export async function createHistoryEntry(entry: Partial<HistoryEntry>) {
  const supabase = createClient()
  const { data, error } = await supabase.from('history_entries').insert(entry).select().single()
  if (error) throw error
  return data as HistoryEntry
}

export async function updateHistoryEntry(id: string, entry: Partial<HistoryEntry>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('history_entries')
    .update(entry)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as HistoryEntry
}

export async function deleteHistoryEntry(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('history_entries').delete().eq('id', id)
  if (error) throw error
}

export async function getCurrentLeadership() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('district_leadership')
    .select('*, profile:profile_id(*)')
    .eq('is_current', true)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data as (DistrictLeadership & { profile: any })[]
}

export async function getLeadershipByYear(year: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('district_leadership')
    .select('*, profile:profile_id(*)')
    .eq('year', year)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data as (DistrictLeadership & { profile: any })[]
}

export async function createLeadershipEntry(entry: Partial<DistrictLeadership>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('district_leadership')
    .insert(entry)
    .select()
    .single()

  if (error) throw error
  return data as DistrictLeadership
}

export async function updateLeadershipEntry(id: string, entry: Partial<DistrictLeadership>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('district_leadership')
    .update(entry)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as DistrictLeadership
}

export async function deleteLeadershipEntry(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('district_leadership').delete().eq('id', id)
  if (error) throw error
}

export async function getContactMessages() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as ContactMessage[]
}

export async function createContactMessage(msg: { name: string; email: string; subject?: string; message: string }) {
  const supabase = createClient()
  const { error } = await supabase.from('contact_messages').insert(msg)
  if (error) throw error
}

export async function markMessageRead(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('contact_messages').update({ is_read: true }).eq('id', id)
  if (error) throw error
}

export async function getUserNotifications(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('profile_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return data as Notification[]
}

export async function markNotificationRead(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  if (error) throw error
}

export async function createNotification(notification: { profile_id: string; title: string; message?: string; link?: string }) {
  const supabase = createClient()
  const { data, error } = await supabase.from('notifications').insert(notification).select().single()
  if (error) throw error
  return data as Notification
}

export async function getAuditLogs(options?: { limit?: number; actorId?: string; tableName?: string }) {
  const supabase = createClient()
  let query = supabase
    .from('audit_logs')
    .select('*, actor:actor_id(*)')
    .order('created_at', { ascending: false })

  if (options?.actorId) query = query.eq('actor_id', options.actorId)
  if (options?.tableName) query = query.eq('table_name', options.tableName)
  if (options?.limit) query = query.limit(options.limit)

  const { data, error } = await query
  if (error) throw error
  return data as (AuditLog & { actor: any })[]
}

export async function createAuditLog(log: {
  actor_id: string
  action: string
  table_name?: string
  record_id?: string
  old_data?: any
  new_data?: any
  ip_address?: string
}) {
  const supabase = createClient()
  const { error } = await supabase.from('audit_logs').insert(log)
  if (error) throw error
}
