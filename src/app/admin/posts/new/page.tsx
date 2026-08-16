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
import { Loader2, Upload, Save, ArrowLeft, X } from 'lucide-react'
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

export default function NewPostPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [coverUrl, setCoverUrl] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
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
    defaultValues: { status: 'draft', is_announcement: false, is_pinned: false, announcement_priority: 'normal' },
  })

  const watchTitle = watch('title')

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

  function addTag() {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed)) {
      const newTags = [...tags, trimmed]
      setTags(newTags)
      setValue('tags', newTags)
    }
    setTagInput('')
  }

  function removeTag(tag: string) {
    const newTags = tags.filter((t) => t !== tag)
    setTags(newTags)
    setValue('tags', newTags)
  }

  const onSubmit = async (data: PostFormData) => {
    setIsSubmitting(true)
    try {
      await createPost({
        ...data,
        slug: slugify(data.title),
        cover_url: coverUrl || undefined,
        tags: tags.length > 0 ? tags : undefined,
        published_at: data.status === 'published' ? new Date().toISOString() : data.published_at || undefined,
      })
      toast.success('Post created successfully')
      router.push('/admin/posts')
    } catch {
      toast.error('Failed to create post')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/posts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-navy">Create Post</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-navy">Post Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...register('title')} placeholder="Post title" />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
              {watchTitle && <p className="text-xs text-gray-400">Slug: {slugify(watchTitle)}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea id="excerpt" {...register('excerpt')} rows={2} placeholder="Brief summary..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea id="content" {...register('content')} rows={12} placeholder="Write your post content here..." />
            </div>

            <div className="space-y-2">
              <Label>Cover Image</Label>
              <div className="flex items-center gap-4">
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Upload Cover
                </Button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                {coverUrl && <span className="text-xs text-green-600">Image uploaded</span>}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select defaultValue="draft" onValueChange={(v: any) => setValue('status', v)}>
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
                <Label htmlFor="published_at">Publish Date</Label>
                <Input id="published_at" type="datetime-local" {...register('published_at')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Add a tag" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} />
                <Button type="button" variant="outline" onClick={addTag}>Add</Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="text-gray-400 hover:text-red-500"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link href="/admin/posts">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Create Post
          </Button>
        </div>
      </form>
    </motion.div>
  )
}
