'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

const DASHBOARD_PREFIXES = ['/admin', '/club-admin', '/superadmin']

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isDashboard = DASHBOARD_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  )

  return (
    <>
      {!isDashboard && <Navbar />}
      <main className="flex-1">{children}</main>
      {!isDashboard && <Footer />}
    </>
  )
}
