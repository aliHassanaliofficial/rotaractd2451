import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

const deleteSchema = z.object({
  action: z.enum(['inactivate', 'permanent']).default('inactivate'),
  password: z.string().optional(),
})

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => null)
    const parsed = deleteSchema.safeParse(body ?? {})
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()

    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['district_admin', 'superadmin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: club, error: clubError } = await admin
      .from('clubs')
      .select('id')
      .eq('id', id)
      .single()

    if (clubError || !club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 })
    }

    if (parsed.data.action === 'inactivate') {
      const { error } = await admin.from('clubs').update({ is_active: false }).eq('id', id)
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, action: 'inactivate' })
    }

    if (!user.email || !parsed.data.password) {
      return NextResponse.json(
        { error: 'Your password is required to permanently delete a club' },
        { status: 400 }
      )
    }

    const verifyClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { error: verifyError } = await verifyClient.auth.signInWithPassword({
      email: user.email,
      password: parsed.data.password,
    })
    if (verifyError) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
    }

    const { data: events } = await admin.from('events').select('id').eq('host_club_id', id)
    const eventIds = (events ?? []).map((e) => e.id)

    if (eventIds.length > 0) {
      const { error: regError } = await admin.from('registrations').delete().in('event_id', eventIds)
      if (regError) return NextResponse.json({ error: regError.message }, { status: 500 })

      const { error: albumsError } = await admin
        .from('gallery_albums')
        .delete()
        .or(`club_id.eq.${id},event_id.in.(${eventIds.join(',')})`)
      if (albumsError) return NextResponse.json({ error: albumsError.message }, { status: 500 })

      const { error: eventsError } = await admin.from('events').delete().in('id', eventIds)
      if (eventsError) return NextResponse.json({ error: eventsError.message }, { status: 500 })
    } else {
      const { error: albumsError } = await admin.from('gallery_albums').delete().eq('club_id', id)
      if (albumsError) return NextResponse.json({ error: albumsError.message }, { status: 500 })
    }

    const { error: postsError } = await admin.from('posts').delete().eq('club_id', id)
    if (postsError) return NextResponse.json({ error: postsError.message }, { status: 500 })

    const { error: membersError } = await admin
      .from('profiles')
      .update({ club_id: null })
      .eq('club_id', id)
    if (membersError) return NextResponse.json({ error: membersError.message }, { status: 500 })

    const { error: finalError } = await admin.from('clubs').delete().eq('id', id)
    if (finalError) return NextResponse.json({ error: finalError.message }, { status: 500 })

    return NextResponse.json({ success: true, action: 'permanent' })
  } catch {
    return NextResponse.json({ error: 'Failed to delete club' }, { status: 500 })
  }
}
