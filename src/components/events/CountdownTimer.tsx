'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils/cn'

interface CountdownTimerProps {
  targetDate: string | Date
  className?: string
  onComplete?: () => void
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function calcTimeLeft(target: Date): TimeLeft {
  const diff = target.getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  }
}

export function CountdownTimer({ targetDate, className, onComplete }: CountdownTimerProps) {
  const target = new Date(targetDate)
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calcTimeLeft(target))

  useEffect(() => {
    const timer = setInterval(() => {
      const tl = calcTimeLeft(target)
      setTimeLeft(tl)
      if (tl.days === 0 && tl.hours === 0 && tl.minutes === 0 && tl.seconds === 0) {
        clearInterval(timer)
        onComplete?.()
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [target, onComplete])

  const total = timeLeft.days + timeLeft.hours + timeLeft.minutes + timeLeft.seconds
  if (total === 0) {
    return <span className={cn('text-cranberry font-semibold', className)}>Happening now!</span>
  }

  const segments = [
    { value: timeLeft.days, label: 'Days' },
    { value: timeLeft.hours, label: 'Hrs' },
    { value: timeLeft.minutes, label: 'Min' },
    { value: timeLeft.seconds, label: 'Sec' },
  ]

  return (
    <div className={cn('flex gap-3', className)}>
      {segments.map((seg) => (
        <div key={seg.label} className="text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-b from-navy to-rotary-blue text-sm font-bold text-white md:h-12 md:w-12 md:text-lg">
            {String(seg.value).padStart(2, '0')}
          </div>
          <span className="mt-1 block text-[10px] uppercase text-gray-500">{seg.label}</span>
        </div>
      ))}
    </div>
  )
}
