'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { createPost } from '@/lib/supabase/queries/posts'
import { postSchema, type PostFormData } from '@/lib/validations/post'
import { slugify } from '@/lib/utils/slugify'
import { STORAGE_BUCKETS } from '@/lib/constants'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'
import { Loader2, Upload, Save, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
import Link from 'next/link'

export default function NewAnnouncementPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [coverUrl, setCoverUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      status: 'published',
      is_announcement: true,
      is_pinned: false,
      announcement_priority: 'normal',
    },
  })

  const watchTitle = watch('title')
  const watchIsPinned = watch('is_pinned')

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return }
    if (!file.type.startsWith('image/')) { toast.error('Only image files allowed'); return }

    setUploading(true)
    const ext = file.name.split('.').pop()
    const filePath = `posts/${uuidv4()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.EVENT_COVERS)
      .upload(filePath, file, { upsert: true })

    if (uploadError) { toast.error('Failed to upload image'); setUploading(false); return }

    const { data: urlData } = supabase.storage.from(STORAGE_BUCKETS.EVENT_COVERS).getPublicUrl(filePath)
    const publicUrl = urlData.publicUrl
    setCoverUrl(publicUrl)
    setValue('cover_url', publicUrl)
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const onSubmit = async (data: PostFormData) => {
    setIsSubmitting(true)
    try {
      await createPost({
        ...data,
        slug: slugify(data.title),
        cover_url: coverUrl || undefined,
        is_announcement: true,
        published_at: data.status === 'published' ? new Date().toISOString() : undefined,
      })
      toast.success('Announcement created')
      router.push('/admin/announcements')
    } catch {
      toast.error('Failed to create announcement')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/announcements">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-navy">Create Announcement</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-navy">Announcement Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...register('title')} placeholder="Announcement title" />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
              {watchTitle && <p className="text-xs text-gray-400">Slug: {slugify(watchTitle)}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Message</Label>
              <Textarea id="excerpt" {...register('excerpt')} rows={4} placeholder="Announcement message..." />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select defaultValue="published" onValueChange={(v: any) => setValue('status', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select defaultValue="normal" onValueChange={(v: any) => setValue('announcement_priority', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="important">Important</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Pinned</Label>
                <div className="flex h-10 items-center">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" {...register('is_pinned')} className="rounded border-gray-300" />
                    Pin this announcement
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cover Image (optional)</Label>
              <div className="flex items-center gap-4">
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Upload Image
                </Button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                {coverUrl && <span className="text-xs text-green-600">Image uploaded</span>}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link href="/admin/announcements">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Create Announcement
          </Button>
        </div>
      </form>
    </motion.div>
  )
}
