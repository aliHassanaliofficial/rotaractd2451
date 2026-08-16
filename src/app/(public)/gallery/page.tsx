'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils/cn'
import { formatDate } from '@/lib/utils/date'
import { ImageIcon, Camera, Calendar, Users, Search, Shield } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import type { GalleryAlbum } from '@/types/database'

export default function GalleryPage() {
  const { user } = useAuth()
  const { settings, loading: settingsLoading } = useSiteSettings()
  const galleryPublic = settings.feature_flags?.gallery_public !== false
  const [albums, setAlbums] = useState<(GalleryAlbum & { event: any; club: any; media: any })[]>([])
  const [loading, setLoading] = useState(true)
  const [filterEvent, setFilterEvent] = useState('')
  const [filterClub, setFilterClub] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [allEvents, setAllEvents] = useState<string[]>([])
  const [allClubs, setAllClubs] = useState<string[]>([])
  const [allYears, setAllYears] = useState<string[]>([])

  const fetchAlbums = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterEvent) params.set('event', filterEvent)
      if (filterClub) params.set('club', filterClub)
      if (filterYear) params.set('year', filterYear)

      const res = await fetch(`/api/gallery?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setAlbums(data.albums || [])
      setAllEvents(data.events || [])
      setAllClubs(data.clubs || [])
      setAllYears(data.years || [])
    } catch {
      setAlbums([])
    } finally {
      setLoading(false)
    }
  }, [filterEvent, filterClub, filterYear])

  useEffect(() => { fetchAlbums() }, [fetchAlbums])

  if (!settingsLoading && !galleryPublic && !user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <Shield className="h-16 w-16 text-gray-300" />
        <h2 className="text-2xl font-bold text-navy">Gallery Locked</h2>
        <p className="text-gray-500">The gallery is only available to registered members.</p>
        <Button asChild>
          <Link href="/login?redirect=/gallery">Sign In to View</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <section className="bg-gradient-to-br from-navy via-[#0a4a82] to-cranberry/50 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <Camera className="h-8 w-8 text-gold" />
            <h1 className="text-4xl font-bold md:text-5xl">Gallery</h1>
          </div>
          <p className="mx-auto max-w-2xl text-lg text-gray-300">
            Explore photos from events, activities, and moments across the District.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex flex-wrap gap-3">
            <select
              value={filterEvent}
              onChange={(e) => setFilterEvent(e.target.value)}
              className="rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">All Events</option>
              {allEvents.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
            <select
              value={filterClub}
              onChange={(e) => setFilterClub(e.target.value)}
              className="rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">All Clubs</option>
              {allClubs.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">All Years</option>
              {allYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-52 w-full rounded-2xl" />
                  <CardContent className="p-4">
                    <Skeleton className="mb-2 h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : albums.length === 0 ? (
            <div className="py-20 text-center">
              <ImageIcon className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <p className="text-lg text-gray-400">No photo albums found.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {albums.map((album, i) => {
                const photoCount = album.media?.[0]?.count || 0
                return (
                  <motion.div
                    key={album.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.4 }}
                  >
                    <Link href={`/gallery/${album.slug}`}>
                      <Card className="group overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg">
                        <div className="relative h-52 overflow-hidden">
                          {album.cover_url ? (
                            <Image src={album.cover_url} alt={album.title} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-gradient-to-br from-navy/20 to-gold/20">
                              <ImageIcon className="h-12 w-12 text-gray-300" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-0 transition-opacity group-hover:opacity-100">
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <ImageIcon className="h-3 w-3" />
                              {photoCount} photos
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="mb-1 font-semibold text-navy group-hover:text-cranberry line-clamp-1">
                            {album.title}
                          </h3>
                          {album.description && (
                            <p className="mb-2 line-clamp-1 text-sm text-gray-500">{album.description}</p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            {album.event && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {album.event.title}
                              </span>
                            )}
                            {album.club && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {album.club.name}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
