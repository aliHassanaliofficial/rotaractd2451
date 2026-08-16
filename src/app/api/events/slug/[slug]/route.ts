import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('events')
      .select('*, host_club:host_club_id(*), organizer:organizer_id(*)')
      .eq('slug', slug)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60' },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 })
  }
}
