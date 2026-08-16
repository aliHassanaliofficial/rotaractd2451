'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

const APPROVAL_COLORS: Record<string, string> = {
  approved: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
}

export default function ClubAdminViewPostPage() {
  const params = useParams()
  const id = params.id as string
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadPost()
  }, [id])

  async function loadPost() {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) { toast.error('Post not found'); return }
      setPost(data)
    } catch {
      toast.error('Failed to load post')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="py-12 text-center text-gray-400">
        <p>Post not found</p>
        <Link href="/club-admin/posts">
          <Button variant="outline" className="mt-4">Back to Posts</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/club-admin/posts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-navy">{post.title}</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="font-medium capitalize">
          {post.status}
        </Badge>
        <Badge variant="outline" className={cn('font-medium', APPROVAL_COLORS[post.approval_status] || '')}>
          {post.approval_status || 'pending'}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-navy">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {post.cover_url && (
            <img src={post.cover_url} alt={post.title} className="w-full max-h-80 object-cover rounded-2xl" />
          )}
          {post.excerpt && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Excerpt</h3>
              <p className="text-gray-700">{post.excerpt}</p>
            </div>
          )}
          {post.content && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Content</h3>
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                {typeof post.content === 'string' ? post.content : JSON.stringify(post.content)}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t">
            <div>
              <p className="text-gray-500">Created</p>
              <p className="font-medium text-navy">{formatDate(post.created_at)}</p>
            </div>
            {post.published_at && (
              <div>
                <p className="text-gray-500">Published</p>
                <p className="font-medium text-navy">{formatDate(post.published_at)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Link href={`/club-admin/posts/${post.id}/edit`}>
          <Button>Edit Post</Button>
        </Link>
      </div>
    </div>
  )
}
