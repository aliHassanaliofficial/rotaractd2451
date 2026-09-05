import type { Metadata } from 'next'
import { getHistoryEntries } from '@/lib/supabase/queries/settings'
import { MILESTONE_TYPES } from '@/lib/constants'
import { formatDate } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'
import { TimelineClient } from './TimelineClient'

export const metadata: Metadata = {
  title: 'Our History',
  description:
    'Explore the history of Rotaract District 2451 Egypt — milestones, achievements, and the journey of young leaders creating change since our founding.',
  alternates: { canonical: '/history' },
}

export default async function HistoryPage() {
  const entries = await getHistoryEntries().catch(() => [])

  return (
    <div className="flex flex-col">
      <section className="bg-gradient-to-br from-navy via-[#0a4a82] to-cranberry/50 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">District History</h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-300">
            Explore the journey of Rotaract from its founding to the present day.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          {entries.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-gray-400">No history entries available yet.</p>
            </div>
          ) : (
            <TimelineClient entries={entries} />
          )}
        </div>
      </section>
    </div>
  )
}
