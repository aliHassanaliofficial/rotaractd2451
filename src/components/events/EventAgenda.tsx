'use client'

import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface AgendaItem {
  time: string
  title: string
  description?: string
  speaker?: string
}

interface EventAgendaProps {
  items: AgendaItem[]
  className?: string
}

export function EventAgenda({ items, className }: EventAgendaProps) {
  if (!items.length) return null

  return (
    <div className={cn('space-y-0', className)}>
      <h3 className="mb-6 text-xl font-semibold text-navy">Event Agenda</h3>
      <div className="relative">
        <div className="absolute left-4 top-0 h-full w-0.5 bg-gray-200" />
        <div className="space-y-8">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
              className="relative pl-12"
            >
              <div className="absolute left-2.5 top-1 flex h-3 w-3 items-center justify-center">
                <div className="h-3 w-3 rounded-full border-2 border-gold bg-white" />
              </div>

              <div className="flex items-center gap-2 text-sm text-gold-dark font-medium">
                <Clock className="h-3.5 w-3.5" />
                {item.time}
              </div>

              <h4 className="mt-1 font-semibold text-navy">{item.title}</h4>

              {item.description && (
                <p className="mt-1 text-sm text-gray-500">{item.description}</p>
              )}

              {item.speaker && (
                <p className="mt-1 text-xs text-cranberry font-medium">{item.speaker}</p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
