'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import type { Club } from '@/types/database'
import { toast } from 'sonner'
import { Loader2, Save, Building2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AvatarUpload } from '@/components/member/AvatarUpload'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const PHONE_REGEX = /^01\d{9}$/
const PHONE_ERROR = 'Phone number must be 11 digits starting with 01 (e.g. 01234567890)'

const completeProfileSchema = z.object({
  club_id: z.string().min(1, 'Please select your club'),
  phone: z.string().regex(PHONE_REGEX, PHONE_ERROR),
  occupation: z.string().min(1, 'Occupation is required').max(100),
  graduation_year: z
    .string()
    .optional()
    .refine(
      (val) => !val || (Number(val) >= 1900 && Number(val) <= 2100),
      'Invalid graduation year'
    ),
  bio: z.string().max(500, 'Bio must be under 500 characters').optional(),
  social_linkedin: z.string().url('Please enter a valid LinkedIn URL'),
  social_instagram: z.string().url('Please enter a valid Instagram URL'),
  social_facebook: z.string().url('Please enter a valid Facebook URL'),
})

type CompleteProfileFormData = z.infer<typeof completeProfileSchema>

export function CompleteProfileForm({ fullName, initialAvatar }: { fullName?: string; initialAvatar?: string | null }) {
  const [clubs, setClubs] = useState<Club[]>([])
  const [clubsLoading, setClubsLoading] = useState(true)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatar || null)
  const [avatarTouched, setAvatarTouched] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchClubs = async () => {
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('is_active', true)
        .order('name')
      if (error) {
        toast.error('Failed to load clubs')
        return
      }
      setClubs(data as Club[])
    }
    fetchClubs().finally(() => setClubsLoading(false))
  }, [supabase])

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CompleteProfileFormData>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: { club_id: '', phone: '', occupation: '', graduation_year: '', bio: '', social_linkedin: '', social_instagram: '', social_facebook: '' },
  })

  const onSubmit = async (data: CompleteProfileFormData) => {
    if (!avatarUrl) {
      setAvatarTouched(true)
      toast.error('Please upload your profile photo')
      return
    }

    const res = await fetch('/api/member/complete-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, avatar_url: avatarUrl }),
    })

    const result = await res.json()

    if (!res.ok) {
      toast.error(result.error || 'Failed to save your profile')
      return
    }

    toast.success('Profile complete! Your club admin has been notified to approve your membership.')
    window.location.reload()
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <Card className="border-gold/30 shadow-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-cranberry/10">
              <Building2 className="h-6 w-6 text-cranberry" />
            </div>
            <CardTitle className="text-xl font-semibold text-navy">
              Complete your profile
            </CardTitle>
            <CardDescription>
              {fullName ? `Welcome, ${fullName}! ` : 'Welcome!'}Choose your Rotaract club and
              finish your details. Your club admin will approve your membership before it activates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <AvatarUpload
                  value={avatarUrl}
                  onChange={(url) => {
                    setAvatarUrl(url)
                    setAvatarTouched(true)
                  }}
                  name={fullName}
                />
                {avatarTouched && !avatarUrl && (
                  <p className="text-xs text-red-500">Profile photo is required</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="club_id">Your Club</Label>
                <Controller
                  name="club_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={clubsLoading}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            clubsLoading ? 'Loading clubs...' : 'Choose your Rotaract club'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {clubs.map((club) => (
                          <SelectItem key={club.id} value={club.id}>
                            {club.name}
                            {club.university ? ` - ${club.university}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.club_id && (
                  <p className="text-xs text-red-500">{errors.club_id.message}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" placeholder="01234567890" {...register('phone')} />
                  {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input id="occupation" placeholder="e.g. Software Engineer" {...register('occupation')} />
                  {errors.occupation && (
                    <p className="text-xs text-red-500">{errors.occupation.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="graduation_year">Graduation Year (optional)</Label>
                  <Input
                    id="graduation_year"
                    type="number"
                    placeholder="e.g. 2026"
                    min={1900}
                    max={2100}
                    {...register('graduation_year')}
                  />
                  {errors.graduation_year && (
                    <p className="text-xs text-red-500">{errors.graduation_year.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="social_linkedin">LinkedIn URL</Label>
                  <Input id="social_linkedin" placeholder="https://linkedin.com/in/..." {...register('social_linkedin')} />
                  {errors.social_linkedin && (
                    <p className="text-xs text-red-500">{errors.social_linkedin.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="social_instagram">Instagram URL</Label>
                  <Input id="social_instagram" placeholder="https://instagram.com/..." {...register('social_instagram')} />
                  {errors.social_instagram && (
                    <p className="text-xs text-red-500">{errors.social_instagram.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="social_facebook">Facebook URL</Label>
                  <Input id="social_facebook" placeholder="https://facebook.com/..." {...register('social_facebook')} />
                  {errors.social_facebook && (
                    <p className="text-xs text-red-500">{errors.social_facebook.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio (optional)</Label>
                <Textarea id="bio" placeholder="Tell us about yourself..." rows={3} {...register('bio')} />
                {errors.bio && <p className="text-xs text-red-500">{errors.bio.message}</p>}
              </div>

              <Button
                type="submit"
                className="w-full bg-cranberry hover:bg-cranberry/90"
                disabled={isSubmitting || clubsLoading}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Complete Profile
                  </>
                )}
              </Button>

              <p className="flex items-start gap-2 text-xs text-gray-500">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
                Your account stays deactivated until your club admin approves your membership.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
