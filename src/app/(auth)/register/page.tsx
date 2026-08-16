'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import type { Club } from '@/types/database'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

const registerSchema = z
  .object({
    full_name: z.string().min(2, 'Full name is required'),
    email: z.string().email('Please enter a valid email'),
    phone: z.string().regex(PHONE_REGEX, PHONE_ERROR),
    club_id: z.string().min(1, 'Please select your club'),
    occupation: z.string().min(1, 'Occupation is required').max(100),
    graduation_year: z
      .string()
      .optional()
      .refine(
        (val) => !val || (Number(val) >= 1900 && Number(val) <= 2100),
        'Invalid graduation year'
      ),
    social_linkedin: z.string().url('Please enter a valid LinkedIn URL'),
    social_instagram: z.string().url('Please enter a valid Instagram URL'),
    social_facebook: z.string().url('Please enter a valid Facebook URL'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [clubs, setClubs] = useState<Club[]>([])
  const [clubsLoading, setClubsLoading] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarTouched, setAvatarTouched] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

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
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { club_id: '' },
  })

  const onSubmit = async (data: RegisterFormData) => {
    if (cooldown > 0) return

    if (!avatarUrl) {
      setAvatarTouched(true)
      toast.error('Please upload your profile photo')
      return
    }

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, avatar_url: avatarUrl }),
    })

    if (res.status === 429) {
      toast.error('Too many signup attempts. Please wait a minute and try again.')
      setCooldown(60)
      return
    }

    const result = await res.json()

    if (!res.ok) {
      toast.error(result.error || 'Failed to create account')
      return
    }

    toast.success('Account created! Check your email to verify. Your club will approve your membership before it activates.')
    router.push('/verify')
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card className="border-gold/30 shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
              <Image src="/logo.png" alt="Rotaract" width={120} height={48} className="h-12 object-contain" />
            </div>
            <CardTitle className="text-2xl font-bold text-navy">
              Join Rotaract
            </CardTitle>
            <CardDescription>
              Create your account and start your journey
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
                />
                {avatarTouched && !avatarUrl && (
                  <p className="text-xs text-red-500">Profile photo is required</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  placeholder="Your full name"
                  {...register('full_name')}
                />
                {errors.full_name && (
                  <p className="text-xs text-red-500">
                    {errors.full_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="01234567890"
                  {...register('phone')}
                />
                {errors.phone && (
                  <p className="text-xs text-red-500">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="club_id">Select Your Club</Label>
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
                            clubsLoading
                              ? 'Loading clubs...'
                              : 'Choose your Rotaract club'
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
                  <p className="text-xs text-red-500">
                    {errors.club_id.message}
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
                <Input
                  id="social_linkedin"
                  placeholder="https://linkedin.com/in/..."
                  {...register('social_linkedin')}
                />
                {errors.social_linkedin && (
                  <p className="text-xs text-red-500">{errors.social_linkedin.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="social_instagram">Instagram URL</Label>
                <Input
                  id="social_instagram"
                  placeholder="https://instagram.com/..."
                  {...register('social_instagram')}
                />
                {errors.social_instagram && (
                  <p className="text-xs text-red-500">{errors.social_instagram.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="social_facebook">Facebook URL</Label>
                <Input
                  id="social_facebook"
                  placeholder="https://facebook.com/..."
                  {...register('social_facebook')}
                />
                {errors.social_facebook && (
                  <p className="text-xs text-red-500">{errors.social_facebook.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirm_password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    {...register('confirm_password')}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirm_password && (
                  <p className="text-xs text-red-500">
                    {errors.confirm_password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-cranberry hover:bg-cranberry/90"
                disabled={isSubmitting || clubsLoading || cooldown > 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : cooldown > 0 ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Try again in {cooldown}s
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-cranberry hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
