'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { toast } from 'sonner'
import { Loader2, Save, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function ClubAdminNewPostPage() {
  const router = useRouter()
  const { profile } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { toast.error('Title is required'); return }
    if (!profile?.club_id) { toast.error('No club assigned'); return }
    if (!profile?.id) { toast.error('Not authenticated'); return }

    setIsSubmitting(true)
    try {
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'post'

      const { error } = await supabase.from('posts').insert({
        title,
        slug,
        excerpt: excerpt || null,
        content: content || null,
        cover_url: coverUrl || null,
        status: 'draft',
        approval_status: 'pending',
        club_id: profile.club_id,
        author_id: profile.id,
        is_announcement: false,
        is_pinned: false,
      })

      if (error) throw error
      toast.success('Post created and submitted for approval')
      router.push('/club-admin/posts')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create post')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/club-admin/posts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-navy">New Post</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-navy">Post Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Post title" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea id="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} placeholder="Brief summary..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} rows={12} placeholder="Write your post content here..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover_url">Cover Image URL</Label>
              <Input id="cover_url" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://example.com/image.jpg" />
            </div>

            <p className="text-xs text-gray-500">
              Note: Content will need District Admin approval before being published.
            </p>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link href="/club-admin/posts">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Create Post
          </Button>
        </div>
      </form>
    </div>
  )
}
