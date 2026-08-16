import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const q = searchParams.get('q')

    const supabase = await createServerSupabaseClient()

    const [categoriesResult, itemsResult] = await Promise.all([
      supabase.from('library_categories').select('*').order('sort_order', { ascending: true }),
      (() => {
        let query = supabase
          .from('library_items')
          .select('*, category:category_id(*)')
          .eq('is_published', true)
          .order('created_at', { ascending: false })

        if (category) query = query.eq('category_id', category)
        if (q) {
          const term = `%${q}%`
          query = query.or(`title.ilike.${term},description.ilike.${term}`)
        }

        return query
      })(),
    ])

    if (itemsResult.error) {
      return NextResponse.json({ error: itemsResult.error.message }, { status: 500 })
    }

    return NextResponse.json(
      {
        categories: categoriesResult.data || [],
        items: itemsResult.data || [],
      },
      { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60' } }
    )
  } catch {
    return NextResponse.json({ error: 'Failed to fetch library' }, { status: 500 })
  }
}
