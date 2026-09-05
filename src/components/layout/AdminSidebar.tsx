'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useRole } from '@/hooks/useRole'
import { cn } from '@/lib/utils/cn'
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Megaphone,
  Building2,
  Users,
  Image as ImageIcon,
  BookOpen,
  MessageSquare,
  Bell,
  BarChart3,
  ChevronLeft,
  LogOut,
  Shield,
  ClipboardCheck,
  Award,
  Globe,
  Wallet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'

const sidebarLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/pending', label: 'Pending Approvals', icon: ClipboardCheck },
  { href: '/admin/events', label: 'Events', icon: Calendar },
  { href: '/admin/transactions', label: 'Transactions', icon: Wallet },
  { href: '/admin/calendar', label: 'Calendar', icon: Calendar },
  { href: '/admin/posts', label: 'Posts', icon: FileText },
  { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/admin/clubs', label: 'Clubs', icon: Building2 },
  { href: '/admin/members', label: 'Members', icon: Users },
  { href: '/admin/leadership', label: 'Leadership', icon: Award },
  { href: '/admin/gallery', label: 'Gallery', icon: ImageIcon },
  { href: '/admin/library', label: 'Library', icon: BookOpen },
  { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin/about', label: 'About Page', icon: Globe },
]

export function AdminSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname()
  const { isSuperAdmin } = useRole()
  const [pendingCount, setPendingCount] = useState(0)
  const [pendingMembers, setPendingMembers] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    loadPendingCount()
    const interval = setInterval(loadPendingCount, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadPendingCount() {
    try {
      const [{ count: p }, { count: e }, { count: g }, { count: m }] = await Promise.all([
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending'),
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending'),
        supabase.from('gallery_albums').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending'),
      ])
      setPendingCount((p || 0) + (e || 0) + (g || 0))
      setPendingMembers(m || 0)
    } catch {
      // silent
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
        {!collapsed && (
          <Link href="/admin" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Rotaract" width={120} height={36} className="h-9 object-contain" />
            <span className="text-lg font-bold text-navy">Admin</span>
          </Link>
        )}
        <Button variant="ghost" size="icon" onClick={onToggle}>
          <ChevronLeft className={cn('h-5 w-5 transition-transform', collapsed && 'rotate-180')} />
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {sidebarLinks.map((link) => {
          const isActive =
            link.href === '/admin'
              ? pathname === '/admin'
              : pathname === link.href || pathname.startsWith(link.href + '/')
          const isPendingLink = link.href === '/admin/pending'
          const isMembersLink = link.href === '/admin/members'
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
              {!collapsed && (
                <span className="flex-1">{link.label}</span>
              )}
              {!collapsed && isPendingLink && pendingCount > 0 && (
                <Badge className="bg-yellow-100 text-yellow-700 text-xs">{pendingCount}</Badge>
              )}
              {!collapsed && isMembersLink && pendingMembers > 0 && (
                <Badge className="bg-yellow-100 text-yellow-700 text-xs">{pendingMembers}</Badge>
              )}
            </Link>
          )
        })}

        {isSuperAdmin && (
          <Link
            href="/superadmin"
            className={cn(
              'mt-4 flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-amber-50 hover:text-amber-600'
            )}
            title={collapsed ? 'Super Admin' : undefined}
          >
            <Shield className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Super Admin</span>}
          </Link>
        )}
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
  )
}
