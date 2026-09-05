'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { useUser } from '@/hooks/useUser'
import { useRole } from '@/hooks/useRole'

const MAINTENANCE_PATH = '/doing-some-updates'

// Always accessible during maintenance so the superadmin (or a future
// superadmin) can still sign in to manage the site.
const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password', '/verify']

export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { settings } = useSiteSettings()
  const { loading: authLoading } = useUser()
  const { isSuperAdmin } = useRole()

  const maintenanceOn = settings.feature_flags?.maintenance_mode === true
  const isAuthRoute = AUTH_ROUTES.includes(pathname)
  const isMaintenancePage = pathname === MAINTENANCE_PATH

  useEffect(() => {
    if (authLoading) return
    if (maintenanceOn && !isSuperAdmin && !isAuthRoute && !isMaintenancePage) {
      router.replace(MAINTENANCE_PATH)
    }
  }, [authLoading, maintenanceOn, isSuperAdmin, isAuthRoute, isMaintenancePage, pathname, router])

  return <>{children}</>
}