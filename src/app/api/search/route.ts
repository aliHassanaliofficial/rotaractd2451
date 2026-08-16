import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'

const searchSchema = z.object({
  q: z.string().min(1, 'Search term is required').max(100),
  type: z.enum(['events', 'posts', 'clubs', 'library']).optional(),
})

const LIMIT_PER_TYPE = 5

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const parsed = searchSchema.parse({
      q: searchParams.get('q'),
      type: searchParams.get('type') || undefined,
    })

    const supabase = await createServerSupabaseClient()
    const term = parsed.q.trim()
    const searchTerm = `%${term}%`
    const tsQuery = term.split(/\s+/).filter(Boolean).map(w => w + ':*').join(' & ')

    const results: Record<string, any[]> = {}

    const typesToSearch = parsed.type ? [parsed.type] : ['events', 'posts', 'clubs', 'library']

    for (const searchType of typesToSearch) {
      switch (searchType) {
        case 'events': {
          const { data, error } = await supabase
            .from('events')
            .select('*, host_club:host_club_id(name, slug)')
            .eq('status', 'published')
            .or(`title.ilike.${searchTerm},description.ilike.${searchTerm},location.ilike.${searchTerm},tags.cs.{${term}}`)
            .gte('start_at', new Date().toISOString())
            .order('start_at', { ascending: true })
            .limit(LIMIT_PER_TYPE)

          if (!error) {
            results.events = (data || []).map(e => ({
              ...e,
              _type: 'event',
              _relevance: calculateRelevance(e, term),
            }))
          }
          break
        }

        case 'posts': {
          const { data, error } = await supabase
            .from('posts')
            .select('*, author:author_id(full_name, avatar_url), club:club_id(name, slug)')
            .eq('status', 'published')
            .or(`title.ilike.${searchTerm},excerpt.ilike.${searchTerm},tags.cs.{${term}}`)
            .order('published_at', { ascending: false })
            .limit(LIMIT_PER_TYPE)

          if (!error) {
            results.posts = (data || []).map(p => ({
              ...p,
              _type: 'post',
              _relevance: calculateRelevance(p, term),
            }))
          }
          break
        }

        case 'clubs': {
          const { data, error } = await supabase
            .from('clubs')
            .select('*')
            .eq('is_active', true)
            .or(`name.ilike.${searchTerm},description.ilike.${searchTerm},university.ilike.${searchTerm},city.ilike.${searchTerm}`)
            .order('name')
            .limit(LIMIT_PER_TYPE)

          if (!error) {
            results.clubs = (data || []).map(c => ({
              ...c,
              _type: 'club',
              _relevance: calculateRelevance(c, term),
            }))
          }
          break
        }

        case 'library': {
          const { data, error } = await supabase
            .from('library_items')
            .select('*, category:category_id(name)')
            .eq('is_published', true)
            .or(`title.ilike.${searchTerm},description.ilike.${searchTerm},tags.cs.{${term}}`)
            .order('created_at', { ascending: false })
            .limit(LIMIT_PER_TYPE)

          if (!error) {
            results.library = (data || []).map(l => ({
              ...l,
              _type: 'library',
              _relevance: calculateRelevance(l, term),
            }))
          }
          break
        }
      }
    }

    for (const key of Object.keys(results)) {
      results[key].sort((a: any, b: any) => b._relevance - a._relevance)
    }

    return NextResponse.json({
      query: term,
      results,
      total: Object.values(results).reduce((sum, arr) => sum + arr.length, 0),
    })
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: err.errors }, { status: 400 })
    }
    console.error('Search error:', err)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}

function calculateRelevance(item: any, term: string): number {
  let score = 0
  const lower = term.toLowerCase()
  const title = (item.title || item.name || '').toLowerCase()
  const description = (item.description || '').toLowerCase()

  if (title === lower) score += 100
  else if (title.startsWith(lower)) score += 80
  else if (title.includes(lower)) score += 60

  if (description.includes(lower)) score += 30

  if (item.tags && Array.isArray(item.tags)) {
    const tagMatch = item.tags.some((t: string) => t.toLowerCase().includes(lower))
    if (tagMatch) score += 40
  }

  if (item.university?.toLowerCase().includes(lower)) score += 20
  if (item.city?.toLowerCase().includes(lower)) score += 20
  if (item.location?.toLowerCase().includes(lower)) score += 20
  if (item.excerpt?.toLowerCase().includes(lower)) score += 20

  return score
}
