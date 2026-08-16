import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tag = searchParams.get('tag')
    const q = searchParams.get('q')
    const limit = Math.min(Number(searchParams.get('limit')) || 9, 50)
    const offset = Number(searchParams.get('offset')) || 0

    const supabase = await createServerSupabaseClient()
    let query = supabase
      .from('posts')
      .select('*, author:author_id(*)', { count: 'exact' })
      .eq('status', 'published')
      .eq('is_announcement', false)
      .order('published_at', { ascending: false })

    if (tag) query = query.contains('tags', [tag])
    if (q) {
      const term = `%${q}%`
      query = query.or(`title.ilike.${term},excerpt.ilike.${term}`)
    }

    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const allTags = [...new Set(data!.flatMap((p) => p.tags || []))].sort() as string[]

    return NextResponse.json(
      { posts: data || [], tags: allTags, total: count || 0 },
      { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60' } }
    )
  } catch {
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}
