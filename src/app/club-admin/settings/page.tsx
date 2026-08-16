'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRole } from '@/hooks/useRole'
import { getClubById, updateClub } from '@/lib/supabase/queries/clubs'
import { STORAGE_BUCKETS } from '@/lib/constants'
import { Loader2, Save, Upload } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'

function normalizeSocialUrl(value: string, base?: string) {
  const v = value.trim()
  if (!v) return undefined
  if (/^https?:\/\//.test(v)) return v
  const handle = v.replace(/^@/, '')
  return base ? `https://${base}/${handle}` : `https://${handle}`
}

export default function ClubAdminSettingsPage() {
  const { clubId, assignedClubIds } = useRole()
  const [clubs, setClubs] = useState<{ id: string; name: string }[]>([])
  const [selectedClubId, setSelectedClubId] = useState('')
  const [clubName, setClubName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [facebook, setFacebook] = useState('')
  const [instagram, setInstagram] = useState('')
  const [website, setWebsite] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [saving, setSaving] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    loadClubs()
  }, [clubId, assignedClubIds])

  useEffect(() => {
    if (selectedClubId) loadClub()
  }, [selectedClubId])

  async function loadClubs() {
    const ids = assignedClubIds.length > 0 ? assignedClubIds : clubId ? [clubId] : []
    if (ids.length === 0) {
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('clubs')
      .select('id, name')
      .in('id', ids)
      .order('name')
    const list = (data || []) as { id: string; name: string }[]
    setClubs(list)
    if (list.length === 0) setLoading(false)
    setSelectedClubId(list[0]?.id || '')
  }

  async function loadClub() {
    setLoading(true)
    try {
      const club = await getClubById(selectedClubId)
      setClubName(club.name)
      setLogoUrl(club.logo_url || '')
      setCoverUrl(club.cover_url || '')
      setEmail(club.email || '')
      setPhone(club.phone || '')
      setFacebook(club.facebook || '')
      setInstagram(club.instagram || '')
      setWebsite(club.website || '')
    } catch (err) {
      console.error('Failed to load club', err)
      toast.error('Failed to load club')
    } finally {
      setLoading(false)
    }
  }

  async function uploadFile(file: File, bucket: string, prefix: string): Promise<string | null> {
    const ext = file.name.split('.').pop()
    const filePath = `${prefix}/${uuidv4()}.${ext}`
    const { error } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: true })
    if (error) {
      console.error('Upload failed', error)
      return null
    }
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath)
    return urlData.publicUrl
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB')
      return
    }
    setUploadingLogo(true)
    const url = await uploadFile(file, STORAGE_BUCKETS.CLUB_LOGOS, 'logos')
    if (url) {
      setLogoUrl(url)
      toast.success('Logo uploaded')
    } else {
      toast.error('Failed to upload logo')
    }
    setUploadingLogo(false)
    if (logoInputRef.current) logoInputRef.current.value = ''
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB')
      return
    }
    setUploadingCover(true)
    const url = await uploadFile(file, STORAGE_BUCKETS.CLUB_LOGOS, 'covers')
    if (url) {
      setCoverUrl(url)
      toast.success('Cover photo uploaded')
    } else {
      toast.error('Failed to upload cover photo')
    }
    setUploadingCover(false)
    if (coverInputRef.current) coverInputRef.current.value = ''
  }

  async function handleSave() {
    if (!selectedClubId) return
    if (!email.trim()) {
      toast.error('Email address is required')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error('Please enter a valid email address')
      return
    }
    if (!instagram.trim()) {
      toast.error('Instagram account is required')
      return
    }
    setSaving(true)
    try {
      await updateClub(selectedClubId, {
        logo_url: logoUrl || undefined,
        cover_url: coverUrl || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        facebook: normalizeSocialUrl(facebook, 'facebook.com'),
        instagram: normalizeSocialUrl(instagram, 'instagram.com'),
        website: normalizeSocialUrl(website),
      })
      toast.success('Club settings updated')
      loadClub()
    } catch (err) {
      console.error('Failed to save club media', err)
      toast.error(err instanceof Error ? err.message : 'Failed to save club media')
    } finally {
      setSaving(false)
    }
  }

  const selectedClub = clubs.find((c) => c.id === selectedClubId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-navy">Club Settings</h1>
        <p className="text-sm text-gray-500">Update your club&apos;s profile picture, cover photo and contact information</p>
      </div>

      {clubs.length > 1 && (
        <div className="w-72">
          <Select value={selectedClubId} onValueChange={setSelectedClubId}>
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
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-navy">{selectedClub?.name || clubName || 'Profile Media'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-20 w-20 rounded-full" />
            </div>
          ) : selectedClubId ? (
            <>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Cover Photo</p>
                <div className="relative h-48 w-full overflow-hidden rounded-2xl bg-gray-100">
                  {coverUrl ? (
                    <img src={coverUrl} alt="Club cover" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-400">
                      No cover photo
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={uploadingCover}
                  >
                    {uploadingCover ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    {coverUrl ? 'Change Cover' : 'Upload Cover'}
                  </Button>
                  {coverUrl && (
                    <Button type="button" variant="ghost" size="sm" className="text-red-500" onClick={() => setCoverUrl('')}>
                      Remove
                    </Button>
                  )}
                  <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Profile Picture</p>
                <div className="flex items-center gap-4">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Club logo" className="h-20 w-20 rounded-2xl border bg-white object-cover" />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl border bg-gray-100 text-sm text-gray-400">
                      No logo
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                    >
                      {uploadingLogo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                      {logoUrl ? 'Change Logo' : 'Upload Logo'}
                    </Button>
                    {logoUrl && (
                      <Button type="button" variant="ghost" size="sm" className="text-red-500" onClick={() => setLogoUrl('')}>
                        Remove
                      </Button>
                    )}
                    <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end border-t pt-4">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Changes
                </Button>
              </div>
            </>
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">You are not assigned to any clubs</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-navy">Club Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : selectedClubId ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Email Address <span className="text-red-500">*</span></Label>
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder="contact@club.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-phone">Phone Number</Label>
                  <Input
                    id="contact-phone"
                    type="tel"
                    placeholder="+1 555 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-instagram">Instagram <span className="text-red-500">*</span></Label>
                  <Input
                    id="contact-instagram"
                    placeholder="https://instagram.com/club or @club"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-facebook">Facebook</Label>
                  <Input
                    id="contact-facebook"
                    placeholder="https://facebook.com/club"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-website">Website</Label>
                  <Input
                    id="contact-website"
                    placeholder="https://example.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end border-t pt-4">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Changes
                </Button>
              </div>
            </>
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">You are not assigned to any clubs</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
