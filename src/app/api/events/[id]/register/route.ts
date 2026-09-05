import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getEventById } from '@/lib/supabase/queries/events'
import { registerForEvent, WorkflowError } from '@/lib/registration-workflow'

const ipRequests = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const window = 60000
  const maxRequests = 5
  const entry = ipRequests.get(ip)
  if (!entry || now > entry.resetAt) {
    ipRequests.set(ip, { count: 1, resetAt: now + window })
    return true
  }
  if (entry.count >= maxRequests) return false
  entry.count++
  return true
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }

    const supabase = await createServerSupabaseClient()
    const admin = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()

    const event = await getEventById(id)
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const result = await registerForEvent({
      supabase,
      admin,
      user,
      event,
      body: await request.json(),
      origin: request.headers.get('origin') || 'https://rotaract2451.org',
    })

    return NextResponse.json(
      {
        ...result.registration,
        qr_url: result.qr_url,
        qr_payload: result.qr_payload,
      },
      { status: 201 }
    )
  } catch (err: any) {
    if (err instanceof WorkflowError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    if (err.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: err.errors }, { status: 400 })
    }
    console.error('Registration error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}