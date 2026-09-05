import Link from 'next/link'
import Image from 'next/image'
import { getUpcomingEvents } from '@/lib/supabase/queries/events'
import { getPublishedPosts as getPosts, getPinnedAnnouncements as getPinned } from '@/lib/supabase/queries/posts'
import { getActiveClubs as getClubs } from '@/lib/supabase/queries/clubs'
import { getCurrentLeadership } from '@/lib/supabase/queries/settings'
import { getSiteSettingsServer } from '@/lib/supabase/queries/settings.server'
import { formatDate, formatEventDateRange, daysUntil } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Calendar, MapPin } from 'lucide-react'
import { HeroSlider } from './_components/HeroSlider'
import { StatsBar } from './_components/StatsBar'
import { AnnouncementTicker } from './_components/AnnouncementTicker'

const DEFAULT_HERO_SLIDES = [
  {
    title: 'Empowering Young Leaders',
    subtitle: 'Join the largest Rotaract network in Egypt. Make a difference in your community.',
    cta: { label: 'Explore Events', href: '/events' },
    image: '/hero/leadership.jpg',
    bgClass: 'from-navy/90 via-[#0a4a82]/80 to-[#0e2f4f]/70',
  },
  {
    title: 'Service Above Self',
    subtitle: 'Together we create lasting change through community service and professional development.',
    cta: { label: 'Our Clubs', href: '/clubs' },
    image: '/hero/service.jpg',
    bgClass: 'from-cranberry/90 to-cranberry/70',
  },
  {
    title: 'Connect. Grow. Lead.',
    subtitle: 'Build lifelong friendships, develop professional skills, and lead with purpose.',
    cta: { label: 'Join Us', href: '/register' },
    image: '/hero/connect.jpg',
    bgClass: 'from-navy/90 via-[#0a4a82]/80 to-gold/60',
  },
]

type HeroSlideSetting = {
  image_url: string
  title: string
  subtitle?: string
  cta_text?: string
  cta_link?: string
  sort_order?: number
  media_type?: 'image' | 'video'
  video_url?: string
}

function mapHeroSlides(list: HeroSlideSetting[] | undefined | null) {
  if (!Array.isArray(list) || list.length === 0) return DEFAULT_HERO_SLIDES
  return [...list]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((s) => ({
      title: s.title,
      subtitle: s.subtitle || '',
      cta: { label: s.cta_text || 'Learn More', href: s.cta_link || '/' },
      image: s.image_url || '',
      bgClass: 'from-navy/90 via-[#0a4a82]/80 to-[#0e2f4f]/70',
      mediaType: (s.media_type === 'video' && s.video_url ? 'video' : 'image') as 'image' | 'video',
      videoUrl: s.video_url,
      posterUrl: s.image_url || undefined,
    }))
}

export default async function HomePage() {
  const [events, posts, clubs, announcements, leadership, settings] = await Promise.all([
    getUpcomingEvents(6).catch(() => []),
    getPosts({ limit: 6 }).catch(() => []),
    getClubs({ limit: 12 }).catch(() => []),
    getPinned().catch(() => []),
    getCurrentLeadership().catch(() => []),
    getSiteSettingsServer(['hero_slides', 'welcome_message', 'district_theme', 'about_page']).catch(() => null),
  ])

  const governor = leadership?.find((l) => l.position === 'District Governor')
  const welcomeMsg = settings?.welcome_message as { title?: string; message?: string } | undefined
  const heroSlides = mapHeroSlides(settings?.hero_slides as HeroSlideSetting[] | undefined | null)

  const aboutStats = (settings?.about_page as { stats?: { label: string; value: string; icon?: string }[] } | undefined)?.stats

  const stats = [
    { label: aboutStats?.[0]?.label || 'Active Clubs', value: parseInt(aboutStats?.[0]?.value || '0') || clubs.length, icon: aboutStats?.[0]?.icon || 'users' },
    { label: aboutStats?.[1]?.label || 'Members', value: parseInt(aboutStats?.[1]?.value || '0'), icon: aboutStats?.[1]?.icon || 'users' },
    { label: aboutStats?.[2]?.label || 'Events This Year', value: parseInt(aboutStats?.[2]?.value || '0'), icon: aboutStats?.[2]?.icon || 'calendar' },
    { label: aboutStats?.[3]?.label || 'Years of Service', value: parseInt(aboutStats?.[3]?.value || '0'), icon: aboutStats?.[3]?.icon || 'clock' },
  ]

  return (
    <div className="flex flex-col">
      <HeroSlider slides={heroSlides} />

      <StatsBar stats={stats} />

      {announcements.length > 0 && <AnnouncementTicker announcements={announcements} />}

      <section className="relative isolate overflow-hidden py-16">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-grid-fade" />
        <div className="pointer-events-none absolute -left-20 top-20 -z-10 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-20 -z-10 h-64 w-64 rounded-full bg-cranberry/10 blur-3xl" />
        <div className="container mx-auto px-4">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-3xl font-bold text-navy">Upcoming Events</h2>
              <p className="mt-1 text-gray-500">Don&apos;t miss out on upcoming activities</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/events">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin">
            {events.map((event) => (
              <Link key={event.id} href={`/events/${event.slug}`} className="min-w-[320px] shrink-0">
                <Card className="group h-full overflow-hidden">
                  <div className="relative h-44 overflow-hidden">
                    {event.cover_url ? (
                      <Image src={event.cover_url} alt={event.title} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-navy to-cranberry">
                        <Calendar className="h-12 w-12 text-white/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      {event.category && (
                        <Badge variant="secondary" className="glass mb-1">{event.category}</Badge>
                      )}
                      <p className="text-sm text-white/90">
                        {daysUntil(event.start_at) > 0
                          ? `${daysUntil(event.start_at)} days away`
                          : 'Happening now'}
                      </p>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="mb-2 line-clamp-2 font-semibold text-navy group-hover:text-cranberry">
                      {event.title}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatEventDateRange(event.start_at, event.end_at)}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="relative bg-gradient-to-b from-gray-50/80 to-white py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-3xl font-bold text-navy">Latest News</h2>
              <p className="mt-1 text-gray-500">Stay informed with district updates</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/news">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.slice(0, 6).map((post) => (
              <Link key={post.id} href={`/news/${post.slug}`}>
                <Card className="group h-full overflow-hidden">
                  <div className="relative h-48 overflow-hidden">
                    {post.cover_url ? (
                      <Image src={post.cover_url} alt={post.title} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-navy/20 to-gold/20" />
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs text-gray-400">
                      {post.published_at && <span>{formatDate(post.published_at)}</span>}
                      {post.author && <span>• {post.author.full_name}</span>}
                    </div>
                    <h3 className="mb-2 line-clamp-2 font-semibold text-navy group-hover:text-cranberry">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="line-clamp-2 text-sm text-gray-500">{post.excerpt}</p>
                    )}
                    {post.tags && post.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {post.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden py-16">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-grid-fade" />
        <div className="pointer-events-none absolute -right-20 top-20 -z-10 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
        <div className="container mx-auto px-4">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-3xl font-bold text-navy">Our Clubs</h2>
              <p className="mt-1 text-gray-500">Discover Rotaract clubs across the district</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/clubs">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {clubs.slice(0, 8).map((club) => (
              <Link key={club.id} href={`/clubs/${club.slug}`}>
                <Card className="group text-center transition-all hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-navy to-cranberry p-0.5 shadow-soft">
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-white">
                        {club.logo_url ? (
                          <Image src={club.logo_url} alt={club.name} width={72} height={72} className="rounded-full object-cover" />
                        ) : (
                          <span className="text-xl font-bold text-navy">{club.name.charAt(0)}</span>
                        )}
                      </div>
                    </div>
                    <h3 className="mb-1 font-semibold text-navy group-hover:text-cranberry">{club.name}</h3>
                    {club.university && (
                      <p className="text-sm text-gray-500">{club.university}</p>
                    )}
                    <p className="mt-2 text-xs text-gray-400">{club.member_count} members</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {governor && (
        <section className="relative isolate overflow-hidden bg-gradient-to-br from-navy via-[#0a4a82] to-cranberry/50 py-16 text-white">
          <div className="pointer-events-none absolute -right-16 top-0 -z-10 h-56 w-56 rounded-full bg-gold/20 blur-3xl" />
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="mb-8 text-3xl font-bold text-gold">Message from the District Governor</h2>
              <div className="mb-6 flex justify-center">
                <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-gold">
                  {governor.photo_url ? (
                    <Image src={governor.photo_url} alt={governor.name || ''} width={128} height={128} className="object-cover" />
                  ) : (
                    <span className="text-4xl font-bold text-gold">
                      {governor.name?.charAt(0) || 'G'}
                    </span>
                  )}
                </div>
              </div>
              <p className="mb-2 text-xl font-semibold">
                {governor.name || 'District Governor'}
              </p>
              <p className="mb-6 text-gray-300">{governor.position}</p>
              <blockquote className="text-lg leading-relaxed text-gray-200">
                &ldquo;{welcomeMsg?.message || 'Welcome to Rotaract. Together, we are making a difference in our communities through service, leadership, and fellowship.'}&rdquo;
              </blockquote>
            </div>
          </div>
        </section>
      )}

      {/* <section className="border-t border-white/60 bg-gray-50/60 py-12">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-center text-2xl font-bold text-navy">Our Partners & Sponsors</h2>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-70 grayscale transition-all hover:opacity-100 hover:grayscale-0">
            {['Partner 1', 'Partner 2', 'Partner 3', 'Partner 4', 'Partner 5'].map((name) => (
              <div key={name} className="glass flex h-16 w-32 items-center justify-center rounded-2xl transition-transform duration-300 hover:-translate-y-1 hover:shadow-glow">
                <span className="text-sm font-medium text-gray-500">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      <section className="relative isolate overflow-hidden bg-gradient-to-br from-cranberry to-deep-cranberry py-12 text-white">
        <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-gold/20 blur-3xl" />
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">Ready to Make a Difference?</h2>
          <p className="mb-6 text-lg text-white/80">
            Join Rotaract today and become part of a global network of young leaders.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button variant="secondary" size="lg" asChild>
              <Link href="/register">Join a Club</Link>
            </Button>
            <Button variant="outline" size="lg" className="border-white/40 text-white hover:bg-white/15" asChild>
              <Link href="/about">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
