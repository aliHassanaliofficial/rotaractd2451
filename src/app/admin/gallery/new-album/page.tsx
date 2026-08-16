'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { createAlbum, addMultipleMedia } from '@/lib/supabase/queries/gallery'
import { slugify } from '@/lib/utils/slugify'
import { STORAGE_BUCKETS } from '@/lib/constants'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'
import { Loader2, Save, ArrowLeft, Upload, X, ImageIcon } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

const albumSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  event_id: z.string().optional(),
  club_id: z.string().optional(),
})

type AlbumFormData = z.infer<typeof albumSchema>

export default function NewAlbumPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [coverIndex, setCoverIndex] = useState(0)
  const [events, setEvents] = useState<{ id: string; title: string }[]>([])
  const [clubs, setClubs] = useState<{ id: string; name: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AlbumFormData>({
    resolver: zodResolver(albumSchema),
  })

  const watchTitle = watch('title')

  useState(() => {
    Promise.all([
      supabase.from('events').select('id, title').eq('status', 'published').order('start_at', { ascending: false }).limit(50),
      supabase.from('clubs').select('id, name').eq('is_active', true).order('name'),
    ]).then(([eventsRes, clubsRes]) => {
      if (eventsRes.data) setEvents(eventsRes.data)
      if (clubsRes.data) setClubs(clubsRes.data)
    })
  })

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const valid = selected.filter((f) => {
      if (!validTypes.includes(f.type)) { toast.error(`${f.name} is not a supported image type`); return false }
      if (f.size > 10 * 1024 * 1024) { toast.error(`${f.name} is over 10MB`); return false }
      return true
    })
    setFiles((prev) => [...prev, ...valid])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    if (coverIndex >= index && coverIndex > 0) setCoverIndex(coverIndex - 1)
  }

  const onSubmit = async (data: AlbumFormData) => {
    if (files.length === 0) { toast.error('Please add at least one photo'); return }
    setIsSubmitting(true)
    setUploadingFiles(true)

    try {
      const slug = slugify(data.title)

      const album = await createAlbum({
        title: data.title,
        slug,
        description: data.description || undefined,
        event_id: data.event_id || undefined,
        club_id: data.club_id || undefined,
        is_published: false,
      })

      const uploadedUrls: string[] = []

      for (const file of files) {
        const ext = file.name.split('.').pop()
        const filePath = `albums/${album.id}/${uuidv4()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKETS.GALLERY)
          .upload(filePath, file, { upsert: true })

        if (uploadError) { console.error('Upload failed:', file.name, uploadError); continue }

        const { data: urlData } = supabase.storage.from(STORAGE_BUCKETS.GALLERY).getPublicUrl(filePath)
        uploadedUrls.push(urlData.publicUrl)
      }

      const mediaItems = uploadedUrls.map((url, i) => ({
        album_id: album.id,
        url,
        type: 'image' as const,
        sort_order: i,
      }))

      await addMultipleMedia(mediaItems)

      if (uploadedUrls[coverIndex]) {
        await supabase
          .from('gallery_albums')
          .update({ cover_url: uploadedUrls[coverIndex] })
          .eq('id', album.id)
      }

      toast.success('Album created with uploaded photos')
      router.push(`/admin/gallery/${album.id}`)
    } catch {
      toast.error('Failed to create album')
    } finally {
      setIsSubmitting(false)
      setUploadingFiles(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/gallery">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-navy">Create Album</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-navy">Album Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Album Title</Label>
              <Input id="title" {...register('title')} placeholder="e.g. District Conference 2025" />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
              {watchTitle && <p className="text-xs text-gray-400">Slug: {slugify(watchTitle)}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register('description')} rows={3} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Related Event (optional)</Label>
                <Select onValueChange={(v) => setValue('event_id', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Club (optional)</Label>
                <Select onValueChange={(v) => setValue('club_id', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select club" />
                  </SelectTrigger>
                  <SelectContent>
                    {clubs.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-navy">Upload Photos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" /> Select Photos
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
              <span className="text-sm text-gray-500">{files.length} file(s) selected</span>
            </div>

            {files.length > 0 && (
              <>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {files.map((file, i) => (
                    <div key={i} className={`relative aspect-square rounded-2xl border-2 overflow-hidden group ${i === coverIndex ? 'border-cranberry' : 'border-gray-200'}`}>
                      <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                        <button type="button" onClick={() => { setCoverIndex(i) }} className="rounded-full bg-white p-1 shadow" title="Set as cover">
                          <ImageIcon className="h-3 w-3 text-navy" />
                        </button>
                        <button type="button" onClick={() => removeFile(i)} className="rounded-full bg-white p-1 shadow" title="Remove">
                          <X className="h-3 w-3 text-red-500" />
                        </button>
                      </div>
                      {i === coverIndex && (
                        <div className="absolute top-1 left-1">
                          <Badge className="bg-cranberry text-white text-xs px-1.5 py-0.5">Cover</Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400">Click the image icon to set as cover photo. Hover to see options.</p>
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link href="/admin/gallery">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={isSubmitting || files.length === 0}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {uploadingFiles ? 'Uploading...' : 'Create Album'}
          </Button>
        </div>
      </form>
    </motion.div>
  )
}
