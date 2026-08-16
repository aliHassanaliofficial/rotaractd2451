import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const downloadSchema = z.object({
  id: z.string().uuid(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = downloadSchema.parse(body)

    const admin = createAdminClient()

    const { data: item } = await admin
      .from('library_items')
      .select('downloads')
      .eq('id', parsed.id)
      .single()

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    const { error } = await admin
      .from('library_items')
      .update({ downloads: (item.downloads || 0) + 1 })
      .eq('id', parsed.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: err.errors }, { status: 400 })
    }
    console.error('Library download error:', err)
    return NextResponse.json({ error: 'Failed to record download' }, { status: 500 })
  }
}
