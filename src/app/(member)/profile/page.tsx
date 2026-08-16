'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { updateProfile } from '@/lib/supabase/queries/profiles'
import { STORAGE_BUCKETS } from '@/lib/constants'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'
import {
  Loader2,
  Camera,
  Save,
  Link2,
  Globe,
  ExternalLink,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

const profileFormSchema = z.object({
  full_name: z.string().min(2, 'Name is required'),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[\d\s\-\+\(\)]{7,20}$/.test(val),
      'Invalid phone number'
    ),
  bio: z.string().max(500, 'Bio must be under 500 characters').optional(),
  occupation: z.string().optional(),
  graduation_year: z.string().optional(),
  social_linkedin: z
    .string()
    .url('Invalid URL')
    .optional()
    .or(z.literal('')),
  social_instagram: z
    .string()
    .url('Invalid URL')
    .optional()
    .or(z.literal('')),
  social_facebook: z
    .string()
    .url('Invalid URL')
    .optional()
    .or(z.literal('')),
})

type ProfileFormData = z.infer<typeof profileFormSchema>

export default function ProfilePage() {
  const { user, profile, loading: userLoading } = useUser()
  const [isSaving, setIsSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
  })

  useEffect(() => {
    if (profile) {
      reset({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        occupation: profile.occupation || '',
        graduation_year: profile.graduation_year?.toString() || '',
        social_linkedin: profile.social_linkedin || '',
        social_instagram: profile.social_instagram || '',
        social_facebook: profile.social_facebook || '',
      })
      setAvatarUrl(profile.avatar_url || null)
    }
  }, [profile, reset])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB')
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed')
      return
    }

    setUploading(true)
    const ext = file.name.split('.').pop()
    const filePath = `${user.id}/${uuidv4()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.AVATARS)
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      toast.error('Failed to upload avatar')
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKETS.AVATARS)
      .getPublicUrl(filePath)

    const publicUrl = urlData.publicUrl
    setAvatarUrl(publicUrl)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id)

    if (updateError) {
      toast.error('Avatar saved but profile update failed')
    } else {
      toast.success('Avatar updated')
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
    setUploading(false)
  }

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return
    setIsSaving(true)

    try {
      await updateProfile(user.id, {
        full_name: data.full_name,
        phone: data.phone || undefined,
        bio: data.bio || undefined,
        occupation: data.occupation || undefined,
        graduation_year: data.graduation_year ? Number(data.graduation_year) : undefined,
        social_linkedin: data.social_linkedin || undefined,
        social_instagram: data.social_instagram || undefined,
        social_facebook: data.social_facebook || undefined,
        avatar_url: avatarUrl || undefined,
      })
      toast.success('Profile updated successfully')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  if (userLoading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Skeleton className="mb-6 h-8 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <Skeleton className="h-10 flex-1" />
            </div>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8 text-center">
        <p className="text-gray-500">Please sign in to view your profile.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="mb-6 text-3xl font-bold text-navy">My Profile</h1>

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your profile details and social links
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                <div className="relative">
                  <Avatar className="h-20 w-20 border-2 border-gold/30">
                    <AvatarImage src={avatarUrl || ''} />
                    <AvatarFallback className="bg-cranberry/10 text-xl text-cranberry">
                      {profile.full_name?.charAt(0) || <User className="h-8 w-8" />}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-navy to-cranberry text-white shadow transition hover:brightness-110 disabled:opacity-50"
                  >
                    {uploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Camera className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </div>
                <div className="flex-1 space-y-1 text-center sm:text-left">
                  <p className="font-semibold text-navy">{profile.full_name}</p>
                  <p className="text-sm text-gray-500">{profile.email}</p>
                  {profile.club && (
                    <p className="text-sm text-gray-500">
                      {profile.club.name}
                    </p>
                  )}
                  {profile.rotaract_id && (
                    <p className="text-xs text-gray-400">
                      ID: {profile.rotaract_id}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input id="full_name" {...register('full_name')} />
                  {errors.full_name && (
                    <p className="text-xs text-red-500">
                      {errors.full_name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+20 100 000 0000"
                    {...register('phone')}
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-500">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input
                    id="occupation"
                    placeholder="e.g. Software Engineer"
                    {...register('occupation')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="graduation_year">
                    Graduation Year
                  </Label>
                  <Input
                    id="graduation_year"
                    type="number"
                    placeholder="e.g. 2026"
                    min={1900}
                    max={2100}
                    {...register('graduation_year')}
                  />
                  {errors.graduation_year && (
                    <p className="text-xs text-red-500">
                      {errors.graduation_year.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  rows={3}
                  {...register('bio')}
                />
                {errors.bio && (
                  <p className="text-xs text-red-500">{errors.bio.message}</p>
                )}
              </div>

              <Separator />

              <div>
                <h3 className="mb-3 text-sm font-medium text-navy">
                  Social Links
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="social_linkedin">
                      <Link2 className="mr-1 inline-block h-3.5 w-3.5 text-blue-600" />
                      LinkedIn
                    </Label>
                    <Input
                      id="social_linkedin"
                      placeholder="https://linkedin.com/in/..."
                      {...register('social_linkedin')}
                    />
                    {errors.social_linkedin && (
                      <p className="text-xs text-red-500">
                        {errors.social_linkedin.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="social_instagram">
                      <Globe className="mr-1 inline-block h-3.5 w-3.5 text-pink-600" />
                      Instagram
                    </Label>
                    <Input
                      id="social_instagram"
                      placeholder="https://instagram.com/..."
                      {...register('social_instagram')}
                    />
                    {errors.social_instagram && (
                      <p className="text-xs text-red-500">
                        {errors.social_instagram.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="social_facebook">
                      <ExternalLink className="mr-1 inline-block h-3.5 w-3.5 text-blue-800" />
                      Facebook
                    </Label>
                    <Input
                      id="social_facebook"
                      placeholder="https://facebook.com/..."
                      {...register('social_facebook')}
                    />
                    {errors.social_facebook && (
                      <p className="text-xs text-red-500">
                        {errors.social_facebook.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving || !isDirty}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
