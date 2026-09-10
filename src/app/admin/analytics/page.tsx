'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BarChart3, Lock } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import type { AnalyticsEntry } from '@/types/database'

function MetricCard({ entry }: { entry: AnalyticsEntry }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-navy/10">
      <div className="mb-3 h-1 w-10 rounded-full bg-gradient-to-r from-gold to-cranberry" />
      <p className="text-sm font-medium text-gray-500">{entry.label}</p>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-4xl font-bold tracking-tight text-navy">
          {Number(entry.value).toLocaleString()}
        </span>
        {entry.suffix && <span className="text-lg font-semibold text-cranberry">{entry.suffix}</span>}
      </div>
      {entry.note && <p className="mt-2 text-xs text-gray-400">{entry.note}</p>}
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const [entries, setEntries] = useState<AnalyticsEntry[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let cancelled = false
    supabase
      .from('analytics_entries')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          toast.error('Failed to load analytics')
          setLoading(false)
          return
        }
        setEntries((data || []) as AnalyticsEntry[])
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [supabase])

  const categories = [...new Set(entries.map((e) => e.category).filter((c): c is string => !!c))]
  const uncategorized = entries.filter((e) => !e.category)

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-navy">Analytics</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="space-y-6">
        <Header />
        <div className="rounded-2xl border border-dashed border-gray-200 py-20 text-center">
          <BarChart3 className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="text-gray-400">No analytics have been published yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Header />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {uncategorized.map((entry) => (
          <MetricCard key={entry.id} entry={entry} />
        ))}
      </div>

      {categories.map((category) => (
        <div key={category}>
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-xl font-bold text-navy">{category}</h2>
            <div className="h-0.5 flex-1 rounded-full bg-gradient-to-r from-gold/50 to-transparent" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {entries
              .filter((e) => e.category === category)
              .map((entry) => (
                <MetricCard key={entry.id} entry={entry} />
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function Header() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-7 w-7 text-cranberry" />
        <h1 className="text-3xl font-bold text-navy">Analytics</h1>
      </div>
      <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-500">
        <Lock className="h-3.5 w-3.5" />
        Published by the district office
      </div>
    </div>
  )
}