import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const createClubAdminSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  club_id: z.string().min(1, 'Please select a club'),
})

export async function POST(request: Request) {
  try {
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
      .select('role')
      .eq('id', user.id)
      .single()

    if (!actor || !['district_admin', 'superadmin'].includes(actor.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Only district admins and super admins can create club admin accounts' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = createClubAdminSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { full_name, email, password, club_id } = parsed.data
    const admin = createAdminClient()

    const { data: userData, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    })

    if (createError) {
      return NextResponse.json(
        { error: createError.message },
        { status: 400 }
      )
    }

    const userId = userData.user?.id
    if (!userId) {
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      )
    }

    const { error: profileError } = await admin.from('profiles').insert({
      id: userId,
      full_name,
      email,
      club_id,
      role: 'club_admin',
      is_active: true,
      is_verified: true,
      approval_status: 'approved',
    })

    if (profileError) {
      return NextResponse.json(
        { error: 'Account created but profile setup failed. Please contact support.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    console.error('Create club admin error:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
