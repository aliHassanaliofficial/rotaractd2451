'use client'

import { Loader2, Clock, ShieldAlert } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { CompleteProfileForm } from '@/components/member/CompleteProfileForm'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

/**
 * Blocks members whose profile is incomplete or pending from exploring the
 * site. Google sign-in users have no club until they complete their profile;
 * manual sign-ups stay pending until a club admin approves them. Admins and
 * logged-out visitors pass through.
 */
export function MembershipGate({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cranberry" />
      </div>
    )
  }

  if (!user) {
    return <>{children}</>
  }

  const role = profile?.role

  if (role && role !== 'member') {
    return <>{children}</>
  }

  if (role === 'member') {
    const supabase = createClient()

    // OAuth (e.g. Google) members start with no club — they must pick one and
    // finish their details before their membership can be approved.
    if (!profile?.club_id) {
      return (
        <CompleteProfileForm
          fullName={profile?.full_name || (user.user_metadata?.full_name as string | undefined)}
          initialAvatar={profile?.avatar_url || null}
        />
      )
    }

    const approvalStatus = profile?.approval_status ?? 'approved'
    const rejected = approvalStatus === 'rejected'

    if (rejected) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <h2 className="text-xl font-semibold text-navy">Membership not approved</h2>
            <p className="mt-2 text-sm text-gray-500">
              Your membership request was not approved. Please contact your club admin or the
              district team if you believe this is a mistake.
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={async () => {
                await supabase.auth.signOut()
                window.location.href = '/'
              }}
            >
              Back to Home
            </Button>
          </div>
        </div>
      )
    }

    if (approvalStatus !== 'approved') {
      return (
        <div className="flex min-h-[60vh] items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <Clock className="mx-auto mb-4 h-12 w-12 text-amber-500" />
            <h2 className="text-xl font-semibold text-navy">Membership pending approval</h2>
            <p className="mt-2 text-sm text-gray-500">
              Your account is awaiting confirmation by your club admin. You will be able to access
              member features once your membership is approved.
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={async () => {
                await supabase.auth.signOut()
                window.location.href = '/'
              }}
            >
              Back to Home
            </Button>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}
