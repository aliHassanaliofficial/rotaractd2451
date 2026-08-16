'use client'

import { ClubCard } from './ClubCard'
import type { Club } from '@/types/database'

interface ClubGridProps {
  clubs: Club[]
  loading?: boolean
  emptyMessage?: string
}

export function ClubGrid({ clubs, loading = false, emptyMessage = 'No clubs found.' }: ClubGridProps) {
  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="animate-pulse rounded-2xl border border-gray-200">
            <div className="h-28 rounded-t-2xl bg-gray-200" />
            <div className="space-y-3 p-6 pt-12 text-center">
              <div className="mx-auto h-5 w-2/3 rounded bg-gray-200" />
              <div className="mx-auto h-4 w-1/2 rounded bg-gray-200" />
              <div className="mx-auto h-4 w-3/4 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!clubs.length) {
    return <div className="py-16 text-center text-gray-500">{emptyMessage}</div>
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {clubs.map((club, i) => (
        <ClubCard key={club.id} club={club} index={i} />
      ))}
    </div>
  )
}
