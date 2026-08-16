'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils/date'
import { Loader2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

type Tab = 'posts' | 'events' | 'gallery'

const APPROVAL_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export default function PendingApprovalsPage() {
  const [tab, setTab] = useState<Tab>('posts')
  const [posts, setPosts] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [galleryAlbums, setGalleryAlbums] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => { loadPending() }, [])

  async function loadPending() {
    setLoading(true)
    try {
      const [postsRes, eventsRes, galleryRes] = await Promise.all([
        supabase
          .from('posts')
          .select('*, author:author_id(full_name), club:club_id(name)')
          .eq('approval_status', 'pending')
          .order('created_at', { ascending: false }),
        supabase
          .from('events')
          .select('*, organizer:organizer_id(full_name), host_club:host_club_id(name)')
          .eq('approval_status', 'pending')
          .order('created_at', { ascending: false }),
        supabase
          .from('gallery_albums')
          .select('*, profile:created_by(full_name), club:club_id(name)')
          .eq('approval_status', 'pending')
          .order('created_at', { ascending: false }),
      ])
      setPosts(postsRes.data || [])
      setEvents(eventsRes.data || [])
      setGalleryAlbums(galleryRes.data || [])
    } catch {
      toast.error('Failed to load pending items')
    } finally {
      setLoading(false)
    }
  }

  async function handleAction(table: string, id: string, status: string) {
    setActionLoading(id)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase
        .from(table as any)
        .update({
          approval_status: status,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (error) throw error
      toast.success(status === 'approved' ? 'Approved' : 'Rejected')
      if (table === 'posts') setPosts((prev) => prev.filter((p) => p.id !== id))
      else if (table === 'events') setEvents((prev) => prev.filter((e) => e.id !== id))
      else setGalleryAlbums((prev) => prev.filter((g) => g.id !== id))
    } catch {
      toast.error('Failed to update')
    } finally {
      setActionLoading(null)
    }
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'posts', label: 'Posts', count: posts.length },
    { key: 'events', label: 'Events', count: events.length },
    { key: 'gallery', label: 'Gallery', count: galleryAlbums.length },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-navy">Pending Approvals</h1>

      <div className="flex gap-1 rounded-2xl border bg-gray-50 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-navy'
            }`}
          >
            {t.label}
            <Badge variant="outline" className="bg-yellow-100 text-yellow-700 text-xs">{t.count}</Badge>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-navy capitalize">{tab} Pending Review</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                    <th className="px-6 py-4">Title</th>
                    <th className="px-6 py-4">Submitted By</th>
                    <th className="px-6 py-4">Club</th>
                    <th className="px-6 py-4">Date Submitted</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tab === 'posts' && (
                    posts.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No pending posts</td></tr>
                    ) : (
                      posts.map((post) => (
                        <tr key={post.id} className="border-b transition-colors hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-navy">{post.title}</td>
                          <td className="px-6 py-4 text-gray-600">{post.author?.full_name || '-'}</td>
                          <td className="px-6 py-4 text-gray-600">{post.club?.name || '-'}</td>
                          <td className="px-6 py-4 text-gray-500">{formatDate(post.created_at)}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleAction('posts', post.id, 'approved')} disabled={actionLoading === post.id}>
                                {actionLoading === post.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                                Approve
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleAction('posts', post.id, 'rejected')} disabled={actionLoading === post.id}>
                                {actionLoading === post.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 mr-1" />}
                                Reject
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )
                  )}

                  {tab === 'events' && (
                    events.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No pending events</td></tr>
                    ) : (
                      events.map((event) => (
                        <tr key={event.id} className="border-b transition-colors hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-navy">{event.title}</td>
                          <td className="px-6 py-4 text-gray-600">{event.organizer?.full_name || '-'}</td>
                          <td className="px-6 py-4 text-gray-600">{event.host_club?.name || '-'}</td>
                          <td className="px-6 py-4 text-gray-500">{formatDate(event.created_at)}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleAction('events', event.id, 'approved')} disabled={actionLoading === event.id}>
                                {actionLoading === event.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                                Approve
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleAction('events', event.id, 'rejected')} disabled={actionLoading === event.id}>
                                {actionLoading === event.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 mr-1" />}
                                Reject
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )
                  )}

                  {tab === 'gallery' && (
                    galleryAlbums.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No pending gallery albums</td></tr>
                    ) : (
                      galleryAlbums.map((album) => (
                        <tr key={album.id} className="border-b transition-colors hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-navy">{album.title}</td>
                          <td className="px-6 py-4 text-gray-600">{album.profile?.full_name || '-'}</td>
                          <td className="px-6 py-4 text-gray-600">{album.club?.name || '-'}</td>
                          <td className="px-6 py-4 text-gray-500">{formatDate(album.created_at)}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleAction('gallery_albums', album.id, 'approved')} disabled={actionLoading === album.id}>
                                {actionLoading === album.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                                Approve
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleAction('gallery_albums', album.id, 'rejected')} disabled={actionLoading === album.id}>
                                {actionLoading === album.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 mr-1" />}
                                Reject
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )
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
