'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'
import { formatDateTime, formatTimeAgo } from '@/lib/utils/date'
import {
  Users,
  Building2,
  Calendar,
  ClipboardCheck,
  HardDrive,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface QuickStats {
  totalUsers: number
  totalClubs: number
  totalEvents: number
  totalRegistrations: number
}

interface StorageInfo {
  name: string
  size: number
  sizeLabel: string
}

interface SystemHealth {
  label: string
  status: 'healthy' | 'warning' | 'error'
  message: string
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<QuickStats | null>(null)
  const [storage, setStorage] = useState<StorageInfo[]>([])
  const [auditEntries, setAuditEntries] = useState<any[]>([])
  const [healthChecks, setHealthChecks] = useState<SystemHealth[]>([])
  const [regChart, setRegChart] = useState<{ date: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      const [
        { count: totalUsers },
        { count: totalClubs },
        { count: totalEvents },
        { count: totalRegistrations },
        { data: buckets },
        auditResponse,
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('clubs').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('registrations').select('*', { count: 'exact', head: true }),
        supabase.storage.listBuckets(),
        supabase
          .from('audit_logs')
          .select('*, actor:actor_id(*)')
          .order('created_at', { ascending: false })
          .limit(10),
      ])

      setStats({
        totalUsers: totalUsers || 0,
        totalClubs: totalClubs || 0,
        totalEvents: totalEvents || 0,
        totalRegistrations: totalRegistrations || 0,
      })

      const storageInfo: StorageInfo[] = []
      if (buckets) {
        for (const bucket of buckets) {
          const { data: files } = await supabase.storage.from(bucket.name).list('', { limit: 1000 })
          let totalSize = 0
          if (files) {
            for (const file of files) {
              totalSize += file.metadata?.size || 0
            }
          }
          const mb = totalSize / (1024 * 1024)
          storageInfo.push({
            name: bucket.name,
            size: totalSize,
            sizeLabel: mb >= 1 ? `${mb.toFixed(1)} MB` : `${(totalSize / 1024).toFixed(1)} KB`,
          })
        }
      }
      setStorage(storageInfo)

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - i)
        return d.toISOString().split('T')[0]
      }).reverse()

      const { data: regData } = await supabase
        .from('registrations')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(500)

      const regCountByDate = last7Days.map((date) => ({
        date,
        count: (regData || []).filter(
          (r: any) => r.created_at?.startsWith(date)
        ).length,
      }))
      setRegChart(regCountByDate)

      setAuditEntries(auditResponse?.data || [])

      const checks: SystemHealth[] = []
      const { error: dbCheck } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).limit(1)
      checks.push({
        label: 'Database Connection',
        status: dbCheck ? 'error' : 'healthy',
        message: dbCheck ? 'Failed to connect to database' : 'Connected successfully',
      })

      const { data: authCheck } = await supabase.auth.getSession()
      checks.push({
        label: 'Authentication Service',
        status: authCheck ? 'healthy' : 'error',
        message: authCheck ? 'Auth service operational' : 'Auth service unavailable',
      })

      if (buckets) {
        checks.push({
          label: 'Storage Service',
          status: buckets.length > 0 ? 'healthy' : 'warning',
          message: `${buckets.length} bucket(s) available`,
        })
      }

      const { count: errorCount } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .ilike('action', '%error%')

      checks.push({
        label: 'Error Rate',
        status: (errorCount || 0) > 10 ? 'warning' : 'healthy',
        message: `${errorCount || 0} logged errors`,
      })

      setHealthChecks(checks)
    } catch (err) {
      console.error('Failed to load dashboard', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-amber-900">Super Admin Dashboard</h1>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    )
  }

  const kpiCards = [
    { title: 'Total Users', value: stats?.totalUsers ?? 0, icon: Users, color: 'text-navy', bg: 'bg-navy/10' },
    { title: 'Total Clubs', value: stats?.totalClubs ?? 0, icon: Building2, color: 'text-cranberry', bg: 'bg-cranberry/10' },
    { title: 'Total Events', value: stats?.totalEvents ?? 0, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-100' },
    { title: 'Total Registrations', value: stats?.totalRegistrations ?? 0, icon: ClipboardCheck, color: 'text-green-600', bg: 'bg-green-100' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-amber-900">Super Admin Dashboard</h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
              <LineChart data={regChart}>
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
            <CardTitle className="text-navy">System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {healthChecks.map((check) => (
              <div key={check.label} className="flex items-center justify-between rounded-2xl border p-3">
                <div className="flex items-center gap-3">
                  {check.status === 'healthy' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : check.status === 'warning' ? (
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-navy">{check.label}</p>
                    <p className="text-xs text-gray-500">{check.message}</p>
                  </div>
                </div>
                <Badge variant={check.status === 'healthy' ? 'default' : check.status === 'warning' ? 'secondary' : 'destructive'}>
                  {check.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-navy">Storage Usage</CardTitle>
            <CardDescription>Per-bucket storage breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {storage.length === 0 ? (
              <p className="text-sm text-gray-400">No storage buckets found</p>
            ) : (
              storage.map((bucket) => {
                const maxSize = Math.max(...storage.map((s) => s.size), 1)
                const pct = (bucket.size / maxSize) * 100
                return (
                  <div key={bucket.name}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium text-navy">{bucket.name}</span>
                      <span className="text-gray-500">{bucket.sizeLabel}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full bg-cranberry transition-all"
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-navy">Recent Audit Log</CardTitle>
            <CardDescription>Latest 10 system actions</CardDescription>
          </CardHeader>
          <CardContent className="max-h-80 space-y-2 overflow-y-auto">
            {auditEntries.length === 0 ? (
              <p className="text-sm text-gray-400">No audit entries</p>
            ) : (
              auditEntries.map((log: any) => (
                <div key={log.id} className="rounded-2xl border p-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-navy">
                      {log.actor?.full_name || log.actor_id?.slice(0, 8) || 'System'}
                    </span>
                    <span className="text-xs text-gray-400">{formatTimeAgo(log.created_at)}</span>
                  </div>
                  <p className="mt-0.5 text-gray-600">
                    <Badge variant="outline" className="mr-1 text-xs">{log.action}</Badge>
                    {log.table_name && <>on <span className="font-mono text-xs">{log.table_name}</span></>}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
