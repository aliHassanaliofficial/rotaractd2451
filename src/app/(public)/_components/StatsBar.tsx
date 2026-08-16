'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Users, Calendar, Clock, type LucideIcon } from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  users: Users,
  calendar: Calendar,
  clock: Clock,
}

interface Stat {
  label: string
  value: number
  icon: string
  suffix?: string
}

interface StatsBarProps {
  stats: Stat[]
}

export function StatsBar({ stats }: StatsBarProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <div ref={ref} className="relative z-10 -mt-16 mb-8">
      <div className="container mx-auto px-4">
        <div className="grid divide-x divide-gold/20 overflow-hidden rounded-2xl border border-white/50 bg-white/60 shadow-soft backdrop-blur-xl md:grid-cols-4">
          {stats.map((stat, i) => {
            const Icon = ICON_MAP[stat.icon] || Users
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="flex flex-col items-center justify-center p-6 text-center"
              >
                <Icon className="mb-2 h-8 w-8 text-gold" />
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ delay: i * 0.15 + 0.3, duration: 0.5 }}
                  className="text-3xl font-bold text-navy"
                >
                  {isInView ? stat.value : 0}
                  {stat.suffix}
                </motion.span>
                <span className="mt-1 text-sm text-gray-500">{stat.label}</span>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
