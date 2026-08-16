import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyAdmins } from '@/lib/supabase/notify-admins'

const ipRequests = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const window = 60000
  const maxRequests = 3
  const entry = ipRequests.get(ip)
  if (!entry || now > entry.resetAt) {
    ipRequests.set(ip, { count: 1, resetAt: now + window })
    return true
  }
  if (entry.count >= maxRequests) return false
  entry.count++
  return true
}

const PHONE_REGEX = /^01\d{9}$/
const PHONE_ERROR = 'Phone number must be 11 digits starting with 01 (e.g. 01234567890)'

const graduationYearField = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? null : v),
  z.coerce.number().int().min(1900, 'Invalid graduation year').max(2100, 'Invalid graduation year').nullable()
)

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(2),
  phone: z.string().regex(PHONE_REGEX, PHONE_ERROR),
  club_id: z.string().min(1),
  avatar_url: z.string().url('Please upload a profile photo'),
  occupation: z.string().min(1, 'Occupation is required').max(100),
  graduation_year: graduationYearField,
  social_linkedin: z.string().url('Please enter a valid LinkedIn URL'),
  social_instagram: z.string().url('Please enter a valid Instagram URL'),
  social_facebook: z.string().url('Please enter a valid Facebook URL'),
})

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many signup attempts. Please wait a minute and try again.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const parsed = signupSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const {
      email,
      password,
      full_name,
      phone,
      club_id,
      avatar_url,
      occupation,
      graduation_year,
      social_linkedin,
      social_instagram,
      social_facebook,
    } = parsed.data
    const admin = createAdminClient()

    const { data: userData, error: signUpError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { full_name },
    })

    if (signUpError) {
      const isRateLimit =
        signUpError.status === 429 ||
        signUpError.message?.toLowerCase().includes('rate limit') ||
        signUpError.message?.toLowerCase().includes('rate_limit') ||
        signUpError.message?.toLowerCase().includes('too many requests')
      if (isRateLimit) {
        return NextResponse.json(
          { error: 'Signup is temporarily rate limited. Please try again later.' },
          { status: 429 }
        )
      }
      return NextResponse.json({ error: signUpError.message }, { status: 400 })
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
      phone,
      club_id,
      avatar_url,
      occupation,
      graduation_year: graduation_year ?? null,
      social_linkedin,
      social_instagram,
      social_facebook,
      role: 'member',
      is_active: false,
      is_verified: false,
      approval_status: 'pending',
    })

    if (profileError) {
      return NextResponse.json(
        { error: 'Account created but profile setup failed. Please contact support.' },
        { status: 500 }
      )
    }

    await notifyAdmins(admin, { full_name, club_id })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
