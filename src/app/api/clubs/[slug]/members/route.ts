import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const admin = createAdminClient()

    const { data: club } = await admin
      .from('clubs')
      .select('id, name, slug')
      .eq('slug', slug)
      .maybeSingle()

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 })
    }

    const { data: members, error } = await admin
      .from('profiles')
      .select('id, full_name, avatar_url, occupation, rotaract_id, role')
      .eq('club_id', club.id)
      .eq('is_active', true)
      .order('full_name')

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
    }

    return NextResponse.json({ club, members })
  } catch (err) {
    console.error('Club members API error:', err)
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
  }
}
