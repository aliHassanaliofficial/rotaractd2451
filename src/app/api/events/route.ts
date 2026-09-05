import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const type = searchParams.get('type')
    const limit = Math.min(Number(searchParams.get('limit')) || 9, 500)
    const offset = Number(searchParams.get('offset')) || 0

    const supabase = await createServerSupabaseClient()
    let query = supabase
      .from('events')
      .select('*, host_club:host_club_id(*)', { count: 'exact' })
      .eq('status', 'published')
      .order('start_at', { ascending: true })

    if (from) query = query.gte('start_at', from)
    if (to) query = query.lte('start_at', to)
    if (category) query = query.eq('category', category)
    if (type === 'event' || type === 'conference') query = query.eq('event_type', type)
    if (status) query = query.in('status', status.split(','))
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      { events: data || [], total: count || 0 },
      { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60' } }
    )
  } catch {
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}
