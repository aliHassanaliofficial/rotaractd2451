'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRole } from '@/hooks/useRole'
import { formatDate } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'
import { Plus, Search, Edit, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

const APPROVAL_COLORS: Record<string, string> = {
  approved: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  published: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
}

export default function ClubAdminEventsPage() {
  const { clubId } = useRole()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (clubId) loadEvents()
  }, [clubId])

  async function loadEvents() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('host_club_id', clubId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setEvents(data || [])
    } catch {
      toast.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  const filtered = events.filter((e) =>
    e.title?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-navy">Events</h1>
        <Link href="/club-admin/events/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Event
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Approval Status</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-6 py-4" colSpan={5}><Skeleton className="h-6 w-full" /></td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">No events found</td>
                  </tr>
                ) : (
                  filtered.map((event) => (
                    <tr key={event.id} className="border-b transition-colors hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-navy">{event.title}</td>
                      <td className="px-6 py-4 text-gray-600">{formatDate(event.start_at)}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={cn('font-medium', APPROVAL_COLORS[event.approval_status] || 'bg-yellow-100 text-yellow-700')}>
                          {event.approval_status || 'pending'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={cn('font-medium', STATUS_COLORS[event.status] || '')}>
                          {event.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/club-admin/events/${event.id}/edit`}>
                          <Button variant="ghost" size="icon" title="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
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
