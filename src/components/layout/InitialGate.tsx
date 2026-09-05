'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

const MINIMUM_HOLD_MS = 5000

export function InitialGate({ children }: { children: React.ReactNode }) {
  const [fading, setFading] = useState(false)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), MINIMUM_HOLD_MS - 400)
    const goneTimer = setTimeout(() => setGone(true), MINIMUM_HOLD_MS)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(goneTimer)
    }
  }, [])

  return (
    <>
      <div
        className="transition-opacity duration-500"
        style={{ opacity: gone ? 1 : 0 }}
      >
        {children}
      </div>

      {!gone && (
        <div
          role="status"
          aria-busy="true"
          className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white transition-opacity duration-500 ${
            fading ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <Image
            src="/logo.png"
            alt="Rotaract"
            width={831}
            height={343}
            priority
            className="h-16 w-auto animate-pulse object-contain sm:h-20"
          />
      <p className="absolute bottom-8 text-xs font-medium uppercase text-black">
        Powered by <a href="https://eraengines.com" target="_blank" rel="noopener noreferrer" className="font-bold text-gold hover:opacity-80">
          Era Engines
        </a>
      </p>
        </div>
      )}
    </>
  )
}
