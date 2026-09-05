import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { decodeQRPayload } from '@/lib/utils/qr'
import { z } from 'zod'

const verifySchema = z.object({
  payload: z.string().min(1, 'Payload is required'),
})

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = verifySchema.parse(body)

    const decoded = decodeQRPayload(parsed.payload)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid QR code format' }, { status: 400 })
    }

    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select('*, event:event_id(*), profile:profile_id(*)')
      .eq('id', decoded.id)
      .single()

    if (regError || !registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    if (registration.event_id !== decoded.event) {
      return NextResponse.json({ error: 'QR code does not match this event' }, { status: 400 })
    }

    if (registration.ticket_number !== decoded.ticket) {
      return NextResponse.json({ error: 'Ticket number mismatch' }, { status: 400 })
    }

    const claimable = ['confirmed', 'attended'].includes(registration.status)

    return NextResponse.json({
      valid: claimable,
      status_note:
        registration.status === 'pending'
          ? 'Registration is awaiting payment approval'
          : registration.status === 'declined'
            ? 'Registration was declined'
            : registration.status === 'cancelled'
              ? 'Registration was cancelled'
              : undefined,
      registration: {
        id: registration.id,
        ticket_number: registration.ticket_number,
        status: registration.status,
        checked_in_at: registration.checked_in_at,
      },
      attendee: {
        name: registration.profile?.full_name || registration.guest_name || 'Guest',
        email: registration.profile?.email || registration.guest_email,
      },
      event: {
        id: registration.event.id,
        title: registration.event.title,
        slug: registration.event.slug,
        start_at: registration.event.start_at,
        location: registration.event.location,
      },
    })
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: err.errors }, { status: 400 })
    }
    console.error('QR verify error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
