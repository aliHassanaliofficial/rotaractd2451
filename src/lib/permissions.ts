export type Permission =
  | 'manage:users'
  | 'manage:system'
  | 'view:audit-logs'
  | 'manage:content'
  | 'approve:content'
  | 'manage:library'
  | 'manage:history'
  | 'manage:leadership'
  | 'manage:settings'
  | 'create:content'
  | 'manage:own-club'
  | 'view:members'
  | 'send:notifications'

const permissionMap: Record<Permission, string[]> = {
  'manage:users': ['superadmin'],
  'manage:system': ['superadmin'],
  'view:audit-logs': ['superadmin'],
  'manage:settings': ['superadmin'],
  'manage:content': ['district_admin', 'superadmin'],
  'approve:content': ['district_admin', 'superadmin'],
  'manage:library': ['district_admin', 'superadmin'],
  'manage:history': ['district_admin', 'superadmin'],
  'manage:leadership': ['district_admin', 'superadmin'],
  'send:notifications': ['district_admin', 'superadmin'],
  'create:content': ['club_admin', 'district_admin', 'superadmin'],
  'manage:own-club': ['club_admin'],
  'view:members': ['member', 'club_admin', 'district_admin', 'superadmin'],
}

export function hasPermission(role: string | null | undefined, permission: Permission): boolean {
  if (!role) return false
  return permissionMap[permission]?.includes(role) ?? false
}

export function canManageContent(role: string | null | undefined): boolean {
  return role === 'district_admin' || role === 'superadmin'
}

export function canApproveContent(role: string | null | undefined): boolean {
  return role === 'district_admin' || role === 'superadmin'
}

export function canManageLibrary(role: string | null | undefined): boolean {
  return role === 'district_admin' || role === 'superadmin'
}

export function canManageHistory(role: string | null | undefined): boolean {
  return role === 'district_admin' || role === 'superadmin'
}

export function canManageLeadership(role: string | null | undefined): boolean {
  return role === 'district_admin' || role === 'superadmin'
}

export function canCreateContent(role: string | null | undefined): boolean {
  return role === 'club_admin' || role === 'district_admin' || role === 'superadmin'
}

export function canManageOwnClub(role: string | null | undefined): boolean {
  return role === 'club_admin'
}

export function canViewMembers(role: string | null | undefined): boolean {
  return !!role
}
