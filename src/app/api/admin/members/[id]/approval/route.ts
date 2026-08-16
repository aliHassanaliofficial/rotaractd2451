import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const approvalSchema = z.object({
  status: z.enum(['approved', 'rejected']),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: actor } = await supabase
      .from('profiles')
      .select('id, role, club_id')
      .eq('id', user.id)
      .single()

    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: target } = await supabase
      .from('profiles')
      .select('id, full_name, club_id, role')
      .eq('id', id)
      .single()

    if (!target) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    if (target.role !== 'member') {
      return NextResponse.json(
        { error: 'Only member accounts can be approved' },
        { status: 400 }
      )
    }

    const isDistrict = ['district_admin', 'superadmin'].includes(actor.role)

    let isAssignedClubAdmin = false
    if (actor.role === 'club_admin') {
      const { data: assignments } = await supabase
        .from('club_admins')
        .select('club_id')
        .eq('profile_id', actor.id)

      const assigned = new Set<string>()
      if (actor.club_id) assigned.add(actor.club_id)
      for (const a of assignments || []) assigned.add(a.club_id)
      isAssignedClubAdmin = !!target.club_id && assigned.has(target.club_id)
    }

    if (!isDistrict && !isAssignedClubAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = approvalSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const status = parsed.data.status
    const admin = createAdminClient()

    const { error } = await admin
      .from('profiles')
      .update({
        approval_status: status,
        reviewed_by: actor.id,
        reviewed_at: new Date().toISOString(),
        is_active: status === 'approved',
      })
      .eq('id', target.id)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update approval status' },
        { status: 500 }
      )
    }

    try {
      await admin.from('notifications').insert({
        profile_id: target.id,
        title: status === 'approved' ? 'Membership approved' : 'Membership not approved',
        message:
          status === 'approved'
            ? 'Welcome! Your Rotaract membership is now active.'
            : 'Your membership request was not approved. Please contact your club admin if you believe this is a mistake.',
        link: '/profile',
      })
    } catch (notifErr) {
      console.error('Failed to notify member about approval:', notifErr)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Member approval error:', err)
    return NextResponse.json({ error: 'Failed to update approval status' }, { status: 500 })
  }
}
