import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

type AlbumRow = {
  id: string
  title: string
  slug: string
  description: string | null
  cover_url: string | null
  created_at: string
  event: { title: string } | null
  club: { name: string } | null
  media: { count: number }[]
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const filterEvent = searchParams.get('event') || ''
    const filterClub = searchParams.get('club') || ''
    const filterYear = searchParams.get('year') || ''

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('gallery_albums')
      .select('*, event:event_id(*), club:club_id(*), media:gallery_media(count)')
      .eq('is_published', true)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const albums = (data as AlbumRow[] | null || []).filter((album) => {
      if (filterEvent && album.event?.title !== filterEvent) return false
      if (filterClub && album.club?.name !== filterClub) return false
      if (filterYear && new Date(album.created_at).getFullYear().toString() !== filterYear) return false
      return true
    })

    const events = [...new Set((data as AlbumRow[] | null || []).map((a) => a.event?.title).filter((v): v is string => Boolean(v)))]
    const clubs = [...new Set((data as AlbumRow[] | null || []).map((a) => a.club?.name).filter((v): v is string => Boolean(v)))]
    const years = [...new Set((data as AlbumRow[] | null || []).map((a) => new Date(a.created_at).getFullYear().toString()).filter(Boolean))]

    return NextResponse.json(
      { albums, events, clubs, years },
      { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60' } }
    )
  } catch {
    return NextResponse.json({ error: 'Failed to fetch albums' }, { status: 500 })
  }
}
