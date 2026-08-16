import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyAdmins } from '@/lib/supabase/notify-admins'

const PHONE_REGEX = /^01\d{9}$/
const PHONE_ERROR = 'Phone number must be 11 digits starting with 01 (e.g. 01234567890)'

const graduationYearField = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? null : v),
  z.coerce.number().int().min(1900, 'Invalid graduation year').max(2100, 'Invalid graduation year').nullable()
)

const completeProfileSchema = z.object({
  club_id: z.string().min(1, 'Please select your club'),
  avatar_url: z.string().url('Please upload a profile photo'),
  phone: z.string().regex(PHONE_REGEX, PHONE_ERROR),
  occupation: z.string().min(1, 'Occupation is required').max(100),
  graduation_year: graduationYearField,
  bio: z.string().max(500, 'Bio must be under 500 characters').optional(),
  social_linkedin: z.string().url('Please enter a valid LinkedIn URL'),
  social_instagram: z.string().url('Please enter a valid Instagram URL'),
  social_facebook: z.string().url('Please enter a valid Facebook URL'),
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, role, club_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 401 })
    }

    if (profile.role !== 'member') {
      return NextResponse.json(
        { error: 'Only member accounts need to complete their profile' },
        { status: 400 }
      )
    }

    if (profile.club_id) {
      return NextResponse.json(
        { error: 'Your profile already has a club. Contact your club admin to change it.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const parsed = completeProfileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { club_id, avatar_url, phone, occupation, graduation_year, bio, social_linkedin, social_instagram, social_facebook } =
      parsed.data

    const admin = createAdminClient()

    const { data: club } = await admin
      .from('clubs')
      .select('id')
      .eq('id', club_id)
      .eq('is_active', true)
      .maybeSingle()

    if (!club) {
      return NextResponse.json(
        { error: 'Selected club not found' },
        { status: 400 }
      )
    }

    const { error: updateError } = await admin
      .from('profiles')
      .update({
        club_id,
        avatar_url,
        phone,
        occupation,
        graduation_year: graduation_year ?? null,
        bio: bio || null,
        social_linkedin,
        social_instagram,
        social_facebook,
      })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to save your profile' },
        { status: 500 }
      )
    }

    // Membership stays pending/inactive until a club admin approves it.
    await notifyAdmins(admin, {
      full_name: profile.full_name || user.email || 'A new member',
      club_id,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Complete profile error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
