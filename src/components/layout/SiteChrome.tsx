'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

const DASHBOARD_PREFIXES = ['/admin', '/club-admin', '/superadmin']
const NO_CHROME = ['/doing-some-updates']

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isDashboard = DASHBOARD_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  )
  const hasChrome = !isDashboard && !NO_CHROME.includes(pathname)

  return (
    <>
      {hasChrome && <Navbar />}
      <main className="flex-1">{children}</main>
      {hasChrome && <Footer />}
    </>
  )
}
