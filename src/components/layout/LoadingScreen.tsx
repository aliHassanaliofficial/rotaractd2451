'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

export function LoadingScreen() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 200)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      role="status"
      aria-busy="true"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white transition-opacity duration-300 ease-out ${
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
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
      <p className="absolute bottom-8 text-xs font-medium uppercase text-gray-400">
        Powered by <a href="https://eraengines.com" target="_blank" className="font-bold">
          Era Engines
        </a>
      </p>
    </div>
  )
}
