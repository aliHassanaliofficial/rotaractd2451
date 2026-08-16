'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, MapPin, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import type { Club } from '@/types/database'

interface FeaturedClubsProps {
  clubs?: Club[]
}

const defaultClubs: Club[] = [
  {
    id: '1',
    name: 'Cairo University Rotaract',
    slug: 'cairo-university',
    logo_url: '/images/club-1.png',
    cover_url: '/images/club-cover-1.jpg',
    university: 'Cairo University',
    city: 'Cairo',
    country: 'Egypt',
    member_count: 85,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Alexandria Elite Rotaract',
    slug: 'alexandria-elite',
    logo_url: '/images/club-2.png',
    cover_url: '/images/club-cover-2.jpg',
    university: 'Alexandria University',
    city: 'Alexandria',
    country: 'Egypt',
    member_count: 62,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'GUC Rotaract',
    slug: 'guc',
    logo_url: '/images/club-3.png',
    cover_url: '/images/club-cover-3.jpg',
    university: 'German University in Cairo',
    city: 'Cairo',
    country: 'Egypt',
    member_count: 120,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Mansoura Medics Rotaract',
    slug: 'mansoura-medics',
    logo_url: '/images/club-4.png',
    cover_url: '/images/club-cover-4.jpg',
    university: 'Mansoura University',
    city: 'Mansoura',
    country: 'Egypt',
    member_count: 45,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export function FeaturedClubs({ clubs = defaultClubs }: FeaturedClubsProps) {
  const [startIdx, setStartIdx] = useState(0)
  const visible = 3

  const next = () => setStartIdx((c) => Math.min(c + 1, clubs.length - visible))
  const prev = () => setStartIdx((c) => Math.max(c - 1, 0))

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold text-navy">Featured Clubs</h2>
            <p className="mt-2 text-gray-600">Meet our active Rotaract clubs across Egypt</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={prev}
              disabled={startIdx === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={next}
              disabled={startIdx >= clubs.length - visible}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="relative overflow-hidden">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={startIdx}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="grid gap-6 md:grid-cols-3"
            >
              {clubs.slice(startIdx, startIdx + visible).map((club) => (
                <Card key={club.id} className="group overflow-hidden">
                  <div className="relative h-32 bg-gradient-to-r from-navy via-[#0a4a82] to-cranberry/70">
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
                    <h3 className="text-lg font-semibold text-navy">{club.name}</h3>
                    {club.university && (
                      <p className="text-sm text-gray-500">{club.university}</p>
                    )}
                    <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-cranberry" />
                        {club.city || club.country}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-navy" />
                        {club.member_count} members
                      </span>
                    </div>
                    <Button variant="outline" size="sm" className="mt-4" asChild>
                      <a href={`/clubs/${club.slug}`}>View Club</a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-8 text-center">
          <Button asChild variant="secondary">
            <a href="/clubs">Explore All Clubs</a>
          </Button>
        </div>
      </div>
    </section>
  )
}
