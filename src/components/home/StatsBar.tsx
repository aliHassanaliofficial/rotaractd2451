'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'

interface Stat {
  value: number
  label: string
  suffix?: string
}

const stats: Stat[] = [
  { value: 45, label: 'Active Clubs', suffix: '+' },
  { value: 3000, label: 'Members', suffix: '+' },
  { value: 200, label: 'Annual Events', suffix: '+' },
  { value: 25, label: 'Years of Service', suffix: '+' },
]

function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  useEffect(() => {
    if (!isInView) return
    const duration = 2000
    const steps = 60
    const increment = target / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [isInView, target])

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  )
}

export function StatsBar() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="relative isolate overflow-hidden bg-gradient-to-br from-navy via-[#0a4a82] to-[#0e2f4f] py-12">
      <div className="pointer-events-none absolute -right-20 -top-24 -z-10 h-72 w-72 rounded-full bg-cranberry/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-20 -z-10 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="text-center"
            >
              <div className="text-4xl font-bold text-gold md:text-5xl">
                <Counter target={stat.value} suffix={stat.suffix} />
              </div>
              <div className="mt-2 text-sm font-medium text-gray-300 uppercase tracking-wider">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
