'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'
import { Plus, Search, Edit, Trash2, Loader2, Check, X } from 'lucide-react'
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
import { deletePost } from '@/lib/supabase/queries/posts'
import type { Post } from '@/types/database'

const POST_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  published: 'bg-green-100 text-green-700',
  archived: 'bg-yellow-100 text-yellow-700',
}

const APPROVAL_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<(Post & { author?: any })[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [approvalFilter, setApprovalFilter] = useState('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => { loadPosts() }, [statusFilter, approvalFilter])

  async function loadPosts() {
    setLoading(true)
    try {
      let query = supabase
        .from('posts')
        .select('*, author:author_id(full_name)')
        .eq('is_announcement', false)
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') query = query.eq('status', statusFilter)
      if (approvalFilter !== 'all') query = query.eq('approval_status', approvalFilter)

      const { data, error } = await query
      if (error) throw error
      setPosts(data || [])
    } catch {
      toast.error('Failed to load posts')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      await deletePost(id)
      toast.success('Post deleted')
      setPosts((prev) => prev.filter((p) => p.id !== id))
    } catch {
      toast.error('Failed to delete post')
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
        .from('posts')
        .update({
          approval_status: status,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (error) throw error
      toast.success(status === 'approved' ? 'Approved' : 'Rejected')
      setPosts((prev) => prev.map((p) => p.id === id ? { ...p, approval_status: status } as any : p))
    } catch {
      toast.error('Failed to update')
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = posts.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  )

  const approvalTabs = ['all', 'pending', 'approved', 'rejected'] as const

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-navy">Posts</h1>
        <Link href="/admin/posts/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create Post
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
          <Input placeholder="Search posts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
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
                  <th className="px-6 py-4">Published Date</th>
                  <th className="px-6 py-4">Tags</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-6 py-4" colSpan={6}><Skeleton className="h-6 w-full" /></td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">No posts found</td>
                  </tr>
                ) : (
                  filtered.map((post) => (
                    <tr key={post.id} className="border-b transition-colors hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-navy">{post.title}</td>
                      <td className="px-6 py-4">
                        <Badge className={cn('font-medium', POST_STATUS_COLORS[post.status])} variant="outline">
                          {post.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={cn('font-medium', APPROVAL_BADGE[(post as any).approval_status || 'approved'])} variant="outline">
                          {(post as any).approval_status || 'approved'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {post.published_at ? formatDate(post.published_at) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(post.tags || []).slice(0, 3).map((tag) => (
                            <span key={tag} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                              {tag}
                            </span>
                          ))}
                          {(post.tags?.length ?? 0) > 3 && (
                            <span className="text-xs text-gray-400">+{post.tags!.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {(post as any).approval_status === 'pending' && (
                            <>
                              <Button variant="ghost" size="icon" className="text-green-600" title="Approve" onClick={() => handleApproval(post.id, 'approved')} disabled={actionLoading === post.id}>
                                {actionLoading === post.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                              </Button>
                              <Button variant="ghost" size="icon" className="text-red-600" title="Reject" onClick={() => handleApproval(post.id, 'rejected')} disabled={actionLoading === post.id}>
                                {actionLoading === post.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                              </Button>
                            </>
                          )}
                          <Link href={`/admin/posts/${post.id}/edit`}>
                            <Button variant="ghost" size="icon" title="Edit">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Dialog open={deleteId === post.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setDeleteId(post.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Delete Post</DialogTitle>
                                <DialogDescription>Are you sure you want to delete "{post.title}"?</DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                                <Button variant="destructive" onClick={() => handleDelete(post.id)} disabled={deleting}>
                                  {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Delete
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
