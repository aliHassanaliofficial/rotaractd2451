import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const guestSchema = z.object({
  event_id: z.string().uuid(),
  guest_name: z.string().min(2),
  guest_email: z.string().email(),
  guest_phone: z.string().optional(),
  guest_club: z.string().optional(),
  notes: z.string().optional(),
})

const memberSchema = z.object({
  event_id: z.string().uuid(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    const admin = createAdminClient()

    const { data: flagsRow } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'feature_flags')
      .maybeSingle()
    const flags = flagsRow?.value as { registration_open?: boolean } | null
    if (flags?.registration_open === false) {
      return NextResponse.json({ error: 'Registration is currently closed by the district' }, { status: 403 })
    }

    if (user) {
      const parsed = memberSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
      }

      const { data: existing } = await admin
        .from('registrations')
        .select('id')
        .eq('event_id', parsed.data.event_id)
        .eq('profile_id', user.id)
        .maybeSingle()

      if (existing) {
        return NextResponse.json({ error: 'You are already registered for this event' }, { status: 409 })
      }

      const { data, error } = await admin
        .from('registrations')
        .insert({
          event_id: parsed.data.event_id,
          profile_id: user.id,
          status: 'confirmed',
        })
        .select('*, event:event_id(*)')
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(data, { status: 201 })
    }

    const parsed = guestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { data: event } = await admin
      .from('events')
      .select('registration_type')
      .eq('id', parsed.data.event_id)
      .single()

    if (event?.registration_type === 'members_only') {
      return NextResponse.json({ error: 'This event is for members only. Sign in to register.' }, { status: 403 })
    }

    const { data, error } = await admin
      .from('registrations')
      .insert({
        event_id: parsed.data.event_id,
        guest_name: parsed.data.guest_name,
        guest_email: parsed.data.guest_email,
        guest_phone: parsed.data.guest_phone || null,
        guest_club: parsed.data.guest_club || null,
        notes: parsed.data.notes || null,
        status: 'confirmed',
      })
      .select('*, event:event_id(*)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('Registration error:', err)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}