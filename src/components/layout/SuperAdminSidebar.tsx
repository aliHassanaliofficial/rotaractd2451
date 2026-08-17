'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import {
  LayoutDashboard,
  Users,
  Settings,
  History,
  Award,
  ClipboardList,
  Activity,
  ChevronLeft,
  ArrowLeft,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

const sidebarLinks = [
  { href: '/superadmin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/superadmin/users', label: 'Users', icon: Users },
  { href: '/superadmin/settings', label: 'Settings', icon: Settings },
  { href: '/superadmin/history', label: 'History', icon: History },
  { href: '/admin/leadership', label: 'Leadership', icon: Award },
  { href: '/superadmin/audit-log', label: 'Audit Log', icon: ClipboardList },
  { href: '/superadmin/system', label: 'System Health', icon: Activity },
]

export function SuperAdminSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-amber-200 bg-amber-50 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-amber-200 px-4">
        {!collapsed && (
          <Link href="/superadmin" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Rotaract" width={120} height={36} className="h-9 object-contain" />
            <span className="text-lg font-bold text-amber-800">Super Admin</span>
          </Link>
        )}
        <Button variant="ghost" size="icon" onClick={onToggle}>
          <ChevronLeft className={cn('h-5 w-5 transition-transform', collapsed && 'rotate-180')} />
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {sidebarLinks.map((link) => {
          const isActive =
            link.href === '/superadmin'
              ? pathname === '/superadmin'
              : pathname === link.href || pathname.startsWith(link.href + '/')
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-amber-200 text-amber-900'
                  : 'text-amber-700 hover:bg-amber-100'
              )}
              title={collapsed ? link.label : undefined}
            >
              <link.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          )
        })}

        <Link
          href="/admin"
          className="mt-4 flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Back to Admin</span>}
        </Link>
      </nav>

      <div className="border-t border-amber-200 p-2">
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
