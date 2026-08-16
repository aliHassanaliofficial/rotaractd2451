import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

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

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(2),
  phone: z.string().optional(),
  club_id: z.string().min(1),
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

    const { email, password, full_name, phone, club_id } = parsed.data
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
      phone: phone || null,
      club_id,
      role: 'member',
      is_active: true,
      is_verified: false,
    })

    if (profileError) {
      return NextResponse.json(
        { error: 'Account created but profile setup failed. Please contact support.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
