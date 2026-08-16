'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDateTime } from '@/lib/utils/date'
import { Download, Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import type { AuditLog } from '@/types/database'

interface AuditLogExtended extends AuditLog {
  actor?: { full_name: string; email: string }
}

const actionColors: Record<string, string> = {
  insert: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  error: 'bg-red-100 text-red-700',
  login: 'bg-purple-100 text-purple-700',
  logout: 'bg-gray-100 text-gray-700',
}

export default function SuperAdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLogExtended[]>([])
  const [loading, setLoading] = useState(true)
  const [actorFilter, setActorFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [tableFilter, setTableFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [totalCount, setTotalCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    loadLogs()
  }, [actionFilter, tableFilter])

  const loadLogs = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('audit_logs')
        .select('*, actor:actor_id(*)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(200)

      if (actionFilter !== 'all') query = query.eq('action', actionFilter)
      if (tableFilter !== 'all') query = query.eq('table_name', tableFilter)

      const { data, count, error } = await query
      if (error) throw error
      setLogs(data || [])
      setTotalCount(count || 0)
    } catch {
      toast.error('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }, [actionFilter, tableFilter, supabase])

  const filtered = logs.filter((log) => {
    if (actorFilter) {
      const name = log.actor?.full_name?.toLowerCase() || ''
      const email = log.actor?.email?.toLowerCase() || ''
      const id = log.actor_id?.toLowerCase() || ''
      const q = actorFilter.toLowerCase()
      if (!name.includes(q) && !email.includes(q) && !id.includes(q)) return false
    }
    if (dateFrom && new Date(log.created_at) < new Date(dateFrom)) return false
    if (dateTo && new Date(log.created_at) > new Date(dateTo + 'T23:59:59')) return false
    return true
  })

  function exportCsv() {
    const headers = ['Timestamp', 'Actor', 'Action', 'Table', 'Record ID', 'Details']
    const rows = filtered.map((log) => [
      formatDateTime(log.created_at),
      log.actor?.full_name || log.actor_id || 'System',
      log.action,
      log.table_name || '',
      log.record_id || '',
      JSON.stringify(log.new_data || log.old_data || {}),
    ])

    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${rows.length} entries`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-amber-900">Audit Log</h1>
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-500">{totalCount} total entries</p>
          <Button variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-navy">System Audit Trail</CardTitle>
          <CardDescription>Immutable record of all system actions</CardDescription>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by actor..."
                value={actorFilter}
                onChange={(e) => setActorFilter(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="insert">Insert</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tableFilter} onValueChange={setTableFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Tables" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tables</SelectItem>
                <SelectItem value="profiles">profiles</SelectItem>
                <SelectItem value="events">events</SelectItem>
                <SelectItem value="registrations">registrations</SelectItem>
                <SelectItem value="clubs">clubs</SelectItem>
                <SelectItem value="posts">posts</SelectItem>
                <SelectItem value="site_settings">site_settings</SelectItem>
                <SelectItem value="history_entries">history_entries</SelectItem>
                <SelectItem value="district_leadership">district_leadership</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
              <span className="text-gray-400">-</span>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-medium uppercase text-gray-500">
                    <th className="px-4 pb-3 pr-4">Timestamp</th>
                    <th className="pb-3 pr-4">Actor</th>
                    <th className="pb-3 pr-4">Action</th>
                    <th className="pb-3 pr-4">Table</th>
                    <th className="pb-3 pr-4">Record ID</th>
                    <th className="pb-3 pr-4">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400">
                        No audit log entries match your filters
                      </td>
                    </tr>
                  ) : (
                    filtered.map((log) => (
                      <tr key={log.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-2.5 pr-4 whitespace-nowrap text-xs text-gray-500">
                          {formatDateTime(log.created_at)}
                        </td>
                        <td className="py-2.5 pr-4 text-gray-700">
                          {log.actor?.full_name || (
                            <span className="font-mono text-xs text-gray-400">{log.actor_id?.slice(0, 12)}</span>
                          )}
                        </td>
                        <td className="py-2.5 pr-4">
                          <Badge className={actionColors[log.action] || 'bg-gray-100 text-gray-700'} variant="outline">
                            {log.action}
                          </Badge>
                        </td>
                        <td className="py-2.5 pr-4">
                          {log.table_name ? (
                            <span className="font-mono text-xs text-gray-600">{log.table_name}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-2.5 pr-4">
                          {log.record_id ? (
                            <span className="font-mono text-xs text-gray-500">{log.record_id.slice(0, 12)}...</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-2.5 pr-4">
                          <div className="max-w-[200px] truncate text-xs text-gray-500">
                            {log.new_data ? (
                              <span title={JSON.stringify(log.new_data, null, 2)}>
                                {JSON.stringify(log.new_data).slice(0, 80)}
                              </span>
                            ) : log.old_data ? (
                              <span title={JSON.stringify(log.old_data, null, 2)}>
                                {JSON.stringify(log.old_data).slice(0, 80)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
