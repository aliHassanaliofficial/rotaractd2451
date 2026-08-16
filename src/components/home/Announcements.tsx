'use client'

import { motion } from 'framer-motion'
import { Megaphone, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { Post, AnnouncementPriority } from '@/types/database'

interface AnnouncementsProps {
  announcements?: Post[]
  onDismiss?: (id: string) => void
}

const priorityColors: Record<AnnouncementPriority, string> = {
  normal: 'bg-gold text-navy',
  important: 'bg-cranberry text-white',
  urgent: 'bg-red-600 text-white',
}

const defaultAnnouncements: Post[] = [
  {
    id: 'ann-1',
    slug: 'district-conference-2026-announcement',
    title: 'District Conference 2026: Early bird registration now open!',
    views: 0,
    is_announcement: true,
    is_pinned: true,
    announcement_priority: 'important',
    status: 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'ann-2',
    slug: 'membership-drive',
    title: 'Membership Drive: Refer a friend and win prizes!',
    views: 0,
    is_announcement: true,
    is_pinned: true,
    announcement_priority: 'normal',
    status: 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export function Announcements({ announcements = defaultAnnouncements }: AnnouncementsProps) {
  if (!announcements.length) return null

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-navy via-[#0a4a82] to-[#0e2f4f]">
      <motion.div
        className="flex items-center gap-8 py-2.5"
        animate={{ x: ['100%', '-100%'] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      >
        {[...announcements, ...announcements].map((ann, i) => (
          <a
            key={`${ann.id}-${i}`}
            href={`/news/${ann.slug}`}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-full px-4 py-1 text-sm font-medium whitespace-nowrap transition-opacity hover:opacity-90',
              priorityColors[ann.announcement_priority]
            )}
          >
            <Megaphone className="h-3.5 w-3.5" />
            {ann.title}
          </a>
        ))}
      </motion.div>
    </div>
  )
}
