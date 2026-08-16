'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Search, Users, Shield, X } from 'lucide-react'
import { useSiteSettings } from '@/hooks/useSiteSettings'

interface Props {
  params: Promise<{ slug: string }>
}

export default function ClubMembersPage({ params }: Props) {
  const { slug } = use(params)
  const { settings } = useSiteSettings()
  const featureEnabled = settings.feature_flags?.show_member_directory !== false
  const [clubName, setClubName] = useState('')
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/clubs/${slug}/members`)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setClubName(data.club?.name || '')
        setMembers(data.members || [])
      } catch {
        setClubName('')
        setMembers([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  if (loading) {
    return (
      <div className="py-16">
        <div className="container mx-auto px-4">
          <Skeleton className="mb-6 h-10 w-48" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="flex items-center gap-3 p-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="mt-1 h-3 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!featureEnabled) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <Shield className="h-16 w-16 text-gray-300" />
        <h2 className="text-2xl font-bold text-navy">Directory Disabled</h2>
        <p className="text-gray-500">The member directory is currently disabled by the district.</p>
        <Button variant="outline" asChild>
          <Link href={`/clubs/${slug}`}>Back to Club</Link>
        </Button>
      </div>
    )
  }

  if (!clubName) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-gray-400">Club not found.</p>
      </div>
    )
  }

  const filtered = members.filter((m: any) => {
    if (!search) return true
    const q = search.toLowerCase()
    return m.full_name?.toLowerCase().includes(q) || m.rotaract_id?.toLowerCase().includes(q) || m.occupation?.toLowerCase().includes(q)
  })

  return (
    <div className="flex flex-col py-12">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/clubs/${slug}`} className="flex items-center gap-1 text-gray-500">
              <ArrowLeft className="h-4 w-4" />
              Back to {clubName}
            </Link>
          </Button>
        </div>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-navy">Members</h1>
            <p className="mt-1 text-gray-500">{filtered.length} members</p>
          </div>
          <div className="relative sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Users className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className="text-lg text-gray-400">
              {search ? 'No members matching your search.' : 'No members listed yet.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((member: any, i: number) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.3 }}
              >
                <Card className="transition-all hover:shadow-md">
                  <CardContent className="flex items-center gap-4 p-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-navy to-cranberry text-white">
                        {member.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-navy truncate">{member.full_name}</p>
                      {member.rotaract_id && (
                        <p className="text-xs text-gray-400">ID: {member.rotaract_id}</p>
                      )}
                      {member.occupation && (
                        <p className="text-xs text-gray-400 truncate">{member.occupation}</p>
                      )}
                    </div>
                    <Badge variant={member.role === 'club_admin' ? 'cranberry' : 'outline'} className="text-[10px]">
                      {member.role === 'club_admin' ? 'Admin' : 'Member'}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
