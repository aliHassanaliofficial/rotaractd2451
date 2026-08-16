'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Users, Clock, UserCheck } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import type { Registration } from '@/types/database'

interface CheckinDashboardProps {
  totalRegistrations: number
  checkedIn: number
  recentCheckins: Registration[]
  capacity?: number
  eventTitle?: string
  className?: string
}

export function CheckinDashboard({
  totalRegistrations,
  checkedIn,
  recentCheckins,
  capacity,
  eventTitle,
  className,
}: CheckinDashboardProps) {
  const percentage = capacity ? Math.round((checkedIn / capacity) * 100) : 0

  return (
    <div className={cn('space-y-6', className)}>
      {eventTitle && (
        <h2 className="text-xl font-semibold text-navy">Check-in: {eventTitle}</h2>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-navy/10 p-2">
              <Users className="h-5 w-5 text-navy" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy">{totalRegistrations}</p>
              <p className="text-xs text-gray-500">Total Registered</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-green-100 p-2">
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{checkedIn}</p>
              <p className="text-xs text-gray-500">Checked In</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-gold/10 p-2">
              <Clock className="h-5 w-5 text-gold-dark" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy">
                {totalRegistrations - checkedIn}
              </p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
        </div>
      </div>

      {capacity && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Venue Capacity</span>
            <span className="font-medium text-navy">
              {checkedIn} / {capacity} ({percentage}%)
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={cn(
                'h-full rounded-full transition-colors',
                percentage > 90
                  ? 'bg-red-500'
                  : percentage > 70
                  ? 'bg-gold'
                  : 'bg-green-500'
              )}
            />
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-3 text-sm font-medium text-gray-500">
          Recent Check-ins ({recentCheckins.length})
        </h3>
        <AnimatePresence>
          <div className="space-y-2">
            {recentCheckins.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-400">No check-ins yet</p>
            ) : (
              recentCheckins.map((reg, i) => {
                const name = reg.guest_name || reg.profile?.full_name || 'Unknown'
                const club = reg.guest_club || reg.profile?.club?.name
                return (
                  <motion.div
                    key={reg.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 rounded-2xl border bg-white p-3 shadow-sm"
                  >
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={reg.profile?.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-navy to-cranberry text-white text-xs">
                        {name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-navy truncate">{name}</p>
                      {club && <p className="text-xs text-gray-400 truncate">{club}</p>}
                    </div>
                    <span className="text-xs text-gray-400">
                      {reg.checked_in_at
                        ? new Date(reg.checked_in_at).toLocaleTimeString()
                        : ''}
                    </span>
                  </motion.div>
                )
              })
            )}
          </div>
        </AnimatePresence>
      </div>
    </div>
  )
}
