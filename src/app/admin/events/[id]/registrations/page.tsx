'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getRegistrationsByEvent, updateRegistrationStatus } from '@/lib/supabase/queries/registrations'
import { getEventById } from '@/lib/supabase/queries/events'
import { formatDate, formatDateTime } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'
import { REG_STATUS_LABELS, REG_STATUS_COLORS } from '@/lib/constants'
import {
  Search,
  Download,
  Check,
  X,
  Loader2,
  ArrowLeft,
  CheckCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import type { Registration } from '@/types/database'

export default function EventRegistrationsPage() {
  const params = useParams()
  const id = params.id as string
  const [registrations, setRegistrations] = useState<(Registration & { profile: any })[]>([])
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [updating, setUpdating] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      try {
        const [regs, evt] = await Promise.all([
          getRegistrationsByEvent(id),
          getEventById(id),
        ])
        setRegistrations(regs as any)
        setEvent(evt)
      } catch (err) {
        toast.error('Failed to load registrations')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const filtered = registrations.filter((r) => {
    const name = r.profile?.full_name || r.guest_name || ''
    const email = r.profile?.email || r.guest_email || ''
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) || email.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter
    return matchesSearch && matchesStatus
  })

  async function handleStatusChange(regId: string, status: Registration['status']) {
    setUpdating(regId)
    try {
      await updateRegistrationStatus(regId, status)
      setRegistrations((prev) => prev.map((r) => (r.id === regId ? { ...r, status } : r)))
      toast.success(`Registration ${status}`)
    } catch {
      toast.error('Failed to update status')
    } finally {
      setUpdating(null)
    }
  }

  async function handleBulkConfirm() {
    setUpdating('bulk')
    try {
      for (const regId of selectedIds) {
        await updateRegistrationStatus(regId, 'confirmed')
      }
      setRegistrations((prev) => prev.map((r) => (selectedIds.has(r.id) ? { ...r, status: 'confirmed' } : r)))
      toast.success(`${selectedIds.size} registrations confirmed`)
      setSelectedIds(new Set())
    } catch {
      toast.error('Failed to bulk confirm')
    } finally {
      setUpdating(null)
    }
  }

  function exportCSV() {
    const headers = ['Name', 'Email', 'Phone', 'Club', 'Status', 'Ticket', 'Registered At']
    const rows = filtered.map((r) => [
      r.profile?.full_name || r.guest_name || '',
      r.profile?.email || r.guest_email || '',
      r.profile?.phone || r.guest_phone || '',
      r.profile?.club?.name || r.guest_club || '',
      r.status,
      r.ticket_number || '',
      r.registered_at,
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `registrations-${event?.slug || id}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported')
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map((r) => r.id)))
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/events">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-navy">{event?.title || 'Registrations'}</h1>
            <p className="text-sm text-gray-500">{registrations.length} total registrations</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button size="sm" variant="outline" onClick={handleBulkConfirm} disabled={updating === 'bulk'}>
              {updating === 'bulk' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCheck className="mr-2 h-4 w-4" />}
              Confirm ({selectedIds.size})
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Search name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="attended">Attended</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                  <th className="px-4 py-4 w-10">
                    <input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} className="rounded border-gray-300" />
                  </th>
                  <th className="px-4 py-4">Name</th>
                  <th className="px-4 py-4">Email</th>
                  <th className="px-4 py-4">Phone</th>
                  <th className="px-4 py-4">Club</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Ticket</th>
                  <th className="px-4 py-4">Registered At</th>
                  <th className="px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-400">No registrations found</td>
                  </tr>
                ) : (
                  filtered.map((reg) => (
                    <tr key={reg.id} className="border-b transition-colors hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selectedIds.has(reg.id)} onChange={() => toggleSelect(reg.id)} className="rounded border-gray-300" />
                      </td>
                      <td className="px-4 py-3 font-medium text-navy">
                        {reg.profile?.full_name || reg.guest_name || 'Guest'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{reg.profile?.email || reg.guest_email || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{reg.profile?.phone || reg.guest_phone || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{reg.profile?.club?.name || reg.guest_club || '-'}</td>
                      <td className="px-4 py-3">
                        <Badge className={cn('font-medium', REG_STATUS_COLORS[reg.status])} variant="outline">
                          {REG_STATUS_LABELS[reg.status] || reg.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{reg.ticket_number || '-'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDateTime(reg.registered_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {reg.status === 'pending' && (
                            <>
                              <Button variant="ghost" size="icon" className="text-green-600" onClick={() => handleStatusChange(reg.id, 'confirmed')} disabled={updating === reg.id}>
                                {updating === reg.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                              </Button>
                              <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleStatusChange(reg.id, 'cancelled')} disabled={updating === reg.id}>
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {reg.status === 'confirmed' && (
                            <Button variant="ghost" size="icon" className="text-blue-600" onClick={() => handleStatusChange(reg.id, 'attended')} disabled={updating === reg.id}>
                              {updating === reg.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
                            </Button>
                          )}
                        </div>
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
