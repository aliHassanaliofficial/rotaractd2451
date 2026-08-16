import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ensureProfile } from '@/lib/supabase/ensure-profile'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('redirect_to') ?? searchParams.get('redirect') ?? '/'

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      // Google/SSO users don't go through /api/auth/signup, so ensure a
      // profiles row exists (profiles.id = auth.users.id). Without it, every
      // .single() profile query returns PGRST116 -> 406 and the user is
      // invisible in admin/member listings.
      const result = await ensureProfile(data.user)
      if (result.error) {
        console.error('Failed to create profile for OAuth user:', result.error)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
