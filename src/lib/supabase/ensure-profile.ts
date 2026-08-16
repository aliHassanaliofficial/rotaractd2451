import { createAdminClient } from './admin'
import type { User } from '@supabase/supabase-js'

/**
 * Ensures a `profiles` row exists for an authenticated user. Auth users created
 * through email signup or OAuth (e.g. Google) can end up without a profiles row
 * if the creation step failed or the row was deleted. Admin/member listings
 * query `profiles`, so such users are invisible. This creates the missing row.
 *
 * OAuth users are created as pending + inactive: they must complete their
 * profile (club + details) and be approved by a club admin before their
 * membership activates.
 */
export async function ensureProfile(user: User) {
  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (existing) {
    return { created: false }
  }

  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'Member'

  const payload = {
    id: user.id,
    full_name: fullName,
    email: user.email || '',
    avatar_url:
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      null,
    role: 'member',
    is_active: false,
    is_verified: false,
    approval_status: 'pending',
  }

  let { error } = await admin.from('profiles').insert(payload)

  // Before the approval migration is applied the column doesn't exist yet;
  // fall back to creating the row without it so sign-in never regresses.
  if (
    error &&
    (error.code === '42703' || /does not exist/i.test(error.message || ''))
  ) {
    const { approval_status, ...fallback } = payload
    const retry = await admin.from('profiles').insert(fallback)
    error = retry.error
  }

  if (error) {
    return { created: false, error }
  }

  return { created: true }
}
