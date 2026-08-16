'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { createLibraryItem } from '@/lib/supabase/queries/library'
import { STORAGE_BUCKETS } from '@/lib/constants'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'
import { Loader2, Upload, Save, ArrowLeft, X, FileText } from 'lucide-react'
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
import type { LibraryCategory } from '@/types/database'

const libraryItemSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['image', 'video', 'document', 'pdf']).default('document'),
  category_id: z.string().optional(),
  is_published: z.boolean().default(true),
  tags: z.array(z.string()).optional(),
})

type LibraryItemFormData = z.input<typeof libraryItemSchema>

export default function NewLibraryItemPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fileUrl, setFileUrl] = useState('')
  const [categories, setCategories] = useState<LibraryCategory[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useState(() => {
    supabase.from('library_categories').select('*').order('sort_order').then(({ data }) => {
      if (data) setCategories(data)
    })
  })

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LibraryItemFormData>({
    resolver: zodResolver(libraryItemSchema),
    defaultValues: { type: 'document', is_published: true },
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 20 * 1024 * 1024) { toast.error('File must be under 20MB'); return }

    setUploading(true)
    const ext = file.name.split('.').pop()
    const filePath = `library/${uuidv4()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.LIBRARY)
      .upload(filePath, file, { upsert: true })

    if (uploadError) { toast.error('Failed to upload file'); setUploading(false); return }

    const { data: urlData } = supabase.storage.from(STORAGE_BUCKETS.LIBRARY).getPublicUrl(filePath)
    setFileUrl(urlData.publicUrl)
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

  const onSubmit = async (data: LibraryItemFormData) => {
    if (!fileUrl) { toast.error('Please upload a file'); return }
    setIsSubmitting(true)
    try {
      await createLibraryItem({
        ...data,
        file_url: fileUrl,
        tags: tags.length > 0 ? tags : undefined,
      })
      toast.success('Library item created')
      router.push('/admin/library')
    } catch {
      toast.error('Failed to create item')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/library">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-navy">Add Library Item</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-navy">Item Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...register('title')} placeholder="Document title" />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register('description')} rows={3} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select defaultValue="document" onValueChange={(v: any) => setValue('type', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select onValueChange={(v) => setValue('category_id', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>File</Label>
              <div className="flex items-center gap-4">
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Upload File
                </Button>
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                {fileUrl && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" /> File uploaded
                  </span>
                )}
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

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" {...register('is_published')} className="rounded border-gray-300" />
                Published
              </label>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link href="/admin/library">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={isSubmitting || !fileUrl}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Create Item
          </Button>
        </div>
      </form>
    </motion.div>
  )
}
