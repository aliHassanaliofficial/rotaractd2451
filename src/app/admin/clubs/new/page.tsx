'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { createClub } from '@/lib/supabase/queries/clubs'
import { clubSchema, type ClubFormData } from '@/lib/validations/club'
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
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'

export default function NewClubPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [logoUrl, setLogoUrl] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const logoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClubFormData>({
    resolver: zodResolver(clubSchema),
    defaultValues: { country: 'Egypt', is_active: true },
  })

  const watchName = watch('name')

  async function uploadFile(file: File, bucket: string, prefix: string): Promise<string | null> {
    const ext = file.name.split('.').pop()
    const filePath = `${prefix}/${uuidv4()}.${ext}`

    const { error } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: true })
    if (error) { toast.error('Failed to upload file'); return null }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath)
    return urlData.publicUrl
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return }
    setUploadingLogo(true)
    const url = await uploadFile(file, STORAGE_BUCKETS.CLUB_LOGOS, 'logos')
    if (url) { setLogoUrl(url); setValue('logo_url', url) }
    setUploadingLogo(false)
    if (logoInputRef.current) logoInputRef.current.value = ''
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return }
    setUploadingCover(true)
    const url = await uploadFile(file, STORAGE_BUCKETS.CLUB_LOGOS, 'covers')
    if (url) { setCoverUrl(url); setValue('cover_url', url) }
    setUploadingCover(false)
    if (coverInputRef.current) coverInputRef.current.value = ''
  }

  const onSubmit = async (data: ClubFormData) => {
    setIsSubmitting(true)
    try {
      await createClub({
        ...data,
        slug: slugify(data.name),
        logo_url: logoUrl || undefined,
        cover_url: coverUrl || undefined,
        charter_date: data.charter_date ? new Date(data.charter_date).toISOString() : undefined,
        founded_year: data.founded_year || undefined,
      })
      toast.success('Club created successfully')
      router.push('/admin/clubs')
    } catch {
      toast.error('Failed to create club')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/clubs">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-navy">Create Club</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-navy">Club Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Club Name</Label>
              <Input id="name" {...register('name')} placeholder="Rotaract Club of ..." />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              {watchName && <p className="text-xs text-gray-400">Slug: {slugify(watchName)}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="university">University</Label>
                <Input id="university" {...register('university')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" {...register('city')} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" {...register('country')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="founded_year">Founded Year</Label>
                <Input id="founded_year" type="number" {...register('founded_year', { valueAsNumber: true })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register('description')} rows={3} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="mission">Mission</Label>
                <Textarea id="mission" {...register('mission')} rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vision">Vision</Label>
                <Textarea id="vision" {...register('vision')} rows={3} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-navy">Contact & Social</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...register('phone')} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input id="website" {...register('website')} placeholder="https://" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="charter_date">Charter Date</Label>
                <Input id="charter_date" type="date" {...register('charter_date')} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <Input id="facebook" {...register('facebook')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input id="instagram" {...register('instagram')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input id="linkedin" {...register('linkedin')} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-navy">Media & Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Club Logo</Label>
                <div className="flex items-center gap-4">
                  <Button type="button" variant="outline" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>
                    {uploadingLogo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    Upload Logo
                  </Button>
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  {logoUrl && <span className="text-xs text-green-600">Uploaded</span>}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cover Image</Label>
                <div className="flex items-center gap-4">
                  <Button type="button" variant="outline" onClick={() => coverInputRef.current?.click()} disabled={uploadingCover}>
                    {uploadingCover ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    Upload Cover
                  </Button>
                  <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                  {coverUrl && <span className="text-xs text-green-600">Uploaded</span>}
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="meeting_day">Meeting Day</Label>
                <Input id="meeting_day" {...register('meeting_day')} placeholder="e.g. Monday" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meeting_time">Meeting Time</Label>
                <Input id="meeting_time" {...register('meeting_time')} placeholder="e.g. 6:00 PM" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meeting_location">Meeting Location</Label>
                <Input id="meeting_location" {...register('meeting_location')} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" {...register('is_active')} className="rounded border-gray-300" />
                Active Club
              </label>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link href="/admin/clubs">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Create Club
          </Button>
        </div>
      </form>
    </motion.div>
  )
}
