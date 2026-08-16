'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SuperAdminSidebar } from '@/components/layout/SuperAdminSidebar'
import { useUser } from '@/hooks/useUser'
import { useRole } from '@/hooks/useRole'
import { cn } from '@/lib/utils/cn'
import { Loader2, ShieldAlert } from 'lucide-react'

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { user, loading: userLoading } = useUser()
  const { isSuperAdmin } = useRole()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    if (userLoading) return
    if (!user || !isSuperAdmin) {
      router.replace('/admin')
    }
  }, [mounted, userLoading, user, isSuperAdmin, router])

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cranberry" />
      </div>
    )
  }

  if (!userLoading && (!user || !isSuperAdmin)) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 px-4">
        <ShieldAlert className="h-12 w-12 text-cranberry" />
        <h2 className="text-xl font-semibold text-navy">Access Denied</h2>
        <p className="text-gray-500">You do not have permission to access this area.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-amber-50/30">
      <SuperAdminSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main
        className={cn(
          'min-h-screen transition-all duration-300',
          collapsed ? 'ml-16' : 'ml-64'
        )}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
