import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

const newsletterSchema = z.object({
  email: z.string().email('Valid email is required'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = newsletterSchema.parse(body)

    const supabase = createClient()
    const { error } = await supabase.from('newsletter_subscribers').insert({ email })

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Already subscribed' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
