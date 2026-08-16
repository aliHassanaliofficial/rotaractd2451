'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { Loader2 } from 'lucide-react'

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { user, loading: userLoading } = useUser()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    if (userLoading) return
    if (!user) {
      router.replace('/login?redirect=' + window.location.pathname)
    }
  }, [mounted, userLoading, user, router])

  if (!mounted || userLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cranberry" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
