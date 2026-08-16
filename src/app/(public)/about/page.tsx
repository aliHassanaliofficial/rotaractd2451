import Link from 'next/link'
import Image from 'next/image'
import { getCurrentLeadership } from '@/lib/supabase/queries/settings'
import { getSiteSettingsServer } from '@/lib/supabase/queries/settings.server'
import { getActiveClubs } from '@/lib/supabase/queries/clubs'
import { getUpcomingEvents } from '@/lib/supabase/queries/events'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Target, Eye, Award, Users, Calendar, Globe, Shield, Heart, BookOpen, Sparkles } from 'lucide-react'

const achievements = [
  { icon: Award, label: 'Best District Award', year: '2024' },
  { icon: Globe, label: 'Largest Cleanup Campaign', year: '2023' },
  { icon: Heart, label: 'Community Impact Award', year: '2024' },
  { icon: BookOpen, label: 'Literacy Program Excellence', year: '2023' },
  { icon: Users, label: 'Highest Membership Growth', year: '2024' },
  { icon: Sparkles, label: 'Innovation in Service', year: '2023' },
]

export default async function AboutPage() {
  const [leadership, clubs, events, settings] = await Promise.all([
    getCurrentLeadership().catch(() => []),
    getActiveClubs().catch(() => []),
    getUpcomingEvents(3).catch(() => []),
    getSiteSettingsServer(['mission', 'vision']).catch(() => null),
  ])

  const mission = settings?.mission as string | undefined
  const vision = settings?.vision as string | undefined

  const stats = [
    { label: 'Active Clubs', value: clubs.length || 25, icon: Users },
    { label: 'Total Members', value: 1200, icon: Users },
    { label: 'Annual Events', value: 45, icon: Calendar },
    { label: 'Years Active', value: 10, icon: Globe },
  ]

  return (
    <div className="flex flex-col">
      <section className="bg-gradient-to-br from-navy via-[#0a4a82] to-cranberry/50 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">About Rotaract</h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-300">
            Empowering young leaders across Egypt to create positive change through service, professional development, and fellowship.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2">
            <Card className="border-gold/20">
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10">
                  <Target className="h-6 w-6 text-gold" />
                </div>
                <CardTitle className="text-2xl text-navy">Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  {mission || 'To empower young professionals and students in Egypt to develop leadership skills, foster community service, and promote international understanding through the Rotaract movement.'}
                </p>
              </CardContent>
            </Card>
            <Card className="border-gold/20">
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10">
                  <Eye className="h-6 w-6 text-gold" />
                </div>
                <CardTitle className="text-2xl text-navy">Our Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  {vision || 'To be the leading youth organization in Egypt, creating a network of empowered young leaders who drive sustainable change in their communities and beyond.'}
                </p>
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
              <h3 className="mb-4 text-xl font-bold text-rotary-blue">About Rotary</h3>
              <p className="mb-4 text-gray-600 leading-relaxed">
                Rotary International is a global network of 1.4 million neighbors, friends, and problem-solvers who see a world where people unite and take action to create lasting change.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Rotary focuses on seven areas of focus: Peace and conflict prevention, disease prevention and treatment, water and sanitation, maternal and child health, basic education and literacy, economic and community development, and supporting the environment.
              </p>
            </div>
            <div className="rounded-2xl border border-cranberry/20 bg-cranberry/5 p-8">
              <h3 className="mb-4 text-xl font-bold text-cranberry">About Rotaract</h3>
              <p className="mb-4 text-gray-600 leading-relaxed">
                Rotaract brings together young leaders aged 18-30 to exchange ideas with leaders in the community, develop leadership and professional skills, and have fun through service.
              </p>
              <p className="text-gray-600 leading-relaxed">
                We have clubs across Egypt that meet regularly to plan service projects, organize professional development workshops, and build lasting friendships.
              </p>
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {leadership.map((leader) => (
              <Card key={leader.id} className="text-center">
                <CardContent className="p-6">
                  <div className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full border-2 border-gold">
                    {leader.photo_url || leader.profile?.avatar_url ? (
                      <Image
                        src={leader.photo_url || leader.profile?.avatar_url || ''}
                        alt={leader.profile?.full_name || leader.position}
                        width={96}
                        height={96}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-navy to-cranberry text-2xl font-bold text-gold">
                        {leader.profile?.full_name?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  <h3 className="mb-1 font-semibold text-navy">
                    {leader.profile?.full_name || 'Position Open'}
                  </h3>
                  <p className="mb-1 text-sm font-medium text-cranberry">{leader.position}</p>
                  <p className="text-xs text-gray-400">{leader.year}</p>
                  {leader.bio && <p className="mt-3 text-sm text-gray-500">{leader.bio}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center">
            <h2 className="mb-2 text-3xl font-bold text-navy">District Achievements</h2>
            <p className="text-gray-500">Milestones and recognition</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {achievements.map((achievement) => {
              const Icon = achievement.icon
              return (
                <div
                  key={achievement.label}
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
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="rounded-2xl border border-gold/10 bg-white p-6 text-center shadow-sm">
                  <Icon className="mx-auto mb-3 h-8 w-8 text-gold" />
                  <p className="text-3xl font-bold text-navy">{stat.value}</p>
                  <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-cranberry to-deep-cranberry py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">Join the Movement</h2>
          <p className="mb-8 text-lg text-white/80">
            Become part of a global network of young leaders making a difference.
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
