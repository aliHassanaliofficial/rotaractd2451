import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('redirect_to') ?? searchParams.get('redirect') ?? '/'

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      const user = data.user

      // Google/SSO users don't go through /api/auth/signup, so ensure a
      // profiles row exists (profiles.id = auth.users.id). Without it, every
      // .single() profile query returns PGRST116 -> 406.
      const admin = createAdminClient()
      const { data: existing } = await admin
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (!existing) {
        const fullName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0] ||
          'Member'

        await admin.from('profiles').insert({
          id: user.id,
          full_name: fullName,
          email: user.email || '',
          role: 'member',
          is_active: true,
          is_verified: false,
        })
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
