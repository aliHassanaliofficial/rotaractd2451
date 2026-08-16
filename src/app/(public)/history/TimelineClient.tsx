'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import { formatDate } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'
import { Badge } from '@/components/ui/badge'
import { MILESTONE_TYPES } from '@/lib/constants'
import type { HistoryEntry } from '@/types/database'

interface TimelineClientProps {
  entries: HistoryEntry[]
}

export function TimelineClient({ entries }: TimelineClientProps) {
  return (
    <div className="relative">
      <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-gradient-to-b from-gold via-cranberry to-navy max-md:left-6" />
      <div className="space-y-12">
        {entries.map((entry, i) => (
          <TimelineEntry key={entry.id} entry={entry} index={i} />
        ))}
      </div>
    </div>
  )
}

function TimelineEntry({ entry, index }: { entry: HistoryEntry; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  const milestone = MILESTONE_TYPES.find((m) => m.value === entry.milestone_type)
  const isLeft = index % 2 === 0

  return (
    <div
      ref={ref}
      className={cn(
        'flex items-start gap-8 max-md:flex-col max-md:pl-14',
        isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
      )}
    >
      <motion.div
        initial={{ opacity: 0, x: isLeft ? -40 : 40 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.1 }}
        className={cn('flex-1', isLeft ? 'md:text-right' : 'md:text-left')}
      >
        <div className="rounded-2xl border border-gold/10 bg-white p-6 shadow-sm">
          <div className={cn('mb-3 flex items-center gap-2', isLeft ? 'md:flex-row-reverse' : '')}>
            <Badge
              className={cn(
                'text-xs uppercase',
                milestone?.color || 'bg-navy'
              )}
            >
              {milestone?.label || entry.milestone_type || 'General'}
            </Badge>
            <span className="text-xs text-gray-400">
              {formatDate(entry.created_at, 'MMM yyyy')}
            </span>
          </div>
          <h3 className={cn('mb-1 text-xl font-bold text-navy', isLeft ? 'md:text-right' : '')}>
            {entry.year} - {entry.title}
          </h3>
          {entry.description && (
            <p className={cn('text-gray-600 leading-relaxed', isLeft ? 'md:text-right' : '')}>
              {entry.description}
            </p>
          )}
          {entry.image_url && (
            <div className={cn('mt-4 overflow-hidden rounded-2xl', isLeft ? 'md:ml-auto' : '')}>
              <Image
                src={entry.image_url}
                alt={entry.title}
                width={400}
                height={250}
                className="h-48 w-full object-cover"
              />
            </div>
          )}
        </div>
      </motion.div>

      <div className="relative z-10 flex shrink-0 items-center justify-center max-md:absolute max-md:left-0">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full border-4 border-white shadow-md',
            milestone?.color ? milestone.color.replace('bg-', 'bg-') + '/20' : 'bg-navy/20',
          )}
          style={{ backgroundColor: milestone?.color ? `var(--color-${milestone.color.replace('bg-', '')})` : undefined }}
        >
          <div
            className={cn(
              'h-3 w-3 rounded-full',
              milestone?.color || 'bg-navy'
            )}
          />
        </div>
      </div>

      <div className="flex-1 max-md:hidden" />
    </div>
  )
}
