'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { updatePost, deletePost } from '@/lib/supabase/queries/posts'
import { formatDate, formatTimeAgo } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'
import { ANNOUNCEMENT_PRIORITIES } from '@/lib/constants'
import { Plus, Pin, PinOff, Edit, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import type { Post } from '@/types/database'

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [togglingPin, setTogglingPin] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => { loadAnnouncements() }, [])

  async function loadAnnouncements() {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('is_announcement', true)
        .order('is_pinned', { ascending: false })
        .order('announcement_priority', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) throw error
      setAnnouncements(data || [])
    } catch {
      toast.error('Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }

  async function togglePin(post: Post) {
    setTogglingPin(post.id)
    try {
      await updatePost(post.id, { is_pinned: !post.is_pinned })
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === post.id ? { ...a, is_pinned: !a.is_pinned } : a))
      )
      toast.success(post.is_pinned ? 'Unpinned' : 'Pinned')
    } catch {
      toast.error('Failed to toggle pin')
    } finally {
      setTogglingPin(null)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      await deletePost(id)
      toast.success('Announcement deleted')
      setAnnouncements((prev) => prev.filter((a) => a.id !== id))
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const priorityColor = (priority: string) => {
    const p = ANNOUNCEMENT_PRIORITIES.find((ap) => ap.value === priority)
    return p?.color || 'bg-gray-400'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-navy">Announcements</h1>
        <Link href="/admin/announcements/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create Announcement
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {announcements.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-400">
              No announcements yet
            </CardContent>
          </Card>
        ) : (
          announcements.map((ann) => (
            <Card key={ann.id} className={cn(ann.is_pinned && 'border-cranberry/30')}>
              <CardContent className="flex items-start justify-between p-5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {ann.is_pinned && (
                      <Badge variant="outline" className="bg-cranberry/10 text-cranberry border-cranberry/20 text-xs">
                        <Pin className="mr-1 h-3 w-3" /> Pinned
                      </Badge>
                    )}
                    <span className={cn('h-2.5 w-2.5 rounded-full', priorityColor(ann.announcement_priority))} />
                    <span className="text-xs font-medium capitalize text-gray-500">
                      {ann.announcement_priority}
                    </span>
                    <Badge variant="outline" className={cn(
                      'text-xs',
                      ann.status === 'published' ? 'bg-green-100 text-green-700' :
                      ann.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                      'bg-yellow-100 text-yellow-700'
                    )}>
                      {ann.status}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-navy truncate">{ann.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {ann.published_at ? formatDate(ann.published_at) : 'Not published'} • Views: {ann.views || 0}
                  </p>
                  {ann.excerpt && (
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">{ann.excerpt}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-4 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => togglePin(ann)}
                    disabled={togglingPin === ann.id}
                    className={ann.is_pinned ? 'text-cranberry' : 'text-gray-400'}
                    title={ann.is_pinned ? 'Unpin' : 'Pin'}
                  >
                    {togglingPin === ann.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : ann.is_pinned ? (
                      <PinOff className="h-4 w-4" />
                    ) : (
                      <Pin className="h-4 w-4" />
                    )}
                  </Button>
                  <Link href={`/admin/posts/${ann.id}/edit`}>
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Dialog open={deleteId === ann.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setDeleteId(ann.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Announcement</DialogTitle>
                        <DialogDescription>Are you sure?</DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => handleDelete(ann.id)} disabled={deleting}>
                          {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Delete
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
