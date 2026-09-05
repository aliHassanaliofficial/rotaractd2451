'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { getClubById, updateClub, deleteClub, getClubOfficers, addClubOfficer, removeClubOfficer, getClubMembers } from '@/lib/supabase/queries/clubs'
import { clubSchema, type ClubFormData } from '@/lib/validations/club'
import { slugify } from '@/lib/utils/slugify'
import { getCurrentRotaryYear } from '@/lib/utils/date'
import { STORAGE_BUCKETS, OFFICER_POSITIONS } from '@/lib/constants'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'
import {
  Loader2,
  Upload,
  Save,
  ArrowLeft,
  Trash2,
  Plus,
  X,
  User,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import type { ClubOfficer, Profile } from '@/types/database'

export default function EditClubPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [logoUrl, setLogoUrl] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [permanent, setPermanent] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [officers, setOfficers] = useState<(ClubOfficer & { profile: Profile })[]>([])
  const [members, setMembers] = useState<Profile[]>([])
  const [showAddOfficer, setShowAddOfficer] = useState(false)
  const [newOfficerPosition, setNewOfficerPosition] = useState('')
  const [newOfficerProfileId, setNewOfficerProfileId] = useState('')
  const [addingOfficer, setAddingOfficer] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<ClubFormData>({
    resolver: zodResolver(clubSchema),
    defaultValues: { country: 'Egypt', is_active: true },
  })

  const watchName = watch('name')

  useEffect(() => {
    async function load() {
      try {
        const [club, officerData, memberData] = await Promise.all([
          getClubById(id),
          getClubOfficers(id),
          getClubMembers(id),
        ])

        setLogoUrl(club.logo_url || '')
        setCoverUrl(club.cover_url || '')
        setOfficers(officerData as any)
        setMembers(memberData)

        reset({
          name: club.name,
          slug: club.slug,
          charter_date: club.charter_date ? club.charter_date.split('T')[0] : '',
          description: club.description || '',
          mission: club.mission || '',
          vision: club.vision || '',
          logo_url: club.logo_url || '',
          cover_url: club.cover_url || '',
          university: club.university || '',
          city: club.city || '',
          country: club.country,
          website: club.website || '',
          email: club.email || '',
          phone: club.phone || '',
          facebook: club.facebook || '',
          instagram: club.instagram || '',
          linkedin: club.linkedin || '',
          founded_year: club.founded_year || undefined,
          meeting_day: club.meeting_day || '',
          meeting_time: club.meeting_time || '',
          meeting_location: club.meeting_location || '',
          is_active: club.is_active,
        })
      } catch {
        toast.error('Failed to load club')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

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

  const handleAddOfficer = async () => {
    if (!newOfficerPosition || !newOfficerProfileId) return
    setAddingOfficer(true)
    try {
      await addClubOfficer({
        club_id: id,
        profile_id: newOfficerProfileId,
        position: newOfficerPosition,
        year: getCurrentRotaryYear(),
      })
      const updated = await getClubOfficers(id)
      setOfficers(updated as any)
      setShowAddOfficer(false)
      setNewOfficerPosition('')
      setNewOfficerProfileId('')
      toast.success('Officer added')
    } catch {
      toast.error('Failed to add officer')
    } finally {
      setAddingOfficer(false)
    }
  }

  const handleRemoveOfficer = async (officerId: string) => {
    try {
      await removeClubOfficer(officerId)
      setOfficers((prev) => prev.filter((o) => o.id !== officerId))
      toast.success('Officer removed')
    } catch {
      toast.error('Failed to remove officer')
    }
  }

  const onSubmit = async (data: ClubFormData) => {
    setIsSubmitting(true)
    try {
      await updateClub(id, {
        ...data,
        slug: slugify(data.name),
        logo_url: logoUrl || undefined,
        cover_url: coverUrl || undefined,
        charter_date: data.charter_date ? new Date(data.charter_date).toISOString() : undefined,
        founded_year: data.founded_year || undefined,
      })
      toast.success('Club updated')
      router.push('/admin/clubs')
    } catch {
      toast.error('Failed to update club')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (action: 'inactivate' | 'permanent') => {
    setDeleting(true)
    try {
      await deleteClub(id, action, action === 'permanent' ? deletePassword : undefined)
      toast.success(action === 'permanent' ? 'Club permanently deleted' : 'Club inactivated')
      router.push('/admin/clubs')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete club')
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setPermanent(false)
      setDeletePassword('')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/clubs">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-navy">Edit Club</h1>
        </div>
        <Dialog
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open)
            if (!open) {
              setPermanent(false)
              setDeletePassword('')
            }
          }}
        >
          <DialogTrigger asChild>
            <Button type="button" variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Delete Club
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{permanent ? 'Permanently Delete Club' : 'Delete Club'}</DialogTitle>
              <DialogDescription>
                {permanent
                  ? 'This will permanently delete the club, including all of its events, posts, gallery albums, and registrations. All members will be unassigned. This cannot be undone.'
                  : 'Choose how to handle this club.'}
              </DialogDescription>
            </DialogHeader>
            {permanent ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="delete-password">Confirm password</Label>
                  <Input
                    id="delete-password"
                    type="password"
                    placeholder="Enter your password to confirm"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                  />
                </div>
                <DialogFooter className="gap-2 sm:justify-between">
                  <Button type="button" variant="outline" onClick={() => setPermanent(false)} disabled={deleting}>
                    Back
                  </Button>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => handleDelete('permanent')}
                      disabled={deleting || !deletePassword}
                    >
                      {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Delete Forever
                    </Button>
                  </div>
                </DialogFooter>
              </div>
            ) : (
              <DialogFooter className="gap-2 sm:justify-between">
                <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => handleDelete('inactivate')} disabled={deleting}>
                    {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Inactivate
                  </Button>
                  <Button type="button" variant="destructive" onClick={() => setPermanent(true)} disabled={deleting}>
                    Permanently Delete
                  </Button>
                </div>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-navy">Club Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Club Name</Label>
              <Input id="name" {...register('name')} />
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
                <Input id="website" {...register('website')} />
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
                    {logoUrl ? 'Change Logo' : 'Upload Logo'}
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
                    {coverUrl ? 'Change Cover' : 'Upload Cover'}
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
                <Input id="meeting_day" {...register('meeting_day')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meeting_time">Meeting Time</Label>
                <Input id="meeting_time" {...register('meeting_time')} />
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-navy">Officers</CardTitle>
            <Button type="button" size="sm" variant="outline" onClick={() => setShowAddOfficer(true)}>
              <Plus className="mr-1 h-4 w-4" /> Add Officer
            </Button>
          </CardHeader>
          <CardContent>
            {officers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No officers assigned</p>
            ) : (
              <div className="space-y-3">
                {officers.map((officer) => (
                  <div key={officer.id} className="flex items-center justify-between rounded-2xl border p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={officer.profile?.avatar_url} />
                        <AvatarFallback className="bg-cranberry/10 text-cranberry">
                          {officer.profile?.full_name?.charAt(0) || <User className="h-5 w-5" />}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-navy text-sm">{officer.profile?.full_name || 'Unknown'}</p>
                        <Badge variant="outline" className="mt-0.5 text-xs">{officer.position}</Badge>
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="text-red-500" onClick={() => handleRemoveOfficer(officer.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Dialog open={showAddOfficer} onOpenChange={setShowAddOfficer}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Officer</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Position</Label>
                    <Select value={newOfficerPosition} onValueChange={setNewOfficerPosition}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        {OFFICER_POSITIONS.map((pos) => (
                          <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Member</Label>
                    <Select value={newOfficerProfileId} onValueChange={setNewOfficerProfileId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select member" />
                      </SelectTrigger>
                      <SelectContent>
                        {members.map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.full_name} ({m.email})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowAddOfficer(false)}>Cancel</Button>
                  <Button type="button" onClick={handleAddOfficer} disabled={addingOfficer || !newOfficerPosition || !newOfficerProfileId}>
                    {addingOfficer ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Add
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-navy">Members ({members.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-400">No members</td>
                    </tr>
                  ) : (
                    members.map((member) => (
                      <tr key={member.id} className="border-b">
                        <td className="px-6 py-3 font-medium text-navy">{member.full_name}</td>
                        <td className="px-6 py-3 text-gray-600">{member.email}</td>
                        <td className="px-6 py-3">
                          <Badge variant="outline" className="text-xs capitalize">{member.role}</Badge>
                        </td>
                        <td className="px-6 py-3">
                          <Badge className={member.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'} variant="outline">
                            {member.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link href="/admin/clubs">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </form>
    </motion.div>
  )
}
