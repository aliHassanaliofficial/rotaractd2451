import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAuditLog } from '@/lib/supabase/queries/settings'
import { z } from 'zod'

const checkinSchema = z.object({
  qr_code: z.string().optional(),
  registration_id: z.string().uuid().optional(),
}).refine(data => data.qr_code || data.registration_id, {
  message: 'Either qr_code or registration_id is required',
})

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: eventId } = await params

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = checkinSchema.parse(body)

    let registration

    if (parsed.registration_id) {
      const { data, error } = await supabase
        .from('registrations')
        .select('*, event:event_id(*), profile:profile_id(*)')
        .eq('id', parsed.registration_id)
        .eq('event_id', eventId)
        .single()

      if (error || !data) {
        return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
      }
      registration = data
    } else {
      const { data, error } = await supabase
        .from('registrations')
        .select('*, event:event_id(*), profile:profile_id(*)')
        .eq('qr_code', parsed.qr_code)
        .eq('event_id', eventId)
        .single()

      if (error || !data) {
        return NextResponse.json({ error: 'Registration not found for this event' }, { status: 404 })
      }
      registration = data
    }

    if (registration.status === 'attended') {
      return NextResponse.json({
        error: 'Already checked in',
        checked_in_at: registration.checked_in_at,
        attendee: {
          name: registration.profile?.full_name || registration.guest_name,
          email: registration.profile?.email || registration.guest_email,
          ticket: registration.ticket_number,
        },
      }, { status: 409 })
    }

    const { data: updated, error: updateError } = await supabase
      .from('registrations')
      .update({
        status: 'attended',
        checked_in_at: new Date().toISOString(),
        checked_in_by: user.id,
      })
      .eq('id', registration.id)
      .select('*, event:event_id(*), profile:profile_id(*)')
      .single()

    if (updateError) {
      return NextResponse.json({ error: 'Failed to check in' }, { status: 500 })
    }

    await createAuditLog({
      actor_id: user.id,
      action: 'checkin',
      table_name: 'registrations',
      record_id: registration.id,
      new_data: { status: 'attended', checked_in_at: new Date().toISOString() },
    }).catch(() => {})

    return NextResponse.json({
      message: 'Check-in successful',
      attendee: {
        id: updated.id,
        name: updated.profile?.full_name || updated.guest_name || 'Guest',
        email: updated.profile?.email || updated.guest_email,
        phone: updated.guest_phone,
        club: updated.profile?.club?.name || updated.guest_club,
        ticket: updated.ticket_number,
        checked_in_at: updated.checked_in_at,
      },
    })
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: err.errors }, { status: 400 })
    }
    console.error('Check-in error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
