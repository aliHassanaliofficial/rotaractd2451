import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { getClubBySlug } from '@/lib/supabase/queries/clubs.server'
import { getClubOfficers, getClubMembers } from '@/lib/supabase/queries/clubs'
import { getEventsByHostClub } from '@/lib/supabase/queries/events'
import { getPublishedAlbums } from '@/lib/supabase/queries/gallery'
import { formatDate, formatEventDateRange } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { MapPin, Globe, Mail, Phone, Calendar, Users, Award, MessageCircle, Camera, ExternalLink, Quote } from 'lucide-react'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params
    const club = await getClubBySlug(slug)
    return {
      title: club.name,
      description: club.description || `Rotaract club at ${club.university || club.city}`,
    }
  } catch {
    return { title: 'Club Not Found' }
  }
}

export default async function ClubDetailPage({ params }: Props) {
  const { slug } = await params
  let club
  try {
    club = await getClubBySlug(slug)
  } catch {
    notFound()
  }

  const [officers, members, events, albums] = await Promise.all([
    getClubOfficers(club.id).catch(() => []),
    getClubMembers(club.id).catch(() => []),
    getEventsByHostClub(club.id).catch(() => []),
    getPublishedAlbums().catch(() => []),
  ])

  const clubAlbums = albums.filter((a) => a.club_id === club.id)
  const upcomingEvents = events.filter((e) => new Date(e.end_at) > new Date()).slice(0, 6)
  const pastEvents = events.filter((e) => new Date(e.end_at) <= new Date()).slice(0, 6)

  const socialLinks = [
    { href: club.facebook, icon: MessageCircle, label: 'Facebook' },
    { href: club.instagram, icon: Camera, label: 'Instagram' },
    { href: club.linkedin, icon: Globe, label: 'LinkedIn' },
    { href: club.website, icon: Globe, label: 'Website' },
  ].filter((s) => s.href)

  return (
    <div className="flex flex-col">
      <div className="relative h-64 overflow-hidden md:h-80">
        {club.cover_url ? (
          <Image src={club.cover_url} alt={club.name} fill className="object-cover" priority />
        ) : (
          <div className="h-full bg-gradient-to-r from-navy to-cranberry" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      </div>

      <div className="container mx-auto px-4">
        <div className="relative -mt-20 mb-8 flex flex-col items-center text-center md:flex-row md:items-end md:gap-6 md:text-left">
          <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow-xl">
            {club.logo_url ? (
              <Image src={club.logo_url} alt={club.name} width={128} height={128} className="object-cover" />
            ) : (
              <span className="text-5xl font-bold text-navy">{club.name.charAt(0)}</span>
            )}
          </div>
          <div className="mt-4 md:mt-0 md:pb-2">
            <h1 className="text-3xl font-bold text-white drop-shadow-lg">{club.name}</h1>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-3 text-white/80 md:justify-start">
              {club.city && (
                <span className="flex items-center gap-1 text-sm">
                  <MapPin className="h-4 w-4" />
                  {club.city}
                </span>
              )}
              {club.university && (
                <span className="flex items-center gap-1 text-sm">
                  <Award className="h-4 w-4" />
                  {club.university}
                </span>
              )}
              <span className="flex items-center gap-1 text-sm">
                <Users className="h-4 w-4" />
                {club.member_count} members
              </span>
            </div>
          </div>
          <div className="mt-4 flex gap-2 md:ml-auto md:mt-0 md:pb-2">
            {socialLinks.map((s) => {
              const Icon = s.icon
              return (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="rounded-full bg-white/20 p-2 text-white transition-colors hover:bg-white/40">
                  <Icon className="h-4 w-4" />
                </a>
              )
            })}
          </div>
        </div>
      </div>

      <section className="pb-16">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-8 w-full justify-start overflow-x-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="officers">Officers</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="gallery">Gallery</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                  {club.description && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-navy">About</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="leading-relaxed text-gray-600 whitespace-pre-line">{club.description}</p>
                      </CardContent>
                    </Card>
                  )}

                  <div className="grid gap-6 sm:grid-cols-2">
                    {club.mission && (
                      <Card>
                        <CardHeader>
                          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-2xl bg-gold/10">
                            <Quote className="h-4 w-4 text-gold" />
                          </div>
                          <CardTitle className="text-navy">Mission</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600">{club.mission}</p>
                        </CardContent>
                      </Card>
                    )}
                    {club.vision && (
                      <Card>
                        <CardHeader>
                          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-2xl bg-gold/10">
                            <Award className="h-4 w-4 text-gold" />
                          </div>
                          <CardTitle className="text-navy">Vision</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600">{club.vision}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {club.founded_year && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-navy">Club Info</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {club.charter_date && (
                            <div>
                              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Charter Date</p>
                              <p className="text-sm font-medium text-navy">{formatDate(club.charter_date)}</p>
                            </div>
                          )}
                          {club.founded_year && (
                            <div>
                              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Founded</p>
                              <p className="text-sm font-medium text-navy">{club.founded_year}</p>
                            </div>
                          )}
                          {club.meeting_day && (
                            <div>
                              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Meeting</p>
                              <p className="text-sm font-medium text-navy">
                                {club.meeting_day}{club.meeting_time ? ` at ${club.meeting_time}` : ''}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <aside className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-navy">Contact</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {club.email && (
                        <a href={`mailto:${club.email}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-cranberry">
                          <Mail className="h-4 w-4 text-gold" />
                          {club.email}
                        </a>
                      )}
                      {club.phone && (
                        <a href={`tel:${club.phone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-cranberry">
                          <Phone className="h-4 w-4 text-gold" />
                          {club.phone}
                        </a>
                      )}
                      {club.website && (
                        <a href={club.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-cranberry">
                          <Globe className="h-4 w-4 text-gold" />
                          Website
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {club.meeting_location && (
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                          <span>{club.meeting_location}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-navy">Quick Stats</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-navy">{members.length}</p>
                          <p className="text-xs text-gray-400">Members</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-navy">{events.length}</p>
                          <p className="text-xs text-gray-400">Events</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </aside>
              </div>
            </TabsContent>

            <TabsContent value="officers">
              {officers.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                  <p className="text-gray-400">No officers listed yet.</p>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {officers.map((officer) => (
                    <Card key={officer.id} className="text-center">
                      <CardContent className="p-6">
                        <Avatar className="mx-auto mb-4 h-20 w-20">
                          <AvatarImage src={officer.profile?.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-br from-navy to-cranberry text-2xl text-white">
                            {officer.profile?.full_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="font-semibold text-navy">{officer.profile?.full_name || 'Unknown'}</h3>
                        <Badge variant="cranberry" className="mt-2">{officer.position}</Badge>
                        <p className="mt-2 text-xs text-gray-400">{officer.year}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="members">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{members.length} members</p>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/clubs/${slug}/members`}>View All</Link>
                </Button>
              </div>
              {members.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                  <p className="text-gray-400">No members listed yet.</p>
                </div>
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {members.slice(0, 12).map((member) => (
                    <div key={member.id} className="flex items-center gap-3 rounded-2xl border p-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-br from-navy to-cranberry text-sm text-white">
                          {member.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-navy truncate">{member.full_name}</p>
                        {member.rotaract_id && <p className="text-xs text-gray-400">ID: {member.rotaract_id}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="events">
              {events.length === 0 ? (
                <div className="py-12 text-center">
                  <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                  <p className="text-gray-400">No events yet.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {upcomingEvents.length > 0 && (
                    <div>
                      <h3 className="mb-4 font-semibold text-navy">Upcoming Events</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        {upcomingEvents.map((e) => (
                          <Link key={e.id} href={`/events/${e.slug}`}>
                            <Card className="group transition-all hover:shadow-md">
                              <CardContent className="flex items-center gap-4 p-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-navy/5 text-center">
                                  <div>
                                    <p className="text-lg font-bold text-cranberry">{new Date(e.start_at).getDate()}</p>
                                    <p className="text-[10px] font-medium text-gray-400">{new Date(e.start_at).toLocaleString('default', { month: 'short' })}</p>
                                  </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-navy group-hover:text-cranberry">{e.title}</p>
                                  <p className="mt-0.5 text-xs text-gray-400">{e.location || e.category}</p>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {pastEvents.length > 0 && (
                    <div>
                      <h3 className="mb-4 font-semibold text-navy">Past Events</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        {pastEvents.map((e) => (
                          <Link key={e.id} href={`/events/${e.slug}`}>
                            <Card className="group transition-all hover:shadow-md opacity-70">
                              <CardContent className="flex items-center gap-4 p-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-center">
                                  <div>
                                    <p className="text-lg font-bold text-gray-400">{new Date(e.start_at).getDate()}</p>
                                    <p className="text-[10px] font-medium text-gray-400">{new Date(e.start_at).toLocaleString('default', { month: 'short' })}</p>
                                  </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-gray-500">{e.title}</p>
                                  <p className="mt-0.5 text-xs text-gray-400">{e.location || e.category}</p>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="gallery">
              {clubAlbums.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-gray-400">No photo albums yet.</p>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {clubAlbums.map((album) => (
                    <Link key={album.id} href={`/gallery/${album.slug}`}>
                      <Card className="group overflow-hidden">
                        <div className="relative h-48 overflow-hidden">
                          {album.cover_url ? (
                            <Image src={album.cover_url} alt={album.title} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-gradient-to-br from-navy to-cranberry" />
                          )}
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-medium text-navy group-hover:text-cranberry">{album.title}</h3>
                          <p className="mt-1 text-xs text-gray-400">
                            {album.media?.[0]?.count || 0} photos
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  )
}
