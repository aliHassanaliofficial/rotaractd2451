'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'
import { formatDate, formatTimeAgo } from '@/lib/utils/date'
import {
  Calendar,
  Users,
  TrendingUp,
  MessageSquare,
  ClipboardCheck,
  Plus,
  FileText,
  Bell,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const COLORS = ['#D91B5C', '#F7A81B', '#003865', '#10B981', '#6366F1', '#F59E0B', '#8B5CF6', '#EC4899']

interface DashboardStats {
  registrationsToday: number
  upcomingEvents: number
  newMembers: number
  unreadMessages: number
  pendingApprovals: number
}

interface ChartData {
  registrationsOverTime: { date: string; count: number }[]
  eventsByCategory: { name: string; value: number }[]
  membersByClub: { name: string; members: number }[]
  recentRegistrations: any[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const [
        { count: regToday },
        { count: upcoming },
        { count: newMembers },
        { count: unread },
        regData,
        eventsData,
        membersData,
      ] = await Promise.all([
        supabase.from('registrations').select('*', { count: 'exact', head: true }).gte('registered_at', today.toISOString()),
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'published').gte('start_at', new Date().toISOString()),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', new Date(new Date().setDate(1)).toISOString()),
        supabase.from('contact_messages').select('*', { count: 'exact', head: true }).eq('is_read', false),
        supabase.from('registrations').select('created_at').order('created_at', { ascending: false }).limit(100),
        supabase.from('events').select('category').eq('status', 'published'),
        supabase.from('clubs').select('name, member_count').eq('is_active', true).order('member_count', { ascending: false }).limit(10),
      ])

      const [{ count: pendingPosts }, { count: pendingEvents }] = await Promise.all([
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending'),
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending'),
      ])

      const { data: recent } = await supabase
        .from('registrations')
        .select('*, event:event_id(title), profile:profile_id(full_name, email)')
        .order('registered_at', { ascending: false })
        .limit(10)

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - i)
        return d.toISOString().split('T')[0]
      }).reverse()

      const regCountByDate = last7Days.map((date) => ({
        date,
        count: (regData?.data || []).filter(
          (r: any) => r.created_at?.startsWith(date)
        ).length,
      }))

      const catMap: Record<string, number> = {}
      for (const e of (eventsData?.data || []) as any[]) {
        if (e.category) {
          catMap[e.category] = (catMap[e.category] || 0) + 1
        }
      }

      setStats({
        registrationsToday: regToday || 0,
        upcomingEvents: upcoming || 0,
        newMembers: newMembers || 0,
        unreadMessages: unread || 0,
        pendingApprovals: (pendingPosts || 0) + (pendingEvents || 0),
      })

      setChartData({
        registrationsOverTime: regCountByDate,
        eventsByCategory: Object.entries(catMap).map(([name, value]) => ({ name, value })),
        membersByClub: (membersData?.data || []).map((c: any) => ({ name: c.name, members: c.member_count || 0 })),
        recentRegistrations: recent || [],
      })
    } catch (err) {
      console.error('Failed to load dashboard', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-navy">Dashboard</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    )
  }

  const kpiCards = [
    {
      title: 'Registrations Today',
      value: stats?.registrationsToday ?? 0,
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      title: 'Upcoming Events',
      value: stats?.upcomingEvents ?? 0,
      icon: Calendar,
      color: 'text-cranberry',
      bg: 'bg-cranberry/10',
    },
    {
      title: 'New Members This Month',
      value: stats?.newMembers ?? 0,
      icon: Users,
      color: 'text-navy',
      bg: 'bg-navy/10',
    },
    {
      title: 'Unread Messages',
      value: stats?.unreadMessages ?? 0,
      icon: MessageSquare,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
    },
    {
      title: 'Pending Approvals',
      value: stats?.pendingApprovals ?? 0,
      icon: ClipboardCheck,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-navy">Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/admin/events/new">
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" /> Create Event
            </Button>
          </Link>
          <Link href="/admin/posts/new">
            <Button size="sm" variant="outline">
              <FileText className="mr-1 h-4 w-4" /> New Post
            </Button>
          </Link>
          <Link href="/admin/notifications">
            <Button size="sm" variant="outline">
              <Bell className="mr-1 h-4 w-4" /> Notify
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
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
            <CardTitle className="text-navy">Registrations (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData?.registrationsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => new Date(v).toLocaleDateString('en', { weekday: 'short' })} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#D91B5C" strokeWidth={2} dot={{ fill: '#D91B5C' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-navy">Events by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={chartData?.eventsByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  dataKey="value"
                >
                  {(chartData?.eventsByCategory || []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-navy">Members by Club</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData?.membersByClub} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="members" fill="#003865" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-navy">Recent Registrations</CardTitle>
            <CardDescription>Latest 10 registrations across all events</CardDescription>
          </div>
          <Link href="/admin/events">
            <Button variant="outline" size="sm">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium uppercase text-gray-500">
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">Event</th>
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {(chartData?.recentRegistrations || []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400">
                      No registrations yet
                    </td>
                  </tr>
                ) : (
                  (chartData?.recentRegistrations || []).map((reg: any) => (
                    <tr key={reg.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium text-navy">
                        {reg.profile?.full_name || reg.guest_name || 'Guest'}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">{reg.event?.title || 'N/A'}</td>
                      <td className="py-3 pr-4 text-gray-500">{formatDate(reg.registered_at)}</td>
                      <td className="py-3">
                        <Badge variant={reg.status === 'confirmed' ? 'default' : reg.status === 'attended' ? 'secondary' : 'outline'}>
                          {reg.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
