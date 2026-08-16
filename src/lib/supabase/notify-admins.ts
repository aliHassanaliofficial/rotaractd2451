import { createAdminClient } from './admin'

/**
 * Notifies the club admins (profile role + club_admins assignments) of a club,
 * plus all district admins / super admins, that a member is awaiting approval.
 */
export async function notifyAdmins(
  admin: ReturnType<typeof createAdminClient>,
  { full_name, club_id }: { full_name: string; club_id: string }
) {
  try {
    const { data: club } = await admin
      .from('clubs')
      .select('name')
      .eq('id', club_id)
      .single()
    const clubName = club?.name || 'a club'

    const [clubAdmins, clubAdminAssignments, districtAdmins] = await Promise.all([
      admin
        .from('profiles')
        .select('id')
        .eq('role', 'club_admin')
        .eq('club_id', club_id),
      admin
        .from('club_admins')
        .select('profile_id')
        .eq('club_id', club_id),
      admin
        .from('profiles')
        .select('id')
        .in('role', ['district_admin', 'superadmin']),
    ])

    const notified = new Set<string>()
    const clubAdminIds = new Set<string>()
    ;[
      ...(clubAdmins.data || []).map((p) => p.id),
      ...(clubAdminAssignments.data || []).map((c) => c.profile_id),
    ].forEach((id) => {
      if (id && !notified.has(id)) {
        notified.add(id)
        clubAdminIds.add(id)
      }
    })

    const notifications: { profile_id: string; title: string; message: string; link: string }[] = []

    for (const id of clubAdminIds) {
      notifications.push({
        profile_id: id,
        title: 'New member registration',
        message: `${full_name} registered in ${clubName} and is awaiting your approval.`,
        link: '/club-admin/members',
      })
    }

    for (const p of districtAdmins.data || []) {
      if (!notified.has(p.id)) {
        notified.add(p.id)
        notifications.push({
          profile_id: p.id,
          title: 'New member registration',
          message: `${full_name} registered in ${clubName} and is awaiting approval.`,
          link: '/admin/members',
        })
      }
    }

    if (notifications.length > 0) {
      await admin.from('notifications').insert(notifications)
    }
  } catch (notifErr) {
    console.error('Failed to notify admins about new member:', notifErr)
  }
}
