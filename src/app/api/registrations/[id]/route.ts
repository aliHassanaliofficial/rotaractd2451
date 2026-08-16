import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const updateSchema = z.object({
  status: z.enum(['confirmed', 'cancelled']),
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()

    const { data: registration, error: fetchError } = await admin
      .from('registrations')
      .select('id, profile_id, status')
      .eq('id', id)
      .single()

    if (fetchError || !registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('role, club_id')
      .eq('id', user.id)
      .single()

    const role = profile?.role
    const isAdmin = role && ['club_admin', 'district_admin', 'superadmin'].includes(role)
    const isOwner = registration.profile_id === user.id

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await admin
      .from('registrations')
      .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to update registration' }, { status: 500 })
  }
}
