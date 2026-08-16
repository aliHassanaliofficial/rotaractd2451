'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Megaphone } from 'lucide-react'
import type { Post } from '@/types/database'

interface AnnouncementTickerProps {
  announcements: Post[]
}

export function AnnouncementTicker({ announcements }: AnnouncementTickerProps) {
  if (announcements.length === 0) return null

  return (
    <div className="bg-gold/10 border-y border-gold/20">
      <div className="container mx-auto flex items-center gap-3 px-4 py-2">
        <div className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-cranberry">
          <Megaphone className="h-4 w-4" />
          <span>Announcements</span>
        </div>
        <div className="flex gap-4 overflow-hidden">
          <motion.div
            animate={{ x: ['0%', '-50%'] }}
            transition={{ repeat: Infinity, duration: 30, ease: 'linear' }}
            className="flex shrink-0 gap-4"
          >
            {[...announcements, ...announcements].map((a, i) => (
              <Link
                key={`${a.id}-${i}`}
                href={`/announcements#${a.id}`}
                className="flex shrink-0 items-center gap-2 text-sm text-gray-600 hover:text-cranberry"
              >
                <Badge
                  variant={
                    a.announcement_priority === 'urgent'
                      ? 'destructive'
                      : a.announcement_priority === 'important'
                        ? 'cranberry'
                        : 'outline'
                  }
                  className="text-[10px] uppercase"
                >
                  {a.announcement_priority}
                </Badge>
                <span className="truncate">{a.title}</span>
              </Link>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
