import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ensureProfile } from '@/lib/supabase/ensure-profile'

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await ensureProfile(user)

    if (result.error) {
      return NextResponse.json({ error: 'Failed to ensure profile' }, { status: 500 })
    }

    return NextResponse.json({ created: result.created })
  } catch (err) {
    console.error('Ensure profile error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
