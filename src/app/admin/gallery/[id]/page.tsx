'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getAlbumMedia, updateAlbum, deleteMedia, addMultipleMedia, deleteAlbum } from '@/lib/supabase/queries/gallery'
import { formatDate } from '@/lib/utils/date'
import { STORAGE_BUCKETS } from '@/lib/constants'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'
import {
  Loader2,
  ArrowLeft,
  Trash2,
  Upload,
  X,
  Save,
  ImageIcon,
  GripVertical,
} from 'lucide-react'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import type { GalleryAlbum, GalleryMedia } from '@/types/database'

export default function AlbumDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [album, setAlbum] = useState<GalleryAlbum | null>(null)
  const [media, setMedia] = useState<GalleryMedia[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedDelete, setSelectedDelete] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => { loadAlbum() }, [id])

  async function loadAlbum() {
    try {
      const { data: albumData } = await supabase
        .from('gallery_albums')
        .select('*')
        .eq('id', id)
        .single()

      const mediaData = await getAlbumMedia(id)

      setAlbum(albumData)
      setMedia(mediaData)
      setEditTitle(albumData?.title || '')
      setEditDescription(albumData?.description || '')
    } catch {
      toast.error('Failed to load album')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveInfo() {
    if (!album) return
    setSaving(true)
    try {
      await updateAlbum(album.id, { title: editTitle, description: editDescription })
      setAlbum((prev) => prev ? { ...prev, title: editTitle, description: editDescription } : prev)
      setEditing(false)
      toast.success('Album updated')
    } catch {
      toast.error('Failed to update album')
    } finally {
      setSaving(false)
    }
  }

  async function handleUploadMore(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const valid = files.filter((f) => {
      if (!validTypes.includes(f.type)) { toast.error(`${f.name} is not supported`); return false }
      if (f.size > 10 * 1024 * 1024) { toast.error(`${f.name} is over 10MB`); return false }
      return true
    })

    if (valid.length === 0) return

    setUploading(true)
    const uploadedUrls: string[] = []

    for (const file of valid) {
      const ext = file.name.split('.').pop()
      const filePath = `albums/${id}/${uuidv4()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.GALLERY)
        .upload(filePath, file, { upsert: true })

      if (uploadError) continue

      const { data: urlData } = supabase.storage.from(STORAGE_BUCKETS.GALLERY).getPublicUrl(filePath)
      uploadedUrls.push(urlData.publicUrl)
    }

    const nextOrder = media.length
    const mediaItems = uploadedUrls.map((url, i) => ({
      album_id: id,
      url,
      type: 'image' as const,
      sort_order: nextOrder + i,
    }))

    try {
      const newMedia = await addMultipleMedia(mediaItems)
      setMedia((prev) => [...prev, ...(newMedia || [])])
      toast.success(`${uploadedUrls.length} photos uploaded`)

      if (!album?.cover_url && uploadedUrls.length > 0) {
        await updateAlbum(id, { cover_url: uploadedUrls[0] })
        setAlbum((prev) => prev ? { ...prev, cover_url: uploadedUrls[0] } : prev)
      }
    } catch {
      toast.error('Failed to save media')
    }

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleDeleteSelected() {
    for (const mediaId of selectedDelete) {
      const item = media.find((m) => m.id === mediaId)
      await deleteMedia(mediaId)
      if (item?.url && album?.cover_url === item.url) {
        const remaining = media.filter((m) => !selectedDelete.has(m.id) && m.id !== mediaId)
        if (remaining.length > 0) {
          await updateAlbum(id, { cover_url: remaining[0].url })
        } else {
          await updateAlbum(id, { cover_url: undefined })
        }
      }
    }
    setMedia((prev) => prev.filter((m) => !selectedDelete.has(m.id)))
    setSelectedDelete(new Set())
    toast.success('Media deleted')
  }

  async function handleDeleteAlbum() {
    setDeleting(true)
    try {
      for (const item of media) {
        await deleteMedia(item.id)
      }
      await deleteAlbum(id)
      toast.success('Album deleted')
      router.push('/admin/gallery')
    } catch {
      toast.error('Failed to delete album')
    } finally {
      setDeleting(false)
    }
  }

  function moveItem(fromIndex: number, direction: 'up' | 'down') {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1
    if (toIndex < 0 || toIndex >= media.length) return

    const newMedia = [...media]
    const temp = newMedia[fromIndex].sort_order
    newMedia[fromIndex] = { ...newMedia[fromIndex], sort_order: newMedia[toIndex].sort_order }
    newMedia[toIndex] = { ...newMedia[toIndex], sort_order: temp }
    newMedia.sort((a, b) => a.sort_order - b.sort_order)
    setMedia(newMedia)

    supabase.from('gallery_media').update({ sort_order: newMedia[fromIndex].sort_order }).eq('id', newMedia[fromIndex].id)
    supabase.from('gallery_media').update({ sort_order: newMedia[toIndex].sort_order }).eq('id', newMedia[toIndex].id)
  }

  if (loading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-64" /><div className="grid grid-cols-4 gap-4"><Skeleton className="h-48" /><Skeleton className="h-48" /><Skeleton className="h-48" /><Skeleton className="h-48" /></div></div>
  }

  if (!album) {
    return <div className="text-center py-16 text-gray-400">Album not found</div>
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/gallery">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            {editing ? (
              <div className="flex items-center gap-2">
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="text-xl font-bold w-80" />
                <Button size="sm" onClick={handleSaveInfo} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-navy">{album.title}</h1>
                <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>Edit</Button>
              </div>
            )}
            <p className="text-sm text-gray-500">{media.length} photos • Created {formatDate(album.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Upload More
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUploadMore} />

          {selectedDelete.size > 0 && (
            <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedDelete.size})
            </Button>
          )}

          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" /> Delete Album
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Album</DialogTitle>
                <DialogDescription>Are you sure? This will also delete all photos.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDeleteAlbum} disabled={deleting}>
                  {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {editing && (
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {media.map((item, index) => (
          <div
            key={item.id}
            className={`group relative aspect-square rounded-2xl border-2 overflow-hidden ${
              selectedDelete.has(item.id) ? 'border-red-500 ring-2 ring-red-300' : 'border-gray-200'
            }`}
          >
            <img
              src={item.thumbnail_url || item.url}
              alt={item.caption || ''}
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
              <button
                type="button"
                onClick={() => {
                  setSelectedDelete((prev) => {
                    const next = new Set(prev)
                    if (next.has(item.id)) next.delete(item.id)
                    else next.add(item.id)
                    return next
                  })
                }}
                className="rounded-full bg-white p-1.5 shadow hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5 text-red-500" />
              </button>
            </div>

            {index === 0 && (
              <Badge className="absolute top-1 left-1 bg-cranberry text-white text-xs">Cover</Badge>
            )}

            <div className="absolute right-1 top-1 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {index > 0 && (
                <button type="button" onClick={() => moveItem(index, 'up')} className="rounded bg-white/80 p-0.5 text-gray-700 hover:bg-white">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                </button>
              )}
              {index < media.length - 1 && (
                <button type="button" onClick={() => moveItem(index, 'down')} className="rounded bg-white/80 p-0.5 text-gray-700 hover:bg-white">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
              )}
            </div>
          </div>
        ))}

        {media.length === 0 && (
          <div className="col-span-full py-16 text-center text-gray-400">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p>No photos in this album</p>
            <Button variant="outline" className="mt-4" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" /> Upload Photos
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
