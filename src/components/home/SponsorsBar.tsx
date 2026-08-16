'use client'

import { motion } from 'framer-motion'

interface Sponsor {
  name: string
  logo: string
  url?: string
}

interface SponsorsBarProps {
  sponsors?: Sponsor[]
  title?: string
}

const defaultSponsors: Sponsor[] = [
  { name: 'Rotary International', logo: '/images/sponsors/rotary.png', url: 'https://rotary.org' },
  { name: 'Partner A', logo: '/images/sponsors/partner-a.png' },
  { name: 'Partner B', logo: '/images/sponsors/partner-b.png' },
  { name: 'Partner C', logo: '/images/sponsors/partner-c.png' },
  { name: 'Partner D', logo: '/images/sponsors/partner-d.png' },
  { name: 'Partner E', logo: '/images/sponsors/partner-e.png' },
]

export function SponsorsBar({ sponsors = defaultSponsors, title = 'Our Partners & Sponsors' }: SponsorsBarProps) {
  return (
    <section className="border-t border-gray-100 bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="mb-8 text-center text-sm font-medium uppercase tracking-wider text-gray-400">{title}</p>
        <div className="relative overflow-hidden">
          <motion.div
            className="flex items-center gap-16"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          >
            {[...sponsors, ...sponsors].map((sponsor, i) => (
              <a
                key={`${sponsor.name}-${i}`}
                href={sponsor.url || '#'}
                target={sponsor.url ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="flex shrink-0 items-center justify-center grayscale transition-all hover:grayscale-0"
              >
                <div className="flex h-12 w-32 items-center justify-center rounded-2xl bg-gray-50 px-4">
                  <span className="text-sm font-medium text-gray-400">{sponsor.name}</span>
                </div>
              </a>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
