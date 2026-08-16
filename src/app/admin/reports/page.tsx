'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'
import { Download, Calendar, Loader2, FileSpreadsheet, Users, BarChart3, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

function downloadCSV(data: Record<string, any>[], filename: string) {
  if (data.length === 0) { toast.error('No data to export'); return }
  const headers = Object.keys(data[0])
  const csv = [
    headers.join(','),
    ...data.map((row) => headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast.success(`${filename}.csv downloaded`)
}

export default function AdminReportsPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const supabase = createClient()

  async function exportEventAttendance() {
    setLoading('attendance')
    try {
      const { data } = await supabase
        .from('registrations')
        .select('*, event:event_id(title, start_at), profile:profile_id(full_name, email, phone, club:club_id(name))')
        .order('event_id', { ascending: true })

      if (!data) { toast.error('No data found'); return }

      const rows = data.map((r: any) => ({
        Event: r.event?.title || 'N/A',
        'Event Date': r.event?.start_at ? formatDate(r.event.start_at) : 'N/A',
        Name: r.profile?.full_name || r.guest_name || 'Guest',
        Email: r.profile?.email || r.guest_email || '',
        Phone: r.profile?.phone || r.guest_phone || '',
        Club: r.profile?.club?.name || r.guest_club || '',
        Status: r.status,
        'Checked In': r.status === 'attended' ? 'Yes' : 'No',
        'Checked In At': r.checked_in_at ? formatDate(r.checked_in_at, 'MMM d, h:mm a') : '',
        'Registered At': formatDate(r.registered_at, 'MMM d, h:mm a'),
        'Ticket Number': r.ticket_number || '',
      }))

      downloadCSV(rows, 'event-attendance-report')
    } catch { toast.error('Failed to generate report') }
    finally { setLoading(null) }
  }

  async function exportMemberDirectory() {
    setLoading('members')
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*, club:club_id(name)')
        .order('full_name')

      if (!data) { toast.error('No data found'); return }

      const rows = data.map((p: any) => ({
        Name: p.full_name || '',
        Email: p.email || '',
        Phone: p.phone || '',
        Role: p.role || '',
        Club: p.club?.name || '',
        'Rotaract ID': p.rotaract_id || '',
        Occupation: p.occupation || '',
        'Graduation Year': p.graduation_year || '',
        City: p.club?.city || '',
        Active: p.is_active ? 'Yes' : 'No',
        Verified: p.is_verified ? 'Yes' : 'No',
        'Joined Date': formatDate(p.created_at),
      }))

      downloadCSV(rows, 'member-directory')
    } catch { toast.error('Failed to generate report') }
    finally { setLoading(null) }
  }

  async function exportRegistrationSummary() {
    setLoading('summary')
    try {
      let query = supabase
        .from('events')
        .select('id, title, start_at, status, capacity, host_club:host_club_id(name)')
        .order('start_at', { ascending: false })

      const { data: events } = await query
      if (!events || events.length === 0) { toast.error('No events found'); return }

      const rows: Record<string, any>[] = []

      for (const event of events) {
        const { count: total } = await supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id)

        const { count: confirmed } = await supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id)
          .eq('status', 'confirmed')

        const { count: attended } = await supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id)
          .eq('status', 'attended')

        const { count: cancelled } = await supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id)
          .eq('status', 'cancelled')

        rows.push({
          Event: event.title,
          Date: formatDate(event.start_at),
          Club: ((event as any).host_club?.[0]?.name) || ((event as any).host_club?.name) || '',
          Status: event.status,
          Capacity: event.capacity || 'Unlimited',
          'Total Registrations': total || 0,
          Confirmed: confirmed || 0,
          Attended: attended || 0,
          Cancelled: cancelled || 0,
          'Fill Rate': event.capacity ? `${Math.round(((total || 0) / event.capacity) * 100)}%` : 'N/A',
        })
      }

      downloadCSV(rows, 'registration-summary')
    } catch { toast.error('Failed to generate report') }
    finally { setLoading(null) }
  }

  async function exportMonthlyActivity() {
    setLoading('monthly')
    try {
      const from = dateFrom || '2024-01-01'
      const to = dateTo || new Date().toISOString().split('T')[0]

      const [events, posts, registrations] = await Promise.all([
        supabase.from('events').select('id, title, created_at, status').gte('created_at', from).lte('created_at', to + 'T23:59:59').order('created_at'),
        supabase.from('posts').select('id, title, created_at, status').gte('created_at', from).lte('created_at', to + 'T23:59:59').order('created_at'),
        supabase.from('registrations').select('id, registered_at, status').gte('registered_at', from).lte('registered_at', to + 'T23:59:59'),
      ])

      const rows = [
        { Metric: 'Events Created', Value: events.data?.length || 0 },
        { Metric: 'Events Published', Value: events.data?.filter((e) => e.status === 'published').length || 0 },
        { Metric: 'Posts Created', Value: posts.data?.length || 0 },
        { Metric: 'Posts Published', Value: posts.data?.filter((p) => p.status === 'published').length || 0 },
        { Metric: 'Total Registrations', Value: registrations.data?.length || 0 },
        { Metric: 'Confirmed', Value: registrations.data?.filter((r) => r.status === 'confirmed').length || 0 },
        { Metric: 'Attended', Value: registrations.data?.filter((r) => r.status === 'attended').length || 0 },
        { Metric: 'Cancelled', Value: registrations.data?.filter((r) => r.status === 'cancelled').length || 0 },
        { 'Date Range': `${from} to ${to}` },
      ]

      downloadCSV(rows, `monthly-activity-${from}-${to}`)
    } catch { toast.error('Failed to generate report') }
    finally { setLoading(null) }
  }

  const reports = [
    {
      title: 'Event Attendance',
      description: 'Export all registrations with attendance status across all events',
      icon: Calendar,
      color: 'text-cranberry',
      bg: 'bg-cranberry/10',
      action: exportEventAttendance,
      key: 'attendance',
    },
    {
      title: 'Member Directory',
      description: 'Export all registered members with their profiles and club info',
      icon: Users,
      color: 'text-navy',
      bg: 'bg-navy/10',
      action: exportMemberDirectory,
      key: 'members',
    },
    {
      title: 'Registration Summary',
      description: 'Per-event registration breakdown with capacity fill rates',
      icon: BarChart3,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
      action: exportRegistrationSummary,
      key: 'summary',
    },
    {
      title: 'Monthly Activity',
      description: 'Aggregated activity metrics within a date range',
      icon: Activity,
      color: 'text-green-600',
      bg: 'bg-green-100',
      action: exportMonthlyActivity,
      key: 'monthly',
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-navy">Reports</h1>

      <div className="grid gap-6 sm:grid-cols-2">
        {reports.map((report) => (
          <Card key={report.key}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={cn('rounded-2xl p-3', report.bg)}>
                    <report.icon className={cn('h-6 w-6', report.color)} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy">{report.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                  </div>
                </div>
              </div>
              <Button
                className="mt-4 w-full"
                variant="outline"
                onClick={report.action}
                disabled={loading === report.key}
              >
                {loading === report.key ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Export CSV
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-navy">Date Range for Monthly Activity</CardTitle>
          <CardDescription>Set the date range for the monthly activity report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">From</Label>
              <Input id="dateFrom" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">To</Label>
              <Input id="dateTo" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <Button variant="outline" onClick={() => { setDateFrom(''); setDateTo('') }}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
