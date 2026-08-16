'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { formatDate, formatTimeAgo } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'
import { FileText, Calendar, Loader2, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface DashboardData {
  postCount: number
  eventCount: number
  upcomingCount: number
  recentPosts: any[]
  recentEvents: any[]
}

export default function ClubAdminDashboard() {
  const { profile, loading: userLoading } = useUser()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!profile) return
    loadDashboard()
  }, [profile])

  async function loadDashboard() {
    if (!profile?.club_id) { setLoading(false); return }

    try {
      const clubId = profile.club_id

      const [
        { count: postCount },
        { count: eventCount },
        { count: upcomingCount },
        postsRes,
        eventsRes,
      ] = await Promise.all([
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('club_id', clubId),
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('host_club_id', clubId),
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('host_club_id', clubId).gte('start_at', new Date().toISOString()),
        supabase.from('posts').select('id, title, status, approval_status, created_at, slug').eq('club_id', clubId).order('created_at', { ascending: false }).limit(5),
        supabase.from('events').select('id, title, status, approval_status, start_at, slug').eq('host_club_id', clubId).order('created_at', { ascending: false }).limit(5),
      ])

      setData({
        postCount: postCount || 0,
        eventCount: eventCount || 0,
        upcomingCount: upcomingCount || 0,
        recentPosts: postsRes.data || [],
        recentEvents: eventsRes.data || [],
      })
    } catch (err) {
      console.error('Failed to load dashboard', err)
    } finally {
      setLoading(false)
    }
  }

  if (userLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  const kpiCards = [
    {
      title: 'My Posts',
      value: data?.postCount ?? 0,
      icon: FileText,
      color: 'text-navy',
      bg: 'bg-navy/10',
    },
    {
      title: 'My Events',
      value: data?.eventCount ?? 0,
      icon: Calendar,
      color: 'text-cranberry',
      bg: 'bg-cranberry/10',
    },
    {
      title: 'Upcoming Events',
      value: data?.upcomingCount ?? 0,
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-navy">
        Welcome, {profile?.full_name || 'Club Admin'}
      </h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{kpi.title}</p>
                  <p className="mt-1 text-3xl font-bold text-navy">{kpi.value}</p>
                </div>
                <div className={cn('rounded-2xl p-3', kpi.bg)}>
                  <kpi.icon className={cn('h-6 w-6', kpi.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-navy">Recent Posts</CardTitle>
          </CardHeader>
          <CardContent>
            {(!data?.recentPosts || data.recentPosts.length === 0) ? (
              <p className="py-8 text-center text-sm text-gray-400">No posts yet</p>
            ) : (
              <div className="space-y-3">
                {data.recentPosts.map((post: any) => (
                  <div key={post.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-navy">{post.title}</p>
                      <p className="text-xs text-gray-400">{formatTimeAgo(post.created_at)}</p>
                    </div>
                    <Badge variant="outline" className={cn(
                      post.approval_status === 'approved' ? 'bg-green-100 text-green-700' :
                      post.approval_status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    )}>
                      {post.approval_status || post.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-navy">Recent Events</CardTitle>
          </CardHeader>
          <CardContent>
            {(!data?.recentEvents || data.recentEvents.length === 0) ? (
              <p className="py-8 text-center text-sm text-gray-400">No events yet</p>
            ) : (
              <div className="space-y-3">
                {data.recentEvents.map((event: any) => (
                  <div key={event.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-navy">{event.title}</p>
                      <p className="text-xs text-gray-400">{formatDate(event.start_at)}</p>
                    </div>
                    <Badge variant="outline" className={cn(
                      event.approval_status === 'approved' ? 'bg-green-100 text-green-700' :
                      event.approval_status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    )}>
                      {event.approval_status || event.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
