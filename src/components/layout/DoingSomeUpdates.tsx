'use client'

import Image from 'next/image'
import { Loader2, Wrench } from 'lucide-react'
import { useSiteSettings } from '@/hooks/useSiteSettings'

export function DoingSomeUpdates() {
  const { settings } = useSiteSettings()
  const logoUrl = settings.logo_url || '/logo.png'

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-4 text-center">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cranberry/10 blur-3xl" />
        <div className="absolute bottom-0 left-10 h-72 w-72 rounded-full bg-navy/10 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
      </div>

      <div className="mb-10 animate-pulse rounded-3xl p-3 shadow-xl">
        <Image
          src={logoUrl}
          alt="Rotaract"
          width={831}
          height={343}
          priority
          className="h-20 w-auto object-contain sm:h-28"
        />
      </div>

      <div className="flex items-center gap-3">
        <Loader2 className="h-7 w-7 animate-spin text-cranberry" />
        <h1 className="text-3xl font-bold text-navy sm:text-5xl">Doing Some Updates</h1>
      </div>

      <p className="mt-4 max-w-md text-gray-500">
        We&apos;re making a few improvements to make things even better. Hang tight —
        we&apos;ll be back shortly.
      </p>

      <div className="mt-10 flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
        <span className="h-2 w-2 animate-pulse rounded-full bg-cranberry" />
        Please check back soon
      </div>

      <div className="absolute bottom-6 flex items-center gap-1.5 text-xs font-medium text-gray-400">
        <p className="absolute bottom-8 text-xs font-medium uppercase text-black">
          Powered by <a href="https://eraengines.com" target="_blank" rel="noopener noreferrer" className="font-bold text-gold hover:opacity-80">
            Era Engines
          </a>
        </p>
      </div>
    </div>
  )
}