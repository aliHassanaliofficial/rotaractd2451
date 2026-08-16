'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { createEvent } from '@/lib/supabase/queries/events'
import { eventSchema, type EventFormData } from '@/lib/validations/event'
import { slugify } from '@/lib/utils/slugify'
import { STORAGE_BUCKETS, EVENT_CATEGORIES } from '@/lib/constants'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
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
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'

export default function NewEventPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [coverUrl, setCoverUrl] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [clubs, setClubs] = useState<{ id: string; name: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      status: 'draft',
      price: 0,
      currency: 'EGP',
      is_online: false,
      registration_open: true,
      registration_type: 'public',
      calendar_type: 'event',
    },
  })

  const watchTitle = watch('title')
  const watchStatus = watch('status')
  const watchIsOnline = watch('is_online')

  async function loadClubs() {
    const { data } = await supabase.from('clubs').select('id, name').eq('is_active', true).order('name')
    if (data) setClubs(data)
  }

  useState(() => { loadClubs() })

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return }
    if (!file.type.startsWith('image/')) { toast.error('Only image files allowed'); return }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', STORAGE_BUCKETS.EVENT_COVERS)
    formData.append('folder', 'events')

    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const result = await res.json()

    if (!res.ok) { toast.error(result.error || 'Failed to upload image'); console.error('Upload error:', result); setUploading(false); return }

    setCoverUrl(result.url)
    setValue('cover_url', result.url)
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

  const onSubmit = async (data: EventFormData) => {
    setIsSubmitting(true)
    try {
      const slug = slugify(data.title)
      await createEvent({
        ...data,
        slug,
        cover_url: coverUrl || undefined,
        tags: tags.length > 0 ? tags : undefined,
        start_at: new Date(data.start_at).toISOString(),
        end_at: new Date(data.end_at).toISOString(),
        registration_deadline: data.registration_deadline ? new Date(data.registration_deadline).toISOString() : undefined,
      })
      toast.success('Event created successfully')
      router.push('/admin/events')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create event')
      console.error('Create event error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/events">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-navy">Create Event</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-navy">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...register('title')} placeholder="Event title" />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
              {watchTitle && (
                <p className="text-xs text-gray-400">Slug: {slugify(watchTitle)}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register('description')} rows={5} placeholder="Describe the event..." />
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
                <Label htmlFor="start_at">Start Date & Time</Label>
                <Input id="start_at" type="datetime-local" {...register('start_at')} />
                {errors.start_at && <p className="text-xs text-red-500">{errors.start_at.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_at">End Date & Time</Label>
                <Input id="end_at" type="datetime-local" {...register('end_at')} />
                {errors.end_at && <p className="text-xs text-red-500">{errors.end_at.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" {...register('location')} placeholder="Venue name or address" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select onValueChange={(v) => setValue('category', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Calendar Type</Label>
                <Select defaultValue="event" onValueChange={(v: 'event' | 'project' | 'meeting') => setValue('calendar_type', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input id="capacity" type="number" {...register('capacity', { valueAsNumber: true })} placeholder="Max attendees" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">Price (0 = Free)</Label>
                <Input id="price" type="number" step="0.01" {...register('price', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="host_club_id">Host Club</Label>
                <Select onValueChange={(v) => setValue('host_club_id', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select club" />
                  </SelectTrigger>
                  <SelectContent>
                    {clubs.map((club) => (
                      <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-navy">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <Label>Registration Type</Label>
              <Select defaultValue="public" onValueChange={(v: 'public' | 'members_only') => setValue('registration_type', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public (Anyone can register)</SelectItem>
                  <SelectItem value="members_only">Members Only (Rotaractors)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...register('is_online')} className="rounded border-gray-300" />
                Online Event
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...register('registration_open')} className="rounded border-gray-300" />
                Registration Open
              </label>
            </div>

            {watchIsOnline && (
              <div className="space-y-2">
                <Label htmlFor="online_url">Online Meeting URL</Label>
                <Input id="online_url" {...register('online_url')} placeholder="https://meet.google.com/..." />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="registration_deadline">Registration Deadline</Label>
              <Input id="registration_deadline" type="datetime-local" {...register('registration_deadline')} />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link href="/admin/events">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Create Event
          </Button>
        </div>
      </form>
    </motion.div>
  )
}
