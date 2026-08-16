'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDateTime } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'
import { Loader2, RefreshCw, Database, HardDrive, Activity, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

interface TableRowCount {
  table: string
  count: number
}

interface BucketInfo {
  name: string
  fileCount: number
  size: number
  sizeLabel: string
}

interface ErrorLog {
  id: string
  actor_id?: string
  action: string
  table_name?: string
  record_id?: string
  new_data?: any
  created_at: string
  actor?: { full_name: string }
}

interface HealthCheck {
  name: string
  status: 'healthy' | 'warning' | 'error'
  detail: string
  icon: any
}

export default function SuperAdminSystemPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'healthy' | 'error'>('healthy')
  const [buckets, setBuckets] = useState<BucketInfo[]>([])
  const [tableCounts, setTableCounts] = useState<TableRowCount[]>([])
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([])
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([])
  const supabase = createClient()

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    await runChecks()
    setLoading(false)
  }

  async function refresh() {
    setRefreshing(true)
    await runChecks()
    setRefreshing(false)
    toast.success('System check complete')
  }

  async function runChecks() {
    const checks: HealthCheck[] = []

    const { error: dbErr } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).limit(1)
    if (dbErr) {
      setConnectionStatus('error')
      checks.push({ name: 'Database Connection', status: 'error', detail: dbErr.message, icon: Database })
    } else {
      setConnectionStatus('healthy')
      checks.push({ name: 'Database Connection', status: 'healthy', detail: 'Connected to Supabase PostgreSQL', icon: Database })
    }

    const { data: session } = await supabase.auth.getSession()
    checks.push({
      name: 'Authentication',
      status: session ? 'healthy' : 'error',
      detail: session ? 'Auth service operational' : 'Auth service unavailable',
      icon: Activity,
    })

    const { data: bucketData, error: bucketErr } = await supabase.storage.listBuckets()
    if (bucketErr) {
      checks.push({ name: 'Storage Service', status: 'error', detail: bucketErr.message, icon: HardDrive })
    } else {
      const bucketInfo: BucketInfo[] = []
      for (const b of bucketData || []) {
        const { data: files } = await supabase.storage.from(b.name).list('', { limit: 1000 })
        let totalSize = 0
        const fileCount = files?.length || 0
        for (const f of files || []) {
          totalSize += f.metadata?.size || 0
        }
        const mb = totalSize / (1024 * 1024)
        bucketInfo.push({
          name: b.name,
          fileCount,
          size: totalSize,
          sizeLabel: mb >= 1 ? `${mb.toFixed(1)} MB` : `${(totalSize / 1024).toFixed(1)} KB`,
        })
      }
      setBuckets(bucketInfo)
      checks.push({
        name: 'Storage Service',
        status: 'healthy',
        detail: `${bucketInfo.length} buckets, ${bucketInfo.reduce((a, b) => a + b.fileCount, 0)} files`,
        icon: HardDrive,
      })
    }

    const tables = ['profiles', 'clubs', 'events', 'registrations', 'posts', 'gallery_albums', 'gallery_media', 'library_items', 'contact_messages', 'audit_logs', 'history_entries', 'district_leadership', 'site_settings']
    const counts: TableRowCount[] = []
    for (const table of tables) {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
      if (!error) counts.push({ table, count: count || 0 })
    }
    setTableCounts(counts)

    const totalRows = counts.reduce((a, b) => a + b.count, 0)
    checks.push({
      name: 'Database Size',
      status: totalRows > 10000 ? 'warning' : 'healthy',
      detail: `${totalRows.toLocaleString()} rows across ${counts.length} tables`,
      icon: Database,
    })

    const { data: errors, error: errLogErr } = await supabase
      .from('audit_logs')
      .select('*, actor:actor_id(*)')
      .or('action.ilike.%error%,action.eq.error')
      .order('created_at', { ascending: false })
      .limit(50)

    if (!errLogErr) {
      setErrorLogs(errors || [])
      checks.push({
        name: 'Error Rate',
        status: (errors || []).length > 20 ? 'error' : (errors || []).length > 5 ? 'warning' : 'healthy',
        detail: `${(errors || []).length} error(s) in audit log`,
        icon: AlertTriangle,
      })
    }

    setHealthChecks(checks)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-amber-900">System Health</h1>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-amber-900">System Health</h1>
        <Button onClick={refresh} disabled={refreshing}>
          <RefreshCw className={cn('mr-2 h-4 w-4', refreshing && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {healthChecks.map((check) => (
          <Card key={check.name}>
            <CardContent className="flex items-start gap-4 p-5">
              <div className={cn(
                'rounded-2xl p-2.5',
                check.status === 'healthy' ? 'bg-green-100' : check.status === 'warning' ? 'bg-amber-100' : 'bg-red-100'
              )}>
                <check.icon className={cn(
                  'h-5 w-5',
                  check.status === 'healthy' ? 'text-green-600' : check.status === 'warning' ? 'text-amber-600' : 'text-red-600'
                )} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-navy">{check.name}</h3>
                  <Badge variant={check.status === 'healthy' ? 'default' : check.status === 'warning' ? 'secondary' : 'destructive'}>
                    <span className={cn(
                      'mr-1.5 inline-block h-2 w-2 rounded-full',
                      check.status === 'healthy' ? 'bg-green-500' : check.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                    )} />
                    {check.status}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-gray-500">{check.detail}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-navy">Supabase Connection</CardTitle>
          <CardDescription>Real-time connection status indicator</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-2xl border p-4">
            <span className={cn(
              'inline-block h-4 w-4 rounded-full',
              connectionStatus === 'healthy' ? 'bg-green-500' : 'bg-red-500'
            )} />
            <div>
              <p className="font-medium text-navy">
                {connectionStatus === 'healthy' ? 'Connected' : 'Disconnected'}
              </p>
              <p className="text-sm text-gray-500">
                {connectionStatus === 'healthy'
                  ? 'Supabase client is operational and responding'
                  : 'There is a problem connecting to Supabase'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-navy">Storage Buckets</CardTitle>
            <CardDescription>Usage per storage bucket</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {buckets.length === 0 ? (
              <p className="text-sm text-gray-400">No buckets found</p>
            ) : (
              buckets.map((bucket) => {
                const maxSize = Math.max(...buckets.map((b) => b.size), 1)
                const pct = (bucket.size / maxSize) * 100
                return (
                  <div key={bucket.name}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium text-navy">{bucket.name}</span>
                      <span className="text-gray-500">{bucket.sizeLabel} ({bucket.fileCount} files)</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-gray-100">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-navy to-cranberry transition-all"
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
            <CardTitle className="text-navy">Table Row Counts</CardTitle>
            <CardDescription>Number of rows per database table</CardDescription>
          </CardHeader>
          <CardContent className="max-h-80 space-y-2 overflow-y-auto">
            {tableCounts.length === 0 ? (
              <p className="text-sm text-gray-400">No table data</p>
            ) : (
              tableCounts
                .sort((a, b) => b.count - a.count)
                .map((t) => {
                  const maxCount = Math.max(...tableCounts.map((tc) => tc.count), 1)
                  const pct = (t.count / maxCount) * 100
                  return (
                    <div key={t.table}>
                      <div className="mb-0.5 flex justify-between text-sm">
                        <span className="font-mono text-xs text-gray-700">{t.table}</span>
                        <span className="text-xs text-gray-500">{t.count.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gray-100">
                        <div
                          className="h-1.5 rounded-full bg-amber-500 transition-all"
                          style={{ width: `${Math.max(pct, 1)}%` }}
                        />
                      </div>
                    </div>
                  )
                })
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-navy">Error Log</CardTitle>
          <CardDescription>Recent errors from the audit log</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {errorLogs.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">No errors logged</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-medium uppercase text-gray-500">
                    <th className="px-4 pb-3 pr-4">Timestamp</th>
                    <th className="pb-3 pr-4">Actor</th>
                    <th className="pb-3 pr-4">Action</th>
                    <th className="pb-3 pr-4">Table</th>
                    <th className="pb-3 pr-4">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {errorLogs.map((log) => (
                    <tr key={log.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-2.5 pr-4 whitespace-nowrap text-xs text-gray-500">
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className="py-2.5 pr-4 text-gray-700">
                        {log.actor?.full_name || <span className="font-mono text-xs">{log.actor_id?.slice(0, 12)}</span>}
                      </td>
                      <td className="py-2.5 pr-4">
                        <Badge variant="destructive">{log.action}</Badge>
                      </td>
                      <td className="py-2.5 pr-4">
                        {log.table_name ? (
                          <span className="font-mono text-xs">{log.table_name}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4">
                        <div className="max-w-[250px] truncate text-xs text-gray-500">
                          {log.new_data ? JSON.stringify(log.new_data).slice(0, 100) : '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


