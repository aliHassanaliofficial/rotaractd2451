'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useUser } from '@/hooks/useUser'
import { useRole } from '@/hooks/useRole'
import { cn } from '@/lib/utils/cn'
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Image as ImageIcon,
  Users,
  Bell,
  Medal,
  Settings,
  ChevronLeft,
  ArrowLeft,
  LogOut,
  Loader2,
  ShieldAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'

const sidebarLinks = [
  { href: '/club-admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/club-admin/posts', label: 'Posts', icon: FileText },
  { href: '/club-admin/events', label: 'Events', icon: Calendar },
  { href: '/club-admin/calendar', label: 'Calendar', icon: Calendar },
  { href: '/club-admin/gallery', label: 'Gallery', icon: ImageIcon },
  { href: '/club-admin/members', label: 'Members', icon: Users },
  { href: '/club-admin/officers', label: 'Officers', icon: Medal },
  { href: '/club-admin/notifications', label: 'Notifications', icon: Bell },
  { href: '/club-admin/settings', label: 'Settings', icon: Settings },
]

export default function ClubAdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [pendingMembers, setPendingMembers] = useState(0)
  const { user, loading: userLoading } = useUser()
  const { isClubAdmin, clubId, assignedClubIds } = useRole()
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const clubs = assignedClubIds.length > 0 ? assignedClubIds : clubId ? [clubId] : []
    if (clubs.length === 0) return
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('approval_status', 'pending')
      .in('club_id', clubs)
      .then(({ count }) => setPendingMembers(count || 0))
  }, [clubId, assignedClubIds, supabase])

  useEffect(() => {
    if (!mounted) return
    if (userLoading) return
    if (!user || !isClubAdmin) {
      router.replace('/login?redirect=' + window.location.pathname)
    }
  }, [mounted, userLoading, user, isClubAdmin, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cranberry" />
      </div>
    )
  }

  if (!userLoading && (!user || !isClubAdmin)) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 px-4">
        <ShieldAlert className="h-12 w-12 text-cranberry" />
        <h2 className="text-xl font-semibold text-navy">Access Denied</h2>
        <p className="text-gray-500">You do not have permission to access this area.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          {!collapsed && (
            <Link href="/club-admin" className="flex items-center gap-2">
              <Image src="/logo.png" alt="Rotaract" width={120} height={36} className="h-9 object-contain" />
              <span className="text-lg font-bold text-navy">Club Panel</span>
            </Link>
          )}
          <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)}>
            <ChevronLeft className={cn('h-5 w-5 transition-transform', collapsed && 'rotate-180')} />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {sidebarLinks.map((link) => {
            const isActive =
              link.href === '/club-admin'
                ? pathname === '/club-admin'
                : pathname === link.href || pathname.startsWith(link.href + '/')
            const isMembersLink = link.href === '/club-admin/members'
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-cranberry/10 text-cranberry'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-navy'
                )}
                title={collapsed ? link.label : undefined}
              >
                <link.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="flex-1">{link.label}</span>}
                {!collapsed && isMembersLink && pendingMembers > 0 && (
                  <Badge className="bg-yellow-100 text-yellow-700 text-xs">{pendingMembers}</Badge>
                )}
              </Link>
            )
          })}

          <Link
            href="/"
            className={cn(
              'mt-4 flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-navy'
            )}
            title={collapsed ? 'Back to Site' : undefined}
          >
            <ArrowLeft className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Back to Site</span>}
          </Link>
        </nav>

        <div className="border-t border-gray-200 p-2">
          <Button
            variant="ghost"
            className="flex w-full items-center gap-3 text-sm text-red-600 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </Button>
        </div>
      </aside>

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
