'use client'

import { motion } from 'framer-motion'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import type { ClubOfficer } from '@/types/database'

interface OfficersGridProps {
  officers: ClubOfficer[]
  className?: string
  emptyMessage?: string
}

export function OfficersGrid({ officers, className, emptyMessage = 'No officers listed.' }: OfficersGridProps) {
  if (!officers.length) {
    return <p className="py-8 text-center text-sm text-gray-500">{emptyMessage}</p>
  }

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', className)}>
      {officers.map((officer, i) => (
        <motion.div
          key={officer.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
          className="flex flex-col items-center rounded-2xl border bg-white p-5 text-center shadow-sm transition-shadow hover:shadow-md"
        >
          <Avatar className="h-16 w-16 border-2 border-gold/30">
            <AvatarImage src={officer.profile?.avatar_url} alt={officer.profile?.full_name} />
            <AvatarFallback className="bg-gradient-to-br from-navy to-cranberry text-white text-lg font-bold">
              {officer.profile?.full_name?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>

          <h4 className="mt-3 font-semibold text-navy">
            {officer.profile?.full_name || 'Unknown'}
          </h4>

          <Badge variant="secondary" className="mt-1">
            {officer.position}
          </Badge>

          {officer.year && (
            <p className="mt-1 text-xs text-gray-400">Term: {officer.year}</p>
          )}
        </motion.div>
      ))}
    </div>
  )
}
