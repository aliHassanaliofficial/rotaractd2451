import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const university = searchParams.get('university')
    const sort = searchParams.get('sort') || 'name'

    const supabase = await createServerSupabaseClient()
    let query = supabase.from('clubs').select('*').eq('is_active', true)

    if (city) query = query.eq('city', city)
    if (university) query = query.ilike('university', `%${university}%`)

    if (sort === 'name') query = query.order('name')
    else if (sort === 'members') query = query.order('member_count', { ascending: false })
    else if (sort === 'newest') query = query.order('created_at', { ascending: false })
    else query = query.order('name')

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const cities = [...new Set(data!.map((c) => c.city).filter(Boolean))].sort() as string[]
    const universities = [...new Set(data!.map((c) => c.university).filter(Boolean))].sort() as string[]

    return NextResponse.json(
      { clubs: data || [], cities, universities },
      { headers: { 'Cache-Control': 'public, max-age=120, s-maxage=120' } }
    )
  } catch {
    return NextResponse.json({ error: 'Failed to fetch clubs' }, { status: 500 })
  }
}
