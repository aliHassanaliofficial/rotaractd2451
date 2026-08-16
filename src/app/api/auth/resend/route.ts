import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const ipRequests = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const window = 60000
  const maxRequests = 2
  const entry = ipRequests.get(ip)
  if (!entry || now > entry.resetAt) {
    ipRequests.set(ip, { count: 1, resetAt: now + window })
    return true
  }
  if (entry.count >= maxRequests) return false
  entry.count++
  return true
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait before resending.' },
        { status: 429 }
      )
    }

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user?.email) {
      return NextResponse.json(
        { error: 'Unable to resend verification. Please sign up again.' },
        { status: 400 }
      )
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
      options: {
        emailRedirectTo: `${new URL(request.url).origin}/auth/callback`,
      },
    })

    if (error) {
      const isRateLimit =
        error.status === 429 ||
        error.message?.toLowerCase().includes('rate limit')
      if (isRateLimit) {
        return NextResponse.json(
          { error: 'Verification emails are temporarily rate limited. Please try again later.' },
          { status: 429 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
