import Link from 'next/link'
import type { Metadata } from 'next'
import { getSiteSettingsServer, getLeadershipYearsServer, getLeadershipByYearServer } from '@/lib/supabase/queries/settings.server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Target, Eye, Award, Users, Globe, Heart, BookOpen, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatRotaryYear } from '@/lib/utils/date'

const iconMap: Record<string, typeof Award> = {
  Award, Globe, Heart, BookOpen, Users, Sparkles, Target, Eye,
}

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Learn about Rotaract District 2451 Egypt — our mission, vision, leadership team, achievements, and the Rotary movement empowering young leaders aged 18-30.',
  alternates: { canonical: '/about' },
}

const defaultAbout = {
  hero_title: 'About Rotaract',
  hero_subtitle: 'Empowering young leaders across Egypt to create positive change through service, professional development, and fellowship.',
  mission: 'To empower young professionals and students in Egypt to develop leadership skills, foster community service, and promote international understanding through the Rotaract movement.',
  vision: 'To be the leading youth organization in Egypt, creating a network of empowered young leaders who drive sustainable change in their communities and beyond.',
  about_rotary_title: 'About Rotary',
  about_rotary_text: 'Rotary International is a global network of 1.4 million neighbors, friends, and problem-solvers who see a world where people unite and take action to create lasting change.\n\nRotary focuses on seven areas of focus: Peace and conflict prevention, disease prevention and treatment, water and sanitation, maternal and child health, basic education and literacy, economic and community development, and supporting the environment.',
  about_rotaract_title: 'About Rotaract',
  about_rotaract_text: 'Rotaract brings together young leaders aged 18-30 to exchange ideas with leaders in the community, develop leadership and professional skills, and have fun through service.\n\nWe have clubs across Egypt that meet regularly to plan service projects, organize professional development workshops, and build lasting friendships.',
  achievements_title: 'District Achievements',
  achievements_subtitle: 'Milestones and recognition',
  achievements: [
    { label: 'Best District Award', year: '2024', icon: 'Award' },
    { label: 'Largest Cleanup Campaign', year: '2023', icon: 'Globe' },
    { label: 'Community Impact Award', year: '2024', icon: 'Heart' },
    { label: 'Literacy Program Excellence', year: '2023', icon: 'BookOpen' },
    { label: 'Highest Membership Growth', year: '2024', icon: 'Users' },
    { label: 'Innovation in Service', year: '2023', icon: 'Sparkles' },
  ] as { label: string; year: string; icon?: string }[],
  stats: [
    { label: 'Active Clubs', value: '25', icon: 'Users' },
    { label: 'Total Members', value: '1200', icon: 'Users' },
    { label: 'Annual Events', value: '45', icon: 'Calendar' },
    { label: 'Years Active', value: '10', icon: 'Globe' },
  ] as { label: string; value: string; icon?: string }[],
  join_title: 'Join the Movement',
  join_subtitle: 'Become part of a global network of young leaders making a difference.',
}

export default async function AboutPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const { year: selectedYear } = await searchParams
  const [leadershipYears, settings] = await Promise.all([
    getLeadershipYearsServer().catch(() => [] as string[]),
    getSiteSettingsServer(['about_page']).catch(() => null),
  ])

  const currentYear = leadershipYears.includes(selectedYear || '') ? selectedYear! : leadershipYears[0] || new Date().getFullYear().toString()
  const leadership = await getLeadershipByYearServer(currentYear).catch(() => [])

  const about = { ...defaultAbout, ...(settings?.about_page as Partial<typeof defaultAbout> || {}) }

  return (
    <div className="flex flex-col">
      <section className="bg-gradient-to-br from-navy via-[#0a4a82] to-cranberry/50 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">{about.hero_title}</h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-300">
            {about.hero_subtitle}
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2">
            <Card className="border-gold/20">
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10">
                  <Target className="h-6 w-6 text-gold" />
                </div>
                <h2 className="mb-3 text-2xl font-bold text-navy">Our Mission</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{about.mission}</p>
              </CardContent>
            </Card>
            <Card className="border-gold/20">
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10">
                  <Eye className="h-6 w-6 text-gold" />
                </div>
                <h2 className="mb-3 text-2xl font-bold text-navy">Our Vision</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{about.vision}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center">
            <h2 className="mb-2 text-3xl font-bold text-navy">About Rotary & Rotaract</h2>
            <p className="mx-auto max-w-2xl text-gray-500">
              Rotaract is a Rotary International program for young leaders aged 18-30
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-8">
              <h3 className="mb-4 text-xl font-bold text-rotary-blue">{about.about_rotary_title}</h3>
              <div className="space-y-4">
                {about.about_rotary_text.split('\n\n').map((p, i) => (
                  <p key={i} className="text-gray-600 leading-relaxed">{p}</p>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-cranberry/20 bg-cranberry/5 p-8">
              <h3 className="mb-4 text-xl font-bold text-cranberry">{about.about_rotaract_title}</h3>
              <div className="space-y-4">
                {about.about_rotaract_text.split('\n\n').map((p, i) => (
                  <p key={i} className="text-gray-600 leading-relaxed">{p}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center">
            <h2 className="mb-2 text-3xl font-bold text-navy">District Leadership</h2>
            <p className="text-gray-500">Meet the team leading the District</p>
          </div>
          {leadershipYears.length > 1 && (
            <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
              {leadershipYears.map((y) => (
                <Link
                  key={y}
                  href={`/about?year=${y}`}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                    currentYear === y
                      ? 'bg-cranberry text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {formatRotaryYear(y)}
                </Link>
              ))}
            </div>
          )}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {leadership.length === 0 ? (
              <p className="col-span-full py-12 text-center text-gray-400">
                No leadership entries for {formatRotaryYear(currentYear)}
              </p>
            ) : (
              leadership.map((leader) => (
                <Card key={leader.id} className="text-center">
                  <CardContent className="p-6">
                    <div className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full border-2 border-gold">
                      {leader.photo_url ? (
                        <img
                          src={leader.photo_url}
                          alt={leader.name || leader.position}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-navy to-cranberry text-2xl font-bold text-gold">
                          {leader.name?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <h3 className="mb-1 font-semibold text-navy">
                      {leader.name || 'Position Open'}
                    </h3>
                    <p className="mb-1 text-sm font-medium text-cranberry">{leader.position}</p>
                    {leader.bio && <p className="mt-3 text-sm text-gray-500">{leader.bio}</p>}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center">
            <h2 className="mb-2 text-3xl font-bold text-navy">{about.achievements_title}</h2>
            <p className="text-gray-500">{about.achievements_subtitle}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {about.achievements.map((achievement, i) => {
              const Icon = iconMap[achievement.icon || 'Award'] || Award
              return (
                <div
                  key={i}
                  className="flex items-center gap-4 rounded-2xl border border-gold/10 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold/10">
                    <Icon className="h-6 w-6 text-gold" />
                  </div>
                  <div>
                    <p className="font-medium text-navy">{achievement.label}</p>
                    <p className="text-xs text-gray-400">{achievement.year}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 md:grid-cols-4">
            {about.stats.map((stat, i) => {
              const Icon = iconMap[stat.icon || 'Users'] || Users
              return (
                <div key={i} className="rounded-2xl border border-gold/10 bg-white p-6 text-center shadow-sm">
                  <Icon className="mx-auto mb-3 h-8 w-8 text-gold" />
                  <p className="text-3xl font-bold text-navy">{stat.value.replace(/\+$/, '')}</p>
                  <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-cranberry to-deep-cranberry py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">{about.join_title}</h2>
          <p className="mb-8 text-lg text-white/80">
            {about.join_subtitle}
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="secondary" size="lg" asChild>
              <Link href="/register">Join a Club</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/30 text-white hover:bg-white/10"
              asChild
            >
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
