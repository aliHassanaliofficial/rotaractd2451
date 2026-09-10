import type { Metadata } from 'next'
import { getAwards } from '@/lib/supabase/queries/settings'
import { Award as AwardIcon } from 'lucide-react'
import { formatRotaryYear } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'

export const metadata: Metadata = {
  title: 'Awards',
  description: 'Recognizing excellence across Rotaract District 2451 — outstanding clubs, leaders, and initiatives.',
  alternates: { canonical: '/awards' },
}

export default async function AwardsPage() {
  const awards = await getAwards().catch(() => [])

  const years = [...new Set(awards.map((a) => a.year).filter((y): y is string => !!y))].sort(
    (a, b) => parseInt(b) - parseInt(a)
  )

  return (
    <div className="flex flex-col">
      <section className="bg-gradient-to-br from-navy via-[#0a4a82] to-cranberry/50 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <AwardIcon className="mx-auto mb-4 h-14 w-14 text-gold" />
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">Awards</h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-300">
            Celebrating the clubs, leaders, and initiatives that made a difference across District 2451.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          {awards.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-gray-400">No awards published yet.</p>
            </div>
          ) : years.length === 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {awards.map((award) => (
                <AwardCard key={award.id} award={award} />
              ))}
            </div>
          ) : (
            <div className="space-y-14">
              {years.map((year) => {
                const yearAwards = awards.filter((a) => a.year === year)
                return (
                  <div key={year}>
                    <div className="mb-6 flex items-center gap-4">
                      <h2 className="text-2xl font-bold text-navy">{formatRotaryYear(year)}</h2>
                      <div className="h-0.5 flex-1 rounded-full bg-gradient-to-r from-gold/60 to-transparent" />
                    </div>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {yearAwards.map((award) => (
                        <AwardCard key={award.id} award={award} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function AwardCard({ award }: { award: { title: string; recipient?: string; category?: string; year?: string; description?: string } }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-navy/10">
      <div className="flex h-24 items-center justify-center bg-gradient-to-br from-navy via-[#0a4a82] to-cranberry/70">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-gold backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
          <AwardIcon className="h-7 w-7" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-center justify-between gap-2">
          {award.category ? (
            <span className="inline-flex items-center rounded-full bg-cranberry/10 px-2.5 py-0.5 text-xs font-medium text-cranberry">
              {award.category}
            </span>
          ) : (
            <span />
          )}
          {award.year && (
            <span className="text-xs font-semibold text-gray-400">{formatRotaryYear(award.year)}</span>
          )}
        </div>
        <h3 className="text-lg font-bold text-navy group-hover:text-cranberry">{award.title}</h3>
        {award.recipient && (
          <p className="text-sm font-medium text-cranberry">{award.recipient}</p>
        )}
        {award.description && (
          <p className={cn('text-sm leading-relaxed text-gray-600')}>{award.description}</p>
        )}
      </div>
    </div>
  )
}