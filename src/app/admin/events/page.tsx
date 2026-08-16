'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'
import { Plus, Search, Edit, Eye, Trash2, Loader2, Check, X } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { deleteEvent } from '@/lib/supabase/queries/events'
import type { Event } from '@/types/database'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  published: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
}

const APPROVAL_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<(Event & { host_club?: any })[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [approvalFilter, setApprovalFilter] = useState('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadEvents()
  }, [statusFilter, approvalFilter])

  async function loadEvents() {
    setLoading(true)
    try {
      let query = supabase
        .from('events')
        .select('*, host_club:host_club_id(name)')
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }
      if (approvalFilter !== 'all') {
        query = query.eq('approval_status', approvalFilter)
      }

      const { data, error } = await query
      if (error) throw error
      setEvents(data || [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      await deleteEvent(id)
      toast.success('Event deleted')
      setEvents((prev) => prev.filter((e) => e.id !== id))
    } catch {
      toast.error('Failed to delete event')
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  async function handleApproval(id: string, status: string) {
    setActionLoading(id)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase
        .from('events')
        .update({
          approval_status: status,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (error) throw error
      toast.success(status === 'approved' ? 'Approved' : 'Rejected')
      setEvents((prev) => prev.map((e) => e.id === id ? { ...e, approval_status: status } as any : e))
    } catch {
      toast.error('Failed to update')
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = events.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase())
  )

  const approvalTabs = ['all', 'pending', 'approved', 'rejected'] as const

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-navy">Events</h1>
        <Link href="/admin/events/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create Event
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-1 rounded-2xl border bg-gray-50 p-1">
        {approvalTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setApprovalFilter(tab)}
            className={`rounded-2xl px-4 py-2 text-sm font-medium transition-colors ${
              approvalFilter === tab ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-navy'
            }`}
          >
            {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Approval</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Club</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-6 py-4" colSpan={7}>
                        <Skeleton className="h-6 w-full" />
                      </td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      No events found
                    </td>
                  </tr>
                ) : (
                  filtered.map((event) => (
                    <tr key={event.id} className="border-b transition-colors hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-navy">{event.title}</td>
                      <td className="px-6 py-4">
                        <Badge className={cn('font-medium', STATUS_COLORS[event.status])} variant="outline">
                          {event.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={cn('font-medium', APPROVAL_BADGE[(event as any).approval_status || 'approved'])} variant="outline">
                          {(event as any).approval_status || 'approved'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{formatDate(event.start_at)}</td>
                      <td className="px-6 py-4 text-gray-600">{event.category || '-'}</td>
                      <td className="px-6 py-4 text-gray-600">{event.host_club?.name || '-'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {(event as any).approval_status === 'pending' && (
                            <>
                              <Button variant="ghost" size="icon" className="text-green-600" title="Approve" onClick={() => handleApproval(event.id, 'approved')} disabled={actionLoading === event.id}>
                                {actionLoading === event.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                              </Button>
                              <Button variant="ghost" size="icon" className="text-red-600" title="Reject" onClick={() => handleApproval(event.id, 'rejected')} disabled={actionLoading === event.id}>
                                {actionLoading === event.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                              </Button>
                            </>
                          )}
                          <Link href={`/admin/events/${event.id}/registrations`}>
                            <Button variant="ghost" size="icon" title="Registrations">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/admin/events/${event.id}/edit`}>
                            <Button variant="ghost" size="icon" title="Edit">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Dialog open={deleteId === event.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setDeleteId(event.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Delete Event</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to delete "{event.title}"? This action cannot be undone.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                                <Button variant="destructive" onClick={() => handleDelete(event.id)} disabled={deleting}>
                                  {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                  Delete
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
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
