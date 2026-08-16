import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getClubBySlug } from '@/lib/supabase/queries/clubs.server'
import { getEventsByHostClub } from '@/lib/supabase/queries/events'
import { formatEventDateRange } from '@/lib/utils/date'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, MapPin, ArrowLeft, Clock } from 'lucide-react'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ClubEventsPage({ params }: Props) {
  const { slug } = await params
  let club
  try {
    club = await getClubBySlug(slug)
  } catch {
    notFound()
  }
  const events = await getEventsByHostClub(club.id).catch(() => [])

  const now = new Date()
  const upcoming = events.filter((e) => new Date(e.end_at) > now)
  const past = events.filter((e) => new Date(e.end_at) <= now)

  return (
    <div className="flex flex-col py-12">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/clubs/${slug}`} className="flex items-center gap-1 text-gray-500">
              <ArrowLeft className="h-4 w-4" />
              Back to {club.name}
            </Link>
          </Button>
        </div>

        <h1 className="mb-2 text-3xl font-bold text-navy">Events</h1>
        <p className="mb-8 text-gray-500">Events organized by {club.name}</p>

        {events.length === 0 ? (
          <div className="py-20 text-center">
            <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className="text-lg text-gray-400">No events yet from this club.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {upcoming.length > 0 && (
              <div>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-navy">
                  <Clock className="h-5 w-5 text-green-500" />
                  Upcoming ({upcoming.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {upcoming.map((e) => (
                    <Link key={e.id} href={`/events/${e.slug}`}>
                      <Card className="group transition-all hover:shadow-md">
                        <CardContent className="flex gap-4 p-4">
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-navy/5 text-center">
                            <div>
                              <p className="text-xl font-bold text-cranberry">{new Date(e.start_at).getDate()}</p>
                              <p className="text-xs font-medium text-gray-400">
                                {new Date(e.start_at).toLocaleString('default', { month: 'short' })}
                              </p>
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-navy group-hover:text-cranberry">{e.title}</p>
                            <p className="mt-1 text-sm text-gray-500">{formatEventDateRange(e.start_at, e.end_at)}</p>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {e.category && <Badge variant="outline" className="text-xs">{e.category}</Badge>}
                              {e.location && (
                                <span className="flex items-center gap-1 text-xs text-gray-400">
                                  <MapPin className="h-3 w-3" />
                                  {e.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {past.length > 0 && (
              <div>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-navy">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  Past ({past.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {past.map((e) => (
                    <Link key={e.id} href={`/events/${e.slug}`}>
                      <Card className="group opacity-70 transition-all hover:opacity-100 hover:shadow-md">
                        <CardContent className="flex gap-4 p-4">
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-center">
                            <div>
                              <p className="text-xl font-bold text-gray-400">{new Date(e.start_at).getDate()}</p>
                              <p className="text-xs font-medium text-gray-400">
                                {new Date(e.start_at).toLocaleString('default', { month: 'short' })}
                              </p>
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-600">{e.title}</p>
                            <p className="mt-1 text-sm text-gray-400">{formatEventDateRange(e.start_at, e.end_at)}</p>
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
      </div>
    </div>
  )
}
