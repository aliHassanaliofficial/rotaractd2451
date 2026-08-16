'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils/cn'
import { Search, Users, MapPin, GraduationCap, ArrowRight } from 'lucide-react'
import type { Club } from '@/types/database'

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('all')
  const [university, setUniversity] = useState('all')
  const [sort, setSort] = useState('name')
  const [cities, setCities] = useState<string[]>([])
  const [universities, setUniversities] = useState<string[]>([])

  const fetchClubs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (city && city !== 'all') params.set('city', city)
      if (university && university !== 'all') params.set('university', university)
      if (sort) params.set('sort', sort)

      const res = await fetch(`/api/clubs?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setClubs(data.clubs || [])
      setCities(data.cities || [])
      setUniversities(data.universities || [])
    } catch {
      setClubs([])
    } finally {
      setLoading(false)
    }
  }, [city, university, sort])

  useEffect(() => { fetchClubs() }, [fetchClubs])

  const filtered = clubs.filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.university?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name)
    if (sort === 'members') return b.member_count - a.member_count
    if (sort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    return 0
  })

  return (
    <div className="flex flex-col">
      <section className="bg-gradient-to-br from-navy via-[#0a4a82] to-cranberry/50 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">Our Clubs</h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-300">
            Discover and connect with Rotaract clubs across Egypt.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative md:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search clubs or universities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={university} onValueChange={setUniversity}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="University" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Universities</SelectItem>
                  {universities.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="members">Members</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-6 text-center">
                    <Skeleton className="mx-auto mb-4 h-20 w-20 rounded-full" />
                    <Skeleton className="mx-auto mb-2 h-5 w-32" />
                    <Skeleton className="mx-auto h-4 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="py-20 text-center">
              <Users className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <p className="text-lg text-gray-400">No clubs found matching your criteria.</p>
              <Button variant="outline" className="mt-4" onClick={() => { setSearch(''); setCity('all'); setUniversity('all') }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sorted.map((club, i) => (
                <motion.div
                  key={club.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.4 }}
                >
                  <Link href={`/clubs/${club.slug}`}>
                    <Card className="group h-full text-center transition-all hover:-translate-y-1">
                      <CardContent className="p-6">
                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-navy to-cranberry p-0.5">
                          <div className="flex h-full w-full items-center justify-center rounded-full bg-white">
                            {club.logo_url ? (
                              <Image src={club.logo_url} alt={club.name} width={76} height={76} className="rounded-full object-cover" />
                            ) : (
                              <span className="text-2xl font-bold text-navy">{club.name.charAt(0)}</span>
                            )}
                          </div>
                        </div>
                        <h3 className="mb-1 font-semibold text-navy group-hover:text-cranberry">{club.name}</h3>
                        {club.university && (
                          <p className="flex items-center justify-center gap-1 text-sm text-gray-500">
                            <GraduationCap className="h-3.5 w-3.5" />
                            {club.university}
                          </p>
                        )}
                        {club.city && (
                          <p className="mt-0.5 flex items-center justify-center gap-1 text-xs text-gray-400">
                            <MapPin className="h-3 w-3" />
                            {club.city}
                          </p>
                        )}
                        <div className="mt-3 flex items-center justify-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {club.member_count} members
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
