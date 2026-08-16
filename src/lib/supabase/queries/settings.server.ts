import { createServerSupabaseClient } from '../server'

export async function getSiteSettingsServer(keys?: string[]) {
  const supabase = await createServerSupabaseClient()
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

export async function getSiteSettingServer(key: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('key', key)
    .maybeSingle()
  if (error || !data) return null
  return data.value as any
}
