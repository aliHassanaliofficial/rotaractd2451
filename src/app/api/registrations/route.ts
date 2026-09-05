import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getEventById } from '@/lib/supabase/queries/events'
import { registerForEvent, WorkflowError } from '@/lib/registration-workflow'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const admin = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body = await request.json()
    const event = await getEventById(body?.event_id)
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const result = await registerForEvent({
      supabase,
      admin,
      user,
      event,
      body,
      origin: request.headers.get('origin') || 'https://rotaract2451.org',
    })

    return NextResponse.json(result.registration, { status: 201 })
  } catch (err: any) {
    if (err instanceof WorkflowError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    if (err.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: err.errors }, { status: 400 })
    }
    console.error('Registration error:', err)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}