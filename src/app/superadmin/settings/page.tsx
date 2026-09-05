'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Plus, Trash2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useUser } from '@/hooks/useUser'

interface HeroSlide {
  id?: string
  image_url: string
  title: string
  subtitle?: string
  cta_text?: string
  cta_link?: string
  sort_order: number
  media_type?: 'image' | 'video'
  video_url?: string
}

export default function SuperAdminSettingsPage() {
  const { user } = useUser()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  const [districtName, setDistrictName] = useState('')
  const [districtYear, setDistrictYear] = useState('')
  const [districtGovernor, setDistrictGovernor] = useState('')
  const [districtTheme, setDistrictTheme] = useState('')
  const [logoUrl, setLogoUrl] = useState('')

  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([])
  const [slideDialogOpen, setSlideDialogOpen] = useState(false)
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null)
  const [slideForm, setSlideForm] = useState({ image_url: '', title: '', subtitle: '', cta_text: '', cta_link: '', media_type: 'image' as 'image' | 'video', video_url: '' })

  const [regOpen, setRegOpen] = useState(true)
  const [showDirectory, setShowDirectory] = useState(true)
  const [galleryPublic, setGalleryPublic] = useState(true)
  const [maintenanceMode, setMaintenanceMode] = useState(false)

  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactAddress, setContactAddress] = useState('')
  const [mapEmbed, setMapEmbed] = useState('')

  const [socialFb, setSocialFb] = useState('')
  const [socialIg, setSocialIg] = useState('')
  const [socialLi, setSocialLi] = useState('')
  const [socialYt, setSocialYt] = useState('')
  const [socialTw, setSocialTw] = useState('')

  const [emailConfirm, setEmailConfirm] = useState('')
  const [emailReminder, setEmailReminder] = useState('')
  const [emailWelcome, setEmailWelcome] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('site_settings').select('*')
      if (error) throw error

      const settings: Record<string, any> = {}
      for (const s of data || []) {
        settings[s.key] = s.value
      }

      setDistrictName(settings.district_name || '')
      setDistrictYear(settings.district_year || '')
      setDistrictGovernor(settings.district_governor || '')
      setDistrictTheme(settings.district_theme || '')
      setLogoUrl(settings.logo_url || '')

      setHeroSlides(settings.hero_slides || [])

      const flags = settings.feature_flags || {}
      setRegOpen(flags.registration_open !== false)
      setShowDirectory(flags.show_member_directory !== false)
      setGalleryPublic(flags.gallery_public !== false)
      setMaintenanceMode(flags.maintenance_mode === true)

      const contact = settings.contact_info || {}
      setContactEmail(contact.email || '')
      setContactPhone(contact.phone || '')
      setContactAddress(contact.address || '')
      setMapEmbed(contact.map_embed_url || '')

      const social = settings.social_media || {}
      setSocialFb(social.facebook || '')
      setSocialIg(social.instagram || '')
      setSocialLi(social.linkedin || '')
      setSocialYt(social.youtube || '')
      setSocialTw(social.twitter || '')

      const templates = settings.email_templates || {}
      setEmailConfirm(templates.confirmation || '')
      setEmailReminder(templates.reminder || '')
      setEmailWelcome(templates.welcome || '')
    } catch {
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  async function saveSetting(key: string, value: any) {
    setSaving(key)
    try {
      const { error } = await supabase.from('site_settings').upsert({
        key,
        value,
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
      toast.success(`${key} saved`)
    } catch {
      toast.error(`Failed to save ${key}`)
    } finally {
      setSaving(null)
    }
  }

  function openNewSlide() {
    setEditingSlide(null)
    setSlideForm({ image_url: '', title: '', subtitle: '', cta_text: '', cta_link: '', media_type: 'image', video_url: '' })
    setSlideDialogOpen(true)
  }

  function openEditSlide(slide: HeroSlide) {
    setEditingSlide(slide)
    setSlideForm({
      image_url: slide.image_url,
      title: slide.title,
      subtitle: slide.subtitle || '',
      cta_text: slide.cta_text || '',
      cta_link: slide.cta_link || '',
      media_type: slide.media_type || 'image',
      video_url: slide.video_url || '',
    })
    setSlideDialogOpen(true)
  }

  async function saveSlide() {
    const newSlide: HeroSlide = {
      image_url: slideForm.image_url,
      title: slideForm.title,
      subtitle: slideForm.subtitle,
      cta_text: slideForm.cta_text,
      cta_link: slideForm.cta_link,
      media_type: slideForm.media_type,
      video_url: slideForm.media_type === 'video' ? slideForm.video_url : undefined,
      sort_order: editingSlide ? editingSlide.sort_order : heroSlides.length,
    }

    let updated: HeroSlide[]
    if (editingSlide) {
      updated = heroSlides.map((s) => (s.sort_order === editingSlide.sort_order ? newSlide : s))
    } else {
      updated = [...heroSlides, newSlide]
    }

    await saveSetting('hero_slides', updated)
    setHeroSlides(updated)
    setSlideDialogOpen(false)
  }

  async function removeSlide(index: number) {
    const updated = heroSlides.filter((_, i) => i !== index)
    await saveSetting('hero_slides', updated)
    setHeroSlides(updated)
  }

  async function moveSlide(index: number, direction: 'up' | 'down') {
    const updated = [...heroSlides]
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= updated.length) return
    const temp = updated[index].sort_order
    updated[index].sort_order = updated[target].sort_order
    updated[target].sort_order = temp
    updated.sort((a, b) => a.sort_order - b.sort_order)
    const reindexed = updated.map((s, i) => ({ ...s, sort_order: i }))
    await saveSetting('hero_slides', reindexed)
    setHeroSlides(reindexed)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-amber-900">Settings</h1>
        <Skeleton className="h-12 w-96 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-amber-900">Settings</h1>
        {saving && (
          <Badge variant="outline" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" /> Saving {saving}...
          </Badge>
        )}
      </div>

      <Tabs defaultValue="district" className="w-full">
        <TabsList className="flex-wrap">
          <TabsTrigger value="district">District Info</TabsTrigger>
          <TabsTrigger value="hero">Hero Slider</TabsTrigger>
          <TabsTrigger value="features">Feature Flags</TabsTrigger>
          <TabsTrigger value="contact">Contact Info</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="email">Email Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="district" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-navy">District Information</CardTitle>
              <CardDescription>Basic district details shown across the site</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-navy">District Name</label>
                  <Input value={districtName} onChange={(e) => setDistrictName(e.target.value)} placeholder="Rotaract" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-navy">Year</label>
                  <Input value={districtYear} onChange={(e) => setDistrictYear(e.target.value)} placeholder="26/27" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-navy">District Governor</label>
                  <Input value={districtGovernor} onChange={(e) => setDistrictGovernor(e.target.value)} placeholder="Name" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-navy">Theme</label>
                  <Input value={districtTheme} onChange={(e) => setDistrictTheme(e.target.value)} placeholder="Connect, Inspire, Act" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-navy">Logo URL</label>
                  <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" />
                </div>
              </div>
              <Button onClick={() => saveSetting('district_name', districtName)} disabled={saving === 'district_name'}>
                Save District Name
              </Button>
              <Button onClick={() => saveSetting('district_year', districtYear)} variant="outline" className="ml-2" disabled={saving === 'district_year'}>
                Save Year
              </Button>
              <Button onClick={() => saveSetting('district_governor', districtGovernor)} variant="outline" className="ml-2" disabled={saving === 'district_governor'}>
                Save Governor
              </Button>
              <Button onClick={() => saveSetting('district_theme', districtTheme)} variant="outline" className="ml-2" disabled={saving === 'district_theme'}>
                Save Theme
              </Button>
              <Button onClick={() => saveSetting('logo_url', logoUrl)} variant="outline" className="ml-2" disabled={saving === 'logo_url'}>
                Save Logo
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hero" className="mt-6 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-navy">Hero Slider Manager</CardTitle>
                <CardDescription>Add, reorder, or remove homepage hero slides</CardDescription>
              </div>
              <Button onClick={openNewSlide}><Plus className="mr-1 h-4 w-4" /> Add Slide</Button>
            </CardHeader>
            <CardContent>
              {heroSlides.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">No hero slides configured</p>
              ) : (
                <div className="space-y-3">
                  {heroSlides.map((slide, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-2xl border p-3">
                      <GripVertical className="h-5 w-5 shrink-0 text-gray-300" />
                      <div className="h-14 w-24 shrink-0 overflow-hidden rounded bg-gray-100">
                        {slide.image_url ? (
                          <img src={slide.image_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-gray-400">No img</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-navy">{slide.title}</p>
                          {slide.media_type === 'video' && (
                            <Badge variant="outline" className="shrink-0 text-[10px]">VIDEO</Badge>
                          )}
                        </div>
                        {slide.subtitle && <p className="truncate text-xs text-gray-500">{slide.subtitle}</p>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={i === 0} onClick={() => moveSlide(i, 'up')}>↑</Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={i === heroSlides.length - 1} onClick={() => moveSlide(i, 'down')}>↓</Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditSlide(slide)}>✎</Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => removeSlide(i)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={slideDialogOpen} onOpenChange={setSlideDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingSlide ? 'Edit Slide' : 'New Slide'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-navy">Image URL</label>
                  <Input value={slideForm.image_url} onChange={(e) => setSlideForm({ ...slideForm, image_url: e.target.value })} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-navy">Media Type</label>
                  <Select
                    value={slideForm.media_type}
                    onValueChange={(v) => setSlideForm({ ...slideForm, media_type: v as 'image' | 'video' })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select media type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-400">
                    Video slides autoplay muted, loop, and use the Image URL as the poster.
                  </p>
                </div>
                {slideForm.media_type === 'video' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-navy">Video URL (mp4/webm)</label>
                    <Input
                      value={slideForm.video_url}
                      onChange={(e) => setSlideForm({ ...slideForm, video_url: e.target.value })}
                      placeholder="https://example.com/video.mp4"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-navy">Title</label>
                  <Input value={slideForm.title} onChange={(e) => setSlideForm({ ...slideForm, title: e.target.value })} placeholder="Slide title" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-navy">Subtitle</label>
                  <Input value={slideForm.subtitle} onChange={(e) => setSlideForm({ ...slideForm, subtitle: e.target.value })} placeholder="Optional subtitle" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-navy">CTA Text</label>
                  <Input value={slideForm.cta_text} onChange={(e) => setSlideForm({ ...slideForm, cta_text: e.target.value })} placeholder="Learn More" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-navy">CTA Link</label>
                  <Input value={slideForm.cta_link} onChange={(e) => setSlideForm({ ...slideForm, cta_link: e.target.value })} placeholder="/events" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSlideDialogOpen(false)}>Cancel</Button>
                <Button onClick={saveSlide}>{editingSlide ? 'Update' : 'Add'} Slide</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="features" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-navy">Feature Flags</CardTitle>
              <CardDescription>Toggle site-wide features on or off</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-2xl border p-4">
                <div>
                  <p className="font-medium text-navy">Registration Open</p>
                  <p className="text-sm text-gray-500">Allow users to register for events</p>
                </div>
                <Switch
                  checked={regOpen}
                  onCheckedChange={(v) => {
                    setRegOpen(v)
                    saveSetting('feature_flags', { registration_open: v, show_member_directory: showDirectory, gallery_public: galleryPublic, maintenance_mode: maintenanceMode })
                  }}
                />
              </div>
              <div className="flex items-center justify-between rounded-2xl border p-4">
                <div>
                  <p className="font-medium text-navy">Member Directory</p>
                  <p className="text-sm text-gray-500">Show member directory on the site</p>
                </div>
                <Switch
                  checked={showDirectory}
                  onCheckedChange={(v) => {
                    setShowDirectory(v)
                    saveSetting('feature_flags', { registration_open: regOpen, show_member_directory: v, gallery_public: galleryPublic, maintenance_mode: maintenanceMode })
                  }}
                />
              </div>
              <div className="flex items-center justify-between rounded-2xl border p-4">
                <div>
                  <p className="font-medium text-navy">Gallery Public</p>
                  <p className="text-sm text-gray-500">Make gallery accessible without login</p>
                </div>
                <Switch
                  checked={galleryPublic}
                  onCheckedChange={(v) => {
                    setGalleryPublic(v)
                    saveSetting('feature_flags', { registration_open: regOpen, show_member_directory: showDirectory, gallery_public: v, maintenance_mode: maintenanceMode })
                  }}
                />
              </div>
              <div className="flex items-center justify-between rounded-2xl border p-4">
                <div>
                  <p className="font-medium text-navy">Doing Some Updates</p>
                  <p className="text-sm text-gray-500">
                    Show the &quot;Doing Some Updates&quot; page to all visitors. Superadmins can still browse the site normally.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/doing-some-updates">Preview</Link>
                  </Button>
                  <Switch
                    checked={maintenanceMode}
                    onCheckedChange={(v) => {
                      setMaintenanceMode(v)
                      saveSetting('feature_flags', { registration_open: regOpen, show_member_directory: showDirectory, gallery_public: galleryPublic, maintenance_mode: v })
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-navy">Contact Information</CardTitle>
              <CardDescription>Contact details displayed on the site</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-navy">Email</label>
                  <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="info@rotaract2451.org" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-navy">Phone</label>
                  <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+90 555 123 4567" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-navy">Address</label>
                  <Input value={contactAddress} onChange={(e) => setContactAddress(e.target.value)} placeholder="District address" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-navy">Map Embed URL</label>
                  <Input value={mapEmbed} onChange={(e) => setMapEmbed(e.target.value)} placeholder="https://www.google.com/maps/embed?pb=..." />
                </div>
              </div>
              <Button
                onClick={() =>
                  saveSetting('contact_info', { email: contactEmail, phone: contactPhone, address: contactAddress, map_embed_url: mapEmbed })
                }
                disabled={saving === 'contact_info'}
              >
                Save Contact Info
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-navy">Social Media Links</CardTitle>
              <CardDescription>Social media URLs displayed in the footer and contact sections</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-navy">Facebook</label>
                  <Input value={socialFb} onChange={(e) => setSocialFb(e.target.value)} placeholder="https://facebook.com/..." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-navy">Instagram</label>
                  <Input value={socialIg} onChange={(e) => setSocialIg(e.target.value)} placeholder="https://instagram.com/..." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-navy">LinkedIn</label>
                  <Input value={socialLi} onChange={(e) => setSocialLi(e.target.value)} placeholder="https://linkedin.com/..." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-navy">YouTube</label>
                  <Input value={socialYt} onChange={(e) => setSocialYt(e.target.value)} placeholder="https://youtube.com/..." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-navy">Twitter / X</label>
                  <Input value={socialTw} onChange={(e) => setSocialTw(e.target.value)} placeholder="https://twitter.com/..." />
                </div>
              </div>
              <Button
                onClick={() =>
                  saveSetting('social_media', { facebook: socialFb, instagram: socialIg, linkedin: socialLi, youtube: socialYt, twitter: socialTw })
                }
                disabled={saving === 'social_media'}
              >
                Save Social Links
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-navy">Email Templates</CardTitle>
              <CardDescription>Customize automated email messages. Use {'{{name}}'}, {'{{event}}'}, {'{{date}}'} as placeholders.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-navy">Confirmation Email</label>
                <Textarea
                  value={emailConfirm}
                  onChange={(e) => setEmailConfirm(e.target.value)}
                  rows={5}
                  placeholder="Hi {{name}}, your registration for {{event}} is confirmed..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-navy">Reminder Email</label>
                <Textarea
                  value={emailReminder}
                  onChange={(e) => setEmailReminder(e.target.value)}
                  rows={5}
                  placeholder="Hi {{name}}, this is a reminder for {{event}} on {{date}}..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-navy">Welcome Email</label>
                <Textarea
                  value={emailWelcome}
                  onChange={(e) => setEmailWelcome(e.target.value)}
                  rows={5}
                  placeholder="Welcome to Rotaract, {{name}}!..."
                />
              </div>
              <Button
                onClick={() => saveSetting('email_templates', { confirmation: emailConfirm, reminder: emailReminder, welcome: emailWelcome })}
                disabled={saving === 'email_templates'}
              >
                Save Email Templates
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
