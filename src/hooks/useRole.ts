'use client'

import { useState, useEffect } from 'react'
import { useUser } from './useUser'
import { createClient } from '@/lib/supabase/client'

export function useRole() {
  const { profile } = useUser()
  const [assignedClubIds, setAssignedClubIds] = useState<string[]>([])

  useEffect(() => {
    if (!profile?.id) return
    if (profile?.role !== 'club_admin') return

    const supabase = createClient()
    supabase
      .from('club_admins')
      .select('club_id')
      .eq('profile_id', profile.id)
      .then(({ data }) => {
        if (data) {
          setAssignedClubIds(data.map((ca) => ca.club_id))
        }
      })
  }, [profile?.id, profile?.role])

  return {
    role: profile?.role ?? null,
    isMember: profile?.role === 'member',
    isClubAdmin: profile?.role === 'club_admin',
    isDistrictAdmin: profile?.role === 'district_admin',
    isSuperAdmin: profile?.role === 'superadmin',
    isAdmin: profile?.role === 'club_admin' || profile?.role === 'district_admin' || profile?.role === 'superadmin',
    isStaff: profile?.role && ['club_admin', 'district_admin', 'superadmin'].includes(profile.role) ? true : false,
    clubId: profile?.club_id,
    assignedClubIds,
  }
}
