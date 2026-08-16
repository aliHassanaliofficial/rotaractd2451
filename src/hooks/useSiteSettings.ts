'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function useSiteSettings() {
  const supabase = useMemo(() => createClient(), [])
  const pathname = usePathname()
  const [settings, setSettings] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const { data } = await supabase.from('site_settings').select('*')
      const record: Record<string, any> = {}
      for (const s of data || []) {
        record[s.key] = s.value
      }
      setSettings(record)
    } catch {
      // keep last known settings on failure
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    load()
  }, [load, pathname])

  useEffect(() => {
    const onFocus = () => load()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') load()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [load])

  return { settings, loading }
}
