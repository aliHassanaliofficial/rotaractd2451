'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
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

export default function ClubAdminPostsPage() {
  const { profile } = useUser()
  const { clubId } = useRole()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (clubId) loadPosts()
  }, [clubId])

  async function loadPosts() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('club_id', clubId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPosts(data || [])
    } catch {
      toast.error('Failed to load posts')
    } finally {
      setLoading(false)
    }
  }

  const filtered = posts.filter((p) =>
    p.title?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-navy">Posts</h1>
        <Link href="/club-admin/posts/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Post
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Search posts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Approval Status</th>
                  <th className="px-6 py-4">Created</th>
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
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">No posts found</td>
                  </tr>
                ) : (
                  filtered.map((post) => (
                    <tr key={post.id} className="border-b transition-colors hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-navy">
                        <Link href={`/club-admin/posts/${post.id}`} className="hover:text-cranberry">
                          {post.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="font-medium capitalize">
                          {post.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={cn('font-medium', APPROVAL_COLORS[post.approval_status] || 'bg-gray-100 text-gray-700')}>
                          {post.approval_status || 'pending'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{formatDate(post.created_at)}</td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/club-admin/posts/${post.id}/edit`}>
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
