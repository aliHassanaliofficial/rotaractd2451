'use client'

import { motion } from 'framer-motion'
import { MapPin, Users, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import type { Club } from '@/types/database'

interface ClubCardProps {
  club: Club
  index?: number
}

export function ClubCard({ club, index = 0 }: ClubCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="group h-full overflow-hidden transition-all hover:shadow-lg">
        <div className="relative h-28 bg-gradient-to-r from-navy via-[#0a4a82] to-cranberry/70">
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
            <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
              <AvatarImage src={club.logo_url} alt={club.name} />
              <AvatarFallback className="bg-gold text-navy text-lg font-bold">
                {club.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        <CardContent className="pt-12 text-center">
          <h3 className="text-lg font-semibold text-navy group-hover:text-cranberry transition-colors">
            {club.name}
          </h3>

          {club.university && (
            <p className="mt-1 text-sm text-gray-500">{club.university}</p>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-cranberry" />
              {club.city || club.country}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-navy" />
              {club.member_count} members
            </span>
            {club.founded_year && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-gold" />
                Est. {club.founded_year}
              </span>
            )}
          </div>

          <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
            <a href={`/clubs/${club.slug}`}>View Club</a>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
